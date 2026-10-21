"""Wellfound (AngelList Talent) Ingestion Collector.

Dual-Tier Ingestion Architecture:
Tier 1: High-speed server-rendered Next.js __NEXT_DATA__ GraphQL Apollo cache extraction via httpx.
Tier 2: Playwright browser fallback for client-rendered dynamic startup job boards.
Extracts startup profiles, equity/compensation, and direct links to startup opportunities.
"""

from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
import httpx
import structlog

from app.collectors.base import BaseCollector
from app.models.schemas import RawJobIngest

logger = structlog.get_logger()

WELLFOUND_BASE_URL = "https://wellfound.com"


class WellfoundCollector(BaseCollector):
    """Dual-tier collector for Wellfound (formerly AngelList Talent) startup jobs."""

    def __init__(
        self,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        super().__init__(
            source_id="WELLFOUND",
            name="Wellfound Startup Portal",
            timeout=timeout or 15.0,
            max_retries=max_retries or 2,
        )

    async def test_connection(self) -> bool:
        """Verify endpoint connectivity."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(f"{WELLFOUND_BASE_URL}/jobs", headers=self.headers)
                return res.status_code == 200
        except Exception:
            return False

    def _extract_from_apollo(self, html_text: str) -> List[Dict[str, Any]]:
        """Parse Apollo GraphQL cache from Next.js __NEXT_DATA__ script."""
        try:
            soup = BeautifulSoup(html_text, "html.parser")
            tag = soup.find("script", id="__NEXT_DATA__")
            if not tag or not tag.string:
                return []

            data = json.loads(tag.string)
            page_props = data.get("props", {}).get("pageProps", {})
            apollo_data = page_props.get("apolloState", {}).get("data", {})
            if not isinstance(apollo_data, dict):
                return []

            # Map startup IDs to Startup objects
            startups: Dict[str, Dict[str, Any]] = {}
            for key, val in apollo_data.items():
                if key.startswith("Startup:") and isinstance(val, dict):
                    startups[key] = val

            # Collect JobListing objects
            job_listings: List[Dict[str, Any]] = []
            for key, val in apollo_data.items():
                if key.startswith("JobListing:") and isinstance(val, dict):
                    startup_ref = val.get("startup", {}).get("__ref")
                    startup_info = startups.get(startup_ref, {}) if startup_ref else {}
                    combined = {**val, "startup_info": startup_info}
                    job_listings.append(combined)

            return job_listings
        except Exception as exc:
            logger.warning("Wellfound Apollo extraction failed", error=str(exc))
            return []

    async def collect_by_category(
        self,
        category_slug: str = "jobs",
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest job listings from Wellfound category or role hub."""
        url = f"{WELLFOUND_BASE_URL}/{category_slug.strip('/')}"
        logger.info("Starting Wellfound harvest", url=url)

        raw_items: List[Dict[str, Any]] = []
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await self._get_with_retry(url, client=client)
                raw_items = self._extract_from_apollo(res.text)
        except Exception as exc:
            logger.warning("Wellfound Tier-1 HTTP extraction failed", error=str(exc))

        # Tier 2: Playwright fallback if Tier 1 returned zero listings
        if not raw_items:
            from app.collectors.playwright_runner import run_safe_playwright

            async def _execute_wellfound_pw() -> List[Dict[str, Any]]:
                try:
                    from playwright.async_api import async_playwright

                    logger.info("Executing Wellfound Playwright browser fallback", url=url)
                    async with async_playwright() as p:
                        browser = await p.chromium.launch(headless=True)
                        page = await browser.new_page(user_agent=self.headers.get("User-Agent"))
                        await page.goto(url, timeout=int(self.timeout * 1000), wait_until="domcontentloaded")
                        content = await page.content()
                        await browser.close()
                        return self._extract_from_apollo(content)
                except Exception as pw_exc:
                    logger.error("Wellfound Playwright fallback failed", error=str(pw_exc))
                    return []

            raw_items = await run_safe_playwright(_execute_wellfound_pw)

        logger.info("Fetched jobs from Wellfound", count=len(raw_items))
        collected: List[RawJobIngest] = []

        for item in raw_items:
            try:
                job_id = str(item.get("id"))
                title = item.get("title", "").strip()
                if not title:
                    continue

                slug = item.get("slug", "")
                startup = item.get("startup_info", {})
                company_name = startup.get("name") or "Startup"
                logo_url = startup.get("logoUrl")

                locations = item.get("locationNames", []) or []
                loc_str = ", ".join(locations) if locations else ("Remote" if item.get("remote") else "Multiple Locations")

                compensation = item.get("compensation") or ""
                public_url = f"{WELLFOUND_BASE_URL}/jobs/{job_id}-{slug}" if slug else f"{WELLFOUND_BASE_URL}/jobs/{job_id}"

                live_start = item.get("liveStartAt")
                posted_dt: Optional[datetime] = None
                if live_start:
                    try:
                        posted_dt = datetime.fromtimestamp(float(live_start), tz=timezone.utc)
                    except Exception:
                        pass

                content = f"{title} at {company_name}.\nLocation: {loc_str}\nCompensation: {compensation}\nRemote: {item.get('remote', False)}"

                raw_payload = {
                    "id": job_id,
                    "title": title,
                    "company_name": company_name,
                    "location_name": loc_str,
                    "content": content,
                    "compensation": compensation,
                    "remote": item.get("remote"),
                    "slug": slug,
                    "logo_url": logo_url,
                    "public_url": public_url,
                }

                record = RawJobIngest(
                    source_id=self.source_id,
                    company_source_id=company_source_id,
                    company_name=company_name,
                    source_job_id=job_id,
                    source_url=public_url,
                    application_url=public_url,
                    raw_payload=raw_payload,
                    posted_at=posted_dt,
                )
                collected.append(record)

            except Exception as item_exc:
                logger.warning("Error processing Wellfound job listing", error=str(item_exc))
                continue

        return collected

    async def collect_for_endpoint(
        self,
        company_name: str,
        endpoint_token: str,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest jobs for category/token slug."""
        slug = endpoint_token.strip() if endpoint_token else "jobs"
        return await self.collect_by_category(
            category_slug=slug,
            company_source_id=company_source_id,
        )
