"""Unit tests for deterministic business rules and role classification."""

from datetime import datetime, timedelta, timezone
import pytest
from app.models.schemas import (
    JobStatus,
    LocationType,
    NormalizedJob,
    RejectionReason,
    ReviewReason,
    RolePriority,
)
from app.rules.filter_engine import evaluate_job
from app.rules.role_classifier import classify_role


def make_dummy_job(**kwargs) -> NormalizedJob:
    """Helper to build a valid NormalizedJob for rule testing."""
    defaults = {
        "source_id": "GREENHOUSE",
        "source_job_id": "job_123",
        "source_url": "https://example.com/job/123",
        "application_url": "https://example.com/apply/123",
        "company_name": "Acme AI",
        "normalized_company_name": "acme ai",
        "canonical_title": "AI Engineer",
        "normalized_title": "ai engineer",
        "description": "Build agentic AI applications with Python and LLMs.",
        "location": "Mumbai, Maharashtra",
        "normalized_location": "Mumbai, Maharashtra",
        "location_type": LocationType.ON_SITE,
        "is_p1_location": True,
        "is_p2_location": False,
        "experience_min": 1.0,
        "experience_max": 2.0,
        "experience_text": "1-2 years",
        "salary_min": 600_000.0,
        "salary_max": 900_000.0,
        "salary_currency": "INR",
        "posted_at": datetime.now(timezone.utc) - timedelta(hours=6),
    }
    defaults.update(kwargs)
    return NormalizedJob(**defaults)


def test_p1_role_classification():
    res = classify_role("Agentic AI Engineer")
    assert res.priority == RolePriority.P1
    assert res.is_excluded is False


def test_p2_role_classification():
    res = classify_role("Python Backend Engineer")
    assert res.priority == RolePriority.P2
    assert res.is_excluded is False


def test_p3_role_classification():
    res = classify_role("Machine Learning Engineer")
    assert res.priority == RolePriority.P3
    assert res.is_excluded is False


def test_hard_exclusion_salesforce():
    res = classify_role("Senior Salesforce Developer")
    assert res.is_excluded is True
    assert res.rejection_reason in (RejectionReason.EXCLUDED_ROLE, RejectionReason.EXPERIENCE_TOO_HIGH)


def test_hard_exclusion_qa():
    res = classify_role("QA Automation Engineer")
    assert res.is_excluded is True
    assert res.rejection_reason == RejectionReason.EXCLUDED_ROLE


def test_hard_exclusion_senior_title():
    res = classify_role("Lead AI Engineer")
    assert res.is_excluded is True
    assert res.rejection_reason == RejectionReason.EXPERIENCE_TOO_HIGH


def test_filter_eligible_p1_job():
    job = make_dummy_job(
        canonical_title="GenAI Engineer",
        experience_min=0.0,
        experience_max=2.0,
        location="Mumbai, Maharashtra",
        is_p1_location=True,
    )
    result = evaluate_job(job)
    assert result.status == JobStatus.ELIGIBLE
    assert result.role_priority == RolePriority.P1


def test_filter_experience_too_high():
    job = make_dummy_job(
        canonical_title="AI Engineer",
        experience_min=3.0,
        experience_max=5.0,
    )
    result = evaluate_job(job)
    assert result.status == JobStatus.REJECTED
    assert result.rejection_reason == RejectionReason.EXPERIENCE_TOO_HIGH


def test_filter_experience_ambiguous_1_to_3():
    job = make_dummy_job(
        canonical_title="AI Engineer",
        experience_min=1.0,
        experience_max=3.0,
    )
    result = evaluate_job(job)
    assert result.status == JobStatus.REVIEW
    assert ReviewReason.EXPERIENCE_AMBIGUOUS.value in result.reason_codes


def test_filter_location_not_allowed():
    job = make_dummy_job(
        canonical_title="AI Engineer",
        location="Noida, Uttar Pradesh",
        normalized_location="Noida, Uttar Pradesh",
        location_type=LocationType.ON_SITE,
        is_p1_location=False,
        is_p2_location=False,
    )
    result = evaluate_job(job)
    assert result.status == JobStatus.REJECTED
    assert result.rejection_reason == RejectionReason.LOCATION_NOT_ALLOWED


def test_filter_remote_routed_to_review():
    job = make_dummy_job(
        canonical_title="AI Engineer",
        location="Remote, India",
        normalized_location="Remote, India",
        location_type=LocationType.REMOTE,
        is_p1_location=False,
        is_p2_location=False,
    )
    result = evaluate_job(job)
    assert result.status == JobStatus.REVIEW
    assert ReviewReason.LOCATION_REMOTE_REVIEW.value in result.reason_codes


def test_filter_pune_salary_threshold_rejected():
    job = make_dummy_job(
        canonical_title="Python Backend Engineer",
        location="Pune, Maharashtra",
        normalized_location="Pune, Maharashtra",
        is_p1_location=True,
        salary_min=300_000.0,  # Below ₹3.6 LPA
    )
    result = evaluate_job(job)
    assert result.status == JobStatus.REJECTED
    assert result.rejection_reason == RejectionReason.SALARY_BELOW_MINIMUM


def test_filter_blr_salary_threshold_rejected():
    job = make_dummy_job(
        canonical_title="AI Engineer",
        location="Bengaluru, Karnataka",
        normalized_location="Bengaluru, Karnataka",
        is_p1_location=False,
        is_p2_location=True,
        salary_min=400_000.0,  # Below ₹5.0 LPA
    )
    result = evaluate_job(job)
    assert result.status == JobStatus.REJECTED
    assert result.rejection_reason == RejectionReason.SALARY_BELOW_MINIMUM


def test_filter_unknown_salary_never_rejected():
    job = make_dummy_job(
        canonical_title="AI Engineer",
        location="Mumbai, Maharashtra",
        is_p1_location=True,
        salary_min=None,
        salary_max=None,
    )
    result = evaluate_job(job)
    assert result.status == JobStatus.REVIEW
    assert ReviewReason.SALARY_UNKNOWN.value in result.reason_codes
    assert result.rejection_reason is None


def test_filter_freshness_expired():
    # Job published 7 days ago
    job = make_dummy_job(
        canonical_title="AI Engineer",
        posted_at=datetime.now(timezone.utc) - timedelta(days=7),
    )
    result = evaluate_job(job)
    assert result.status == JobStatus.EXPIRED
    assert result.rejection_reason == RejectionReason.JOB_TOO_OLD


def test_filter_agency_job_routed_to_review():
    """Verify staffing agency jobs are routed to REVIEW with COMPANY_UNVERIFIED and AGENCY_DETECTED."""
    job = make_dummy_job(
        canonical_title="Generative AI Engineer",
        location="Pune, Maharashtra",
        is_p1_location=True,
        salary_min=1_500_000.0,
        is_agency=True,
    )
    result = evaluate_job(job)
    assert result.status == JobStatus.REVIEW
    assert result.review_reason == ReviewReason.COMPANY_UNVERIFIED
    assert "AGENCY_DETECTED" in result.reason_codes
    assert result.decision_details.get("is_agency") is True

