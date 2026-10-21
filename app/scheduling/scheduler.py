"""APScheduler in-process background scheduling service.

Implements ADR-010: Zero distributed broker architecture.
Periodically schedules harvest jobs and daily freshness sweeps with:
- Global concurrency lock (prevents SQLite write lock contention)
- Chunked memory disposal & batch sweeps
- Error isolation and clean lifecycle shutdown
"""

import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select, update
import structlog

from app.config.settings import settings
from app.models.database import AsyncSessionLocal
from app.models.entities import Job
from app.models.schemas import JobStatus, RejectionReason
from app.services.company_service import CompanyService
from app.services.pipeline import PipelineService

logger = structlog.get_logger()

# Global mutex to prevent concurrent database write transaction clashes in SQLite
_harvest_lock = asyncio.Lock()


class AppScheduler:
    """Manages in-process periodic harvesting and housekeeping tasks with crash-proof guards."""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    async def harvest_all_active_sources(self):
        """Poll all registered active company endpoints with concurrency lock protection."""
        if _harvest_lock.locked():
            logger.warning("Harvest already in progress. Skipping scheduled batch harvest tick to protect SQLite.")
            return

        async with _harvest_lock:
            logger.info("Executing scheduled batch harvest across active company sources")
            try:
                async with AsyncSessionLocal() as session:
                    company_service = CompanyService(session)
                    pipeline = PipelineService(session)
                    active_sources = await company_service.list_active_company_sources()

                    for cs in active_sources:
                        if not cs.ats_identifier:
                            continue
                        try:
                            await pipeline.run_endpoint_harvest(
                                source_id=cs.source_id,
                                company_name=cs.company.name,
                                endpoint_token=cs.ats_identifier,
                                company_source_id=cs.id,
                            )
                        except Exception as exc:
                            logger.error(
                                "Scheduled harvest failed for source",
                                company=cs.company.name,
                                source=cs.source_id,
                                error=str(exc),
                            )
            except Exception as e:
                logger.error("Global batch harvest execution failed", error=str(e))

    async def run_freshness_expiration_sweep(self):
        """Mark jobs older than 5 days as EXPIRED using chunked batches to avoid memory bloat."""
        logger.info("Running freshness expiration sweep")
        now_utc = datetime.now(timezone.utc)
        try:
            async with AsyncSessionLocal() as session:
                # Query in batches of 500 to keep memory footprint bounded
                batch_size = 500
                offset = 0
                total_expired = 0

                while True:
                    stmt = (
                        select(Job)
                        .where(
                            Job.status.in_([JobStatus.ELIGIBLE.value, JobStatus.REVIEW.value]),
                            Job.posted_at.is_not(None),
                        )
                        .order_by(Job.id)
                        .offset(offset)
                        .limit(batch_size)
                    )
                    result = await session.execute(stmt)
                    jobs = result.scalars().all()
                    if not jobs:
                        break

                    batch_expired = 0
                    for job in jobs:
                        if not job.posted_at:
                            continue
                        p_date = job.posted_at if job.posted_at.tzinfo else job.posted_at.replace(tzinfo=timezone.utc)
                        age_days = (now_utc - p_date).total_seconds() / 86400.0
                        if age_days > 5.0:
                            job.status = JobStatus.EXPIRED.value
                            job.rejection_reason = RejectionReason.JOB_TOO_OLD.value
                            batch_expired += 1

                    if batch_expired > 0:
                        await session.commit()
                        total_expired += batch_expired

                    offset += batch_size

                logger.info("Freshness sweep finished", expired_jobs=total_expired)
        except Exception as e:
            logger.error("Freshness expiration sweep encountered an error", error=str(e))

    async def harvest_search_matrix(self):
        """Run automated Indian tech search matrix harvest with concurrency lock."""
        if _harvest_lock.locked():
            logger.warning("Harvest already in progress. Skipping scheduled matrix harvest tick to avoid collision.")
            return

        async with _harvest_lock:
            logger.info("Executing scheduled Indian tech search matrix harvest")
            try:
                async with AsyncSessionLocal() as session:
                    pipeline = PipelineService(session)
                    await pipeline.run_matrix_harvest()
            except Exception as e:
                logger.error("Matrix harvest task encountered an error", error=str(e))

    def start(self):
        """Start scheduled background jobs."""
        if not settings.scheduler_enabled:
            logger.info("Scheduler is disabled by configuration (SCHEDULER_ENABLED=false)")
            return

        # Harvest interval job for company ATS sources
        self.scheduler.add_job(
            self.harvest_all_active_sources,
            trigger=IntervalTrigger(hours=settings.collection_interval_hours),
            id="harvest_all_active_sources",
            replace_existing=True,
        )

        # Harvest Indian search matrix job (every 8 hours)
        self.scheduler.add_job(
            self.harvest_search_matrix,
            trigger=IntervalTrigger(hours=8),
            id="harvest_search_matrix",
            replace_existing=True,
        )

        # Freshness expiration daily sweep
        self.scheduler.add_job(
            self.run_freshness_expiration_sweep,
            trigger=IntervalTrigger(hours=12),
            id="run_freshness_expiration_sweep",
            replace_existing=True,
        )

        self.scheduler.start()
        logger.info(
            "Scheduler started successfully with concurrency protection",
            interval_hours=settings.collection_interval_hours,
        )

    def shutdown(self):
        """Stop scheduler cleanly."""
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
            logger.info("Scheduler stopped cleanly")
