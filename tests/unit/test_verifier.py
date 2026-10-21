"""Unit tests for authenticity verification engine."""

from app.models.schemas import LocationType, NormalizedJob
from app.verification.verifier import verify_job, is_valid_url


def test_is_valid_url():
    assert is_valid_url("https://boards.greenhouse.io/razorpay/jobs/123") is True
    assert is_valid_url("http://example.com/apply") is True
    assert is_valid_url("not_a_url") is False
    assert is_valid_url("") is False
    assert is_valid_url(None) is False


def test_verify_job_passed():
    job = NormalizedJob(
        source_id="GREENHOUSE",
        source_job_id="12345",
        source_url="https://boards.greenhouse.io/company/jobs/12345",
        application_url="https://boards.greenhouse.io/company/jobs/12345",
        company_name="Razorpay",
        normalized_company_name="razorpay",
        canonical_title="AI Engineer",
        normalized_title="ai engineer",
        description="A" * 200,  # Valid long JD
        location="Bengaluru, Karnataka",
        normalized_location="Bengaluru, Karnataka",
        location_type=LocationType.ON_SITE,
        is_p2_location=True,
        experience_min=0.0,
        experience_max=2.0,
        salary_min=800_000.0,
    )
    result = verify_job(job)
    assert result.status == "PASSED"
    assert result.confidence >= 0.80
    assert result.source_valid is True
    assert result.jd_exists is True


def test_verify_job_failed_short_jd():
    job = NormalizedJob(
        source_id="GREENHOUSE",
        source_job_id="12345",
        source_url="https://example.com",
        company_name="Acme",
        normalized_company_name="acme",
        canonical_title="AI Engineer",
        normalized_title="ai engineer",
        description="Too short",  # < 100 chars
        location="Mumbai",
        normalized_location="Mumbai",
    )
    result = verify_job(job)
    assert result.status == "FAILED"
    assert result.jd_exists is False
