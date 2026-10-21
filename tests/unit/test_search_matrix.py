"""Unit tests for Indian Tech Search Matrix and Automated Pipeline Harvesting.

Tests matrix definitions, city mapping, and run_matrix_harvest orchestration.
"""

from unittest.mock import AsyncMock, patch
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.search_matrix import ALL_TARGET_CITIES, SEARCH_TARGETS, SearchTarget
from app.models.schemas import RawJobIngest
from app.services.pipeline import PipelineService


def test_search_matrix_structure_integrity():
    """Verify all search matrix targets have valid priority, slugs, and keywords."""
    assert len(SEARCH_TARGETS) >= 5
    for target in SEARCH_TARGETS:
        assert target.priority in ("P1", "P2", "P3")
        assert len(target.query_title) > 0
        assert len(target.cutshort_slug) > 0
        assert len(target.hirist_keyword) > 0

    assert "Mumbai" in ALL_TARGET_CITIES
    assert "Pune" in ALL_TARGET_CITIES
    assert "Bengaluru" in ALL_TARGET_CITIES
    assert "Hyderabad" in ALL_TARGET_CITIES


@pytest.mark.asyncio
async def test_run_matrix_harvest_orchestration(async_db_session: AsyncSession):
    """Verify run_matrix_harvest coordinates across targets and sources."""
    pipeline = PipelineService(async_db_session)

    mock_ingest = RawJobIngest(
        source_id="CUTSHORT",
        company_name="Matrix Tech",
        source_job_id="matrix-001",
        source_url="https://cutshort.io/job/matrix-001",
        application_url="https://cutshort.io/job/matrix-001",
        raw_payload={
            "title": "Generative AI Engineer",
            "content": "Work with LLMs, prompt engineering, and Python backend.",
            "location_name": "Pune",
            "experience": "1-2 years",
        },
    )

    sample_target = SearchTarget(
        query_title="Generative AI Engineer",
        priority="P1",
        cutshort_slug="generative-ai-jobs",
        hirist_keyword="generative-ai-jobs",
    )

    with patch.object(
        pipeline._collectors["CUTSHORT"],
        "collect_for_endpoint",
        new_callable=AsyncMock,
    ) as mock_collect:
        mock_collect.return_value = [mock_ingest]

        result = await pipeline.run_matrix_harvest(
            sources=["CUTSHORT"],
            targets=[sample_target],
            cities=["Pune"],
        )

        assert result["status"] == "SUCCESS"
        assert result["runs_executed"] == 1
        assert result["total_found"] == 1
        assert result["total_created"] == 1
