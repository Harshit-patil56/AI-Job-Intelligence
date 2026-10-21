"""Naukri Public Ingestion Collector for Indian Tech Opportunities.

Leverages non-authenticated public search wrapper via JobSpy to capture
open vacancies across tier-1 Indian hubs (Bengaluru, Pune, Mumbai, Hyderabad).
"""

import asyncio
from datetime import datetime, timezone
from typing import List, Optional
import structlog

from app.collectors.base import BaseCollector
from app.models.schemas import RawJobIngest

logger = structlog.get_logger()


class NaukriCollector(BaseCollector):
    """Collector for Naukri Indian tech job portal."""

    def __init__(
        self,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        super().__init__(
            source_id="NAUKRI",
            name="Naukri India Portal",
            timeout=timeout or 20.0,
            max_retries=max_retries or 2,
        )

    async def test_connection(self) -> bool:
        """Verify collector dependency initialization."""
        try:
            import jobspy
            return True
        except ImportError:
            return False

    async def collect_by_query(
        self,
        search_term: str = "Software Engineer",
        location: str = "Bengaluru",
        results_wanted: int = 15,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest job vacancies from Naukri in non-blocking worker thread."""
        from jobspy import scrape_jobs

        logger.info(
            "Executing Naukri public harvest",
            search_term=search_term,
            location=location,
            results_wanted=results_wanted,
        )

        def _do_scrape():
            try:
                df = scrape_jobs(
                    site_name=["naukri"],
                    search_term=search_term,
                    location=location,
                    results_wanted=results_wanted,
                    verbose=0,
                )
                return df
            except Exception as exc:
                logger.warning("Naukri scrape call failed", error=str(exc))
                return None

        df = await asyncio.to_thread(_do_scrape)
        if df is None or df.empty:
            logger.info("Naukri returned zero results", term=search_term)
            return []

        logger.info("Fetched jobs from Naukri", count=len(df))
        collected: List[RawJobIngest] = []

        for _, row in df.iterrows():
            try:
                title = str(row.get("title") or "").strip()
                company = str(row.get("company") or "").strip()
                if not title or not company:
                    continue

                raw_id = str(row.get("id") or "")
                job_url = str(row.get("job_url") or "")
                if not raw_id:
                    import hashlib
                    raw_id = hashlib.sha256(f"{company}:{title}:{job_url}".encode("utf-8")).hexdigest()[:16]

                loc_str = str(row.get("location") or location)
                desc = str(row.get("description") or title)

                posted_val = row.get("date_posted")
                posted_dt: Optional[datetime] = None
                if posted_val:
                    try:
                        if isinstance(posted_val, datetime):
                            posted_dt = posted_val if posted_val.tzinfo else posted_val.replace(tzinfo=timezone.utc)
                        else:
                            posted_dt = datetime.fromisoformat(str(posted_val)).replace(tzinfo=timezone.utc)
                    except Exception:
                        pass

                raw_payload = {
                    "id": raw_id,
                    "title": title,
                    "company_name": company,
                    "location_name": loc_str,
                    "content": desc,
                    "job_url": job_url,
                    "min_amount": row.get("min_amount"),
                    "max_amount": row.get("max_amount"),
                    "currency": row.get("currency"),
                    "interval": row.get("interval"),
                    "job_type": row.get("job_type"),
                    "date_posted": str(posted_val) if posted_val else None,
                }

                record = RawJobIngest(
                    source_id=self.source_id,
                    company_source_id=company_source_id,
                    company_name=company,
                    source_job_id=raw_id,
                    source_url=job_url or f"https://www.naukri.com/joblistings-{raw_id}",
                    application_url=job_url or None,
                    raw_payload=raw_payload,
                    posted_at=posted_dt,
                )
                collected.append(record)

            except Exception as item_exc:
                logger.warning("Error processing Naukri row", error=str(item_exc))
                continue

        return collected

    async def collect_for_endpoint(
        self,
        company_name: str,
        endpoint_token: str,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest jobs for token formatted as: 'searchTerm|location'."""
        parts = endpoint_token.split("|")
        term = parts[0].strip() if parts else "Python"
        loc = parts[1].strip() if len(parts) > 1 else "Bengaluru"
        return await self.collect_by_query(
            search_term=term,
            location=loc,
            company_source_id=company_source_id,
        )
