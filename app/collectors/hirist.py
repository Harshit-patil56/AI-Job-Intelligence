"""Hirist Ingestion Collector for Indian Tech Opportunities.

Dual-Tier Ingestion Architecture:
Tier 1: Direct public category and keyword endpoint extraction via httpx.
Tier 2: Playwright browser automation for rendering client-side React SPA job listings.
Captures Indian tech roles across Python, ML, GenAI, and Data Science.
"""

from datetime import datetime, timezone
import json
import re
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
import httpx
import structlog

from app.collectors.base import BaseCollector
from app.models.schemas import RawJobIngest

logger = structlog.get_logger()

HIRIST_BASE_URL = "https://www.hirist.tech"


class HiristCollector(BaseCollector):
    """Dual-tier collector for Hirist Indian tech opportunities."""

    def __init__(
        self,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        super().__init__(
            source_id="HIRIST",
            name="Hirist Tech Portal",
            timeout=timeout or 15.0,
            max_retries=max_retries or 2,
        )

    def _parse_preloaded_state(self, html_text: str) -> List[Dict[str, Any]]:
        """Extract job listings from window.__PRELOADED_STATE__ if present in DOM."""
        try:
            match = re.search(r'window\.__PRELOADED_STATE__\s*=\s*(\{.*?\});?\s*</script>', html_text, re.DOTALL)
            if not match:
                return []
            state = json.loads(match.group(1))
            feed = state.get("feed", {})
            jobs = feed.get("jobFeed") or feed.get("allCatJobs") or []
            if isinstance(jobs, list):
                return jobs
        except Exception as exc:
            logger.warning("Hirist __PRELOADED_STATE__ parsing failed", error=str(exc))
        return []

    async def _collect_via_playwright(self, url: str) -> List[Dict[str, Any]]:
        """Headless browser rendering using Playwright to extract hydrated job cards."""
        from app.collectors.playwright_runner import run_safe_playwright

        async def _execute() -> List[Dict[str, Any]]:
            try:
                from playwright.async_api import async_playwright

                logger.info("Executing Hirist Playwright browser harvest", url=url)
                async with async_playwright() as p:
                    browser = await p.chromium.launch(headless=True)
                    page = await browser.new_page(
                        user_agent=self.headers.get("User-Agent"),
                    )
                    await page.goto(url, timeout=int(self.timeout * 1000), wait_until="domcontentloaded")
                    await page.wait_for_timeout(2000)

                    # Try evaluating preloaded state from window first
                    jobs = await page.evaluate("""() => {
                        if (window.__PRELOADED_STATE__ && window.__PRELOADED_STATE__.feed) {
                            return window.__PRELOADED_STATE__.feed.jobFeed || [];
                        }
                        return [];
                    }""")

                    if not jobs:
                        # DOM fallback: extract visible job cards
                        jobs = await page.evaluate("""() => {
                            const items = [];
                            const links = document.querySelectorAll("a[href*='/j/']");
                            links.forEach((a, idx) => {
                                const rawText = a.innerText.trim();
                                const firstLine = rawText.split('\\n')[0].trim();
                                const href = a.href;
                                const cleanHref = href.split('?')[0];
                                const id = cleanHref.split('/j/')[1] ? cleanHref.split('/j/')[1].split('.')[0] : ('hirist-' + idx);
                                const card = a.closest("[class*='card'], [class*='job']") || a.parentElement;
                                const text = card ? card.innerText : "";
                                const lines = text.split('\\n').map(s => s.trim()).filter(Boolean);

                                let title = firstLine;
                                let company = "Unknown Company";
                                if (firstLine.includes(" - ")) {
                                    const parts = firstLine.split(" - ");
                                    company = parts[0].trim();
                                    title = parts.slice(1).join(" - ").trim();
                                }

                                let exp = "";
                                let loc = "";
                                for (let i = 1; i < lines.length; i++) {
                                    const line = lines[i];
                                    if (line.includes("yrs") || line.includes("years") || /\\d+\\s*-\\s*\\d+/.test(line)) {
                                        exp = line;
                                    } else if (!loc && !line.includes("Posted") && !line.includes("today") && line.length < 50) {
                                        loc = line;
                                    }
                                }

                                items.push({
                                    id: id,
                                    title: title,
                                    companyName: company,
                                    location: loc,
                                    experience: exp,
                                    url: cleanHref,
                                    card_text: text,
                                });
                            });
                            return items;
                        }""")

                    await browser.close()
                    return jobs or []
            except Exception as exc:
                logger.error("Hirist Playwright extraction failed", url=url, error=str(exc))
                return []

        return await run_safe_playwright(_execute)

    async def collect_by_keyword(
        self,
        keyword: str,
        target_location: Optional[str] = None,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest job postings from Hirist keyword / category endpoint."""
        clean_keyword = keyword.strip().strip("/")
        if clean_keyword.startswith("k/"):
            url = f"{HIRIST_BASE_URL}/{clean_keyword}"
        elif clean_keyword.startswith("c/"):
            url = f"{HIRIST_BASE_URL}/{clean_keyword}"
        else:
            url = f"{HIRIST_BASE_URL}/k/{clean_keyword}"

        logger.info("Starting Hirist harvest", keyword=clean_keyword, url=url)

        raw_jobs_json: List[Dict[str, Any]] = []

        # Tier 1: Fast HTTP GET
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await self._get_with_retry(url, client=client)
                raw_jobs_json = self._parse_preloaded_state(resp.text)
            except Exception as exc:
                logger.warning(
                    "Hirist Tier 1 HTTP request failed; attempting Tier 2 Playwright fallback",
                    url=url,
                    error=str(exc),
                )

        # Tier 2: Playwright fallback if Tier 1 returned no records
        if not raw_jobs_json:
            raw_jobs_json = await self._collect_via_playwright(url)

        logger.info("Hirist raw jobs extracted", count=len(raw_jobs_json), keyword=clean_keyword)

        collected_records: List[RawJobIngest] = []
        now_utc = datetime.now(timezone.utc)

        for item in raw_jobs_json:
            job_id = str(item.get("id") or item.get("jobId") or item.get("url", ""))
            if not job_id:
                continue

            title = item.get("title") or item.get("jobTitle") or "Technical Engineer"
            comp_name = (
                item.get("companyName")
                or item.get("recruiterName")
                or item.get("company")
                or "Unknown Company"
            )
            job_url = item.get("url") or item.get("jobUrl") or f"{HIRIST_BASE_URL}/j/{job_id}"
            if not job_url.startswith("http"):
                job_url = f"{HIRIST_BASE_URL}{job_url}"

            loc_str = str(item.get("location") or item.get("cityName") or "")
            if target_location and target_location.lower() != "remote":
                if target_location.lower() not in loc_str.lower():
                    continue

            min_exp = item.get("minExp") or item.get("experience_min")
            max_exp = item.get("maxExp") or item.get("experience_max")
            card_content = item.get("card_text") or item.get("description") or title

            raw_payload = {
                "id": job_id,
                "title": title,
                "company_name": comp_name,
                "location_name": loc_str,
                "experience_min": min_exp,
                "experience_max": max_exp,
                "experience": item.get("experience") or (f"{min_exp}-{max_exp} years" if min_exp is not None else ""),
                "content": card_content,
                "public_url": job_url,
                "source": "HIRIST",
            }

            record = RawJobIngest(
                source_id=self.source_id,
                company_source_id=company_source_id,
                company_name=comp_name,
                source_job_id=job_id,
                source_url=job_url,
                application_url=job_url,
                raw_payload=raw_payload,
                collected_at=now_utc,
            )
            collected_records.append(record)

        return collected_records

    async def collect_for_endpoint(
        self,
        company_name: str,
        endpoint_token: str,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest jobs by keyword or token.
        
        Example endpoint_token: 'generative-ai-jobs' or 'python-jobs|Pune'
        """
        parts = endpoint_token.split("|")
        keyword = parts[0].strip()
        location = parts[1].strip() if len(parts) > 1 else None

        return await self.collect_by_keyword(
            keyword=keyword,
            target_location=location,
            company_source_id=company_source_id,
        )

    async def test_connection(self) -> bool:
        """Verify Hirist portal connectivity."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(f"{HIRIST_BASE_URL}/c/python-jobs", headers=self.headers)
                return resp.status_code == 200
        except Exception:
            return False
