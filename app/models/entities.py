"""SQLAlchemy 2.0 ORM Entities.

Implements all 10 core tables specified in docs/architecture/DATABASE_SCHEMA_V1.md:
1. companies
2. sources
3. company_sources
4. raw_jobs
5. jobs
6. job_source_references
7. verification_records
8. filter_decisions
9. ai_analysis_results
10. collection_runs
"""

from datetime import datetime, timezone
from typing import Any, List, Optional
import uuid

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.database import Base, JSON_VARIANT


def generate_uuid() -> str:
    """Generate a clean UUID string."""
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


class Company(Base):
    """Normalized corporate entity profile."""

    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    normalized_name: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    website: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sector: Mapped[str] = mapped_column(String(50), nullable=False, default="UNKNOWN")
    business_model: Mapped[str] = mapped_column(String(50), nullable=False, default="UNKNOWN")
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verification_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    # Relationships
    company_sources: Mapped[List["CompanySource"]] = relationship(
        "CompanySource", back_populates="company", cascade="all, delete-orphan"
    )
    jobs: Mapped[List["Job"]] = relationship("Job", back_populates="company")


class Source(Base):
    """Ingestion source platforms and ATS platforms."""

    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    base_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    # Relationships
    company_sources: Mapped[List["CompanySource"]] = relationship(
        "CompanySource", back_populates="source"
    )
    collection_runs: Mapped[List["CollectionRun"]] = relationship(
        "CollectionRun", back_populates="source"
    )


class CompanySource(Base):
    """Maps a company to a specific source or ATS board token."""

    __tablename__ = "company_sources"
    __table_args__ = (
        UniqueConstraint(
            "company_id", "source_id", "ats_identifier", name="uq_company_source_board"
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    # ats_identifier is nullable per correction #2: generic career pages have no ATS board token
    ats_identifier: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    career_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    api_endpoint: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    discovery_method: Mapped[str] = mapped_column(String(50), nullable=False, default="MANUAL")
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_collected_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="company_sources")
    source: Mapped["Source"] = relationship("Source", back_populates="company_sources")
    raw_jobs: Mapped[List["RawJob"]] = relationship(
        "RawJob", back_populates="company_source", cascade="all, delete-orphan"
    )
    collection_runs: Mapped[List["CollectionRun"]] = relationship(
        "CollectionRun", back_populates="company_source"
    )


class RawJob(Base):
    """Immutable raw source payloads.

    Per correction #3: points directly to company_sources.id for exact provenance.
    """

    __tablename__ = "raw_jobs"
    __table_args__ = (
        UniqueConstraint(
            "company_source_id", "source_job_id", name="uq_company_source_raw_job"
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    company_source_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("company_sources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_job_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    source_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    application_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    raw_payload: Mapped[Any] = mapped_column(JSON_VARIANT, nullable=False)
    raw_content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    # Relationships
    company_source: Mapped["CompanySource"] = relationship(
        "CompanySource", back_populates="raw_jobs"
    )
    references: Mapped[List["JobSourceReference"]] = relationship(
        "JobSourceReference", back_populates="raw_job"
    )


class Job(Base):
    """Canonical, deduplicated representation of a job opening."""

    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    canonical_title: Mapped[str] = mapped_column(String(255), nullable=False)
    normalized_title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role_priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="NOT_RELEVANT", index=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    location_type: Mapped[str] = mapped_column(String(50), nullable=False, default="UNKNOWN")

    # Experience
    experience_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    experience_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    experience_text: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Compensation
    salary_min: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    salary_max: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    salary_currency: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default="INR")
    salary_period: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True, default="ANNUAL"
    )
    salary_text: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Freshness timestamps
    # Per correction #4: posted_at is the primary basis for freshness (>5d expiration)
    posted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    # Status & Audit
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="NEW", index=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    review_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    verification_confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Application links
    application_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    application_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="NOT_APPLIED"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="jobs", lazy="selectin")
    source_references: Mapped[List["JobSourceReference"]] = relationship(
        "JobSourceReference", back_populates="job", cascade="all, delete-orphan", lazy="selectin"
    )
    verification_records: Mapped[List["VerificationRecord"]] = relationship(
        "VerificationRecord", back_populates="job", cascade="all, delete-orphan"
    )
    filter_decisions: Mapped[List["FilterDecision"]] = relationship(
        "FilterDecision", back_populates="job", cascade="all, delete-orphan"
    )
    ai_results: Mapped[List["AIAnalysisResult"]] = relationship(
        "AIAnalysisResult", back_populates="job", cascade="all, delete-orphan"
    )


class JobSourceReference(Base):
    """Tracks cross-platform discovery events for canonical jobs."""

    __tablename__ = "job_source_references"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    raw_job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("raw_jobs.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    source_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False
    )
    source_job_id: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    application_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    source_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_experience: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_salary: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_posted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    match_method: Mapped[str] = mapped_column(String(50), nullable=False)
    match_confidence: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    is_primary_source: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="source_references", lazy="selectin")
    raw_job: Mapped["RawJob"] = relationship("RawJob", back_populates="references", lazy="selectin")
    source: Mapped["Source"] = relationship("Source", lazy="selectin")


