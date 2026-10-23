"""Unit tests for normalization and parsing modules."""

import pytest
from app.models.schemas import LocationType, RawJobIngest, SalaryPeriod
from app.normalization.experience_parser import parse_experience
from app.normalization.location_parser import parse_location
from app.normalization.normalizer import (
    clean_html_to_text,
    normalize_company_name,
    normalize_raw_job,
    normalize_title,
)
from app.normalization.salary_parser import parse_salary


def test_location_alias_bangalore():
    res = parse_location("Bangalore, Karnataka")
    assert res.matched_city == "Bengaluru"
    assert "Bengaluru, Karnataka" in res.normalized_location
    assert res.is_p2 is True
    assert res.is_p1 is False


def test_location_mumbai_suburbs():
    res1 = parse_location("Andheri East, Mumbai")
    assert res1.matched_city == "Mumbai"
    assert res1.is_p1 is True

    res2 = parse_location("Vashi, Navi Mumbai")
    assert res2.matched_city == "Navi Mumbai"
    assert res2.is_p1 is True

    res3 = parse_location("Hinjewadi, Pune")
    assert res3.matched_city == "Pune"
    assert res3.is_p1 is True


def test_location_remote_detection():
    res = parse_location("Remote - India (Work from home)")
    assert res.is_remote is True
    assert res.location_type == LocationType.REMOTE


def test_experience_range_parsing():
    res = parse_experience("Requires 0-2 years of software engineering experience")
    assert res.experience_min == 0.0
    assert res.experience_max == 2.0
    assert res.is_fresher_or_entry is True


def test_experience_fresher_keyword():
    res = parse_experience("Hiring Freshers for AI developer role", title="AI Developer")
    assert res.experience_min == 0.0
    assert res.is_fresher_or_entry is True


def test_experience_senior_rejection_band():
    res = parse_experience("Must have 3+ years experience with LLMs")
    assert res.experience_min == 3.0
    assert res.is_ambiguous is False


def test_experience_one_to_three():
    res = parse_experience("1 to 3 yrs experience")
    assert res.experience_min == 1.0
    assert res.experience_max == 3.0


def test_salary_lpa_range():
    res = parse_salary("Compensation: ₹ 6 - 12 LPA")
    assert res.annual_min == 600_000.0
    assert res.annual_max == 1_200_000.0
    assert res.salary_currency == "INR"


def test_salary_monthly_inr():
    res = parse_salary("Stipend / Salary: ₹35,000 per month")
    assert res.salary_period == SalaryPeriod.MONTHLY
    assert res.annual_min == 420_000.0


def test_salary_l_range():
    res = parse_salary("CTC: 15L - 25L")
    assert res.annual_min == 1_500_000.0
    assert res.annual_max == 2_500_000.0
    assert res.salary_text == "₹15L - ₹25L"


def test_salary_usd():
    res = parse_salary("Salary range: $120k - $160k per year")
    assert res.annual_min == 120_000.0
    assert res.annual_max == 160_000.0
    assert res.salary_currency == "USD"
    assert res.salary_text == "$120k - $160k"


def test_salary_market_estimation():
    from app.normalization.salary_parser import estimate_market_salary
    res = estimate_market_salary("P1", experience_min=3.0)
    assert res.is_estimated is True
    assert res.annual_min == 1_800_000.0
    assert res.annual_max == 3_200_000.0
    assert "(Est.)" in res.salary_text


def test_company_name_normalization():
    assert normalize_company_name("Razorpay Software Pvt Ltd") == "razorpay"
    assert normalize_company_name("BrowserStack Inc.") == "browserstack"
    assert normalize_company_name("Swiggy Private Limited") == "swiggy"


def test_title_normalization():
    assert normalize_title("Senior AI Engineer - GenAI/LLM") == "senior ai engineer genai llm"
    assert normalize_title("Software Engineer (Python / Backend)") == "software engineer python backend"


def test_clean_html_to_text():
    raw_html = "<p>Join our <strong>GenAI</strong> team!</p><br/><ul><li>Build RAG</li></ul>"
    text = clean_html_to_text(raw_html)
    assert "Join our GenAI team!" in text
    assert "Build RAG" in text
    assert "<p>" not in text
