"""Jobs REST API endpoints.

Enables querying canonical jobs, inspecting source references, and reviewing audit trails.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.copilot import CopilotService
from app.ai.gateway import LLMGateway
from app.models.database import get_db_session
from app.models.entities import Company, Job, JobSourceReference
from app.models.schemas import JobStatus, RolePriority
from app.normalization.salary_parser import estimate_market_salary, format_salary_display

router = APIRouter(prefix="/jobs", tags=["Jobs"])


class UpdateApplicationStatusRequest(BaseModel):
    application_status: str = Field(..., description="NOT_APPLIED, SHORTLISTED, APPLIED, INTERVIEWING, OFFER, REJECTED")


@router.get("/")
async def list_jobs(
    status: Optional[JobStatus] = Query(None, description="Filter by operational status"),
    role_priority: Optional[RolePriority] = Query(None, description="Filter by role priority (P1/P2/P3)"),
    location: Optional[str] = Query(None, description="Search by location string"),
    search: Optional[str] = Query(None, description="Search by title, company, or location"),
    company: Optional[str] = Query(None, description="Filter specifically by company name"),
    verified: Optional[bool] = Query(None, description="Filter jobs with verification confidence >= 0.9"),
    experience_level: Optional[str] = Query(None, description="ENTRY (0-2 YOE), MID (2-5 YOE), SENIOR (5+ YOE)"),
    application_status: Optional[str] = Query(None, description="Filter by candidate application status (NOT_APPLIED, APPLIED, INTERVIEWING, etc.)"),
    limit: int = Query(12, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db_session),
):
    """Retrieve canonical jobs ordered by freshness (posted_at) with real total count."""
    filters = []

    if status:
        filters.append(Job.status == status.value)
    if role_priority:
        filters.append(Job.role_priority == role_priority.value)
    if verified is not None:
        if verified:
            filters.append(Job.verification_confidence >= 0.9)
        else:
            filters.append(Job.verification_confidence < 0.9)
    if application_status and application_status.strip() and application_status.upper() != "ALL":
        filters.append(Job.application_status == application_status.strip().upper())
    if experience_level and experience_level.strip() and experience_level.upper() != "ALL":
        lvl = experience_level.strip().upper()
        if lvl in ("ENTRY", "0-2"):
            filters.append(
                or_(
                    Job.experience_min.is_(None),
                    Job.experience_min <= 2.0,
                )
            )
        elif lvl in ("MID", "2-5"):
            filters.append(
                or_(
                    Job.experience_min.between(2.0, 5.0),
                    Job.experience_max.between(2.0, 5.0),
                )
            )
        elif lvl in ("SENIOR", "5+"):
            filters.append(Job.experience_min >= 5.0)
    if location:
        loc_lower = location.strip().lower()
        if loc_lower == "remote":
            filters.append(
                or_(
                    Job.location.ilike("%remote%"),
                    Job.location_type == "REMOTE",
                    Job.location.ilike("%home based%"),
                    Job.location.ilike("%worldwide%"),
                )
            )
        elif loc_lower in ("mumbai", "pune"):
            filters.append(
                or_(
                    Job.location.ilike(f"%{location.strip()}%"),
                    Job.location.ilike("%mh, india%"),
                    Job.location.ilike("%maharashtra%"),
                )
            )
        else:
            filters.append(Job.location.ilike(f"%{location.strip()}%"))
    if company and company.strip():
        filters.append(Company.name.ilike(f"%{company.strip()}%"))
    if search and search.strip():
        term = f"%{search.strip()}%"
        filters.append(
            or_(
                Job.canonical_title.ilike(term),
                Job.location.ilike(term),
                Company.name.ilike(term),
            )
        )

    # 1. Real SQL count query
    count_stmt = select(func.count(Job.id))
    has_company_join = bool((search and search.strip()) or (company and company.strip()))
    if has_company_join:
        count_stmt = count_stmt.join(Job.company, isouter=True)
    if filters:
        count_stmt = count_stmt.where(*filters)

    total_result = await session.execute(count_stmt)
    total = total_result.scalar() or 0

    # 2. Sliced data query
    stmt = (
        select(Job)
        .options(
            selectinload(Job.company),
            selectinload(Job.source_references),
        )
        .order_by(desc(Job.posted_at), desc(Job.first_seen_at))
        .offset(offset)
        .limit(limit)
    )
    if has_company_join:
        stmt = stmt.join(Job.company, isouter=True)
    if filters:
        stmt = stmt.where(*filters)

    result = await session.execute(stmt)
    jobs = result.scalars().all()

    items = []
    for j in jobs:
        eff_salary_text = j.salary_text
        if not eff_salary_text:
            if j.salary_min is not None:
                eff_salary_text = format_salary_display(
                    float(j.salary_min),
                    float(j.salary_max) if j.salary_max is not None else float(j.salary_min),
                    j.salary_currency,
                    j.salary_period,
                )
            else:
                est = estimate_market_salary(j.role_priority, j.experience_min, j.experience_max, j.location)
                eff_salary_text = est.salary_text

        items.append({
            "id": j.id,
            "company_name": j.company.name if j.company else "Unknown",
            "title": j.canonical_title,
            "normalized_title": j.normalized_title,
            "role_priority": j.role_priority,
            "location": j.location,
            "location_type": j.location_type,
            "experience_min": j.experience_min,
            "experience_max": j.experience_max,
            "experience_text": j.experience_text,
            "salary_min": float(j.salary_min) if j.salary_min is not None else None,
            "salary_max": float(j.salary_max) if j.salary_max is not None else None,
            "salary_currency": j.salary_currency,
            "salary_period": j.salary_period,
            "salary_text": eff_salary_text,
            "status": j.status,
            "rejection_reason": j.rejection_reason,
            "review_reason": j.review_reason,
            "verification_confidence": j.verification_confidence,
            "posted_at": j.posted_at.isoformat() if j.posted_at else None,
            "application_url": j.application_url,
            "application_status": j.application_status or "NOT_APPLIED",
            "sources_count": len(j.source_references),
            "company_website": j.company.website if j.company else None,
            "company_sector": j.company.sector if j.company else None,
            "company_business_model": j.company.business_model if j.company else None,
        })

    return {"total": total, "limit": limit, "offset": offset, "jobs": items}


@router.get("/stats")
async def get_jobs_stats(session: AsyncSession = Depends(get_db_session)):
    """Retrieve aggregate KPI stats across all canonical jobs."""
    total = (await session.execute(select(func.count(Job.id)))).scalar() or 0
    p1 = (await session.execute(select(func.count(Job.id)).where(Job.role_priority == "P1"))).scalar() or 0
    p2 = (await session.execute(select(func.count(Job.id)).where(Job.role_priority == "P2"))).scalar() or 0
    verified = (await session.execute(select(func.count(Job.id)).where(Job.verification_confidence >= 0.9))).scalar() or 0
    review = (await session.execute(select(func.count(Job.id)).where(Job.status == "REVIEW"))).scalar() or 0

    return {
        "total": total,
        "p1": p1,
        "p2": p2,
        "verified": verified,
        "review": review,
    }


@router.get("/facets")
async def get_jobs_facets(session: AsyncSession = Depends(get_db_session)):
    """Retrieve dynamic search facets and live counts directly from the database."""
    total = (await session.execute(select(func.count(Job.id)))).scalar() or 0
    p1 = (await session.execute(select(func.count(Job.id)).where(Job.role_priority == "P1"))).scalar() or 0
    p2 = (await session.execute(select(func.count(Job.id)).where(Job.role_priority == "P2"))).scalar() or 0
    p3 = (await session.execute(select(func.count(Job.id)).where(Job.role_priority == "P3"))).scalar() or 0
    verified = (await session.execute(select(func.count(Job.id)).where(Job.verification_confidence >= 0.9))).scalar() or 0
    review = (await session.execute(select(func.count(Job.id)).where(Job.status == "REVIEW"))).scalar() or 0
    eligible = (await session.execute(select(func.count(Job.id)).where(Job.status == "ELIGIBLE"))).scalar() or 0

    # Group locations with count >= 1
    loc_stmt = (
        select(Job.location, func.count(Job.id).label("count"))
        .where(Job.location.isnot(None), Job.location != "")
        .group_by(Job.location)
        .order_by(desc("count"))
        .limit(40)
    )
    loc_results = (await session.execute(loc_stmt)).all()
    locations = [{"name": row[0], "count": row[1]} for row in loc_results]

    return {
        "total": total,
        "tracks": [
            {"id": "ALL", "label": "All Roles", "count": total},
            {"id": "P1", "label": "P1 • AI & GenAI", "count": p1},
            {"id": "P2", "label": "P2 • Backend Python", "count": p2},
            {"id": "P3", "label": "P3 • Software Eng", "count": p3},
        ],
        "locations": locations,
        "status_counts": {
            "eligible": eligible,
            "review": review,
            "verified": verified,
        },
    }


@router.get("/{job_id}")
async def get_job_detail(
    job_id: str,
    session: AsyncSession = Depends(get_db_session),
):
    """Retrieve full canonical job detail including audit records and source references."""
    stmt = (
        select(Job)
        .where(Job.id == job_id)
        .options(
            selectinload(Job.company),
            selectinload(Job.source_references),
            selectinload(Job.verification_records),
            selectinload(Job.filter_decisions),
            selectinload(Job.ai_results),
        )
    )
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    valid_ai_results = [r for r in job.ai_results if r.provider != "FALLBACK_HEURISTIC"]
    latest_ai = valid_ai_results[-1] if valid_ai_results else None

    return {
        "id": job.id,
        "company": {
            "id": job.company.id,
            "name": job.company.name,
            "website": job.company.website,
            "sector": job.company.sector,
            "business_model": job.company.business_model,
        },
        "title": job.canonical_title,
        "description": job.description,
        "role_priority": job.role_priority,
        "location": job.location,
        "location_type": job.location_type,
        "experience": {
            "min": job.experience_min,
            "max": job.experience_max,
            "text": job.experience_text,
        },
        "salary": {
            "min": float(job.salary_min) if job.salary_min is not None else None,
            "max": float(job.salary_max) if job.salary_max is not None else None,
            "currency": job.salary_currency,
            "period": job.salary_period,
            "text": job.salary_text or (
                format_salary_display(
                    float(job.salary_min),
                    float(job.salary_max) if job.salary_max is not None else float(job.salary_min),
                    job.salary_currency,
                    job.salary_period,
                )
                if job.salary_min is not None
                else estimate_market_salary(job.role_priority, job.experience_min, job.experience_max, job.location).salary_text
            ),
        },
        "salary_text": job.salary_text or (
            format_salary_display(
                float(job.salary_min),
                float(job.salary_max) if job.salary_max is not None else float(job.salary_min),
                job.salary_currency,
                job.salary_period,
            )
            if job.salary_min is not None
            else estimate_market_salary(job.role_priority, job.experience_min, job.experience_max, job.location).salary_text
        ),
        "status": job.status,
        "rejection_reason": job.rejection_reason,
        "review_reason": job.review_reason,
        "verification_confidence": job.verification_confidence,
        "posted_at": job.posted_at.isoformat() if job.posted_at else None,
        "application_url": job.application_url,
        "application_status": job.application_status or "NOT_APPLIED",
        "source_references": [
            {
                "id": ref.id,
                "source_id": ref.source_id,
                "source_job_id": ref.source_job_id,
                "source_url": ref.source_url,
                "application_url": ref.application_url,
                "match_method": ref.match_method,
                "is_primary": ref.is_primary_source,
            }
            for ref in job.source_references
        ],
        "verification_records": [
            {
                "id": vr.id,
                "status": vr.status,
                "confidence": vr.confidence,
                "source_valid": vr.source_valid,
                "jd_exists": vr.jd_exists,
                "evidence": vr.evidence,
                "verified_at": vr.verified_at.isoformat(),
            }
            for vr in job.verification_records
        ],
        "filter_decisions": [
            {
                "id": fd.id,
                "status": fd.status,
                "role_priority": fd.role_priority,
                "reason_codes": fd.reason_codes,
                "decision_details": fd.decision_details,
                "evaluated_at": fd.evaluated_at.isoformat(),
            }
            for fd in job.filter_decisions
        ],
        "ai_analysis": {
            "id": latest_ai.id,
            "provider": latest_ai.provider,
            "model": latest_ai.model,
            "prompt_version": latest_ai.prompt_version,
            "confidence": latest_ai.confidence,
            "tokens_used": latest_ai.tokens_used,
            "created_at": latest_ai.created_at.isoformat(),
            "payload": latest_ai.output_payload,
        } if latest_ai else None,
    }


@router.post("/{job_id}/analyze")
async def analyze_job(
    job_id: str,
    force_refresh: bool = Query(False, description="Bypass cache and force fresh inference"),
    session: AsyncSession = Depends(get_db_session),
):
    """Run on-demand LLM intelligence analysis and skill gap extraction for a canonical job."""
    stmt = (
        select(Job)
        .where(Job.id == job_id)
        .options(selectinload(Job.company))
    )
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    gateway = LLMGateway()
    res = await gateway.evaluate_job(
        session=session,
        job_id=job.id,
        company=job.company.name if job.company else "Unknown",
        title=job.canonical_title,
        description=job.description or "",
        location=job.location,
        experience=job.experience_text,
        force_refresh=force_refresh,
    )
    await session.commit()
    return res


@router.patch("/{job_id}/application-status")
async def update_application_status(
    job_id: str,
    payload: UpdateApplicationStatusRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Update user's personal job application tracking status (NOT_APPLIED, SHORTLISTED, APPLIED, etc.)."""
    stmt = select(Job).where(Job.id == job_id)
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.application_status = payload.application_status.upper()
    await session.commit()
    return {"id": job.id, "application_status": job.application_status}


@router.post("/{job_id}/copilot-pack")
async def generate_copilot_pack(
    job_id: str,
    session: AsyncSession = Depends(get_db_session),
):
    """Generate tailored resume bullet points, cover note, and interview prep questions via AI Copilot."""
    stmt = (
        select(Job)
        .where(Job.id == job_id)
        .options(selectinload(Job.company), selectinload(Job.ai_results))
    )
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    extracted_skills = []
    valid_ai = [r for r in job.ai_results if r.provider != "FALLBACK_HEURISTIC"]
    if valid_ai and valid_ai[-1].output_payload:
        extracted_skills = valid_ai[-1].output_payload.get("extracted_skills", [])

    # Fetch active candidate profile if present
    from app.models.entities import CandidateProfile
    cand_stmt = select(CandidateProfile).limit(1)
    cand_res = await session.execute(cand_stmt)
    candidate_profile = cand_res.scalar_one_or_none()

    copilot = CopilotService()
    pack = await copilot.generate_pack(
        company=job.company.name if job.company else "Unknown",
        title=job.canonical_title,
        description=job.description or "",
        extracted_skills=extracted_skills,
        candidate_profile=candidate_profile,
        session=session,
    )
    return pack