class VerificationRecord(Base):
    """Audit record of authenticity verification checks."""

    __tablename__ = "verification_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_valid: Mapped[bool] = mapped_column(Boolean, nullable=False)
    jd_exists: Mapped[bool] = mapped_column(Boolean, nullable=False)
    application_url_valid: Mapped[bool] = mapped_column(Boolean, nullable=False)
    company_valid: Mapped[bool] = mapped_column(Boolean, nullable=False)
    location_consistent: Mapped[bool] = mapped_column(Boolean, nullable=False)
    experience_consistent: Mapped[bool] = mapped_column(Boolean, nullable=False)
    salary_stated: Mapped[bool] = mapped_column(Boolean, nullable=False)
    posting_date_plausible: Mapped[bool] = mapped_column(Boolean, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    evidence: Mapped[Optional[Any]] = mapped_column(JSON_VARIANT, nullable=True)
    verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="verification_records")


class FilterDecision(Base):
    """Versioned audit trail of deterministic rule engine evaluations."""

    __tablename__ = "filter_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rule_version: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    role_priority: Mapped[str] = mapped_column(String(20), nullable=False)
    reason_codes: Mapped[Any] = mapped_column(JSON_VARIANT, nullable=False)
    decision_details: Mapped[Optional[Any]] = mapped_column(JSON_VARIANT, nullable=True)
    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="filter_decisions")


class AIAnalysisResult(Base):
    """Versioned, cached LLM inference outputs."""

    __tablename__ = "ai_analysis_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(50), nullable=False)
    input_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    output_payload: Mapped[Any] = mapped_column(JSON_VARIANT, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="ai_results")


class CollectionRun(Base):
    """Operational monitoring of collector harvesting runs."""

    __tablename__ = "collection_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    source_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    company_source_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("company_sources.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="RUNNING")
    jobs_found: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    jobs_created: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    jobs_updated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    jobs_failed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    source: Mapped["Source"] = relationship("Source", back_populates="collection_runs")
    company_source: Mapped[Optional["CompanySource"]] = relationship(
        "CompanySource", back_populates="collection_runs"
    )


class CandidateProfile(Base):
    """User's personal candidate profile and resume text for personalized AI Copilot tailoring."""

    __tablename__ = "candidate_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Tanmay")
    headline: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    target_roles: Mapped[List[str]] = mapped_column(JSON_VARIANT, nullable=False, default=list)
    preferred_locations: Mapped[List[str]] = mapped_column(JSON_VARIANT, nullable=False, default=list)
    skills: Mapped[List[str]] = mapped_column(JSON_VARIANT, nullable=False, default=list)
    resume_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )
