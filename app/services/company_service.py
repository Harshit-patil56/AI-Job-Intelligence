"""Company and Source Registry Service.

Handles registration and lookup of target hiring companies,
ingestion sources, and ATS endpoint bindings.
"""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import structlog

from app.models.entities import Company, CompanySource, Source
from app.normalization.normalizer import normalize_company_name

logger = structlog.get_logger()


class CompanyService:
    """Manages companies, sources, and ATS board registrations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_source(
        self,
        source_id: str,
        name: str,
        source_type: str,
        base_url: Optional[str] = None,
    ) -> Source:
        """Find or create an ingestion platform source entry."""
        stmt = select(Source).where(Source.id == source_id)
        result = await self.session.execute(stmt)
        source = result.scalar_one_or_none()
        if source:
            return source

        source = Source(
            id=source_id,
            name=name,
            source_type=source_type,
            base_url=base_url,
            is_active=True,
        )
        self.session.add(source)
        await self.session.flush()
        return source

    async def get_or_create_company(
        self,
        name: str,
        website: Optional[str] = None,
        industry: Optional[str] = None,
        sector: str = "UNKNOWN",
        business_model: str = "UNKNOWN",
        verified: bool = False,
    ) -> Company:
        """Find or create a normalized company profile."""
        norm_name = normalize_company_name(name)
        stmt = select(Company).where(Company.normalized_name == norm_name)
        result = await self.session.execute(stmt)
        company = result.scalar_one_or_none()
        if company:
            return company

        company = Company(
            name=name,
            normalized_name=norm_name,
            website=website,
            industry=industry,
            sector=sector,
            business_model=business_model,
            verified=verified,
            confidence=1.0 if verified else 0.5,
        )
        self.session.add(company)
        await self.session.flush()
        return company

    async def register_company_source(
        self,
        company_id: str,
        source_id: str,
        ats_identifier: Optional[str] = None,
        career_url: Optional[str] = None,
        api_endpoint: Optional[str] = None,
    ) -> CompanySource:
        """Register or retrieve a specific company ATS endpoint."""
        stmt = select(CompanySource).where(
            CompanySource.company_id == company_id,
            CompanySource.source_id == source_id,
            CompanySource.ats_identifier == ats_identifier,
        )
        result = await self.session.execute(stmt)
        cs = result.scalar_one_or_none()
        if cs:
            return cs

        cs = CompanySource(
            company_id=company_id,
            source_id=source_id,
            ats_identifier=ats_identifier,
            career_url=career_url,
            api_endpoint=api_endpoint,
            is_active=True,
        )
        self.session.add(cs)
        await self.session.flush()
        return cs

    async def list_active_company_sources(
        self, source_id: Optional[str] = None
    ) -> List[CompanySource]:
        """Fetch all active company sources for scheduled harvests."""
        stmt = (
            select(CompanySource)
            .where(CompanySource.is_active == True)
            .options(
                selectinload(CompanySource.company),
                selectinload(CompanySource.source),
            )
        )
        if source_id:
            stmt = stmt.where(CompanySource.source_id == source_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
