"""Integration tests for the complete ingestion and processing pipeline."""

import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.entities import (
    CollectionRun,
    Company,
    FilterDecision,
    Job,
    JobSourceReference,
    RawJob,
    VerificationRecord,
)
from app.models.schemas import JobStatus, RawJobIngest, RolePriority
from app.services.pipeline import PipelineService


SAMPLE_RAW_INGESTS = [
    RawJobIngest(
        source_id="GREENHOUSE",
        company_name="Razorpay",
        source_job_id="gh_101",
        source_url="https://boards.greenhouse.io/razorpay/jobs/101",
        application_url="https://boards.greenhouse.io/razorpay/jobs/101",
        raw_payload={
            "id": 101,
            "title": "AI Engineer",
            "location_name": "Mumbai, India",
            "content": "<p>We are hiring an AI Engineer with 0-2 years of experience in Python and LLMs. " + "x" * 150 + "</p>",
            "company_name": "Razorpay",
        },
    ),
    RawJobIngest(
        source_id="GREENHOUSE",
        company_name="Razorpay",
        source_job_id="gh_102",
        source_url="https://boards.greenhouse.io/razorpay/jobs/102",
        application_url="https://boards.greenhouse.io/razorpay/jobs/102",
        raw_payload={
            "id": 102,
            "title": "Senior Staff Architect",
            "location_name": "Bengaluru, India",
            "content": "<p>Lead architect with 10+ years experience. " + "x" * 150 + "</p>",
            "company_name": "Razorpay",
        },
    ),
]


@pytest.mark.asyncio
async def test_end_to_end_harvest_pipeline(async_db_session):
    pipeline = PipelineService(async_db_session)

    # Mock collector's collect_for_endpoint to return our sample ingests
    with patch.object(
        pipeline._collectors["GREENHOUSE"],
        "collect_for_endpoint",
        new=AsyncMock(return_value=SAMPLE_RAW_INGESTS),
    ):
        result = await pipeline.run_endpoint_harvest(
            source_id="GREENHOUSE",
            company_name="Razorpay",
            endpoint_token="razorpay",
        )

        assert result["status"] == "SUCCESS"
        assert result["jobs_found"] == 2
        assert result["jobs_created"] == 2
        assert result["jobs_updated"] == 0

        # Verify Company was created
        comp_stmt = select(Company).where(Company.name == "Razorpay")
        company = (await async_db_session.execute(comp_stmt)).scalar_one()
        assert company.normalized_name == "razorpay"

        # Verify RawJobs were created
        raw_stmt = select(RawJob)
        raw_jobs = (await async_db_session.execute(raw_stmt)).scalars().all()
        assert len(raw_jobs) == 2

        # Verify Canonical Jobs
        jobs_stmt = (
            select(Job)
            .options(
                selectinload(Job.source_references),
                selectinload(Job.verification_records),
                selectinload(Job.filter_decisions),
            )
            .order_by(Job.canonical_title)
        )
        jobs = (await async_db_session.execute(jobs_stmt)).scalars().all()
        assert len(jobs) == 2

        # Job 1: AI Engineer in Mumbai -> ELIGIBLE, P1
        ai_job = next(j for j in jobs if j.canonical_title == "AI Engineer")
        assert ai_job.status in (JobStatus.ELIGIBLE.value, JobStatus.REVIEW.value)
        assert ai_job.role_priority == RolePriority.P1.value
        assert len(ai_job.source_references) == 1
        assert ai_job.source_references[0].is_primary_source is True
        assert len(ai_job.verification_records) == 1
        assert len(ai_job.filter_decisions) == 1

        # Job 2: Senior Staff Architect -> REJECTED, EXPERIENCE_TOO_HIGH
        sr_job = next(j for j in jobs if "Architect" in j.canonical_title)
        assert sr_job.status == JobStatus.REJECTED.value
        assert sr_job.rejection_reason in ("EXPERIENCE_TOO_HIGH", "EXCLUDED_ROLE")


@pytest.mark.asyncio
async def test_pipeline_deduplication_on_subsequent_run(async_db_session):
    pipeline = PipelineService(async_db_session)

    with patch.object(
        pipeline._collectors["GREENHOUSE"],
        "collect_for_endpoint",
        new=AsyncMock(return_value=[SAMPLE_RAW_INGESTS[0]]),
    ):
        # First Run: creates job
        res1 = await pipeline.run_endpoint_harvest(
            source_id="GREENHOUSE",
            company_name="Razorpay",
            endpoint_token="razorpay",
        )
        assert res1["jobs_created"] == 1

        # Second Run: exact same job should be deduplicated
        res2 = await pipeline.run_endpoint_harvest(
            source_id="GREENHOUSE",
            company_name="Razorpay",
            endpoint_token="razorpay",
        )
        assert res2["jobs_created"] == 0
        assert res2["jobs_updated"] == 1

        # Check only 1 canonical job remains
        jobs_stmt = select(Job)
        jobs = (await async_db_session.execute(jobs_stmt)).scalars().all()
        assert len(jobs) == 1
