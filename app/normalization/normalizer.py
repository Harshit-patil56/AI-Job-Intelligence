"""Top-level normalization engine.

Cleanses raw scraped or API payloads, standardizes titles and company names,
strips HTML from descriptions, and orchestrates location, experience, and salary parsers.
"""

import html
import re
from bs4 import BeautifulSoup

from app.models.schemas import NormalizedJob, RawJobIngest
from app.normalization.agency_detector import detect_agency
from app.normalization.experience_parser import parse_experience
from app.normalization.location_parser import parse_location
from app.normalization.salary_parser import parse_salary

LEGAL_SUFFIXES = [
    r"\bpvt\.?\s*ltd\.?\b",
    r"\bprivate\s+limited\b",
    r"\bltd\.?\b",
    r"\blimited\b",
    r"\binc\.?\b",
    r"\bincorporated\b",
    r"\bcorp\.?\b",
    r"\bcorporation\b",
    r"\bllc\b",
    r"\bllp\b",
    r"\btechnologies\b",
    r"\btech\b",
    r"\bsolutions\b",
    r"\bservices\b",
    r"\bsoftware\b",
    r"\bconsulting\b",
]


def clean_html_to_text(raw_html: str | None) -> str:
    """Clean HTML tags and decode HTML entities into legible, structured plain text."""
    if not raw_html:
        return ""
    try:
        # Pre-decode entities in case source feeds encoded tags (e.g. Greenhouse &lt;div&gt;)
        decoded = html.unescape(raw_html)
        if "&lt;" in decoded or "&gt;" in decoded:
            decoded = html.unescape(decoded)

        soup = BeautifulSoup(decoded, "html.parser")

        # Headings: separate with double newline
        for heading in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
            heading.insert_before("\n\n")
            heading.insert_after("\n")

        # Line breaks
        for br in soup.find_all("br"):
            br.replace_with("\n")

        # List items: bullet formatting
        for li in soup.find_all("li"):
            li.insert_before("• ")
            li.append("\n")

        # Paragraphs, divs, and section blocks
        for block in soup.find_all(["p", "div", "section", "article"]):
            block.append("\n")

        text = soup.get_text()
    except Exception:
        text = re.sub(r"<[^>]+>", " ", raw_html)

    # Post-clean remaining entities and unicode non-breaking spaces
    text = html.unescape(text)
    text = text.replace("\xa0", " ")
    # Horizontal spacing
    text = re.sub(r"[ \t]+", " ", text)
    # Vertical spacing: collapse 3+ newlines to double newline
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def normalize_title(title: str | None) -> str:
    """Sanitize and normalize job title string for deterministic comparisons."""
    if not title:
        return ""
    # Lowercase, replace slashes and hyphens with spaces, remove special characters
    t = title.lower()
    t = re.sub(r"[\(\)\[\]\{\}\|/\\,_-]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def normalize_company_name(name: str | None) -> str:
    """Standardize legal and trading company names."""
    if not name:
        return ""
    n = name.lower().strip()
    for pattern in LEGAL_SUFFIXES:
        n = re.sub(pattern, " ", n, flags=re.IGNORECASE)
    n = re.sub(r"[^\w\s]", " ", n)
    n = re.sub(r"\s+", " ", n).strip()
    return n or name.lower().strip()


def normalize_raw_job(raw_job: RawJobIngest) -> NormalizedJob:
    """Convert an incoming RawJobIngest into a standardized NormalizedJob."""
    raw_payload = raw_job.raw_payload or {}

    # Extract or clean title
    title = raw_payload.get("title") or raw_payload.get("job_title") or "Unknown Title"
    canonical_title = re.sub(r"\s+", " ", title).strip()
    norm_title = normalize_title(canonical_title)

    # Extract or clean company
    company_name = (
        raw_job.company_name
        or raw_payload.get("company_name")
        or raw_payload.get("company")
        or "Unknown Company"
    )
    norm_company_name = normalize_company_name(company_name)

    # Clean description
    raw_desc = (
        raw_payload.get("content")
        or raw_payload.get("description")
        or raw_payload.get("job_description")
        or ""
    )
    clean_desc = clean_html_to_text(raw_desc)

    # Parse location
    raw_location = (
        raw_payload.get("location")
        or raw_payload.get("location_name")
        or (raw_payload.get("offices", [{}])[0].get("name") if raw_payload.get("offices") else None)
        or ""
    )
    loc_analysis = parse_location(raw_location)

    # Parse experience
    exp_snippet = (
        raw_payload.get("experience")
        or raw_payload.get("experience_required")
        or ""
    )
    exp_analysis = parse_experience(raw_text=f"{exp_snippet}\n{clean_desc[:2000]}", title=canonical_title)

    # Parse salary
    salary_snippet = (
        raw_payload.get("salary")
        or raw_payload.get("compensation")
        or ""
    )
    salary_analysis = parse_salary(f"{salary_snippet} {clean_desc[:1500]}")

    # Parse posted_at date
    posted_at = (
        raw_payload.get("posted_at")
        or raw_payload.get("published_at")
        or raw_payload.get("created_at")
        or raw_payload.get("updated_at")
    )

    # Agency detection
    agency_res = detect_agency(company_name, raw_payload)

    return NormalizedJob(
        source_id=raw_job.source_id,
        company_source_id=raw_job.company_source_id,
        source_job_id=raw_job.source_job_id,
        source_url=raw_job.source_url,
        application_url=raw_job.application_url or raw_payload.get("absolute_url"),
        company_name=company_name,
        normalized_company_name=norm_company_name,
        company_url=raw_payload.get("company_url"),
        canonical_title=canonical_title,
        normalized_title=norm_title,
        description=clean_desc,
        location=raw_location or loc_analysis.normalized_location,
        normalized_location=loc_analysis.normalized_location,
        location_type=loc_analysis.location_type,
        is_p1_location=loc_analysis.is_p1,
        is_p2_location=loc_analysis.is_p2,
        experience_min=exp_analysis.experience_min,
        experience_max=exp_analysis.experience_max,
        experience_text=exp_analysis.experience_text,
        salary_min=salary_analysis.annual_min,
        salary_max=salary_analysis.annual_max,
        salary_currency=salary_analysis.salary_currency,
        salary_period=salary_analysis.salary_period,
        salary_text=salary_analysis.salary_text,
        is_agency=agency_res.is_agency,
        posted_at=posted_at,
        raw_payload=raw_payload,
    )
