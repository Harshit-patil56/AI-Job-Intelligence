"""Multi-tier deduplication engine and cross-source conflict handler.

Implements staged matching hierarchy from rules/DEDUPLICATION_V1.md:
- Stage 1: Exact External ID match (Confidence: 1.0)
- Stage 2: Canonical Application / ATS URL match (Confidence: 0.98)
- Stage 3: Composite Deterministic Match (Normalized Company + Title + City + Date <= 14d) (Confidence: 0.90)
- Stage 4: Cross-source conflict tracking (routes to SOURCE_CONFLICT_REVIEW)
"""

from datetime import datetime, timezone
from typing import List, NamedTuple, Optional
import structlog

from app.models.entities import Job, JobSourceReference
from app.models.schemas import NormalizedJob, ReviewReason

logger = structlog.get_logger()


class DeduplicationMatch(NamedTuple):
    is_duplicate: bool
    canonical_job: Optional[Job]
    match_method: Optional[str]
    match_confidence: float
    has_attribute_conflict: bool
    conflict_reason: Optional[ReviewReason]


def check_material_conflict(
    canonical: Job, incoming: NormalizedJob
) -> tuple[bool, Optional[ReviewReason]]:
    """Determine whether an incoming duplicate conflicts with the canonical job on material eligibility attributes."""
    # 1. Experience conflict: e.g. canonical says 0-2 yrs, incoming says 3+ yrs
    if canonical.experience_min is not None and incoming.experience_min is not None:
        if abs(canonical.experience_min - incoming.experience_min) >= 1.0:
            return True, ReviewReason.SOURCE_CONFLICT_REVIEW

    # 2. Location conflict: different primary cities
    if canonical.location and incoming.normalized_location:
        can_city = canonical.location.split(",")[0].strip().lower()
        inc_city = incoming.normalized_location.split(",")[0].strip().lower()
        if can_city != inc_city and can_city not in ("remote", "unknown") and inc_city not in ("remote", "unknown"):
            return True, ReviewReason.SOURCE_CONFLICT_REVIEW

    # 3. Salary conflict: conflicting disclosed numbers
    if (
        canonical.salary_min is not None
        and incoming.salary_min is not None
        and abs(canonical.salary_min - incoming.salary_min) > 100_000
    ):
        return True, ReviewReason.SOURCE_CONFLICT_REVIEW

    return False, None


class DeduplicationEngine:
    """Evaluates incoming normalized jobs against existing canonical database jobs."""

    def match_job(
        self, incoming: NormalizedJob, existing_jobs: List[Job]
    ) -> DeduplicationMatch:
        """Evaluate incoming job through staged deduplication tiers against existing jobs."""
        
        def get_job_refs(j: Job) -> list:
            val = j.__dict__.get("source_references")
            if val is not None:
                return val if isinstance(val, (list, tuple)) else list(val)
            return []

        def get_company_norm_name(j: Job) -> str:
            comp = j.__dict__.get("company")
            if comp is not None:
                return getattr(comp, "normalized_name", "")
            return ""

        # Stage 1: Exact External Identity Match (source_id + source_job_id)
        for job in existing_jobs:
            for ref in get_job_refs(job):
                if (
                    ref.source_id == incoming.source_id
                    and ref.source_job_id == incoming.source_job_id
                ):
                    has_conflict, reason = check_material_conflict(job, incoming)
                    return DeduplicationMatch(
                        is_duplicate=True,
                        canonical_job=job,
                        match_method="EXACT_EXTERNAL_ID",
                        match_confidence=1.0,
                        has_attribute_conflict=has_conflict,
                        conflict_reason=reason,
                    )

        # Stage 2: Canonical Application / ATS URL Match
        if incoming.application_url:
            norm_app_url = incoming.application_url.rstrip("/").lower()
            for job in existing_jobs:
                if job.application_url and job.application_url.rstrip("/").lower() == norm_app_url:
                    has_conflict, reason = check_material_conflict(job, incoming)
                    return DeduplicationMatch(
                        is_duplicate=True,
                        canonical_job=job,
                        match_method="CANONICAL_ATS_URL",
                        match_confidence=0.98,
                        has_attribute_conflict=has_conflict,
                        conflict_reason=reason,
                    )
                for ref in get_job_refs(job):
                    if ref.application_url and ref.application_url.rstrip("/").lower() == norm_app_url:
                        has_conflict, reason = check_material_conflict(job, incoming)
                        return DeduplicationMatch(
                            is_duplicate=True,
                            canonical_job=job,
                            match_method="CANONICAL_ATS_URL",
                            match_confidence=0.98,
                            has_attribute_conflict=has_conflict,
                            conflict_reason=reason,
                        )

        # Stage 3: Composite Deterministic Match
        # (Company + Title + City + Posting date proximity <= 14 days)
        for job in existing_jobs:
            # 1. Company match
            if get_company_norm_name(job) != incoming.normalized_company_name:
                continue

            # 2. Normalized Title match
            if job.normalized_title != incoming.normalized_title:
                continue

            # 3. Location match (same primary city)
            job_city = job.location.split(",")[0].strip().lower()
            inc_city = incoming.normalized_location.split(",")[0].strip().lower()
            if job_city != inc_city:
                continue

            # 4. Date proximity: if both have dates, check difference <= 14 days
            if job.posted_at and incoming.posted_at:
                j_date = job.posted_at if job.posted_at.tzinfo else job.posted_at.replace(tzinfo=timezone.utc)
                i_date = incoming.posted_at if incoming.posted_at.tzinfo else incoming.posted_at.replace(tzinfo=timezone.utc)
                diff_days = abs((j_date - i_date).total_seconds()) / 86400.0
                if diff_days > 14.0:
                    continue

            has_conflict, reason = check_material_conflict(job, incoming)
            return DeduplicationMatch(
                is_duplicate=True,
                canonical_job=job,
                match_method="COMPOSITE_DETERMINISTIC",
                match_confidence=0.90,
                has_attribute_conflict=has_conflict,
                conflict_reason=reason,
            )

        # No duplicate match -> New Canonical Job
        return DeduplicationMatch(
            is_duplicate=False,
            canonical_job=None,
            match_method=None,
            match_confidence=0.0,
            has_attribute_conflict=False,
            conflict_reason=None,
        )
