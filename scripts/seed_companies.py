"""Seed target Indian tech companies and their ATS/Career endpoints.

Populates initial registry with high-signal Indian tech employers hiring
AI Engineers, GenAI Developers, and Python Backend Engineers in Mumbai, Pune, BLR, and HYD.
"""

import asyncio
from typing import List, Dict, Any
import structlog

from app.models.database import AsyncSessionLocal, init_db
from app.services.company_service import CompanyService

logger = structlog.get_logger()

# Seed registry of verified tech companies operating in target Indian tech hubs
SEED_COMPANIES: List[Dict[str, Any]] = [
    {
        "name": "Razorpay",
        "website": "https://razorpay.com",
        "industry": "FinTech / Payments",
        "sector": "IT",
        "business_model": "PRODUCT",
        "verified": True,
        "source_id": "GREENHOUSE",
        "ats_identifier": "razorpay",
        "career_url": "https://boards.greenhouse.io/razorpay",
    },
    {
        "name": "BrowserStack",
        "website": "https://www.browserstack.com",
        "industry": "Developer Tools / Testing Cloud",
        "sector": "IT",
        "business_model": "PRODUCT",
        "verified": True,
        "source_id": "GREENHOUSE",
        "ats_identifier": "browserstack",
        "career_url": "https://boards.greenhouse.io/browserstack",
    },
    {
        "name": "Postman",
        "website": "https://www.postman.com",
        "industry": "API Development Platform",
        "sector": "IT",
        "business_model": "PRODUCT",
        "verified": True,
        "source_id": "GREENHOUSE",
        "ats_identifier": "postman",
        "career_url": "https://boards.greenhouse.io/postman",
    },
    {
        "name": "Hasura",
        "website": "https://hasura.io",
        "industry": "GraphQL & Data APIs",
        "sector": "IT",
        "business_model": "PRODUCT",
        "verified": True,
        "source_id": "GREENHOUSE",
        "ats_identifier": "hasura",
        "career_url": "https://boards.greenhouse.io/hasura",
    },
    {
        "name": "InMobi",
        "website": "https://www.inmobi.com",
        "industry": "AdTech & Consumer Intelligence",
        "sector": "IT",
        "business_model": "PRODUCT",
        "verified": True,
        "source_id": "GREENHOUSE",
        "ats_identifier": "inmobi",
        "career_url": "https://boards.greenhouse.io/inmobi",
    },
    {
        "name": "CleverTap",
        "website": "https://clevertap.com",
        "industry": "Customer Engagement & Analytics",
        "sector": "IT",
        "business_model": "PRODUCT",
        "verified": True,
        "source_id": "LEVER",
        "ats_identifier": "clevertap",
        "career_url": "https://jobs.lever.co/clevertap",
    },
    {
        "name": "Urban Company",
        "website": "https://www.urbancompany.com",
        "industry": "Home Services & Marketplace Tech",
        "sector": "IT",
        "business_model": "PRODUCT",
        "verified": True,
        "source_id": "LEVER",
        "ats_identifier": "urbancompany",
        "career_url": "https://jobs.lever.co/urbancompany",
    },
    {
        "name": "Linear",
        "website": "https://linear.app",
        "industry": "Issue Tracking & Project Management",
        "sector": "IT",
        "business_model": "PRODUCT",
        "verified": True,
        "source_id": "ASHBY",
        "ats_identifier": "linear",
        "career_url": "https://jobs.ashbyhq.com/linear",
    },
    {
        "name": "Ramp",
        "website": "https://ramp.com",
        "industry": "FinTech / Corporate Cards & Spend Management",
        "sector": "IT",
        "business_model": "PRODUCT",
        "verified": True,
        "source_id": "ASHBY",
        "ats_identifier": "ramp",
        "career_url": "https://jobs.ashbyhq.com/ramp",
    },
]

# Supported sources
SEED_SOURCES: List[Dict[str, Any]] = [
    {
        "id": "GREENHOUSE",
        "name": "Greenhouse ATS API",
        "source_type": "ATS",
        "base_url": "https://boards-api.greenhouse.io/v1/boards",
    },
    {
        "id": "LEVER",
        "name": "Lever ATS API",
        "source_type": "ATS",
        "base_url": "https://api.lever.co/v0/postings",
    },
    {
        "id": "ASHBY",
        "name": "Ashby ATS API",
        "source_type": "ATS",
        "base_url": "https://api.ashbyhq.com/posting-api",
    },
    {
        "id": "JOBSPY",
        "name": "JobSpy Multi-Board Engine (LinkedIn/Indeed/Glassdoor)",
        "source_type": "AGGREGATOR",
        "base_url": "https://jobspy.io",
    },
    {
        "id": "HIRIST",
        "name": "Hirist Tech Portal",
        "source_type": "JOB_BOARD",
        "base_url": "https://www.hirist.tech",
    },
]


async def seed_registry():
    """Seed sources, companies, and company_sources."""
    await init_db()
    async with AsyncSessionLocal() as session:
        service = CompanyService(session)

        # 1. Register sources
        for s in SEED_SOURCES:
            src = await service.get_or_create_source(
                source_id=s["id"],
                name=s["name"],
                source_type=s["source_type"],
                base_url=s["base_url"],
            )
            logger.info("Source registered", source_id=src.id)

        # 2. Register companies and ATS bindings
        for c in SEED_COMPANIES:
            company = await service.get_or_create_company(
                name=c["name"],
                website=c["website"],
                industry=c["industry"],
                sector=c["sector"],
                business_model=c["business_model"],
                verified=c["verified"],
            )
            cs = await service.register_company_source(
                company_id=company.id,
                source_id=c["source_id"],
                ats_identifier=c["ats_identifier"],
                career_url=c["career_url"],
            )
            logger.info(
                "Company and ATS board registered",
                company=company.name,
                source=cs.source_id,
                ats_identifier=cs.ats_identifier,
            )

        await session.commit()
        logger.info("Seeding completed successfully")


if __name__ == "__main__":
    asyncio.run(seed_registry())
