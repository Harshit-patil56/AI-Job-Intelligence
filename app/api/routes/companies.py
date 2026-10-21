"""Companies and Source Registry REST API endpoints.

Enables inspecting target companies, querying registered ATS endpoints,
and registering new hiring targets.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database import get_db_session
from app.models.entities import Company, CompanySource, Source
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["Companies"])


class CompanyCreateRequest(BaseModel):
    name: str = Field(..., description="Company name")
    website: Optional[str] = Field(None, description="Official website")
    industry: Optional[str] = Field(None, description="Industry domain")
    sector: str = Field("IT", description="IT or NON_IT")
    business_model: str = Field("PRODUCT", description="PRODUCT or SERVICES")
    verified: bool = Field(True, description="Verification status")


class CompanySourceCreateRequest(BaseModel):
    source_id: str = Field(..., description="Source identifier (e.g. GREENHOUSE, LEVER, ASHBY)")
    ats_identifier: str = Field(..., description="ATS board token or slug")
    career_url: Optional[str] = Field(None, description="Direct career portal URL")


@router.get("/")
async def list_companies(
    sector: Optional[str] = Query(None, description="Filter by sector (e.g. IT, NON_IT)"),
    business_model: Optional[str] = Query(None, description="Filter by business model (PRODUCT, SERVICES)"),
    verified: Optional[bool] = Query(None, description="Filter by verification state"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db_session),
):
    """Retrieve verified companies in the target registry."""
    stmt = (
        select(Company)
        .options(selectinload(Company.company_sources).selectinload(CompanySource.source))
        .order_by(Company.name)
        .offset(offset)
        .limit(limit)
    )

    if sector:
        stmt = stmt.where(Company.sector == sector.upper())
    if business_model:
        stmt = stmt.where(Company.business_model == business_model.upper())
    if verified is not None:
        stmt = stmt.where(Company.verified == verified)

    result = await session.execute(stmt)
    companies = result.scalars().all()

    items = []
    for c in companies:
        items.append({
            "id": c.id,
            "name": c.name,
            "normalized_name": c.normalized_name,
            "website": c.website,
            "industry": c.industry,
            "sector": c.sector,
            "business_model": c.business_model,
            "verified": c.verified,
            "confidence": c.confidence,
            "sources": [
                {
                    "id": cs.id,
                    "source_id": cs.source_id,
                    "ats_identifier": cs.ats_identifier,
                    "career_url": cs.career_url,
                    "is_active": cs.is_active,
                }
                for cs in c.company_sources
            ],
        })

    return {"total": len(items), "limit": limit, "offset": offset, "companies": items}


@router.get("/{company_id}")
async def get_company(
    company_id: str,
    session: AsyncSession = Depends(get_db_session),
):
    """Retrieve detailed profile and active sources for a company."""
    stmt = (
        select(Company)
        .where(Company.id == company_id)
        .options(selectinload(Company.company_sources).selectinload(CompanySource.source))
    )
    result = await session.execute(stmt)
    company = result.scalar_one_or_none()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return {
        "id": company.id,
        "name": company.name,
        "normalized_name": company.normalized_name,
        "website": company.website,
        "industry": company.industry,
        "sector": company.sector,
        "business_model": company.business_model,
        "verified": company.verified,
        "confidence": company.confidence,
        "sources": [
            {
                "id": cs.id,
                "source_id": cs.source_id,
                "ats_identifier": cs.ats_identifier,
                "career_url": cs.career_url,
                "is_active": cs.is_active,
            }
            for cs in company.company_sources
        ],
    }


@router.post("/", status_code=201)
async def create_company(
    payload: CompanyCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Register or retrieve an existing company profile."""
    service = CompanyService(session)
    company = await service.get_or_create_company(
        name=payload.name,
        website=payload.website,
        industry=payload.industry,
        sector=payload.sector,
        business_model=payload.business_model,
        verified=payload.verified,
    )
    await session.commit()
    return {"id": company.id, "name": company.name, "normalized_name": company.normalized_name}


@router.post("/{company_id}/sources", status_code=201)
async def bind_company_source(
    company_id: str,
    payload: CompanySourceCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Register or update an ATS endpoint for a company."""
    stmt = select(Company).where(Company.id == company_id)
    result = await session.execute(stmt)
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    service = CompanyService(session)
    source = await service.get_or_create_source(
        source_id=payload.source_id.upper(),
        name=f"{payload.source_id.title()} Platform",
        source_type="ATS",
    )

    cs = await service.register_company_source(
        company_id=company.id,
        source_id=source.id,
        ats_identifier=payload.ats_identifier,
        career_url=payload.career_url,
    )
    await session.commit()
    return {
        "id": cs.id,
        "company_id": cs.company_id,
        "source_id": cs.source_id,
        "ats_identifier": cs.ats_identifier,
        "career_url": cs.career_url,
    }
