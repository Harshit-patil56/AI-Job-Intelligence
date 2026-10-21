"""Unit tests for Staffing Agency & Third-Party Recruiter Detector.

Tests pattern matching, platform flags, and legitimate direct employers.
"""

from app.normalization.agency_detector import detect_agency


def test_detect_agency_explicit_platform_flag():
    """Verify Cutshort hiringForClient=True is detected immediately."""
    res = detect_agency(company_name="Acme Tech", raw_payload={"hiringForClient": True})
    assert res.is_agency is True
    assert "hiringForClient=True" in res.matched_pattern


def test_detect_agency_client_of_pattern():
    """Verify 'Client of...' recruiters are identified."""
    res = detect_agency(company_name="Client of Michael Page")
    assert res.is_agency is True
    assert res.matched_pattern.lower() == "client of"


def test_detect_agency_hiring_for_pattern():
    """Verify 'Hiring for...' staffing headlines are flagged."""
    res = detect_agency(company_name="Hiring for Fortune 500 MNC")
    assert res.is_agency is True


def test_detect_agency_confidential_posting():
    """Verify 'Confidential' employer identities are flagged."""
    res = detect_agency(company_name="Confidential Tech Startup")
    assert res.is_agency is True


def test_detect_agency_consultancy_and_staffing_keywords():
    """Verify consulting and staffing keywords in employer names."""
    agencies = [
        "ABC Staffing Solutions Pvt Ltd",
        "Apex Recruitment Services",
        "Global Manpower Placement",
        "Top MNC",
        "Leading Fintech Company",
        "Talent Acquisition Partners",
        "Premier HR Solutions",
    ]
    for name in agencies:
        res = detect_agency(company_name=name)
        assert res.is_agency is True, f"Failed to identify agency: {name}"


def test_legitimate_direct_employers_not_flagged():
    """Verify verified tech product employers are never falsely flagged as agencies."""
    legitimate_companies = [
        "Razorpay",
        "BrowserStack",
        "Postman",
        "Hasura",
        "InMobi",
        "CleverTap",
        "Urban Company",
        "Linear",
        "Ramp",
        "Google",
        "Microsoft",
        "Uber",
    ]
    for name in legitimate_companies:
        res = detect_agency(company_name=name, raw_payload={"hiringForClient": False})
        assert res.is_agency is False, f"Direct employer falsely marked as agency: {name}"
