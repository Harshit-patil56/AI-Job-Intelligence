"""Top-level normalization engine.

Cleanses raw scraped or API payloads, standardizes titles and company names,
strips HTML from descriptions, and orchestrates location, experience, and salary parsers.
"""

import html
import re
from bs4 import BeautifulSoup

from app.models.schemas import NormalizedJob, RawJobIngest, SalaryPeriod
from app.normalization.agency_detector import detect_agency
from app.normalization.experience_parser import parse_experience
from app.normalization.location_parser import parse_location
from app.normalization.salary_parser import (
    SalaryAnalysis,
    estimate_market_salary,
    format_salary_display,
    parse_salary,
)

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

    # Extract or clean company - prioritize payload's specific hiring employer over run-level aggregator tokens
    payload_comp = str(raw_payload.get("company_name") or raw_payload.get("company") or "").strip()
    run_comp = str(raw_job.company_name or "").strip()

    def is_placeholder(name: str) -> bool:
        low = name.lower()
        return any(low.startswith(p) for p in ("jobspy (", "cutshort (", "hirist (", "naukri (", "instahyre (", "wellfound startups"))

    if payload_comp and not is_placeholder(payload_comp):
        company_name = payload_comp
    elif run_comp and not is_placeholder(run_comp):
        company_name = run_comp
    else:
        company_name = payload_comp or run_comp or "Unknown Company"

    # Strip any residual aggregator tokens like "JobSpy (AI Engineer)"
    company_name = re.sub(r"^(jobspy|cutshort|hirist|instahyre|naukri|wellfound)\s*\([^)]*\)", "", company_name, flags=re.IGNORECASE).strip() or company_name
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
    # 1. First priority: Check if raw_payload already has explicit structured salary fields
    raw_sal_min = raw_payload.get("salary_min") or raw_payload.get("min_amount")
    raw_sal_max = raw_payload.get("salary_max") or raw_payload.get("max_amount")
    raw_sal_curr = raw_payload.get("salary_currency") or raw_payload.get("currency") or "INR"
    raw_sal_period = raw_payload.get("salary_period") or raw_payload.get("interval") or "ANNUAL"
    raw_sal_text = (
        raw_payload.get("salary_text")
        or raw_payload.get("salaryRangeText")
        or raw_payload.get("compensation")
        or raw_payload.get("salary")
    )

    salary_analysis = None

    if raw_sal_min is not None or raw_sal_max is not None:
        try:
            s_min = float(raw_sal_min) if raw_sal_min is not None else None
            s_max = float(raw_sal_max) if raw_sal_max is not None else s_min
            ann_min = s_min
            ann_max = s_max
            per_enum = SalaryPeriod.ANNUAL
            if str(raw_sal_period).upper() in ("MONTHLY", "MONTH", "MO"):
                per_enum = SalaryPeriod.MONTHLY
                if s_min:
                    ann_min = s_min * 12.0
                if s_max:
                    ann_max = s_max * 12.0

            disp_text = format_salary_display(s_min, s_max, raw_sal_curr, raw_sal_period, str(raw_sal_text) if raw_sal_text else None)
            salary_analysis = SalaryAnalysis(
                salary_min=s_min,
                salary_max=s_max,
                salary_currency=str(raw_sal_curr).upper(),
                salary_period=per_enum,
                salary_text=disp_text,
                annual_min=ann_min,
                annual_max=ann_max,
                is_estimated=False,
            )
        except (ValueError, TypeError):
            pass

    # 2. Second priority: Parse from text snippet or full job description
    if not salary_analysis or salary_analysis.annual_min is None:
        salary_snippet = str(raw_sal_text or "")
        full_salary_text = f"{salary_snippet}\n{clean_desc}"
        salary_analysis = parse_salary(full_salary_text)

    # 3. Third priority: Market estimate based on title, experience & location
    if not salary_analysis or salary_analysis.annual_min is None:
        title_lower = canonical_title.lower()
        role_p = "P1" if any(k in title_lower for k in ("genai", "generative ai", "llm", "agent", "prompt")) else (
            "P2" if any(k in title_lower for k in ("backend", "distributed", "data engineer", "platform")) else (
                "P3" if any(k in title_lower for k in ("software", "full stack", "frontend", "developer", "engineer")) else "OTHER"
            )
        )
        salary_analysis = estimate_market_salary(
            role_priority=role_p,
            experience_min=exp_analysis.experience_min,
            experience_max=exp_analysis.experience_max,
            location=raw_location,
        )

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
        source_url=raw_job.source_url or raw_payload.get("public_url") or raw_payload.get("absolute_url"),
        application_url=(
            raw_job.application_url
            or raw_payload.get("absolute_url")
            or raw_payload.get("public_url")
            or raw_payload.get("job_url")
        ),
        company_name=company_name,
        normalized_company_name=norm_company_name,
        company_url=(
            raw_payload.get("company_url")
            or raw_payload.get("company_website")
            or raw_payload.get("companyWebsite")
            or raw_payload.get("company_homepage")
        ),
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
