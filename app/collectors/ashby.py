"""Ashby ATS Ingestion Collector.

Queries public Ashby job board API endpoint:
GET https://api.ashbyhq.com/posting-api/job-board/{company_token}
Requires zero authentication, respects rate limits, and captures immutable raw payloads.
"""

from datetime import datetime, timezone
from typing import List, Optional
import httpx
import structlog

from app.collectors.base import BaseCollector
from app.models.schemas import RawJobIngest

logger = structlog.get_logger()

ASHBY_API_BASE = "https://api.ashbyhq.com/posting-api/job-board"


class AshbyCollector(BaseCollector):
    """Collector implementation for public Ashby ATS job boards."""

    def __init__(self, timeout: Optional[float] = None, max_retries: Optional[int] = None):
        super().__init__(
            source_id="ASHBY",
            name="Ashby ATS API",
            timeout=timeout,
            max_retries=max_retries,
        )

    async def collect_for_endpoint(
        self,
        company_name: str,
        endpoint_token: str,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest all open job vacancies for a given Ashby board identifier.

        Example: endpoint_token = 'linear'
        URL: https://api.ashbyhq.com/posting-api/job-board/linear
        """
        url = f"{ASHBY_API_BASE}/{endpoint_token}"
        collected_records: List[RawJobIngest] = []

        logger.info(
            "Starting Ashby harvest",
            company=company_name,
            board_token=endpoint_token,
            url=url,
        )

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await self._get_with_retry(url, client=client)
                data = response.json()
            except Exception as exc:
                logger.error(
                    "Failed to fetch Ashby job board",
                    company=company_name,
                    board_token=endpoint_token,
                    error=str(exc),
                )
                return []

            jobs_array = data.get("jobs", [])
            logger.info(
                "Fetched jobs from Ashby board",
                company=company_name,
                board_token=endpoint_token,
                count=len(jobs_array),
            )

            now_utc = datetime.now(timezone.utc)

            for item in jobs_array:
                job_id = str(item.get("id"))
                job_url = item.get("jobUrl") or f"https://jobs.ashbyhq.com/{endpoint_token}/{job_id}"
                app_url = item.get("applyUrl") or job_url

                # Ashby fields
                title = item.get("title", "")
                location_name = item.get("location") or ""
                department = item.get("department") or ""
                is_remote = bool(item.get("isRemote", False))
                description_html = item.get("descriptionHtml") or item.get("descriptionPlain") or ""
                published_at = item.get("publishedAt")

                # Compensation tiers if present
                compensation = item.get("compensation") or {}

                raw_payload = {
                    "id": job_id,
                    "title": title,
                    "company_name": company_name,
                    "location_name": location_name,
                    "is_remote": is_remote,
                    "department": department,
                    "content": description_html,
                    "published_at": published_at,
                    "job_url": job_url,
                    "apply_url": app_url,
                    "compensation": compensation,
                    "employment_type": item.get("employmentType"),
                }

                record = RawJobIngest(
                    source_id=self.source_id,
                    company_source_id=company_source_id,
                    company_name=company_name,
                    source_job_id=job_id,
                    source_url=job_url,
                    application_url=app_url,
                    raw_payload=raw_payload,
                    collected_at=now_utc,
                )
                collected_records.append(record)

        return collected_records

    async def test_connection(self) -> bool:
        """Check if Ashby job board API is accessible."""
        test_url = f"{ASHBY_API_BASE}/linear"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(test_url, headers=self.headers)
                return resp.status_code in (200, 404)
            except Exception:
                return False
