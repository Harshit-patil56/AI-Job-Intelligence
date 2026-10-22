"""Authenticity and integrity verification engine.

Implements multi-dimensional verification checks specified in rules/VERIFICATION_V1.md:
- Source authenticity
- JD completeness
- Application URL integrity
- Company validity
- Geographic plausibility
- Experience requirement consistency
- Posting date plausibility
"""

from datetime import datetime, timezone
from typing import Any, Dict
from urllib.parse import urlparse

from app.models.schemas import NormalizedJob, VerificationResult

KNOWN_SOURCES = {
    "GREENHOUSE",
    "LEVER",
    "ASHBY",
    "HIRIST",
    "JOBSPY",
    "CUTSHORT",
    "INSTAHYRE",
    "NAUKRI",
    "WELLFOUND",
    "GLASSDOOR",
    "LINKEDIN",
    "INDEED",
    "CAREER_PAGE",
}


def is_valid_url(url: str | None) -> bool:
    """Check if URL string is syntactically well-formed."""
    if not url:
        return False
    try:
        parsed = urlparse(url)
        return bool(parsed.scheme in ("http", "https") and parsed.netloc)
    except Exception:
        return False


def verify_job(job: NormalizedJob) -> VerificationResult:
    """Execute authenticity verification across 8 structural dimensions."""
    evidence: Dict[str, Any] = {}

    # 1. Source validity
    source_valid = job.source_id.upper() in KNOWN_SOURCES
    evidence["source"] = {"id": job.source_id, "valid": source_valid}

    # 2. JD existence & completeness (min 100 characters)
    jd_len = len(job.description.strip())
    jd_exists = jd_len >= 100
    evidence["jd"] = {"length": jd_len, "exists": jd_exists}

    # 3. Application URL validity
    app_url_valid = is_valid_url(job.application_url or job.source_url)
    evidence["application_url"] = {
        "url": job.application_url or job.source_url,
        "valid": app_url_valid,
    }

    # 4. Company validity
    company_valid = bool(
        job.company_name
        and job.company_name.lower().strip() not in ("unknown", "unknown company", "")
    )
    evidence["company"] = {"name": job.company_name, "valid": company_valid}

    # 5. Location consistency
    location_consistent = bool(
        job.normalized_location
        and job.normalized_location.lower().strip() not in ("unknown", "")
    )
    evidence["location"] = {
        "normalized": job.normalized_location,
        "consistent": location_consistent,
    }

    # 6. Experience consistency
    if job.experience_min is not None and job.experience_max is not None:
        experience_consistent = job.experience_min <= job.experience_max
    else:
        experience_consistent = True
    evidence["experience"] = {
        "min": job.experience_min,
        "max": job.experience_max,
        "consistent": experience_consistent,
    }

    # 7. Salary stated
    salary_stated = job.salary_min is not None
    evidence["salary"] = {"stated": salary_stated, "min": job.salary_min}

    # 8. Posting date plausibility
    now = datetime.now(timezone.utc)
    if job.posted_at:
        p_date = job.posted_at if job.posted_at.tzinfo else job.posted_at.replace(tzinfo=timezone.utc)
        # Plausible if not in future by > 1 day and not older than 180 days
        diff_days = (now - p_date).total_seconds() / 86400.0
        posting_date_plausible = -1.0 <= diff_days <= 180.0
    else:
        posting_date_plausible = True  # Missing date does not fail validity
    evidence["posting_date"] = {
        "posted_at": str(job.posted_at),
        "plausible": posting_date_plausible,
    }

    # Weighted confidence score calculation
    # Weights sum to 1.0
    score = 0.0
    score += 0.25 if source_valid else 0.0
    score += 0.25 if jd_exists else 0.0
    score += 0.15 if app_url_valid else 0.0
    score += 0.15 if company_valid else 0.0
    score += 0.10 if location_consistent else 0.0
    score += 0.05 if experience_consistent else 0.0
    score += 0.05 if posting_date_plausible else 0.0
    # salary_stated is an enrichment bonus, does not penalize
    if salary_stated:
        score = min(1.0, score + 0.05)

    confidence = round(score, 2)

    # Status classification
    if not source_valid or not jd_exists or confidence < 0.50:
        status = "FAILED"
    elif confidence >= 0.80:
        status = "PASSED"
    else:
        status = "WARNING"

    return VerificationResult(
        source_valid=source_valid,
        jd_exists=jd_exists,
        application_url_valid=app_url_valid,
        company_valid=company_valid,
        location_consistent=location_consistent,
        experience_consistent=experience_consistent,
        salary_stated=salary_stated,
        posting_date_plausible=posting_date_plausible,
        confidence=confidence,
        status=status,
        evidence=evidence,
    )
