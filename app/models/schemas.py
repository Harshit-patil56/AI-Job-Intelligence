"""Domain and Data Contract Schemas using Pydantic v2.

Type-safe representations for raw ingestion payloads, normalized jobs,
verification evaluations, filter outcomes, and API responses.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class RolePriority(str, Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    NOT_RELEVANT = "NOT_RELEVANT"


class JobStatus(str, Enum):
    NEW = "NEW"
    ELIGIBLE = "ELIGIBLE"
    REVIEW = "REVIEW"
    REJECTED = "REJECTED"
    DUPLICATE = "DUPLICATE"
    EXPIRED = "EXPIRED"
    VERIFICATION_FAILED = "VERIFICATION_FAILED"


class RejectionReason(str, Enum):
    LOCATION_NOT_ALLOWED = "LOCATION_NOT_ALLOWED"
    EXPERIENCE_TOO_HIGH = "EXPERIENCE_TOO_HIGH"
    EXCLUDED_ROLE = "EXCLUDED_ROLE"
    JOB_TOO_OLD = "JOB_TOO_OLD"
    SALARY_BELOW_MINIMUM = "SALARY_BELOW_MINIMUM"


class ReviewReason(str, Enum):
    EXPERIENCE_AMBIGUOUS = "EXPERIENCE_AMBIGUOUS"
    LOCATION_REMOTE_REVIEW = "LOCATION_REMOTE_REVIEW"
    SOURCE_CONFLICT_REVIEW = "SOURCE_CONFLICT_REVIEW"
    SALARY_UNKNOWN = "SALARY_UNKNOWN"
    LOCATION_AMBIGUOUS = "LOCATION_AMBIGUOUS"
    COMPANY_UNVERIFIED = "COMPANY_UNVERIFIED"
    EXCLUSION_AMBIGUOUS = "EXCLUSION_AMBIGUOUS"


class LocationType(str, Enum):
    ON_SITE = "ON_SITE"
    HYBRID = "HYBRID"
    REMOTE = "REMOTE"
    UNKNOWN = "UNKNOWN"


class SalaryPeriod(str, Enum):
    ANNUAL = "ANNUAL"
    MONTHLY = "MONTHLY"
    HOURLY = "HOURLY"
    UNKNOWN = "UNKNOWN"


class RawJobIngest(BaseModel):
    """Raw ingestion payload before normalization."""

    model_config = ConfigDict(extra="ignore")

    source_id: str
    company_source_id: Optional[str] = None
    company_name: str
    source_job_id: str
    source_url: str
    application_url: Optional[str] = None
    raw_payload: Dict[str, Any]
    collected_at: Optional[datetime] = None


class NormalizedJob(BaseModel):
    """Normalized job entity ready for deduplication and rule evaluation."""

    model_config = ConfigDict(extra="ignore")

    source_id: str
    company_source_id: Optional[str] = None
    source_job_id: str
    source_url: str
    application_url: Optional[str] = None

    company_name: str
    normalized_company_name: str
    company_url: Optional[str] = None

    canonical_title: str
    normalized_title: str
    description: str

    location: str
    normalized_location: str
    location_type: LocationType = LocationType.UNKNOWN
    is_p1_location: bool = False
    is_p2_location: bool = False

    experience_min: Optional[float] = None
    experience_max: Optional[float] = None
    experience_text: Optional[str] = None

    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = "INR"
    salary_period: Optional[SalaryPeriod] = SalaryPeriod.ANNUAL
    salary_text: Optional[str] = None

    is_agency: bool = False
    posted_at: Optional[datetime] = None
    raw_payload: Dict[str, Any] = Field(default_factory=dict)


class VerificationResult(BaseModel):
    """Output of multi-dimensional verification checks."""

    source_valid: bool
    jd_exists: bool
    application_url_valid: bool
    company_valid: bool
    location_consistent: bool
    experience_consistent: bool
    salary_stated: bool
    posting_date_plausible: bool
    confidence: float = Field(ge=0.0, le=1.0)
    status: str  # PASSED, WARNING, FAILED
    evidence: Dict[str, Any] = Field(default_factory=dict)


class FilterResult(BaseModel):
    """Result of deterministic rule engine evaluation."""

    status: JobStatus
    role_priority: RolePriority
    rejection_reason: Optional[RejectionReason] = None
    review_reason: Optional[ReviewReason] = None
    reason_codes: List[str] = Field(default_factory=list)
    decision_details: Dict[str, Any] = Field(default_factory=dict)
