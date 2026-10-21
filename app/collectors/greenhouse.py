"""Greenhouse ATS Ingestion Collector.

Queries public Greenhouse Board API endpoints:
GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
Requires zero authentication, respects rate limits, and captures immutable raw payloads.
"""

from datetime import datetime, timezone
from typing import List, Optional
import httpx
import structlog

from app.collectors.base import BaseCollector
from app.models.schemas import RawJobIngest

logger = structlog.get_logger()

GREENHOUSE_API_BASE = "https://boards-api.greenhouse.io/v1/boards"


class GreenhouseCollector(BaseCollector):
    """Collector implementation for public Greenhouse ATS job boards."""

    def __init__(self, timeout: Optional[float] = None, max_retries: Optional[int] = None):
        super().__init__(
            source_id="GREENHOUSE",
            name="Greenhouse ATS API",
            timeout=timeout,
            max_retries=max_retries,
        )

    async def collect_for_endpoint(
        self,
        company_name: str,
        endpoint_token: str,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest all open job vacancies for a given Greenhouse board token.

        Example: endpoint_token = 'razorpay'
        URL: https://boards-api.greenhouse.io/v1/boards/razorpay/jobs?content=true
        """
        url = f"{GREENHOUSE_API_BASE}/{endpoint_token}/jobs"
        params = {"content": "true"}
        collected_records: List[RawJobIngest] = []

        logger.info(
            "Starting Greenhouse harvest",
            company=company_name,
            board_token=endpoint_token,
            url=url,
        )

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await self._get_with_retry(url, client=client, params=params)
                data = response.json()
            except Exception as exc:
                logger.error(
                    "Failed to fetch Greenhouse board",
                    company=company_name,
                    board_token=endpoint_token,
                    error=str(exc),
                )
                return []

            jobs_array = data.get("jobs", [])
            logger.info(
                "Fetched jobs from Greenhouse board",
                company=company_name,
                board_token=endpoint_token,
                count=len(jobs_array),
            )

            for job_item in jobs_array:
                job_id = str(job_item.get("id"))
                absolute_url = job_item.get("absolute_url") or f"https://boards.greenhouse.io/{endpoint_token}/jobs/{job_id}"
                
                # Extract location string from nested dict if present
                loc_obj = job_item.get("location")
                loc_str = loc_obj.get("name") if isinstance(loc_obj, dict) else str(loc_obj or "")

                raw_payload = {
                    "id": job_id,
                    "title": job_item.get("title", ""),
                    "location_name": loc_str,
                    "content": job_item.get("content", ""),
                    "updated_at": job_item.get("updated_at"),
                    "absolute_url": absolute_url,
                    "company_name": company_name,
                    "departments": job_item.get("departments", []),
                    "offices": job_item.get("offices", []),
                }

                record = RawJobIngest(
                    source_id=self.source_id,
                    company_source_id=company_source_id,
                    company_name=company_name,
                    source_job_id=job_id,
                    source_url=absolute_url,
                    application_url=absolute_url,
                    raw_payload=raw_payload,
                    collected_at=datetime.now(timezone.utc),
                )
                collected_records.append(record)

        return collected_records

    async def test_connection(self) -> bool:
        """Check if Greenhouse board API is accessible."""
        test_url = f"{GREENHOUSE_API_BASE}/github/jobs"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(test_url, headers=self.headers)
                return resp.status_code in (200, 404)
            except Exception:
                return False
