"""Lever ATS Ingestion Collector.

Queries public Lever postings API endpoint:
GET https://api.lever.co/v0/postings/{company_token}?mode=json
Requires zero authentication, respects rate limits, and captures immutable raw payloads.
"""

from datetime import datetime, timezone
from typing import List, Optional
import httpx
import structlog

from app.collectors.base import BaseCollector
from app.models.schemas import RawJobIngest

logger = structlog.get_logger()

LEVER_API_BASE = "https://api.lever.co/v0/postings"


class LeverCollector(BaseCollector):
    """Collector implementation for public Lever ATS job postings."""

    def __init__(self, timeout: Optional[float] = None, max_retries: Optional[int] = None):
        super().__init__(
            source_id="LEVER",
            name="Lever ATS API",
            timeout=timeout,
            max_retries=max_retries,
        )

    async def collect_for_endpoint(
        self,
        company_name: str,
        endpoint_token: str,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest all open job postings for a given Lever company identifier.

        Example: endpoint_token = 'clevertap'
        URL: https://api.lever.co/v0/postings/clevertap?mode=json
        """
        url = f"{LEVER_API_BASE}/{endpoint_token}"
        params = {"mode": "json"}
        collected_records: List[RawJobIngest] = []

        logger.info(
            "Starting Lever harvest",
            company=company_name,
            company_token=endpoint_token,
            url=url,
        )

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await self._get_with_retry(url, client=client, params=params)
                postings = response.json()
                if not isinstance(postings, list):
                    logger.warning(
                        "Unexpected Lever response format, expected list",
                        company=company_name,
                        token=endpoint_token,
                    )
                    return []
            except Exception as exc:
                logger.error(
                    "Failed to fetch Lever postings",
                    company=company_name,
                    token=endpoint_token,
                    error=str(exc),
                )
                return []

            logger.info(
                "Fetched postings from Lever",
                company=company_name,
                token=endpoint_token,
                count=len(postings),
            )

            now_utc = datetime.now(timezone.utc)

            for item in postings:
                job_id = str(item.get("id"))
                hosted_url = item.get("hostedUrl") or f"https://jobs.lever.co/{endpoint_token}/{job_id}"
                apply_url = item.get("applyUrl") or hosted_url

                categories = item.get("categories") or {}
                location_str = categories.get("location") or ""
                commitment = categories.get("commitment") or ""
                department = categories.get("department") or categories.get("team") or ""
                workplace_type = item.get("workplaceType") or ""

                # Extract description content (prefer plain text if available, else HTML description)
                description_content = item.get("descriptionPlain") or item.get("description") or ""
                additional_info = item.get("additionalPlain") or item.get("additional") or ""
                full_content = f"{description_content}\n\n{additional_info}".strip()

                # Parse created timestamp (milliseconds epoch)
                created_epoch = item.get("createdAt")
                posted_iso = None
                if created_epoch and isinstance(created_epoch, (int, float)):
                    try:
                        posted_iso = datetime.fromtimestamp(created_epoch / 1000.0, tz=timezone.utc).isoformat()
                    except Exception:
                        pass

                raw_payload = {
                    "id": job_id,
                    "title": item.get("text", ""),
                    "company_name": company_name,
                    "location_name": location_str,
                    "workplace_type": workplace_type,
                    "commitment": commitment,
                    "department": department,
                    "content": full_content,
                    "created_at": posted_iso,
                    "hosted_url": hosted_url,
                    "apply_url": apply_url,
                    "categories": categories,
                }

                record = RawJobIngest(
                    source_id=self.source_id,
                    company_source_id=company_source_id,
                    company_name=company_name,
                    source_job_id=job_id,
                    source_url=hosted_url,
                    application_url=apply_url,
                    raw_payload=raw_payload,
                    collected_at=now_utc,
                )
                collected_records.append(record)

        return collected_records

    async def test_connection(self) -> bool:
        """Check if Lever postings API is accessible."""
        test_url = f"{LEVER_API_BASE}/netflix"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(test_url, headers=self.headers, params={"mode": "json"})
                return resp.status_code in (200, 404)
            except Exception:
                return False
