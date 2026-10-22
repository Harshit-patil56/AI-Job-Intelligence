"""Pipeline Orchestration Service.

Coordinates the end-to-end workflow:
Collectors -> Raw Payload Store -> Normalizer -> Deduplicator -> Verifier -> Rules Engine -> Persistence.
Invoked identically by API endpoints, scheduler jobs, and CLI scripts.
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import structlog

from app.collectors.ashby import AshbyCollector
from app.collectors.base import BaseCollector, calculate_content_hash
from app.collectors.cutshort import CutshortCollector
from app.collectors.greenhouse import GreenhouseCollector
from app.collectors.hirist import HiristCollector
from app.collectors.instahyre import InstahyreCollector
from app.collectors.jobspy_collector import JobSpyCollector
from app.collectors.lever import LeverCollector
from app.collectors.naukri import NaukriCollector
from app.collectors.wellfound import WellfoundCollector
from app.config.search_matrix import SEARCH_TARGETS, SearchTarget
from app.deduplication.deduplicator import DeduplicationEngine
from app.models.database import AsyncSessionLocal
from app.models.entities import (
    CollectionRun,
    Company,
    CompanySource,
    FilterDecision,
    Job,
    JobSourceReference,
    RawJob,
    VerificationRecord,
)
from app.models.schemas import FilterResult, JobStatus, NormalizedJob, RawJobIngest, VerificationResult
from app.normalization.normalizer import normalize_raw_job
from app.rules.filter_engine import RULE_VERSION, evaluate_job
from app.services.company_service import CompanyService
from app.verification.verifier import verify_job

logger = structlog.get_logger()


class PipelineStageTracker:
    """Thread/asyncio-safe in-memory tracker for active pipeline stage."""

    def __init__(self):
        self.is_active: bool = False
        self.run_id: Optional[str] = None
        self.step: int = 0
        self.stage_name: str = "Idle"
        self.stage_detail: str = ""
        self.source_id: str = ""
        self.company_name: str = ""
        self.jobs_found: int = 0
        self.jobs_processed: int = 0
        self.total_jobs: int = 0
        self.status: str = "IDLE"

    def set_stage(
        self,
        step: Optional[int] = None,
        stage_name: Optional[str] = None,
        stage_detail: Optional[str] = None,
        run_id: Optional[str] = None,
        source_id: Optional[str] = None,
        company_name: Optional[str] = None,
        jobs_found: Optional[int] = None,
        jobs_processed: Optional[int] = None,
        total_jobs: Optional[int] = None,
        status: Optional[str] = None,
        is_active: Optional[bool] = None,
    ):
        if is_active is not None:
            self.is_active = is_active
        if run_id is not None:
            self.run_id = run_id
        if step is not None:
            self.step = step
        if stage_name is not None:
            self.stage_name = stage_name
        if stage_detail is not None:
            self.stage_detail = stage_detail
        if source_id is not None:
            self.source_id = source_id
        if company_name is not None:
            self.company_name = company_name
        if jobs_found is not None:
            self.jobs_found = jobs_found
        if jobs_processed is not None:
            self.jobs_processed = jobs_processed
        if total_jobs is not None:
            self.total_jobs = total_jobs
        if status is not None:
            self.status = status

    def reset(self, status: str = "IDLE", message: str = ""):
        self.is_active = False
        self.status = status
        self.stage_detail = message
        if status == "SUCCESS":
            self.step = 5
            self.stage_name = "Canonical Storage & Telemetry"

    def to_dict(self) -> dict:
        return {
            "is_active": self.is_active,
            "run_id": self.run_id,
            "step": self.step,
            "stage_name": self.stage_name,
            "stage_detail": self.stage_detail,
            "source_id": self.source_id,
            "company_name": self.company_name,
            "jobs_found": self.jobs_found,
            "jobs_processed": self.jobs_processed,
            "total_jobs": self.total_jobs,
            "status": self.status,
        }


pipeline_tracker = PipelineStageTracker()


@dataclass
class HarvestTask:
    """Represents a single planned harvest run (one platform × one search token)."""
    source_id: str
    run_label: str
    endpoint_token: str
    collector: BaseCollector
    # Resolved during Phase 1 (setup)
    run_id: str = ""
    company_source_id: str = ""
    source_db_id: str = ""
    sentinel_company_id: str = ""


class PipelineService:
    """Central orchestration service coordinating collectors, processing, and persistence."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.company_service = CompanyService(session)
        self.deduplicator = DeduplicationEngine()
        self._collectors: Dict[str, BaseCollector] = {
            "GREENHOUSE": GreenhouseCollector(),
            "LEVER": LeverCollector(),
            "ASHBY": AshbyCollector(),
            "LINKEDIN": JobSpyCollector(source_id="LINKEDIN", name="LinkedIn Tech Portal", sites=["linkedin"], timeout=35.0),
            "JOBSPY": JobSpyCollector(source_id="JOBSPY", name="LinkedIn & Tech Boards", sites=["linkedin"], timeout=35.0),
            "NAUKRI": NaukriCollector(timeout=25.0),
            "WELLFOUND": WellfoundCollector(timeout=25.0),
            "CUTSHORT": CutshortCollector(),
            "HIRIST": HiristCollector(),
            "INSTAHYRE": InstahyreCollector(),
        }

    def register_collector(self, collector: BaseCollector) -> None:
        """Register an additional ingestion collector."""
        self._collectors[collector.source_id.upper()] = collector

    # Aggregator sources that perform keyword searches across many companies.
    # For these, we never create a fake Company entity from the search slug.
    AGGREGATOR_SOURCES = frozenset({"LINKEDIN", "JOBSPY", "CUTSHORT", "HIRIST", "INSTAHYRE", "NAUKRI", "WELLFOUND"})

    async def run_endpoint_harvest(
        self,
        source_id: str,
        company_name: str,
        endpoint_token: str,
        company_source_id: Optional[str] = None,
        run_label: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Harvest, normalize, deduplicate, verify, filter, and persist jobs for a single board.

        For ATS sources (Greenhouse, Lever, Ashby): company_name is the real hiring company.
        For Aggregator sources (JobSpy, Cutshort, Hirist etc.): company_name is a run-label
        used only for CollectionRun display — per-job company resolution uses raw scraped data.
        """
        collector = self._collectors.get(source_id.upper())
        if not collector:
            raise ValueError(f"No collector registered for source: {source_id}")

        is_aggregator = source_id.upper() in self.AGGREGATOR_SOURCES
        display_label = run_label or company_name  # human-readable label for tracking UI

        # 1. Ensure the ingestion Source platform record exists
        source = await self.company_service.get_or_create_source(
            source_id=source_id.upper(),
            name=f"{source_id.title()} Platform",
            source_type="ATS" if not is_aggregator else "AGGREGATOR",
        )

        # For ATS sources, company_name is the real hiring company — create/find Company entity.
        # For aggregator sources, individual job company resolution happens per-job below;
        # we use a lightweight sentinel company for the CollectionRun foreign key only.
        if is_aggregator:
            # Create a sentinel company representing this aggregator platform (not a real employer).
            # Jobs will each resolve to their own real Company entity during processing.
            sentinel_name = f"__{source_id.upper()}__"
            company = await self.company_service.get_or_create_company(name=sentinel_name)
        else:
            company = await self.company_service.get_or_create_company(name=company_name)

        if not company_source_id:
            if is_aggregator:
                # For aggregators, the career_url is the search results URL (for reference only).
                aggregator_search_urls = {
                    "CUTSHORT": f"https://cutshort.io/jobs/{endpoint_token.split('|')[0]}",
                    "HIRIST": f"https://www.hirist.tech/k/{endpoint_token.split('|')[0]}",
                    "INSTAHYRE": f"https://www.instahyre.com/search?q={endpoint_token.split('|')[0]}",
                    "NAUKRI": f"https://www.naukri.com/{endpoint_token.split('|')[0]}-jobs",
                    "WELLFOUND": "https://wellfound.com/jobs",
                    "JOBSPY": "https://www.linkedin.com/jobs/",
                }
                career_url = aggregator_search_urls.get(source_id.upper())
            else:
                ats_career_urls = {
                    "GREENHOUSE": f"https://boards.greenhouse.io/{endpoint_token}",
                    "LEVER": f"https://jobs.lever.co/{endpoint_token}",
                    "ASHBY": f"https://jobs.ashbyhq.com/{endpoint_token}",
                }
                career_url = ats_career_urls.get(source_id.upper())

            cs = await self.company_service.register_company_source(
                company_id=company.id,
                source_id=source.id,
                ats_identifier=endpoint_token,
                career_url=career_url,
            )
            company_source_id = cs.id

        # 2. Initialize CollectionRun tracking
        run = CollectionRun(
            source_id=source.id,
            company_source_id=company_source_id,
            started_at=datetime.now(timezone.utc),
            status="RUNNING",
        )
        self.session.add(run)
        await self.session.commit()

        pipeline_tracker.set_stage(
            is_active=True,
            run_id=run.id,
            step=1,
            stage_name="Endpoint Handshake",
            stage_detail=f"Routing to {source_id} — {display_label}",
            source_id=source_id,
            company_name=display_label,
            status="RUNNING",
            jobs_found=0,
            jobs_processed=0,
            total_jobs=0,
        )

        logger.info(
            "Executing harvest pipeline",
            source=source_id,
            company=company_name,
            endpoint=endpoint_token,
            run_id=run.id,
        )

        # 3. Collect Raw Ingestion Records
        raw_ingests: List[RawJobIngest] = []
        try:
            raw_ingests = await collector.collect_for_endpoint(
                company_name=company_name,
                endpoint_token=endpoint_token,
                company_source_id=company_source_id,
            )
            run.jobs_found = len(raw_ingests)
            pipeline_tracker.set_stage(
                step=2,
                stage_name="Payload Ingestion & Normalization",
                stage_detail=f"Extracting structured roles from {len(raw_ingests)} listings",
                jobs_found=len(raw_ingests),
                total_jobs=len(raw_ingests),
            )
        except Exception as exc:
            logger.error("Collection failed", error=str(exc))
            run.status = "FAILED"
            run.error_summary = str(exc)
            run.finished_at = datetime.now(timezone.utc)
            await self.session.commit()
            pipeline_tracker.set_stage(
                is_active=False,
                status="FAILED",
                stage_detail=str(exc),
            )
            return {"status": "FAILED", "error": str(exc), "run_id": run.id}

        # 4. Fetch existing canonical jobs for deduplication
        existing_jobs_stmt = (
            select(Job)
            .options(
                selectinload(Job.company),
                selectinload(Job.source_references),
            )
        )
        existing_jobs = list((await self.session.execute(existing_jobs_stmt)).scalars().all())

        jobs_created = 0
        jobs_updated = 0
        jobs_failed = 0

        # 5. Process each raw job through the pipeline
        for idx, raw_item in enumerate(raw_ingests):
            try:
                pipeline_tracker.set_stage(
                    step=3,
                    stage_name="Canonical Deduplication",
                    stage_detail=f"Deduplicating listing {idx + 1}/{len(raw_ingests)}",
                    jobs_processed=idx + 1,
                )
                # A. Persist / update immutable RawJob
                content_hash = calculate_content_hash(raw_item.raw_payload)
                raw_stmt = select(RawJob).where(
                    RawJob.company_source_id == company_source_id,
                    RawJob.source_job_id == raw_item.source_job_id,
                )
                raw_record = (await self.session.execute(raw_stmt)).scalar_one_or_none()

                now_utc = datetime.now(timezone.utc)
                if raw_record:
                    raw_record.last_seen_at = now_utc
                    if raw_record.raw_content_hash != content_hash:
                        raw_record.raw_payload = raw_item.raw_payload
                        raw_record.raw_content_hash = content_hash
                else:
                    raw_record = RawJob(
                        company_source_id=company_source_id,
                        source_job_id=raw_item.source_job_id,
                        source_url=raw_item.source_url,
                        application_url=raw_item.application_url,
                        raw_payload=raw_item.raw_payload,
                        raw_content_hash=content_hash,
                        first_seen_at=now_utc,
                        last_seen_at=now_utc,
                        collected_at=now_utc,
                    )
                    self.session.add(raw_record)
                await self.session.flush()

                # B. Normalize
                norm_job = normalize_raw_job(raw_item)

                pipeline_tracker.set_stage(
                    step=4,
                    stage_name="Agency & Spam Verification",
                    stage_detail=f"Verifying placement integrity {idx + 1}/{len(raw_ingests)}",
                    jobs_processed=idx + 1,
                )

                # C. Verification
                verif_result: VerificationResult = verify_job(norm_job)

                # D. Deduplication against canonical database
                dedup_match = self.deduplicator.match_job(norm_job, existing_jobs)

                if dedup_match.is_duplicate and dedup_match.canonical_job:
                    canonical_job = dedup_match.canonical_job
                    canonical_job.last_seen_at = now_utc

                    # Add new source reference
                    ref = JobSourceReference(
                        job=canonical_job,
                        job_id=canonical_job.id,
                        raw_job=raw_record,
                        raw_job_id=raw_record.id,
                        source=source,
                        source_id=source.id,
                        source_job_id=norm_job.source_job_id,
                        source_url=norm_job.source_url,
                        application_url=norm_job.application_url,
                        source_title=norm_job.canonical_title,
                        source_location=norm_job.location,
                        source_experience=norm_job.experience_text,
                        source_salary=norm_job.salary_text,
                        source_posted_at=norm_job.posted_at,
                        match_method=dedup_match.match_method or "DUPLICATE",
                        match_confidence=dedup_match.match_confidence,
                        is_primary_source=False,
                    )
                    self.session.add(ref)

                    # Handle cross-source conflict if present
                    if dedup_match.has_attribute_conflict:
                        canonical_job.review_reason = "SOURCE_CONFLICT_REVIEW"
                        if canonical_job.status == JobStatus.ELIGIBLE.value:
                            canonical_job.status = JobStatus.REVIEW.value

                    jobs_updated += 1
                else:
                    # New Canonical Job: evaluate filter rules
                    filter_result: FilterResult = evaluate_job(norm_job, evaluation_time=now_utc)
                    final_status = filter_result.status.value
                    if verif_result.status == "FAILED":
                        final_status = JobStatus.VERIFICATION_FAILED.value

                    # Per-Job Company Resolution (industry standard):
                    # Always resolve the real hiring company from normalized job data.
                    # For ATS sources this matches the run-level company.
                    # For aggregator sources this is the actual scraped employer (e.g. "Razorpay", "Flipkart").
                    # company_url from the scrape payload enriches the Company record with a real website.
                    job_comp_name = norm_job.company_name.strip() if norm_job.company_name else ""
                    # Strip any residual aggregator sentinel names that leaked through
                    if job_comp_name.startswith("__") and job_comp_name.endswith("__"):
                        job_comp_name = ""
                    if job_comp_name and job_comp_name.lower() not in ("unknown company", "unknown", ""):
                        job_company = await self.company_service.get_or_create_company(
                            name=job_comp_name,
                            website=norm_job.company_url or None,
                        )
                    else:
                        job_company = company

                    new_job = Job(
                        company_id=job_company.id,
                        company=job_company,
                        canonical_title=norm_job.canonical_title,
                        normalized_title=norm_job.normalized_title,
                        role_priority=filter_result.role_priority.value,
                        description=norm_job.description,
                        location=norm_job.normalized_location,
                        location_type=norm_job.location_type.value,
                        experience_min=norm_job.experience_min,
                        experience_max=norm_job.experience_max,
                        experience_text=norm_job.experience_text,
                        salary_min=norm_job.salary_min,
                        salary_max=norm_job.salary_max,
                        salary_currency=norm_job.salary_currency,
                        salary_period=norm_job.salary_period.value if norm_job.salary_period else "ANNUAL",
                        salary_text=norm_job.salary_text,
                        posted_at=norm_job.posted_at,
                        first_seen_at=now_utc,
                        last_seen_at=now_utc,
                        status=final_status,
                        rejection_reason=filter_result.rejection_reason.value if filter_result.rejection_reason else None,
                        review_reason=filter_result.review_reason.value if filter_result.review_reason else None,
                        verification_confidence=verif_result.confidence,
                        application_url=norm_job.application_url or norm_job.source_url,
                        application_status="NOT_APPLIED",
                    )
                    self.session.add(new_job)
                    await self.session.flush()

                    # Add primary JobSourceReference (automatically populates new_job.source_references via backref)
                    primary_ref = JobSourceReference(
                        job=new_job,
                        job_id=new_job.id,
                        raw_job=raw_record,
                        raw_job_id=raw_record.id,
                        source=source,
                        source_id=source.id,
                        source_job_id=norm_job.source_job_id,
                        source_url=norm_job.source_url,
                        application_url=norm_job.application_url,
                        source_title=norm_job.canonical_title,
                        source_location=norm_job.location,
                        source_experience=norm_job.experience_text,
                        source_salary=norm_job.salary_text,
                        source_posted_at=norm_job.posted_at,
                        match_method="PRIMARY_CREATION",
                        match_confidence=1.0,
                        is_primary_source=True,
                    )
                    self.session.add(primary_ref)

                    # Add VerificationRecord (automatically populates new_job.verification_records via backref)
                    verif_record = VerificationRecord(
                        job=new_job,
                        job_id=new_job.id,
                        source_valid=verif_result.source_valid,
                        jd_exists=verif_result.jd_exists,
                        application_url_valid=verif_result.application_url_valid,
                        company_valid=verif_result.company_valid,
                        location_consistent=verif_result.location_consistent,
                        experience_consistent=verif_result.experience_consistent,
                        salary_stated=verif_result.salary_stated,
                        posting_date_plausible=verif_result.posting_date_plausible,
                        confidence=verif_result.confidence,
                        status=verif_result.status,
                        evidence=verif_result.evidence,
                    )
                    self.session.add(verif_record)

                    # Add FilterDecision (automatically populates new_job.filter_decisions via backref)
                    filter_decision = FilterDecision(
                        job=new_job,
                        job_id=new_job.id,
                        rule_version=RULE_VERSION,
                        status=final_status,
                        role_priority=filter_result.role_priority.value,
                        reason_codes=filter_result.reason_codes,
                        decision_details=filter_result.decision_details,
                    )
                    self.session.add(filter_decision)

                    existing_jobs.append(new_job)
                    jobs_created += 1

            except Exception as item_exc:
                logger.error(
                    "Error processing job in harvest pipeline",
                    job_id=raw_item.source_job_id,
                    error=str(item_exc),
                )
                jobs_failed += 1

        # 6. Finalize Run status
        run.finished_at = datetime.now(timezone.utc)
        run.jobs_created = jobs_created
        run.jobs_updated = jobs_updated
        run.jobs_failed = jobs_failed
        run.status = "SUCCESS" if jobs_failed == 0 else "PARTIAL"
        await self.session.commit()

        pipeline_tracker.set_stage(
            step=5,
            stage_name="Canonical Storage & Telemetry",
            stage_detail=f"Harvest complete. {jobs_created} new listings, {jobs_updated} refreshed.",
            is_active=False,
            status=run.status,
            jobs_found=run.jobs_found,
            jobs_processed=len(raw_ingests),
        )

        logger.info(
            "Harvest pipeline completed",
            found=run.jobs_found,
            created=jobs_created,
            updated=jobs_updated,
            failed=jobs_failed,
            status=run.status,
        )

        return {
            "status": run.status,
            "jobs_found": run.jobs_found,
            "jobs_created": jobs_created,
            "jobs_updated": jobs_updated,
            "jobs_failed": jobs_failed,
            "run_id": run.id,
        }

    # -------------------------------------------------------------------------
    # Per-platform concurrency limits (semaphore max concurrent requests).
    # JobSpy scrapes LinkedIn/Indeed/Glassdoor — these rate-limit aggressively,
    # so we restrict to 1 concurrent request per platform.
    # Cutshort/Hirist/Instahyre are REST/HTML scrapers — allow up to 2.
    # Naukri/Wellfound are moderately tolerant — allow up to 3.
    # -------------------------------------------------------------------------
    PLATFORM_CONCURRENCY: Dict[str, int] = {
        "LINKEDIN":  1,   # LinkedIn rate-limits hard
        "JOBSPY":    1,   # Multi-board aggregator
        "NAUKRI":    3,
        "WELLFOUND": 3,
        "CUTSHORT":  2,   # Next.js HTML scrape
        "HIRIST":    2,   # Playwright/HTML scrape
        "INSTAHYRE": 2,
        "GREENHOUSE":5,   # Proper REST API
        "LEVER":     5,
        "ASHBY":     5,
    }

    async def _collect_with_semaphore(
        self,
        task: HarvestTask,
        sem: asyncio.Semaphore,
    ) -> Tuple[HarvestTask, List[RawJobIngest]]:
        """Run one collector under a platform semaphore. Pure I/O — no DB."""
        async with sem:
            pipeline_tracker.set_stage(
                step=2,
                stage_name="Concurrent Collection",
                stage_detail=f"Fetching: {task.run_label}",
                source_id=task.source_id,
                company_name=task.run_label,
            )
            try:
                ingests = await task.collector.collect_for_endpoint(
                    company_name=task.run_label,
                    endpoint_token=task.endpoint_token,
                    company_source_id=task.company_source_id or None,
                )
                logger.info(
                    "Collector finished",
                    source=task.source_id,
                    label=task.run_label,
                    found=len(ingests),
                )
                return task, ingests
            except Exception as exc:
                logger.error(
                    "Collector failed",
                    source=task.source_id,
                    label=task.run_label,
                    error=str(exc),
                )
                return task, []

    async def _persist_harvest_result(
        self,
        task: HarvestTask,
        raw_ingests: List[RawJobIngest],
        persist_sem: asyncio.Semaphore,
    ) -> Dict[str, Any]:
        """Persist one collector's results using a fresh independent DB session.

        Each task gets its own AsyncSession so concurrent persists don't share
        state — the industry-standard pattern for concurrent SQLAlchemy 2.0 work.
        """
        async with persist_sem:
            async with AsyncSessionLocal() as session:
                try:
                    svc = PipelineService(session)
                    result = await svc._process_and_persist(
                        raw_ingests=raw_ingests,
                        source_db_id=task.source_db_id,
                        company_source_id=task.company_source_id,
                        run_id=task.run_id,
                        run_label=task.run_label,
                        source_id=task.source_id,
                    )
                    await session.commit()
                    return result
                except Exception as exc:
                    await session.rollback()
                    logger.error(
                        "Persist task failed",
                        run_id=task.run_id,
                        label=task.run_label,
                        error=str(exc),
                    )
                    return {"jobs_created": 0, "jobs_updated": 0, "jobs_failed": 1}

    async def _setup_harvest_task(
        self,
        source_id: str,
        endpoint_token: str,
        run_label: str,
    ) -> HarvestTask:
        """Phase 1: Resolve/create DB entities for one harvest slot (sequential, fast).

        Creates Source, sentinel Company, CompanySource, and CollectionRun records
        so Phase 2 (HTTP) and Phase 3 (persist) can run purely concurrently.
        """
        collector = self._collectors[source_id]
        is_aggregator = source_id in self.AGGREGATOR_SOURCES

        source = await self.company_service.get_or_create_source(
            source_id=source_id,
            name=f"{source_id.title()} Platform",
            source_type="AGGREGATOR" if is_aggregator else "ATS",
        )

        sentinel_name = f"__{source_id}__" if is_aggregator else run_label
        company = await self.company_service.get_or_create_company(name=sentinel_name)

        if is_aggregator:
            aggregator_search_urls = {
                "LINKEDIN":  f"https://www.linkedin.com/jobs/search/?keywords={endpoint_token.split('|')[0]}&location={endpoint_token.split('|')[1] if '|' in endpoint_token else 'India'}",
                "JOBSPY":    f"https://www.linkedin.com/jobs/search/?keywords={endpoint_token.split('|')[0]}",
                "NAUKRI":    f"https://www.naukri.com/{endpoint_token.split('|')[0]}-jobs",
                "WELLFOUND": "https://wellfound.com/jobs",
                "CUTSHORT":  f"https://cutshort.io/jobs/{endpoint_token.split('|')[0]}",
                "HIRIST":    f"https://www.hirist.tech/k/{endpoint_token.split('|')[0]}",
                "INSTAHYRE": f"https://www.instahyre.com/search?q={endpoint_token.split('|')[0]}",
            }
            career_url = aggregator_search_urls.get(source_id)
        else:
            ats_career_urls = {
                "GREENHOUSE": f"https://boards.greenhouse.io/{endpoint_token}",
                "LEVER":      f"https://jobs.lever.co/{endpoint_token}",
                "ASHBY":      f"https://jobs.ashbyhq.com/{endpoint_token}",
            }
            career_url = ats_career_urls.get(source_id)

        cs = await self.company_service.register_company_source(
            company_id=company.id,
            source_id=source.id,
            ats_identifier=endpoint_token,
            career_url=career_url,
        )

        run = CollectionRun(
            source_id=source.id,
            company_source_id=cs.id,
            started_at=datetime.now(timezone.utc),
            status="RUNNING",
        )
        self.session.add(run)
        await self.session.flush()

        return HarvestTask(
            source_id=source_id,
            run_label=run_label,
            endpoint_token=endpoint_token,
            collector=collector,
            run_id=run.id,
            company_source_id=cs.id,
            source_db_id=source.id,
            sentinel_company_id=company.id,
        )

    async def _process_and_persist(
        self,
        raw_ingests: List[RawJobIngest],
        source_db_id: str,
        company_source_id: str,
        run_id: str,
        run_label: str,
        source_id: str,
    ) -> Dict[str, Any]:
        """Phase 3: Normalize, deduplicate, verify, filter and persist one collector's results.

        Runs inside an independent session (called from _persist_harvest_result).
        """
        from sqlalchemy import select as sa_select
        from sqlalchemy.orm import selectinload as sa_selectinload
        from app.models.entities import Source  # local import to avoid circular

        # Re-fetch Source within this independent session
        source_obj = (await self.session.execute(
            sa_select(Source).where(Source.id == source_db_id)
        )).scalar_one_or_none()

        # Re-fetch run
        run = (await self.session.execute(
            sa_select(CollectionRun).where(CollectionRun.id == run_id)
        )).scalar_one_or_none()

        if not run:
            logger.warning("CollectionRun not found in persist session", run_id=run_id)
            return {"jobs_created": 0, "jobs_updated": 0, "jobs_failed": 0}

        if not source_obj:
            logger.warning("Source not found in persist session", source_db_id=source_db_id)
            return {"jobs_created": 0, "jobs_updated": 0, "jobs_failed": 0}

        # Update run with jobs found
        run.jobs_found = len(raw_ingests)
        await self.session.flush()

        # Fetch existing jobs for deduplication
        existing_jobs_stmt = (
            sa_select(Job)
            .options(
                sa_selectinload(Job.company),
                sa_selectinload(Job.source_references),
            )
        )
        existing_jobs = list((await self.session.execute(existing_jobs_stmt)).scalars().all())

        jobs_created = 0
        jobs_updated = 0
        jobs_failed = 0
        now_utc = datetime.now(timezone.utc)

        for idx, raw_item in enumerate(raw_ingests):
            try:
                # Persist raw job
                content_hash = calculate_content_hash(raw_item.raw_payload)
                raw_stmt = sa_select(RawJob).where(
                    RawJob.company_source_id == company_source_id,
                    RawJob.source_job_id == raw_item.source_job_id,
                )
                raw_record = (await self.session.execute(raw_stmt)).scalar_one_or_none()

                if raw_record:
                    raw_record.last_seen_at = now_utc
                    if raw_record.raw_content_hash != content_hash:
                        raw_record.raw_payload = raw_item.raw_payload
                        raw_record.raw_content_hash = content_hash
                else:
                    raw_record = RawJob(
                        company_source_id=company_source_id,
                        source_job_id=raw_item.source_job_id,
                        source_url=raw_item.source_url,
                        application_url=raw_item.application_url,
                        raw_payload=raw_item.raw_payload,
                        raw_content_hash=content_hash,
                        first_seen_at=now_utc,
                        last_seen_at=now_utc,
                        collected_at=now_utc,
                    )
                    self.session.add(raw_record)
                await self.session.flush()

                # Normalize
                norm_job = normalize_raw_job(raw_item)

                # Verify
                verif_result: VerificationResult = verify_job(norm_job)

                # Deduplicate
                dedup_match = self.deduplicator.match_job(norm_job, existing_jobs)

                if dedup_match.is_duplicate and dedup_match.canonical_job:
                    canonical_job = dedup_match.canonical_job
                    canonical_job.last_seen_at = now_utc
                    ref = JobSourceReference(
                        job=canonical_job,
                        job_id=canonical_job.id,
                        raw_job=raw_record,
                        raw_job_id=raw_record.id,
                        source=source_obj,
                        source_id=source_obj.id,
                        source_job_id=norm_job.source_job_id,
                        source_url=norm_job.source_url,
                        application_url=norm_job.application_url,
                        source_title=norm_job.canonical_title,
                        source_location=norm_job.location,
                        source_experience=norm_job.experience_text,
                        source_salary=norm_job.salary_text,
                        source_posted_at=norm_job.posted_at,
                        match_method=dedup_match.match_method or "DUPLICATE",
                        match_confidence=dedup_match.match_confidence,
                        is_primary_source=False,
                    )
                    self.session.add(ref)
                    if dedup_match.has_attribute_conflict:
                        canonical_job.review_reason = "SOURCE_CONFLICT_REVIEW"
                        if canonical_job.status == JobStatus.ELIGIBLE.value:
                            canonical_job.status = JobStatus.REVIEW.value
                    jobs_updated += 1
                else:
                    filter_result: FilterResult = evaluate_job(norm_job, evaluation_time=now_utc)
                    final_status = filter_result.status.value
                    if verif_result.status == "FAILED":
                        final_status = JobStatus.VERIFICATION_FAILED.value

                    # Resolve real company per job
                    job_comp_name = norm_job.company_name.strip() if norm_job.company_name else ""
                    if job_comp_name.startswith("__") and job_comp_name.endswith("__"):
                        job_comp_name = ""
                    if job_comp_name and job_comp_name.lower() not in ("unknown company", "unknown", ""):
                        job_company = await self.company_service.get_or_create_company(
                            name=job_comp_name,
                            website=norm_job.company_url or None,
                        )
                    else:
                        # Fallback: get sentinel company
                        from app.models.entities import Company as CompanyEntity
                        job_company = (await self.session.execute(
                            sa_select(CompanyEntity).where(CompanyEntity.id == run.company_source_id)
                        )).scalar_one_or_none()
                        if not job_company:
                            job_company = await self.company_service.get_or_create_company(name="Unknown Company")

                    new_job = Job(
                        company_id=job_company.id,
                        company=job_company,
                        canonical_title=norm_job.canonical_title,
                        normalized_title=norm_job.normalized_title,
                        role_priority=filter_result.role_priority.value,
                        description=norm_job.description,
                        location=norm_job.normalized_location,
                        location_type=norm_job.location_type.value,
                        experience_min=norm_job.experience_min,
                        experience_max=norm_job.experience_max,
                        experience_text=norm_job.experience_text,
                        salary_min=norm_job.salary_min,
                        salary_max=norm_job.salary_max,
                        salary_currency=norm_job.salary_currency,
                        salary_period=norm_job.salary_period.value if norm_job.salary_period else "ANNUAL",
                        salary_text=norm_job.salary_text,
                        posted_at=norm_job.posted_at,
                        first_seen_at=now_utc,
                        last_seen_at=now_utc,
                        status=final_status,
                        rejection_reason=filter_result.rejection_reason.value if filter_result.rejection_reason else None,
                        review_reason=filter_result.review_reason.value if filter_result.review_reason else None,
                        verification_confidence=verif_result.confidence,
                        application_url=norm_job.application_url or norm_job.source_url,
                        application_status="NOT_APPLIED",
                    )
                    self.session.add(new_job)
                    await self.session.flush()

                    primary_ref = JobSourceReference(
                        job=new_job,
                        job_id=new_job.id,
                        raw_job=raw_record,
                        raw_job_id=raw_record.id,
                        source=source_obj,
                        source_id=source_obj.id,
                        source_job_id=norm_job.source_job_id,
                        source_url=norm_job.source_url,
                        application_url=norm_job.application_url,
                        source_title=norm_job.canonical_title,
                        source_location=norm_job.location,
                        source_experience=norm_job.experience_text,
                        source_salary=norm_job.salary_text,
                        source_posted_at=norm_job.posted_at,
                        match_method="PRIMARY_CREATION",
                        match_confidence=1.0,
                        is_primary_source=True,
                    )
                    self.session.add(primary_ref)

                    verif_record = VerificationRecord(
                        job=new_job,
                        job_id=new_job.id,
                        source_valid=verif_result.source_valid,
                        jd_exists=verif_result.jd_exists,
                        application_url_valid=verif_result.application_url_valid,
                        company_valid=verif_result.company_valid,
                        location_consistent=verif_result.location_consistent,
                        experience_consistent=verif_result.experience_consistent,
                        salary_stated=verif_result.salary_stated,
                        posting_date_plausible=verif_result.posting_date_plausible,
                        confidence=verif_result.confidence,
                        status=verif_result.status,
                        evidence=verif_result.evidence,
                    )
                    self.session.add(verif_record)

                    filter_decision = FilterDecision(
                        job=new_job,
                        job_id=new_job.id,
                        rule_version=RULE_VERSION,
                        status=final_status,
                        role_priority=filter_result.role_priority.value,
                        reason_codes=filter_result.reason_codes,
                        decision_details=filter_result.decision_details,
                    )
                    self.session.add(filter_decision)

                    existing_jobs.append(new_job)
                    jobs_created += 1

            except Exception as item_exc:
                logger.error(
                    "Error processing job in persist task",
                    job_id=raw_item.source_job_id,
                    label=run_label,
                    error=str(item_exc),
                )
                jobs_failed += 1

        # Finalize run record
        run.finished_at = datetime.now(timezone.utc)
        run.jobs_created = jobs_created
        run.jobs_updated = jobs_updated
        run.jobs_failed = jobs_failed
        run.status = "SUCCESS" if jobs_failed == 0 else "PARTIAL"
        await self.session.flush()

        return {
            "jobs_found": len(raw_ingests),
            "jobs_created": jobs_created,
            "jobs_updated": jobs_updated,
            "jobs_failed": jobs_failed,
            "run_id": run_id,
        }

    async def run_matrix_harvest(
        self,
        sources: Optional[List[str]] = None,
        targets: Optional[List[SearchTarget]] = None,
        cities: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Concurrent matrix harvest across Indian tech platforms.

        Industry-standard 3-phase approach:
          Phase 1 — Setup   : Build all HarvestTask plans (sequential DB setup, fast).
          Phase 2 — Collect : Run all HTTP collectors concurrently with per-platform
                              asyncio.Semaphore rate limits to avoid bans.
          Phase 3 — Persist : Persist each result concurrently using independent
                              DB sessions (AsyncSessionLocal) — SQLAlchemy 2.0 best practice.

        Expected speed improvement: ~10–15x over sequential execution.
        Full 105-task matrix: ~5–8 min instead of 45–90 min.
        """
        # Standard portal priority hierarchy:
        # Priority 1: LinkedIn (Top professional network)
        # Priority 2: Naukri (Tier-1 Indian tech enterprise portal)
        # Priority 3: Wellfound (AngelList - premier startup ecosystem)
        # Priority 4: Cutshort (Specialized Indian tech recruiters)
        # Priority 5: Hirist (Specialized tech portal)
        PORTAL_PRIORITY_ORDER = ["LINKEDIN", "JOBSPY", "NAUKRI", "WELLFOUND", "CUTSHORT", "HIRIST", "INSTAHYRE"]

        raw_sources = sources or ["LINKEDIN", "NAUKRI", "WELLFOUND", "CUTSHORT", "HIRIST"]

        def _portal_priority_key(src_name: str) -> int:
            s_up = src_name.upper()
            try:
                return PORTAL_PRIORITY_ORDER.index(s_up)
            except ValueError:
                return 99

        active_sources = sorted(
            list(dict.fromkeys(s.upper() for s in raw_sources)),
            key=_portal_priority_key,
        )
        active_targets = targets or SEARCH_TARGETS
        active_cities = cities or ["Mumbai", "Pune", "Bengaluru", "Hyderabad", "Remote"]

        logger.info(
            "Starting prioritized concurrent matrix harvest",
            sources=active_sources,
            targets=len(active_targets),
            cities=len(active_cities),
        )

        # ── Phase 1: Setup ────────────────────────────────────────────────────
        # Build all HarvestTask plans sequentially in priority order.
        # DB operations here are fast (just upserts), so sequential is fine
        # and avoids session-sharing bugs.
        pipeline_tracker.set_stage(
            is_active=True,
            step=1,
            stage_name="Endpoint Handshake",
            stage_detail="Setting up harvest plans (prioritizing top portals: LinkedIn, Naukri, Wellfound)...",
            status="RUNNING",
            jobs_found=0,
            jobs_processed=0,
            total_jobs=0,
        )

        harvest_tasks: List[HarvestTask] = []
        for src in active_sources:
            if src not in self._collectors:
                continue

            if src == "WELLFOUND":
                # Wellfound returns 40+ startup openings in one feed across roles
                task = await self._setup_harvest_task(
                    source_id=src,
                    endpoint_token="jobs",
                    run_label="Tech Startups via Wellfound (AngelList)",
                )
                harvest_tasks.append(task)
                continue

            for target in active_targets:
                for city in active_cities:
                    if src in ("LINKEDIN", "JOBSPY"):
                        token = f"{target.query_title}|{city}"
                        run_label = f"{target.query_title} via LinkedIn · {city}"
                    elif src == "NAUKRI":
                        token = f"{target.query_title}|{city}"
                        run_label = f"{target.query_title} via Naukri · {city}"
                    elif src == "CUTSHORT":
                        token = f"{target.cutshort_slug}|{city}"
                        run_label = f"{target.query_title} via Cutshort · {city}"
                    elif src == "HIRIST":
                        token = f"{target.hirist_keyword}|{city}"
                        run_label = f"{target.query_title} via Hirist · {city}"
                    elif src == "INSTAHYRE":
                        token = f"{target.query_title}|{city}"
                        run_label = f"{target.query_title} via Instahyre · {city}"
                    else:
                        token = f"{target.query_title}|{city}"
                        run_label = f"{target.query_title} via {src.title()} · {city}"

                    task = await self._setup_harvest_task(
                        source_id=src,
                        endpoint_token=token,
                        run_label=run_label,
                    )
                    harvest_tasks.append(task)

        # Commit all setup records together
        await self.session.commit()

        total_tasks = len(harvest_tasks)
        logger.info("Harvest plans created", total_tasks=total_tasks)

        pipeline_tracker.set_stage(
            step=2,
            stage_name="Concurrent Collection",
            stage_detail=f"Launching {total_tasks} concurrent collectors...",
            total_jobs=total_tasks,
        )

        # ── Phase 2: Concurrent HTTP Collection ───────────────────────────────
        # One asyncio.Semaphore per platform to enforce independent rate limits.
        # e.g. JOBSPY=1 means only 1 JobSpy request at a time (avoids LinkedIn ban).
        #      CUTSHORT=2 means up to 2 Cutshort requests can run simultaneously.
        platform_sems: Dict[str, asyncio.Semaphore] = {
            src: asyncio.Semaphore(self.PLATFORM_CONCURRENCY.get(src, 2))
            for src in active_sources
        }

        collect_coros = [
            self._collect_with_semaphore(task, platform_sems[task.source_id])
            for task in harvest_tasks
        ]
        # gather with return_exceptions=True so one failure doesn't kill the rest
        raw_results: List[Tuple[HarvestTask, List[RawJobIngest]]] = []
        gather_results = await asyncio.gather(*collect_coros, return_exceptions=True)

        total_found = 0
        for i, result in enumerate(gather_results):
            if isinstance(result, Exception):
                logger.error(
                    "Collect coroutine raised exception",
                    task_label=harvest_tasks[i].run_label,
                    error=str(result),
                )
                raw_results.append((harvest_tasks[i], []))
            else:
                task, ingests = result  # type: ignore[misc]
                total_found += len(ingests)
                raw_results.append((task, ingests))

        logger.info("All collectors finished", total_found=total_found)

        pipeline_tracker.set_stage(
            step=3,
            stage_name="Canonical Deduplication",
            stage_detail=f"Persisting {total_found} collected listings concurrently...",
            jobs_found=total_found,
        )

        # ── Phase 3: Concurrent Persistence ───────────────────────────────────
        # Each task runs in its own AsyncSession (created from AsyncSessionLocal).
        # A persist_sem(5) prevents overwhelming SQLite/PostgreSQL with too many
        # simultaneous write transactions.
        persist_sem = asyncio.Semaphore(5)

        persist_coros = [
            self._persist_harvest_result(task, ingests, persist_sem)
            for task, ingests in raw_results
        ]
        persist_results = await asyncio.gather(*persist_coros, return_exceptions=True)

        total_created = 0
        total_updated = 0
        total_failed = 0
        runs_executed = 0

        for pr in persist_results:
            if isinstance(pr, Exception):
                logger.error("Persist coroutine raised exception", error=str(pr))
                total_failed += 1
            else:
                r = pr  # type: ignore[assignment]
                total_created += r.get("jobs_created", 0)
                total_updated += r.get("jobs_updated", 0)
                total_failed += r.get("jobs_failed", 0)
                runs_executed += 1

        final_status = "SUCCESS" if total_failed == 0 else "PARTIAL"
        pipeline_tracker.set_stage(
            step=5,
            stage_name="Canonical Storage & Telemetry",
            stage_detail=(
                f"Matrix harvest complete · {total_found} found · "
                f"{total_created} new · {total_updated} refreshed across {runs_executed} runs."
            ),
            is_active=False,
            status=final_status,
            jobs_found=total_found,
            jobs_processed=total_found,
        )

        logger.info(
            "Concurrent matrix harvest finished",
            runs=runs_executed,
            found=total_found,
            created=total_created,
            updated=total_updated,
            failed=total_failed,
        )

        return {
            "status": final_status,
            "runs_executed": runs_executed,
            "total_found": total_found,
            "total_created": total_created,
            "total_updated": total_updated,
            "total_failed": total_failed,
        }

