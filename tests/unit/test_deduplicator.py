"""Unit tests for tiered deduplication and conflict detection."""

from datetime import datetime, timezone
import pytest
from app.deduplication.deduplicator import DeduplicationEngine, check_material_conflict
from app.models.entities import Company, Job, JobSourceReference
from app.models.schemas import LocationType, NormalizedJob, ReviewReason


def test_stage_1_exact_external_id_match():
    engine = DeduplicationEngine()

    company = Company(id="c1", name="Acme", normalized_name="acme")
    job = Job(
        id="j1",
        company_id="c1",
        company=company,
        canonical_title="AI Engineer",
        normalized_title="ai engineer",
        description="desc",
        location="Mumbai, Maharashtra",
        source_references=[
            JobSourceReference(
                id="r1",
                job_id="j1",
                raw_job_id="raw_1",
                source_id="LINKEDIN",
                source_job_id="ext_999",
                source_url="https://linkedin.com/jobs/999",
                match_method="PRIMARY",
            )
        ],
    )

    incoming = NormalizedJob(
        source_id="LINKEDIN",
        source_job_id="ext_999",
        source_url="https://linkedin.com/jobs/999",
        company_name="Acme",
        normalized_company_name="acme",
        canonical_title="AI Engineer",
        normalized_title="ai engineer",
        description="desc",
        location="Mumbai",
        normalized_location="Mumbai, Maharashtra",
    )

    match = engine.match_job(incoming, [job])
    assert match.is_duplicate is True
    assert match.match_method == "EXACT_EXTERNAL_ID"
    assert match.match_confidence == 1.0


def test_stage_2_canonical_ats_url_match():
    engine = DeduplicationEngine()

    company = Company(id="c1", name="Acme", normalized_name="acme")
    job = Job(
        id="j1",
        company_id="c1",
        company=company,
        canonical_title="AI Engineer",
        normalized_title="ai engineer",
        description="desc",
        location="Mumbai, Maharashtra",
        application_url="https://boards.greenhouse.io/acme/jobs/555",
        source_references=[],
    )

    # Incoming from Indeed pointing to the same Greenhouse ATS URL
    incoming = NormalizedJob(
        source_id="INDEED",
        source_job_id="indeed_123",
        source_url="https://indeed.com/viewjob?jk=123",
        application_url="https://boards.greenhouse.io/acme/jobs/555",
        company_name="Acme",
        normalized_company_name="acme",
        canonical_title="AI Engineer",
        normalized_title="ai engineer",
        description="desc",
        location="Mumbai",
        normalized_location="Mumbai, Maharashtra",
    )

    match = engine.match_job(incoming, [job])
    assert match.is_duplicate is True
    assert match.match_method == "CANONICAL_ATS_URL"
    assert match.match_confidence == 0.98


def test_stage_3_composite_deterministic_match():
    engine = DeduplicationEngine()

    company = Company(id="c1", name="Razorpay", normalized_name="razorpay")
    job = Job(
        id="j1",
        company_id="c1",
        company=company,
        canonical_title="Python Backend Engineer",
        normalized_title="python backend engineer",
        description="desc",
        location="Bengaluru, Karnataka",
        posted_at=datetime.now(timezone.utc),
        source_references=[],
    )

    # Cross-source listing with identical normalized company, title, city, date
    incoming = NormalizedJob(
        source_id="JOBSPY",
        source_job_id="jobspy_456",
        source_url="https://example.com/job/456",
        company_name="Razorpay Software Pvt Ltd",
        normalized_company_name="razorpay",
        canonical_title="Python Backend Engineer",
        normalized_title="python backend engineer",
        description="desc",
        location="Bengaluru",
        normalized_location="Bengaluru, Karnataka",
        posted_at=datetime.now(timezone.utc),
    )

    match = engine.match_job(incoming, [job])
    assert match.is_duplicate is True
    assert match.match_method == "COMPOSITE_DETERMINISTIC"


def test_cross_source_material_conflict():
    company = Company(id="c1", name="Acme", normalized_name="acme")
    job = Job(
        id="j1",
        company_id="c1",
        company=company,
        canonical_title="AI Engineer",
        normalized_title="ai engineer",
        description="desc",
        location="Mumbai, Maharashtra",
        experience_min=0.0,
        experience_max=2.0,
        source_references=[],
    )

    # Incoming claims 4 years minimum
    incoming = NormalizedJob(
        source_id="OTHER",
        source_job_id="oth_1",
        source_url="https://example.com",
        company_name="Acme",
        normalized_company_name="acme",
        canonical_title="AI Engineer",
        normalized_title="ai engineer",
        description="desc",
        location="Mumbai, Maharashtra",
        normalized_location="Mumbai, Maharashtra",
        experience_min=4.0,
    )

    has_conflict, reason = check_material_conflict(job, incoming)
    assert has_conflict is True
    assert reason == ReviewReason.SOURCE_CONFLICT_REVIEW
