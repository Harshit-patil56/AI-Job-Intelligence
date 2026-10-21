"""Deterministic filtering and business rules engine (V1).

Enforces maximum recall principle:
- Zero silent drops
- Evaluates role priority, experience ladder, location tiers, salary minimums, and freshness
- Emits fully auditable FilterResult records with explicit reason codes
"""

from datetime import datetime, timezone
from typing import List, Optional

from app.models.schemas import (
    FilterResult,
    JobStatus,
    LocationType,
    NormalizedJob,
    RejectionReason,
    ReviewReason,
    RolePriority,
)
from app.rules.role_classifier import classify_role

RULE_VERSION = "v1.1.0"

# Salary thresholds (in annual INR)
PUNE_MIN_SALARY_ANNUAL = 360_000.0  # ₹3.6 LPA / ₹30k per month
BLR_HYD_MIN_SALARY_ANNUAL = 500_000.0  # ₹5.0 LPA


def evaluate_job(
    job: NormalizedJob, evaluation_time: Optional[datetime] = None
) -> FilterResult:
    """Execute complete deterministic business rules against a normalized job."""
    eval_now = evaluation_time or datetime.now(timezone.utc)
    reason_codes: List[str] = []
    details: dict = {}

    # 1. Role Classification & Hard Exclusions
    role_info = classify_role(job.canonical_title, job.description)
    details["role_classification"] = {
        "priority": role_info.priority.value,
        "matched_role": role_info.matched_role,
        "is_excluded": role_info.is_excluded,
    }

    if role_info.is_excluded:
        rej_code = role_info.rejection_reason or RejectionReason.EXCLUDED_ROLE
        reason_codes.append(rej_code.value)
        return FilterResult(
            status=JobStatus.REJECTED,
            role_priority=role_info.priority,
            rejection_reason=rej_code,
            review_reason=None,
            reason_codes=reason_codes,
            decision_details=details,
        )

    # 2. Freshness / Publication Age Check
    # Evaluated strictly on original publication timestamp (posted_at)
    if job.posted_at:
        # Normalize timezone if needed
        job_posted = (
            job.posted_at
            if job.posted_at.tzinfo
            else job.posted_at.replace(tzinfo=timezone.utc)
        )
        age_days = (eval_now - job_posted).total_seconds() / 86400.0
        details["age_days"] = round(age_days, 2)
        if age_days > 5.0:
            reason_codes.append(RejectionReason.JOB_TOO_OLD.value)
            return FilterResult(
                status=JobStatus.EXPIRED,
                role_priority=role_info.priority,
                rejection_reason=RejectionReason.JOB_TOO_OLD,
                review_reason=None,
                reason_codes=reason_codes,
                decision_details=details,
            )

    review_reasons: List[ReviewReason] = []
    if role_info.review_reason:
        review_reasons.append(role_info.review_reason)

    if job.is_agency:
        review_reasons.append(ReviewReason.COMPANY_UNVERIFIED)
        reason_codes.append("AGENCY_DETECTED")
        details["is_agency"] = True

    # 3. Experience Evaluation
    details["experience"] = {
        "min": job.experience_min,
        "max": job.experience_max,
        "text": job.experience_text,
    }

    if job.experience_min is not None:
        # Minimum >= 2 years is strictly rejected
        if job.experience_min >= 2.0:
            reason_codes.append(RejectionReason.EXPERIENCE_TOO_HIGH.value)
            return FilterResult(
                status=JobStatus.REJECTED,
                role_priority=role_info.priority,
                rejection_reason=RejectionReason.EXPERIENCE_TOO_HIGH,
                review_reason=None,
                reason_codes=reason_codes,
                decision_details=details,
            )
        # 1-3 years range is routed to REVIEW per Section 4
        elif job.experience_min == 1.0 and job.experience_max is not None and job.experience_max >= 3.0:
            review_reasons.append(ReviewReason.EXPERIENCE_AMBIGUOUS)
            reason_codes.append(ReviewReason.EXPERIENCE_AMBIGUOUS.value)
        # 0-1, 0-2, 1-2 are KEEP (ELIGIBLE)
    else:
        # Ambiguous / unstated experience -> REVIEW
        review_reasons.append(ReviewReason.EXPERIENCE_AMBIGUOUS)
        reason_codes.append(ReviewReason.EXPERIENCE_AMBIGUOUS.value)

    # 4. Location Evaluation
    details["location"] = {
        "normalized": job.normalized_location,
        "type": job.location_type.value,
        "is_p1": job.is_p1_location,
        "is_p2": job.is_p2_location,
    }

    if job.location_type == LocationType.REMOTE:
        review_reasons.append(ReviewReason.LOCATION_REMOTE_REVIEW)
        reason_codes.append(ReviewReason.LOCATION_REMOTE_REVIEW.value)
    elif job.is_p1_location or job.is_p2_location:
        pass  # Approved geographic hubs
    elif job.location_type == LocationType.UNKNOWN:
        review_reasons.append(ReviewReason.LOCATION_AMBIGUOUS)
        reason_codes.append(ReviewReason.LOCATION_AMBIGUOUS.value)
    else:
        # Explicit on-site outside P1/P2 hubs
        reason_codes.append(RejectionReason.LOCATION_NOT_ALLOWED.value)
        return FilterResult(
            status=JobStatus.REJECTED,
            role_priority=role_info.priority,
            rejection_reason=RejectionReason.LOCATION_NOT_ALLOWED,
            review_reason=None,
            reason_codes=reason_codes,
            decision_details=details,
        )

    # 5. Compensation (Salary) Evaluation
    norm_loc_lower = job.normalized_location.lower()
    details["salary"] = {
        "min": job.salary_min,
        "max": job.salary_max,
        "currency": job.salary_currency,
        "period": job.salary_period.value if job.salary_period else None,
    }

    if job.salary_min is not None:
        # Pune check: minimum ₹3.6 LPA
        if "pune" in norm_loc_lower and job.salary_min < PUNE_MIN_SALARY_ANNUAL:
            reason_codes.append(RejectionReason.SALARY_BELOW_MINIMUM.value)
            return FilterResult(
                status=JobStatus.REJECTED,
                role_priority=role_info.priority,
                rejection_reason=RejectionReason.SALARY_BELOW_MINIMUM,
                review_reason=None,
                reason_codes=reason_codes,
                decision_details=details,
            )
        # Bengaluru / Hyderabad check: minimum ₹5.0 LPA
        elif any(c in norm_loc_lower for c in ("bengaluru", "hyderabad")) and job.salary_min < BLR_HYD_MIN_SALARY_ANNUAL:
            reason_codes.append(RejectionReason.SALARY_BELOW_MINIMUM.value)
            return FilterResult(
                status=JobStatus.REJECTED,
                role_priority=role_info.priority,
                rejection_reason=RejectionReason.SALARY_BELOW_MINIMUM,
                review_reason=None,
                reason_codes=reason_codes,
                decision_details=details,
            )
    else:
        # Unknown Salary: NEVER reject; flag as REVIEW
        review_reasons.append(ReviewReason.SALARY_UNKNOWN)
        reason_codes.append(ReviewReason.SALARY_UNKNOWN.value)

    # 6. Status Synthesis
    if review_reasons:
        primary_review = review_reasons[0]
        return FilterResult(
            status=JobStatus.REVIEW,
            role_priority=role_info.priority,
            rejection_reason=None,
            review_reason=primary_review,
            reason_codes=list(dict.fromkeys(reason_codes)),
            decision_details=details,
        )

    return FilterResult(
        status=JobStatus.ELIGIBLE,
        role_priority=role_info.priority,
        rejection_reason=None,
        review_reason=None,
        reason_codes=[],
        decision_details=details,
    )
