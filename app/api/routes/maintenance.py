"""System and Database Maintenance API Routes.

Provides operational utilities to:
1. Query database telemetry, disk footprint, and table metrics.
2. Auto-archive postings exceeding the 5-day freshness rule.
3. Prune rejected jobs and optimize local storage.
4. Run SQLite VACUUM to defragment and recover disk space.
5. Purge and refresh the local logo cache.
6. Safely reset harvested job records while preserving candidate profile data.
"""

from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.config.known_companies import KNOWN_COMPANY_PROFILES, get_curated_company_profile
from app.models.database import get_db_session
from app.models.entities import (
    AIAnalysisResult,
    CandidateProfile,
    CollectionRun,
    Company,
    CompanySource,
    FilterDecision,
    Job,
    JobSourceReference,
    RawJob,
    VerificationRecord,
)

logger = structlog.get_logger()
router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

DB_FILE_PATH = Path("ai_job_intelligence.db")
LOGOS_DIR = Path("web/public/logos")


@router.get("/stats")
async def get_maintenance_stats(session: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
    """Retrieve database metrics, disk footprint, and storage telemetry."""
    db_size_bytes = DB_FILE_PATH.stat().st_size if DB_FILE_PATH.exists() else 0
    db_size_mb = round(db_size_bytes / (1024 * 1024), 2)

    # Job counts
    total_jobs = (await session.execute(select(func.count(Job.id)))).scalar_one() or 0
    expired_jobs = (
        await session.execute(select(func.count(Job.id)).where(Job.status == "EXPIRED"))
    ).scalar_one() or 0
    rejected_jobs = (
        await session.execute(select(func.count(Job.id)).where(Job.status == "REJECTED"))
    ).scalar_one() or 0
    review_jobs = (
        await session.execute(select(func.count(Job.id)).where(Job.status == "REVIEW"))
    ).scalar_one() or 0
    eligible_jobs = (
        await session.execute(
            select(func.count(Job.id)).where(Job.status.in_(["ELIGIBLE", "NEW"]))
        )
    ).scalar_one() or 0
    applied_jobs = (
        await session.execute(
            select(func.count(Job.id)).where(Job.application_status.in_(["APPLIED", "INTERVIEWING", "OFFER"]))
        )
    ).scalar_one() or 0

    # Entity counts
    total_companies = (await session.execute(select(func.count(Company.id)))).scalar_one() or 0
    total_raw_jobs = (await session.execute(select(func.count(RawJob.id)))).scalar_one() or 0
    total_runs = (await session.execute(select(func.count(CollectionRun.id)))).scalar_one() or 0

    # Cached logos count
    logos_cached_count = len(list(LOGOS_DIR.glob("*.png"))) if LOGOS_DIR.exists() else 0

    return {
        "database_size_bytes": db_size_bytes,
        "database_size_mb": db_size_mb,
        "total_jobs": total_jobs,
        "eligible_jobs": eligible_jobs,
        "review_jobs": review_jobs,
        "rejected_jobs": rejected_jobs,
        "expired_jobs": expired_jobs,
        "applied_jobs": applied_jobs,
        "total_companies": total_companies,
        "total_raw_jobs": total_raw_jobs,
        "total_runs": total_runs,
        "logos_cached_count": logos_cached_count,
        "freshness_cutoff_days": 5,
    }


@router.post("/archive-expired")
async def archive_expired_jobs(session: AsyncSession = Depends(get_db_session)):
    """Archive postings older than 5 days (120 hours) per the V1 frozen freshness rule."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=5)

    stmt = select(Job).where(
        Job.posted_at.is_not(None),
        Job.posted_at < cutoff,
        Job.status.notin_(["EXPIRED", "APPLIED"]),
    )
    result = await session.execute(stmt)
    old_jobs = result.scalars().all()

    archived_count = 0
    for j in old_jobs:
        j.status = "EXPIRED"
        j.review_reason = "JOB_TOO_OLD"
        archived_count += 1

    await session.commit()
    logger.info("Executed 5-day freshness archival", count=archived_count)
    return {
        "status": "SUCCESS",
        "archived_count": archived_count,
        "message": f"Archived {archived_count} jobs older than 5 days.",
    }


@router.post("/prune-rejected")
async def prune_rejected_jobs(session: AsyncSession = Depends(get_db_session)):
    """Delete rejected jobs that have not been applied to, freeing up database storage."""
    # Find IDs of rejected unapplied jobs
    stmt = select(Job.id).where(
        Job.status == "REJECTED",
        Job.application_status == "NOT_APPLIED",
    )
    job_ids = list((await session.execute(stmt)).scalars().all())

    if not job_ids:
        return {"status": "SUCCESS", "pruned_count": 0, "message": "No rejected jobs to prune."}

    # Delete cascading references
    await session.execute(delete(JobSourceReference).where(JobSourceReference.job_id.in_(job_ids)))
    await session.execute(delete(VerificationRecord).where(VerificationRecord.job_id.in_(job_ids)))
    await session.execute(delete(FilterDecision).where(FilterDecision.job_id.in_(job_ids)))
    await session.execute(delete(AIAnalysisResult).where(AIAnalysisResult.job_id.in_(job_ids)))
    await session.execute(delete(Job).where(Job.id.in_(job_ids)))

    await session.commit()
    logger.info("Pruned rejected jobs", count=len(job_ids))
    return {
        "status": "SUCCESS",
        "pruned_count": len(job_ids),
        "message": f"Pruned {len(job_ids)} rejected postings.",
    }


@router.post("/remediate-entities")
async def remediate_company_entities(session: AsyncSession = Depends(get_db_session)):
    """Re-enrich companies with official websites, industries, and business models."""
    import re
    stmt = select(Company)
    companies = list((await session.execute(stmt)).scalars().all())

    updated_count = 0
    for c in companies:
        curated = get_curated_company_profile(c.name)

        if curated:
            new_web = curated.get("website")
            new_ind = curated.get("industry") or "Software & Technology Services"
            new_sec = curated.get("sector") or "IT"
            new_model = curated.get("business_model") or "PRODUCT"
            verified = True
            confidence = 1.0
        else:
            # For non-curated companies, do NOT fabricate fake websites or force verified=True
            clean_slug = re.sub(r"[^\w]", "", c.name.lower())
            # If current website matches a fabricated slug, clear it to None
            if c.website in [f"https://{clean_slug}.com", f"http://{clean_slug}.com", f"https://{clean_slug}.in", f"http://{clean_slug}.in"]:
                new_web = None
            else:
                new_web = c.website
            new_ind = c.industry or "Software & Technology Services"
            new_sec = c.sector if c.sector != "UNKNOWN" else "IT"
            new_model = c.business_model if c.business_model != "UNKNOWN" else "PRODUCT"
            verified = c.verified
            confidence = c.confidence

        if (
            c.website != new_web
            or c.industry != new_ind
            or c.sector != new_sec
            or c.business_model != new_model
            or c.verified != verified
            or c.confidence != confidence
        ):
            c.website = new_web
            c.industry = new_ind
            c.sector = new_sec
            c.business_model = new_model
            c.verified = verified
            c.confidence = confidence
            updated_count += 1

    await session.commit()
    logger.info("Remediated company entities", updated=updated_count)
    return {
        "status": "SUCCESS",
        "updated_companies": updated_count,
        "message": f"Enriched {updated_count} companies with verified metadata.",
    }


@router.post("/purge-logos")
async def purge_logo_cache():
    """Purge cached logo files from web/public/logos so fresh logos re-fetch."""
    if not LOGOS_DIR.exists():
        return {"status": "SUCCESS", "purged_count": 0, "message": "Logos directory does not exist."}

    purged = 0
    for f in LOGOS_DIR.glob("*.png"):
        try:
            f.unlink()
            purged += 1
        except Exception:
            pass

    logger.info("Purged local logo cache", count=purged)
    return {
        "status": "SUCCESS",
        "purged_count": purged,
        "message": f"Purged {purged} logos from disk cache.",
    }


@router.post("/vacuum")
async def vacuum_database(session: AsyncSession = Depends(get_db_session)):
    """Run SQLite VACUUM to reclaim free space and defragment database on disk."""
    try:
        await session.execute(text("VACUUM"))
        db_size_bytes = DB_FILE_PATH.stat().st_size if DB_FILE_PATH.exists() else 0
        db_size_mb = round(db_size_bytes / (1024 * 1024), 2)
        return {
            "status": "SUCCESS",
            "new_size_mb": db_size_mb,
            "message": f"Database compacted successfully. New footprint: {db_size_mb} MB.",
        }
    except Exception as exc:
        logger.error("VACUUM failed", error=str(exc))
        raise HTTPException(status_code=500, detail=f"Database VACUUM failed: {str(exc)}")


@router.post("/reset-jobs")
async def reset_all_job_records(session: AsyncSession = Depends(get_db_session)):
    """Wipe all harvested job postings and runs while safely preserving Candidate Profile data."""
    try:
        await session.execute(delete(JobSourceReference))
        await session.execute(delete(VerificationRecord))
        await session.execute(delete(FilterDecision))
        await session.execute(delete(AIAnalysisResult))
        await session.execute(delete(Job))
        await session.execute(delete(RawJob))
        await session.execute(delete(CollectionRun))
        await session.commit()

        # Run vacuum after wipe
        await session.execute(text("VACUUM"))

        logger.info("Job intelligence database records safely reset")
        return {
            "status": "SUCCESS",
            "message": "All harvested job records cleared. Candidate Profile preserved.",
        }
    except Exception as exc:
        logger.error("Reset jobs failed", error=str(exc))
        raise HTTPException(status_code=500, detail=f"Reset jobs failed: {str(exc)}")
