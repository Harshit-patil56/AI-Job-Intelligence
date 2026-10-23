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


def fetch_and_store_company_logo(company_name: str, domain: Optional[str] = None) -> Optional[str]:
    """Download employer logo directly to data/logos via internal CDN pipeline."""
    import os, urllib.request, re

    if not company_name or company_name.startswith("__") or company_name.lower() in ("unknown company", "unknown"):
        return None

    slug = "".join(c for c in company_name.lower() if c.isalnum())
    if not slug:
        return None

    # Resolve domain if not provided
    resolved_domain = domain
    if not resolved_domain:
        if "." in company_name:
            for w in company_name.strip().split():
                if "." in w and not w.startswith("http"):
                    resolved_domain = re.sub(r"[^a-z0-9.-]", "", w.lower()).strip(".")
                    break
        if not resolved_domain and len(slug) >= 3:
            resolved_domain = f"{slug}.com"

    if not resolved_domain:
        return None

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    logos_dir = os.path.join(base_dir, "data", "logos")
    os.makedirs(logos_dir, exist_ok=True)
    file_path = os.path.join(logos_dir, f"{slug}.png")

    if not os.path.exists(file_path):
        candidate_urls = [
            f"https://www.google.com/s2/favicons?domain={resolved_domain}&sz=128",
            f"https://icons.duckduckgo.com/ip3/{resolved_domain}.ico",
        ]
        for url in candidate_urls:
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=3.0) as ir:
                    data = ir.read()
                    if len(data) > 250:
                        with open(file_path, "wb") as fp:
                            fp.write(data)
                        break
            except Exception:
                continue

    return resolved_domain


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
        """Find or create a normalized company profile, enriched with curated employer metadata."""
        import asyncio
        from app.config.known_companies import get_curated_company_profile

        norm_name = normalize_company_name(name)
        stmt = select(Company).where(Company.normalized_name == norm_name)
        result = await self.session.execute(stmt)
        company = result.scalar_one_or_none()

        curated = get_curated_company_profile(name)
        eff_website = website or (curated["website"] if curated else None)

        # If website is still missing, dynamically discover domain and download logo via our logo pipeline
        if not eff_website and not name.startswith("__") and name.lower() not in ("unknown company", "unknown"):
            discovered_domain = await asyncio.to_thread(fetch_and_store_company_logo, name)
            if discovered_domain:
                eff_website = f"https://{discovered_domain}"

        eff_industry = industry or (curated["industry"] if curated else None)
        eff_sector = sector if sector != "UNKNOWN" else (curated["sector"] if curated else "UNKNOWN")
        eff_model = business_model if business_model != "UNKNOWN" else (curated["business_model"] if curated else "UNKNOWN")
        eff_verified = verified or bool(curated) or bool(eff_website)

        if company:
            # Upgrade existing company profile if more accurate data is available
            updated = False
            if eff_website and not company.website:
                company.website = eff_website
                updated = True
            if eff_industry and not company.industry:
                company.industry = eff_industry
                updated = True
            if eff_sector != "UNKNOWN" and company.sector == "UNKNOWN":
                company.sector = eff_sector
                updated = True
            if eff_model != "UNKNOWN" and company.business_model == "UNKNOWN":
                company.business_model = eff_model
                updated = True
            if eff_verified and not company.verified:
                company.verified = True
                company.confidence = 1.0
                updated = True
            if updated:
                await self.session.flush()
            return company

        company = Company(
            name=name,
            normalized_name=norm_name,
            website=eff_website,
            industry=eff_industry,
            sector=eff_sector,
            business_model=eff_model,
            verified=eff_verified,
            confidence=1.0 if eff_verified else 0.5,
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
