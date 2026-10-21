"""Cutshort Ingestion Collector for Indian Tech Opportunities.

Dual-Tier Ingestion Architecture:
Tier 1: High-speed server-rendered Next.js __NEXT_DATA__ extraction via httpx.
Tier 2: Headless Playwright browser fallback for dynamic hydration or challenge recovery.
Extracts rich structured metadata: salaryRange, expRange, skills, remoteType, and hiringForClient.
"""

import asyncio
from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
import httpx
import structlog

from app.collectors.base import BaseCollector
from app.models.schemas import RawJobIngest

logger = structlog.get_logger()

CUTSHORT_BASE_URL = "https://cutshort.io"


class CutshortCollector(BaseCollector):
    """Dual-tier collector for Cutshort.io Indian tech jobs."""

    def __init__(
        self,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        super().__init__(
            source_id="CUTSHORT",
            name="Cutshort Tech Portal",
            timeout=timeout or 15.0,
            max_retries=max_retries or 2,
        )

    def _extract_from_next_data(self, html_text: str) -> List[Dict[str, Any]]:
        """Extract structured jobs array from Next.js __NEXT_DATA__ script."""
        try:
            soup = BeautifulSoup(html_text, "html.parser")
            tag = soup.find("script", id="__NEXT_DATA__")
            if not tag or not tag.string:
                return []

            data = json.loads(tag.string)
            props = data.get("props") or {}
            page_props = props.get("pageProps") or {}
            dehydrated = page_props.get("dehydratedState") or {}
            if not isinstance(dehydrated, dict):
                return []

            queries = dehydrated.get("queries") or []
            for q in queries:
                q_key = q.get("queryKey", [])
                if isinstance(q_key, list) and len(q_key) > 0 and q_key[0] == "jobListData":
                    page_data = q.get("state", {}).get("data", {}).get("data", {}).get("pageData", {})
                    jobs = page_data.get("jobs", [])
                    if isinstance(jobs, list):
                        return jobs
        except Exception as exc:
            logger.warning("Cutshort __NEXT_DATA__ extraction failed", error=str(exc))
        return []

    async def _collect_via_playwright(self, url: str) -> List[Dict[str, Any]]:
        """Headless browser fallback using Playwright."""
        from app.collectors.playwright_runner import run_safe_playwright

        async def _execute() -> List[Dict[str, Any]]:
            try:
                from playwright.async_api import async_playwright

                logger.info("Executing Cutshort Playwright browser fallback", url=url)
                async with async_playwright() as p:
                    browser = await p.chromium.launch(headless=True)
                    page = await browser.new_page(
                        user_agent=self.headers.get("User-Agent"),
                    )
                    await page.goto(url, timeout=int(self.timeout * 1000), wait_until="domcontentloaded")
                    content = await page.content()
                    await browser.close()
                    return self._extract_from_next_data(content)
            except Exception as exc:
                logger.error("Cutshort Playwright fallback failed", url=url, error=str(exc))
                return []

        return await run_safe_playwright(_execute)

    async def collect_by_slug(
        self,
        slug: str,
        target_location: Optional[str] = None,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest job postings from Cutshort role category."""
        clean_slug = slug.strip().strip("/")
        if not clean_slug.endswith("-jobs"):
            clean_slug = f"{clean_slug}-jobs"

        url = f"{CUTSHORT_BASE_URL}/jobs/{clean_slug}"
        logger.info("Starting Cutshort harvest", slug=clean_slug, url=url)

        raw_jobs_json: List[Dict[str, Any]] = []

        # Tier 1: Fast HTTP GET
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await self._get_with_retry(url, client=client)
                raw_jobs_json = self._extract_from_next_data(resp.text)
            except Exception as exc:
                logger.warning(
                    "Cutshort Tier 1 HTTP request failed; attempting Tier 2 Playwright fallback",
                    url=url,
                    error=str(exc),
                )

        # Tier 2: Playwright fallback if Tier 1 returned no records
        if not raw_jobs_json:
            raw_jobs_json = await self._collect_via_playwright(url)

        logger.info("Cutshort raw jobs extracted", count=len(raw_jobs_json), slug=clean_slug)

        collected_records: List[RawJobIngest] = []
        now_utc = datetime.now(timezone.utc)

        for item in raw_jobs_json:
            job_id = str(item.get("_id") or item.get("id"))
            if not job_id:
                continue

            headline = item.get("headline") or item.get("title") or "Technical Role"
            company_details = item.get("companyDetails") or {}
            comp_name = company_details.get("name") or "Unknown Company"
            public_url = item.get("publicUrl") or f"{CUTSHORT_BASE_URL}/job/{job_id}"

            # Location formatting
            locations = item.get("locations") or []
            location_str = ", ".join(locations) if isinstance(locations, list) else str(locations)

            # Location filter if specified
            if target_location and target_location.lower() != "remote":
                if target_location.lower() not in location_str.lower():
                    continue

            # Salary extraction
            salary_range = item.get("salaryRange") or {}
            sal_min = salary_range.get("min")
            sal_max = salary_range.get("max")
            sal_curr = salary_range.get("currency") or "INR"

            # Experience extraction
            exp_range = item.get("expRange") or {}
            exp_min = exp_range.get("min")
            exp_max = exp_range.get("max")
            exp_text = f"{exp_min}-{exp_max} years" if exp_min is not None and exp_max is not None else ""

            raw_payload = {
                "id": job_id,
                "title": headline,
                "company_name": comp_name,
                "company_url": company_details.get("website"),
                "location_name": location_str,
                "locations": locations,
                "remote_type": item.get("remoteType"),
                "experience_min": exp_min,
                "experience_max": exp_max,
                "experience": exp_text,
                "salary_min": sal_min,
                "salary_max": sal_max,
                "salary_currency": sal_curr,
                "salary_text": item.get("salaryRangeText"),
                "skills": item.get("allSkills") or [],
                "content": item.get("sanitizedComment") or "",
                "public_url": public_url,
                "hiringForClient": bool(item.get("hiringForClient", False)),
                "source": "CUTSHORT",
            }

            record = RawJobIngest(
                source_id=self.source_id,
                company_source_id=company_source_id,
                company_name=comp_name,
                source_job_id=job_id,
                source_url=public_url,
                application_url=public_url,
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
        """Harvest jobs by slug or token.
        
        Example endpoint_token: 'generative-ai-jobs' or 'python-jobs|Mumbai'
        """
        parts = endpoint_token.split("|")
        slug = parts[0].strip()
        location = parts[1].strip() if len(parts) > 1 else None

        return await self.collect_by_slug(
            slug=slug,
            target_location=location,
            company_source_id=company_source_id,
        )

    async def test_connection(self) -> bool:
        """Verify Cutshort portal connectivity."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(f"{CUTSHORT_BASE_URL}/jobs/python-jobs", headers=self.headers)
                return resp.status_code == 200
        except Exception:
            return False
