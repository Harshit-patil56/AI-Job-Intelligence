"""Instahyre Ingestion Collector for Curated Indian Tech Opportunities.

Public REST API Ingestion Architecture:
Extracts curated tech jobs from Instahyre's public API:
GET https://www.instahyre.com/api/v1/job_search?skills={skills}&locations={locations}
Captures rich metadata: company profile, company tagline, logo URL, tech keywords, and public job URL.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import urllib.parse
import httpx
import structlog

from app.collectors.base import BaseCollector
from app.models.schemas import RawJobIngest

logger = structlog.get_logger()

INSTAHYRE_API_ENDPOINT = "https://www.instahyre.com/api/v1/job_search"


class InstahyreCollector(BaseCollector):
    """Direct public REST API collector for Instahyre Indian tech opportunities."""

    def __init__(
        self,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        super().__init__(
            source_id="INSTAHYRE",
            name="Instahyre Tech Sourcing",
            timeout=timeout or 15.0,
            max_retries=max_retries or 2,
        )

    async def test_connection(self) -> bool:
        """Verify Instahyre public endpoint accessibility."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(
                    INSTAHYRE_API_ENDPOINT,
                    params={"skills": "Python", "job_type": 0},
                    headers=self.headers,
                )
                return res.status_code == 200
        except Exception:
            return False

    async def collect_by_query(
        self,
        skills: str = "Python",
        locations: Optional[str] = "Bengaluru,Mumbai,Pune,Hyderabad",
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest job postings from Instahyre public search API."""
        params: Dict[str, Any] = {
            "skills": skills,
            "job_type": 0,
        }
        if locations:
            params["locations"] = locations

        logger.info("Executing Instahyre API harvest", skills=skills, locations=locations)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await self._get_with_retry(
                    INSTAHYRE_API_ENDPOINT,
                    client=client,
                    params=params,
                )
                data = res.json()
        except Exception as exc:
            logger.error("Instahyre API request failed", error=str(exc))
            return []

        raw_objects = data.get("objects", [])
        logger.info("Fetched Instahyre jobs", count=len(raw_objects))

        collected: List[RawJobIngest] = []
        for item in raw_objects:
            try:
                job_id = str(item.get("id"))
                title = item.get("title", "")
                employer = item.get("employer", {}) or {}
                company_name = employer.get("company_name", "Unknown")
                public_url = item.get("public_url") or f"https://www.instahyre.com/job-{job_id}/"
                locations_str = item.get("locations", "")
                keywords = item.get("keywords", []) or []

                # Combine tagline and note into structured content description
                note = employer.get("instahyre_note") or ""
                tagline = employer.get("company_tagline") or ""
                content = f"{title} at {company_name}.\n\nTagline: {tagline}\n\nOverview:\n{note}\n\nRequired Skills: {', '.join(keywords)}"

                raw_payload = {
                    "id": job_id,
                    "title": title,
                    "company_name": company_name,
                    "location_name": locations_str,
                    "content": content,
                    "keywords": keywords,
                    "public_url": public_url,
                    "company_tagline": tagline,
                    "company_note": note,
                    "company_founded": employer.get("company_founded"),
                    "employee_count": employer.get("employee_count"),
                    "logo_url": employer.get("profile_image_src"),
                }

                record = RawJobIngest(
                    source_id=self.source_id,
                    company_source_id=company_source_id,
                    company_name=company_name,
                    source_job_id=job_id,
                    source_url=public_url,
                    application_url=public_url,
                    raw_payload=raw_payload,
                    posted_at=None,
                )
                collected.append(record)

            except Exception as item_exc:
                logger.warning("Error parsing Instahyre job item", error=str(item_exc))
                continue

        return collected

    async def collect_for_endpoint(
        self,
        company_name: str,
        endpoint_token: str,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest jobs for token formatted as: 'skills|location' or skill keyword."""
        parts = endpoint_token.split("|")
        skills = parts[0].strip() if parts else "Python"
        location = parts[1].strip() if len(parts) > 1 else None
        return await self.collect_by_query(
            skills=skills,
            locations=location,
            company_source_id=company_source_id,
        )
