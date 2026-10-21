"""Integration tests for FastAPI application endpoints.

Tests /health, /jobs, /companies, and /pipeline routes using httpx AsyncClient.
"""

from unittest.mock import AsyncMock, patch
import httpx
from httpx import ASGITransport
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.main import app
from app.models.database import get_db_session
from app.models.entities import Company, Job
from app.models.schemas import RawJobIngest


@pytest.fixture
def override_db(async_db_session: AsyncSession):
    """Override FastAPI get_db_session dependency with test session."""
    async def _get_test_session():
        yield async_db_session

    app.dependency_overrides[get_db_session] = _get_test_session
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_health_check():
    """Verify /health endpoint returns 200 and healthy status."""
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_company_api_flow(override_db, async_db_session: AsyncSession):
    """Verify creating a company, binding an ATS source, and listing companies."""
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create Company
        create_resp = await client.post(
            "/companies/",
            json={
                "name": "Stripe India",
                "website": "https://stripe.com",
                "industry": "FinTech",
                "sector": "IT",
                "business_model": "PRODUCT",
                "verified": True,
            },
        )
        assert create_resp.status_code == 201
        comp_data = create_resp.json()
        company_id = comp_data["id"]

        # 2. Bind ATS Source
        bind_resp = await client.post(
            f"/companies/{company_id}/sources",
            json={
                "source_id": "GREENHOUSE",
                "ats_identifier": "stripe",
                "career_url": "https://boards.greenhouse.io/stripe",
            },
        )
        assert bind_resp.status_code == 201
        source_data = bind_resp.json()
        assert source_data["ats_identifier"] == "stripe"

        # 3. List Companies
        list_resp = await client.get("/companies/?sector=IT")
        assert list_resp.status_code == 200
        list_data = list_resp.json()
        assert list_data["total"] >= 1
        assert any(c["name"] == "Stripe India" for c in list_data["companies"])

        # 4. Get Company Detail
        detail_resp = await client.get(f"/companies/{company_id}")
        assert detail_resp.status_code == 200
        detail_data = detail_resp.json()
        assert detail_data["name"] == "Stripe India"
        assert len(detail_data["sources"]) == 1


@pytest.mark.asyncio
async def test_jobs_list_and_detail(override_db, async_db_session: AsyncSession):
    """Verify /jobs list and /jobs/{id} detail endpoints."""
    # Seed a sample job
    company = Company(
        name="InstaTech",
        normalized_name="instatech",
        sector="IT",
        business_model="PRODUCT",
        verified=True,
    )
    async_db_session.add(company)
    await async_db_session.flush()

    job = Job(
        company_id=company.id,
        company=company,
        canonical_title="Junior Generative AI Engineer",
        normalized_title="junior generative ai engineer",
        role_priority="P1",
        description="Build LLM applications and agentic workflows in Python.",
        location="Mumbai, Maharashtra",
        location_type="ON_SITE",
        experience_min=1,
        experience_max=2,
        status="ELIGIBLE",
        application_url="https://example.com/apply/1",
    )
    async_db_session.add(job)
    await async_db_session.commit()

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # List jobs
        resp = await client.get("/jobs/?status=ELIGIBLE&role_priority=P1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["jobs"][0]["title"] == "Junior Generative AI Engineer"
        assert data["jobs"][0]["role_priority"] == "P1"

        # Get job detail
        job_id = data["jobs"][0]["id"]
        detail_resp = await client.get(f"/jobs/{job_id}")
        assert detail_resp.status_code == 200
        detail_data = detail_resp.json()
        assert detail_data["title"] == "Junior Generative AI Engineer"
        assert detail_data["company"]["name"] == "InstaTech"


@pytest.mark.asyncio
async def test_pipeline_harvest_trigger(override_db, async_db_session: AsyncSession):
    """Verify /pipeline/harvest triggers harvest run cleanly."""
    mock_ingest = RawJobIngest(
        source_id="GREENHOUSE",
        company_name="Acme Corp",
        source_job_id="harvest-101",
        source_url="https://boards.greenhouse.io/acme/101",
        application_url="https://boards.greenhouse.io/acme/101",
        raw_payload={
            "title": "AI Backend Engineer",
            "content": "Work with FastAPI, LangGraph, and PostgreSQL. 1 year experience required.",
            "location_name": "Bengaluru",
        },
    )

    with patch(
        "app.collectors.greenhouse.GreenhouseCollector.collect_for_endpoint",
        new_callable=AsyncMock,
    ) as mock_collect:
        mock_collect.return_value = [mock_ingest]

        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/pipeline/harvest",
                json={
                    "source_id": "GREENHOUSE",
                    "company_name": "Acme Corp",
                    "endpoint_token": "acme",
                },
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "SUCCESS"
            assert data["jobs_found"] == 1
            assert data["jobs_created"] == 1

            # Check /pipeline/runs
            runs_resp = await client.get("/pipeline/runs")
            assert runs_resp.status_code == 200
            runs_data = runs_resp.json()
            assert len(runs_data["runs"]) >= 1


@pytest.mark.asyncio
async def test_pipeline_matrix_harvest_trigger(override_db, async_db_session: AsyncSession):
    """Verify /pipeline/harvest/matrix triggers multi-source matrix harvest."""
    mock_ingest = RawJobIngest(
        source_id="CUTSHORT",
        company_name="Matrix Inc",
        source_job_id="cs-mat-1",
        source_url="https://cutshort.io/job/cs-mat-1",
        application_url="https://cutshort.io/job/cs-mat-1",
        raw_payload={
            "title": "Machine Learning Engineer",
            "content": "PyTorch, MLflow, model deployment. 1-2 years experience.",
            "location_name": "Mumbai",
        },
    )

    with patch(
        "app.collectors.cutshort.CutshortCollector.collect_for_endpoint",
        new_callable=AsyncMock,
    ) as mock_collect:
        mock_collect.return_value = [mock_ingest]

        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/pipeline/harvest/matrix",
                json={
                    "sources": ["CUTSHORT"],
                    "cities": ["Mumbai"],
                },
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "SUCCESS"
            assert data["runs_executed"] >= 1
            assert data["total_found"] >= 1

