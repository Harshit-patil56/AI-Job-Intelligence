"""Unit tests for ATS and Aggregator Collectors.

Tests Greenhouse, Lever, Ashby, and JobSpy collectors using mocked HTTP / Thread responses.
Verifies payload serialization, error handling, retries, and data extraction contracts.
"""

from unittest.mock import AsyncMock, MagicMock, patch
import httpx
import pytest

from app.collectors.ashby import AshbyCollector
from app.collectors.base import calculate_content_hash
from app.collectors.greenhouse import GreenhouseCollector
from app.collectors.jobspy_collector import JobSpyCollector
from app.collectors.lever import LeverCollector


def test_calculate_content_hash_deterministic():
    """Verify SHA-256 payload hashing is deterministic regardless of key order."""
    payload_a = {"title": "AI Engineer", "company": "Acme", "id": 123}
    payload_b = {"id": 123, "company": "Acme", "title": "AI Engineer"}
    assert calculate_content_hash(payload_a) == calculate_content_hash(payload_b)


@pytest.mark.asyncio
async def test_greenhouse_collector_success():
    """Verify Greenhouse collector properly parses job listings and nested fields."""
    mock_response_data = {
        "jobs": [
            {
                "id": 101,
                "title": "Senior AI Backend Engineer",
                "location": {"name": "Mumbai, India"},
                "content": "<p>Build LLM agents.</p>",
                "updated_at": "2026-10-15T12:00:00Z",
                "absolute_url": "https://boards.greenhouse.io/acme/jobs/101",
                "departments": [{"name": "AI Engineering"}],
                "offices": [{"name": "Mumbai"}],
            }
        ]
    }

    collector = GreenhouseCollector()
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_response_data

    with patch.object(collector, "_get_with_retry", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        records = await collector.collect_for_endpoint(
            company_name="Acme Corp",
            endpoint_token="acme",
            company_source_id="cs-001",
        )

        assert len(records) == 1
        rec = records[0]
        assert rec.source_id == "GREENHOUSE"
        assert rec.source_job_id == "101"
        assert rec.company_name == "Acme Corp"
        assert rec.company_source_id == "cs-001"
        assert rec.raw_payload["title"] == "Senior AI Backend Engineer"
        assert rec.raw_payload["location_name"] == "Mumbai, India"
        assert "LLM agents" in rec.raw_payload["content"]


@pytest.mark.asyncio
async def test_greenhouse_collector_error_handling():
    """Verify Greenhouse collector returns empty list on network failure."""
    collector = GreenhouseCollector()
    with patch.object(collector, "_get_with_retry", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.ConnectError("Connection refused")
        records = await collector.collect_for_endpoint(
            company_name="Acme Corp",
            endpoint_token="acme",
        )
        assert records == []


@pytest.mark.asyncio
async def test_lever_collector_success():
    """Verify Lever collector properly parses list of postings and categories."""
    mock_response_data = [
        {
            "id": "lever-456",
            "text": "Generative AI Engineer",
            "categories": {
                "location": "Bengaluru",
                "team": "Machine Learning",
                "commitment": "Full-time",
            },
            "workplaceType": "hybrid",
            "descriptionPlain": "Develop RAG pipelines and evaluation metrics.",
            "additionalPlain": "Python, PyTorch, LangChain.",
            "hostedUrl": "https://jobs.lever.co/targetcorp/lever-456",
            "applyUrl": "https://jobs.lever.co/targetcorp/lever-456/apply",
            "createdAt": 1729000000000,
        }
    ]

    collector = LeverCollector()
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_response_data

    with patch.object(collector, "_get_with_retry", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        records = await collector.collect_for_endpoint(
            company_name="Target Corp",
            endpoint_token="targetcorp",
            company_source_id="cs-002",
        )

        assert len(records) == 1
        rec = records[0]
        assert rec.source_id == "LEVER"
        assert rec.source_job_id == "lever-456"
        assert rec.company_name == "Target Corp"
        assert rec.raw_payload["title"] == "Generative AI Engineer"
        assert rec.raw_payload["location_name"] == "Bengaluru"
        assert rec.raw_payload["workplace_type"] == "hybrid"
        assert "RAG pipelines" in rec.raw_payload["content"]
        assert rec.raw_payload["created_at"] is not None


@pytest.mark.asyncio
async def test_lever_collector_invalid_format():
    """Verify Lever collector handles non-list JSON payload safely."""
    collector = LeverCollector()
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"error": "Unauthorized or not found"}

    with patch.object(collector, "_get_with_retry", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        records = await collector.collect_for_endpoint(
            company_name="Target Corp",
            endpoint_token="invalid",
        )
        assert records == []


@pytest.mark.asyncio
async def test_ashby_collector_success():
    """Verify Ashby collector properly parses job listings with remote flags and compensation."""
    mock_response_data = {
        "jobs": [
            {
                "id": "ashby-789",
                "title": "AI Platform Engineer",
                "location": "Pune",
                "department": "Infrastructure",
                "isRemote": True,
                "descriptionHtml": "<p>Scale our agent orchestration framework.</p>",
                "publishedAt": "2026-10-18T10:00:00Z",
                "jobUrl": "https://jobs.ashbyhq.com/innovate/ashby-789",
                "applyUrl": "https://jobs.ashbyhq.com/innovate/ashby-789/application",
                "compensation": {"min": 2500000, "max": 4000000, "currency": "INR"},
            }
        ]
    }

    collector = AshbyCollector()
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_response_data

    with patch.object(collector, "_get_with_retry", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        records = await collector.collect_for_endpoint(
            company_name="Innovate Ltd",
            endpoint_token="innovate",
            company_source_id="cs-003",
        )

        assert len(records) == 1
        rec = records[0]
        assert rec.source_id == "ASHBY"
        assert rec.source_job_id == "ashby-789"
        assert rec.company_name == "Innovate Ltd"
        assert rec.raw_payload["title"] == "AI Platform Engineer"
        assert rec.raw_payload["location_name"] == "Pune"
        assert rec.raw_payload["is_remote"] is True
        assert rec.raw_payload["published_at"] == "2026-10-18T10:00:00Z"
        assert rec.raw_payload["compensation"]["min"] == 2500000


@pytest.mark.asyncio
async def test_jobspy_collector_mocked():
    """Verify JobSpy collector parses search results accurately from thread worker."""
    mock_records = [
        {
            "id": "jobspy-1",
            "site": "linkedin",
            "company": "DeepTech India",
            "title": "Machine Learning Engineer",
            "location": "Mumbai",
            "description": "Looking for ML engineer with 1 year experience in PyTorch.",
            "date_posted": "2026-10-17",
            "job_url": "https://www.linkedin.com/jobs/view/jobspy-1",
            "job_url_direct": "https://www.linkedin.com/jobs/view/jobspy-1",
            "min_amount": 1200000,
            "max_amount": 2000000,
            "currency": "INR",
            "interval": "yearly",
        }
    ]

    collector = JobSpyCollector()
    with patch.object(collector, "_sync_scrape", return_value=mock_records):
        results = await collector.search_jobs(
            search_term="Machine Learning",
            location="Mumbai",
            results_wanted=5,
        )

        assert len(results) == 1
        rec = results[0]
        assert rec.source_id == "LINKEDIN"
        assert rec.company_name == "DeepTech India"
        assert rec.raw_payload["title"] == "Machine Learning Engineer"
        assert rec.raw_payload["location_name"] == "Mumbai"
        assert rec.raw_payload["salary_min"] == 1200000


@pytest.mark.asyncio
async def test_cutshort_collector_success():
    """Verify Cutshort collector extracts structured jobs from Next.js payload."""
    import json
    from app.collectors.cutshort import CutshortCollector

    mock_job = {
        "_id": "cs-999",
        "headline": "Generative AI Specialist",
        "companyDetails": {"name": "GenAI Labs", "website": "https://genailabs.ai"},
        "publicUrl": "https://cutshort.io/job/cs-999",
        "locations": ["Pune", "Bengaluru"],
        "expRange": {"min": 1, "max": 2},
        "salaryRange": {"currency": "INR", "min": 1500000, "max": 2500000},
        "salaryRangeText": "₹15L - ₹25L / yr",
        "hiringForClient": False,
        "remoteType": "remote_okay",
        "sanitizedComment": "<p>Build agentic workflows with LangGraph.</p>",
        "allSkills": ["Python", "LLMs", "RAG"],
    }

    mock_next_data = {
        "props": {
            "pageProps": {
                "dehydratedState": {
                    "queries": [
                        {
                            "queryKey": ["jobListData", "generative-ai-jobs"],
                            "state": {
                                "data": {
                                    "data": {
                                        "pageData": {
                                            "jobs": [mock_job]
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        }
    }

    mock_html = f'<html><body><script id="__NEXT_DATA__" type="application/json">{json.dumps(mock_next_data)}</script></body></html>'

    collector = CutshortCollector()
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.text = mock_html

    with patch.object(collector, "_get_with_retry", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        records = await collector.collect_by_slug("generative-ai-jobs")

        assert len(records) == 1
        rec = records[0]
        assert rec.source_id == "CUTSHORT"
        assert rec.source_job_id == "cs-999"
        assert rec.company_name == "GenAI Labs"
        assert rec.raw_payload["title"] == "Generative AI Specialist"
        assert "Pune" in rec.raw_payload["location_name"]
        assert rec.raw_payload["hiringForClient"] is False
        assert rec.raw_payload["salary_min"] == 1500000
        assert rec.raw_payload["experience_min"] == 1


@pytest.mark.asyncio
async def test_hirist_collector_success():
    """Verify Hirist collector extracts jobs from preloaded state payload."""
    import json
    from app.collectors.hirist import HiristCollector

    mock_job = {
        "id": "hirist-555",
        "title": "Python AI Backend Engineer",
        "companyName": "NxtGen Solutions",
        "location": "Mumbai",
        "minExp": 1,
        "maxExp": 2,
        "jobUrl": "/j/hirist-555",
        "description": "FastAPI, PostgreSQL, and PyTorch backend development.",
    }

    mock_state = {
        "feed": {
            "jobFeed": [mock_job]
        }
    }

    mock_html = f'<html><body><script>window.__PRELOADED_STATE__ = {json.dumps(mock_state)};</script></body></html>'

    collector = HiristCollector()
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.text = mock_html

    with patch.object(collector, "_get_with_retry", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        records = await collector.collect_by_keyword("k/python-jobs")

        assert len(records) == 1
        rec = records[0]
        assert rec.source_id == "HIRIST"
        assert rec.source_job_id == "hirist-555"
        assert rec.company_name == "NxtGen Solutions"
        assert rec.raw_payload["title"] == "Python AI Backend Engineer"
        assert rec.raw_payload["location_name"] == "Mumbai"
        assert rec.raw_payload["experience_min"] == 1

