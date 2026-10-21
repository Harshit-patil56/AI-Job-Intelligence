"""Pipeline Orchestration Service.

Coordinates the end-to-end workflow:
Collectors -> Raw Payload Store -> Normalizer -> Deduplicator -> Verifier -> Rules Engine -> Persistence.
Invoked identically by API endpoints, scheduler jobs, and CLI scripts.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
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
            "JOBSPY": JobSpyCollector(),
            "CUTSHORT": CutshortCollector(),
            "HIRIST": HiristCollector(),
            "INSTAHYRE": InstahyreCollector(),
            "NAUKRI": NaukriCollector(),
            "WELLFOUND": WellfoundCollector(),
        }

    def register_collector(self, collector: BaseCollector) -> None:
        """Register an additional ingestion collector."""
        self._collectors[collector.source_id.upper()] = collector

    async def run_endpoint_harvest(
        self,
        source_id: str,
        company_name: str,
        endpoint_token: str,
        company_source_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Harvest, normalize, deduplicate, verify, filter, and persist jobs for a single board."""
        collector = self._collectors.get(source_id.upper())
        if not collector:
            raise ValueError(f"No collector registered for source: {source_id}")

        # 1. Ensure Company, Source, and CompanySource exist
        source = await self.company_service.get_or_create_source(
            source_id=source_id.upper(),
            name=f"{source_id.title()} Platform",
            source_type="ATS" if source_id.upper() in ("GREENHOUSE", "LEVER", "ASHBY") else "AGGREGATOR",
        )
        company = await self.company_service.get_or_create_company(name=company_name)
        
        if not company_source_id:
            default_career_urls = {
                "GREENHOUSE": f"https://boards.greenhouse.io/{endpoint_token}",
                "LEVER": f"https://jobs.lever.co/{endpoint_token}",
                "ASHBY": f"https://jobs.ashbyhq.com/{endpoint_token}",
                "CUTSHORT": f"https://cutshort.io/jobs/{endpoint_token}",
                "HIRIST": f"https://www.hirist.tech/k/{endpoint_token}",
                "INSTAHYRE": f"https://www.instahyre.com/{endpoint_token}",
                "NAUKRI": f"https://www.naukri.com/{endpoint_token}",
                "WELLFOUND": f"https://wellfound.com/jobs/{endpoint_token}",
            }
            career_url = default_career_urls.get(source_id.upper())
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
            stage_detail=f"Routing to {source_id} for {company_name}",
            source_id=source_id,
            company_name=company_name,
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

                    # Dynamic Entity Resolution:
                    # If this is an aggregator feed or if norm_job.company_name differs from the run-level placeholder,
                    # resolve or create the actual hiring company record.
                    job_comp_name = norm_job.company_name.strip() if norm_job.company_name else ""
                    if job_comp_name and job_comp_name.lower() not in ("unknown company", "unknown", ""):
                        job_company = await self.company_service.get_or_create_company(name=job_comp_name)
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

    async def run_matrix_harvest(
        self,
        sources: Optional[List[str]] = None,
        targets: Optional[List[SearchTarget]] = None,
        cities: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Harvest across Indian search targets (JobSpy, Cutshort, Hirist)."""
        active_sources = [s.upper() for s in (sources or ["JOBSPY", "CUTSHORT", "HIRIST"])]
        active_targets = targets or SEARCH_TARGETS
        active_cities = cities or ["Mumbai", "Pune", "Bengaluru", "Hyderabad", "Remote"]

        total_found = 0
        total_created = 0
        total_updated = 0
        total_failed = 0
        runs_executed = 0

        logger.info(
            "Starting Indian tech search matrix harvest",
            sources=active_sources,
            target_count=len(active_targets),
            cities=active_cities,
        )

        pipeline_tracker.set_stage(
            is_active=True,
            step=1,
            stage_name="Endpoint Handshake",
            stage_detail=f"Starting search matrix harvest across {len(active_sources)} platforms...",
            status="RUNNING",
        )

        for target in active_targets:
            for city in active_cities:
                for src in active_sources:
                    if src not in self._collectors:
                        continue

                    # Platform-specific token formatting
                    if src == "CUTSHORT":
                        token = f"{target.cutshort_slug}|{city}"
                        company = f"Cutshort ({target.cutshort_slug})"
                    elif src == "HIRIST":
                        token = f"{target.hirist_keyword}|{city}"
                        company = f"Hirist ({target.hirist_keyword})"
                    elif src == "INSTAHYRE":
                        token = f"{target.query_title}|{city}"
                        company = f"Instahyre ({target.query_title})"
                    elif src == "NAUKRI":
                        token = f"{target.query_title}|{city}"
                        company = f"Naukri ({target.query_title})"
                    elif src == "WELLFOUND":
                        token = "jobs"
                        company = "Wellfound Startups"
                    else:  # JOBSPY
                        token = f"{target.query_title}|{city}"
                        company = f"JobSpy ({target.query_title})"

                    try:
                        res = await self.run_endpoint_harvest(
                            source_id=src,
                            company_name=company,
                            endpoint_token=token,
                        )
                        total_found += res.get("jobs_found", 0)
                        total_created += res.get("jobs_created", 0)
                        total_updated += res.get("jobs_updated", 0)
                        total_failed += res.get("jobs_failed", 0)
                        runs_executed += 1
                    except Exception as exc:
                        logger.error(
                            "Matrix harvest task failed",
                            source=src,
                            token=token,
                            error=str(exc),
                        )
                        total_failed += 1

        pipeline_tracker.set_stage(
            step=5,
            stage_name="Canonical Storage & Telemetry",
            stage_detail=f"Matrix harvest completed. Discovered {total_found} listings across {runs_executed} runs.",
            is_active=False,
            status="SUCCESS" if total_failed == 0 else "PARTIAL",
        )

        return {
            "status": "SUCCESS" if total_failed == 0 else "PARTIAL",
            "runs_executed": runs_executed,
            "total_found": total_found,
            "total_created": total_created,
            "total_updated": total_updated,
            "total_failed": total_failed,
        }

