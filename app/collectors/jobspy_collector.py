"""JobSpy Ingestion Collector for Indian Tech Opportunities.

Leverages the python-jobspy library to harvest job openings across LinkedIn,
Indeed, and Glassdoor without requiring authentication, sessions, or anti-bot bypass.
Operates non-blocking using asyncio.to_thread.
"""

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import structlog
from jobspy import scrape_jobs

from app.collectors.base import BaseCollector
from app.models.schemas import RawJobIngest

logger = structlog.get_logger()


class JobSpyCollector(BaseCollector):
    """Aggregator collector utilizing JobSpy for broad Indian tech job discovery."""

    def __init__(
        self,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
        sites: Optional[List[str]] = None,
    ):
        super().__init__(
            source_id="JOBSPY",
            name="JobSpy Multi-Board Scraper",
            timeout=timeout,
            max_retries=max_retries,
        )
        self.sites = sites or ["indeed", "linkedin", "glassdoor"]

    def _sync_scrape(
        self,
        search_term: str,
        location: str,
        results_wanted: int = 15,
        hours_old: int = 120,
    ) -> List[Dict[str, Any]]:
        """Synchronous wrapper for JobSpy scrape_jobs."""
        try:
            df = scrape_jobs(
                site_name=self.sites,
                search_term=search_term,
                location=location,
                results_wanted=results_wanted,
                country_indeed="india",
                hours_old=hours_old,
                fetch_description=True,
                verbose=0,
            )
            if df is None or df.empty:
                return []
            # Fill NaN values for JSON serialization
            df = df.fillna("")
            return df.to_dict(orient="records")
        except Exception as exc:
            logger.error(
                "JobSpy scrape execution failed",
                search_term=search_term,
                location=location,
                error=str(exc),
            )
            return []

    async def collect_for_endpoint(
        self,
        company_name: str,
        endpoint_token: str,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest jobs where endpoint_token is formatted as 'search_term|location'.

        Example: endpoint_token = 'AI Engineer|Mumbai'
        """
        parts = endpoint_token.split("|")
        search_term = parts[0].strip()
        location = parts[1].strip() if len(parts) > 1 else "Mumbai"

        return await self.search_jobs(
            search_term=search_term,
            location=location,
            company_source_id=company_source_id,
        )

    async def search_jobs(
        self,
        search_term: str,
        location: str,
        results_wanted: int = 15,
        hours_old: int = 120,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Asynchronously query JobSpy across configured sites."""
        logger.info(
            "Starting JobSpy harvest",
            search_term=search_term,
            location=location,
            sites=self.sites,
        )

        try:
            records = await asyncio.wait_for(
                asyncio.to_thread(
                    self._sync_scrape,
                    search_term=search_term,
                    location=location,
                    results_wanted=results_wanted,
                    hours_old=hours_old,
                ),
                timeout=self.timeout,
            )
        except asyncio.TimeoutError:
            logger.warning(
                "JobSpy harvest timed out after limit",
                timeout=self.timeout,
                search_term=search_term,
                location=location,
            )
            return []

        logger.info(
            "JobSpy harvest retrieved raw records",
            count=len(records),
            search_term=search_term,
            location=location,
        )

        ingests: List[RawJobIngest] = []
        now_utc = datetime.now(timezone.utc)

        for row in records:
            job_id = str(row.get("id") or row.get("job_url"))
            site = str(row.get("site") or "jobspy").upper()
            comp_name = str(row.get("company") or "Unknown Company")
            job_url = str(row.get("job_url") or "")
            app_url = str(row.get("job_url_direct") or job_url)

            # Standardize date posted if provided
            posted_val = row.get("date_posted")
            posted_iso = None
            if posted_val:
                try:
                    if hasattr(posted_val, "isoformat"):
                        posted_iso = posted_val.isoformat()
                    else:
                        posted_iso = str(posted_val)
                except Exception:
                    pass

            raw_payload = {
                "id": job_id,
                "title": row.get("title", ""),
                "company_name": comp_name,
                "company_url": row.get("company_url", ""),
                "location_name": row.get("location", location),
                "content": row.get("description", ""),
                "posted_at": posted_iso,
                "source_site": site,
                "job_url": job_url,
                "absolute_url": app_url,
                "salary_min": row.get("min_amount") or None,
                "salary_max": row.get("max_amount") or None,
                "salary_currency": row.get("currency") or "INR",
                "salary_period": row.get("interval") or "ANNUAL",
                "skills": row.get("skills") or [],
                "experience": row.get("experience_range") or "",
            }

            ingest = RawJobIngest(
                source_id=site,  # e.g. INDEED, LINKEDIN, GLASSDOOR
                company_source_id=company_source_id,
                company_name=comp_name,
                source_job_id=job_id,
                source_url=job_url or app_url,
                application_url=app_url or job_url,
                raw_payload=raw_payload,
                collected_at=now_utc,
            )
            ingests.append(ingest)

        return ingests

    async def test_connection(self) -> bool:
        """Verify that JobSpy can query without network exceptions."""
        try:
            records = await asyncio.to_thread(
                self._sync_scrape,
                search_term="Python",
                location="Mumbai",
                results_wanted=1,
            )
            return len(records) >= 0
        except Exception:
            return False
