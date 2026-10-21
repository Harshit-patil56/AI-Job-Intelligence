"""initial_schema_v1

Revision ID: 18d2ee4879ed
Revises:
Create Date: 2026-10-19

Full DDL for all 10 core tables:
  companies, sources, company_sources, raw_jobs, jobs,
  job_source_references, verification_records, filter_decisions,
  ai_analysis_results, collection_runs
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "18d2ee4879ed"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── companies ────────────────────────────────────────────────────────────
    op.create_table(
        "companies",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("normalized_name", sa.String(255), nullable=False, unique=True),
        sa.Column("website", sa.String(512), nullable=True),
        sa.Column("industry", sa.String(100), nullable=True),
        sa.Column("sector", sa.String(50), nullable=False, server_default="UNKNOWN"),
        sa.Column("business_model", sa.String(50), nullable=False, server_default="UNKNOWN"),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("verification_source", sa.String(100), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )
    op.create_index("ix_companies_normalized_name", "companies", ["normalized_name"], unique=True)

    # ─── sources ──────────────────────────────────────────────────────────────
    op.create_table(
        "sources",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("source_type", sa.String(50), nullable=False),
        sa.Column("base_url", sa.String(512), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # ─── company_sources ──────────────────────────────────────────────────────
    op.create_table(
        "company_sources",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "company_id",
            sa.String(36),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "source_id",
            sa.String(50),
            sa.ForeignKey("sources.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("ats_identifier", sa.String(255), nullable=True),
        sa.Column("career_url", sa.String(1024), nullable=True),
        sa.Column("api_endpoint", sa.String(1024), nullable=True),
        sa.Column("discovery_method", sa.String(50), nullable=False, server_default="MANUAL"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("last_collected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.UniqueConstraint("company_id", "source_id", "ats_identifier", name="uq_company_source_board"),
    )
    op.create_index("ix_company_sources_company_id", "company_sources", ["company_id"])
    op.create_index("ix_company_sources_source_id", "company_sources", ["source_id"])
    op.create_index("ix_company_sources_ats_identifier", "company_sources", ["ats_identifier"])

    # ─── raw_jobs ─────────────────────────────────────────────────────────────
    op.create_table(
        "raw_jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "company_source_id",
            sa.String(36),
            sa.ForeignKey("company_sources.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("source_job_id", sa.String(255), nullable=False),
        sa.Column("source_url", sa.String(2048), nullable=False),
        sa.Column("application_url", sa.String(2048), nullable=True),
        sa.Column("raw_payload", sa.JSON(), nullable=False),
        sa.Column("raw_content_hash", sa.String(64), nullable=False),
        sa.Column(
            "first_seen_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "last_seen_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "collected_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint("company_source_id", "source_job_id", name="uq_company_source_raw_job"),
    )
    op.create_index("ix_raw_jobs_company_source_id", "raw_jobs", ["company_source_id"])
    op.create_index("ix_raw_jobs_source_job_id", "raw_jobs", ["source_job_id"])
    op.create_index("ix_raw_jobs_raw_content_hash", "raw_jobs", ["raw_content_hash"])

    # ─── jobs ─────────────────────────────────────────────────────────────────
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "company_id",
            sa.String(36),
            sa.ForeignKey("companies.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("canonical_title", sa.String(255), nullable=False),
        sa.Column("normalized_title", sa.String(255), nullable=False),
        sa.Column("role_priority", sa.String(20), nullable=False, server_default="NOT_RELEVANT"),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("location", sa.String(255), nullable=False),
        sa.Column("location_type", sa.String(50), nullable=False, server_default="UNKNOWN"),
        sa.Column("experience_min", sa.Float(), nullable=True),
        sa.Column("experience_max", sa.Float(), nullable=True),
        sa.Column("experience_text", sa.String(255), nullable=True),
        sa.Column("salary_min", sa.Numeric(12, 2), nullable=True),
        sa.Column("salary_max", sa.Numeric(12, 2), nullable=True),
        sa.Column("salary_currency", sa.String(10), nullable=True, server_default="INR"),
        sa.Column("salary_period", sa.String(20), nullable=True, server_default="ANNUAL"),
        sa.Column("salary_text", sa.String(255), nullable=True),
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "first_seen_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "last_seen_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("status", sa.String(30), nullable=False, server_default="NEW"),
        sa.Column("rejection_reason", sa.String(100), nullable=True),
        sa.Column("review_reason", sa.String(100), nullable=True),
        sa.Column("verification_confidence", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("application_url", sa.String(2048), nullable=True),
        sa.Column("application_status", sa.String(30), nullable=False, server_default="NOT_APPLIED"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )
    op.create_index("ix_jobs_company_id", "jobs", ["company_id"])
    op.create_index("ix_jobs_normalized_title", "jobs", ["normalized_title"])
    op.create_index("ix_jobs_role_priority", "jobs", ["role_priority"])
    op.create_index("ix_jobs_posted_at", "jobs", ["posted_at"])
    op.create_index("ix_jobs_status", "jobs", ["status"])

    # ─── job_source_references ────────────────────────────────────────────────
    op.create_table(
        "job_source_references",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "job_id",
            sa.String(36),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "raw_job_id",
            sa.String(36),
            sa.ForeignKey("raw_jobs.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "source_id",
            sa.String(50),
            sa.ForeignKey("sources.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("source_job_id", sa.String(255), nullable=False),
        sa.Column("source_url", sa.String(2048), nullable=False),
        sa.Column("application_url", sa.String(2048), nullable=True),
        sa.Column("source_title", sa.String(255), nullable=True),
        sa.Column("source_location", sa.String(255), nullable=True),
        sa.Column("source_experience", sa.String(255), nullable=True),
        sa.Column("source_salary", sa.String(255), nullable=True),
        sa.Column("source_posted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("match_method", sa.String(50), nullable=False),
        sa.Column("match_confidence", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("is_primary_source", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_job_source_references_job_id", "job_source_references", ["job_id"])
    op.create_index("ix_job_source_references_raw_job_id", "job_source_references", ["raw_job_id"])

    # ─── verification_records ─────────────────────────────────────────────────
    op.create_table(
        "verification_records",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "job_id",
            sa.String(36),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("source_valid", sa.Boolean(), nullable=False),
        sa.Column("jd_exists", sa.Boolean(), nullable=False),
        sa.Column("application_url_valid", sa.Boolean(), nullable=False),
        sa.Column("company_valid", sa.Boolean(), nullable=False),
        sa.Column("location_consistent", sa.Boolean(), nullable=False),
        sa.Column("experience_consistent", sa.Boolean(), nullable=False),
        sa.Column("salary_stated", sa.Boolean(), nullable=False),
        sa.Column("posting_date_plausible", sa.Boolean(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("evidence", sa.JSON(), nullable=True),
        sa.Column(
            "verified_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_verification_records_job_id", "verification_records", ["job_id"])

    # ─── filter_decisions ─────────────────────────────────────────────────────
    op.create_table(
        "filter_decisions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "job_id",
            sa.String(36),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("rule_version", sa.String(50), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("role_priority", sa.String(20), nullable=False),
        sa.Column("reason_codes", sa.JSON(), nullable=False),
        sa.Column("decision_details", sa.JSON(), nullable=True),
        sa.Column(
            "evaluated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_filter_decisions_job_id", "filter_decisions", ["job_id"])

    # ─── ai_analysis_results ──────────────────────────────────────────────────
    op.create_table(
        "ai_analysis_results",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "job_id",
            sa.String(36),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("prompt_version", sa.String(50), nullable=False),
        sa.Column("input_hash", sa.String(64), nullable=False),
        sa.Column("output_payload", sa.JSON(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("tokens_used", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_ai_analysis_results_job_id", "ai_analysis_results", ["job_id"])
    op.create_index("ix_ai_analysis_results_input_hash", "ai_analysis_results", ["input_hash"])

    # ─── collection_runs ──────────────────────────────────────────────────────
    op.create_table(
        "collection_runs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "source_id",
            sa.String(50),
            sa.ForeignKey("sources.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "company_source_id",
            sa.String(36),
            sa.ForeignKey("company_sources.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="RUNNING"),
        sa.Column("jobs_found", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("jobs_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("jobs_updated", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("jobs_failed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_summary", sa.Text(), nullable=True),
    )
    op.create_index("ix_collection_runs_source_id", "collection_runs", ["source_id"])
    op.create_index("ix_collection_runs_company_source_id", "collection_runs", ["company_source_id"])


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_table("collection_runs")
    op.drop_table("ai_analysis_results")
    op.drop_table("filter_decisions")
    op.drop_table("verification_records")
    op.drop_table("job_source_references")
    op.drop_table("jobs")
    op.drop_table("raw_jobs")
    op.drop_table("company_sources")
    op.drop_table("sources")
    op.drop_table("companies")
