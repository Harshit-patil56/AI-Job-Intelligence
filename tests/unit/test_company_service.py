"""Unit tests for CompanyService registry operations.

Verifies creation, deduplicated lookup by normalized name, source binding,
and querying active company endpoints.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.company_service import CompanyService


@pytest.mark.asyncio
async def test_get_or_create_source(async_db_session: AsyncSession):
    """Verify source registration is idempotent."""
    service = CompanyService(async_db_session)

    src1 = await service.get_or_create_source(
        source_id="LEVER",
        name="Lever ATS API",
        source_type="ATS",
        base_url="https://api.lever.co/v0/postings",
    )
    assert src1.id == "LEVER"
    assert src1.is_active is True

    # Lookup should return existing source without duplicate error
    src2 = await service.get_or_create_source(
        source_id="LEVER",
        name="Different Name",
        source_type="ATS",
    )
    assert src2.id == src1.id
    assert src2.name == "Lever ATS API"


@pytest.mark.asyncio
async def test_get_or_create_company_normalized(async_db_session: AsyncSession):
    """Verify company deduplication works by normalized company name."""
    service = CompanyService(async_db_session)

    c1 = await service.get_or_create_company(
        name="Razorpay Software Private Limited",
        website="https://razorpay.com",
        industry="FinTech",
        sector="IT",
        business_model="PRODUCT",
        verified=True,
    )
    assert c1.id is not None
    assert c1.verified is True
    assert c1.confidence == 1.0

    # Query with alternative legal suffix / casing
    c2 = await service.get_or_create_company(
        name="Razorpay Technologies Pvt. Ltd.",
    )
    assert c2.id == c1.id
    assert c2.normalized_name == c1.normalized_name


@pytest.mark.asyncio
async def test_register_and_list_active_company_sources(async_db_session: AsyncSession):
    """Verify company source binding and active retrieval."""
    service = CompanyService(async_db_session)

    src = await service.get_or_create_source(
        source_id="ASHBY",
        name="Ashby ATS API",
        source_type="ATS",
    )
    company = await service.get_or_create_company(
        name="Linear",
        website="https://linear.app",
    )

    cs = await service.register_company_source(
        company_id=company.id,
        source_id=src.id,
        ats_identifier="linear",
        career_url="https://jobs.ashbyhq.com/linear",
    )
    assert cs.id is not None
    assert cs.ats_identifier == "linear"
    assert cs.is_active is True

    # Fetch active sources
    active = await service.list_active_company_sources(source_id="ASHBY")
    assert len(active) == 1
    assert active[0].id == cs.id
    assert active[0].company.name == "Linear"
    assert active[0].source.name == "Ashby ATS API"
