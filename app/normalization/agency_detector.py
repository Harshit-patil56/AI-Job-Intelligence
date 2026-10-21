"""Staffing Agency and Third-Party Recruiter Detection Engine.

Detects placement agencies, staffing firms, and confidential postings to prevent
them from crowding out direct engineering vacancies from primary hiring companies.
"""

from dataclasses import dataclass
import re
from typing import Optional

AGENCY_PATTERNS = [
    r"\bclient\s+of\b",
    r"\bhiring\s+for\b",
    r"\bconfidential\b",
    r"\bstaffing\b",
    r"\brecruitment\b",
    r"\brecruiting\b",
    r"\bconsultancy\b",
    r"\bconsulting\s+services?\b",
    r"\btalent\s+acquisition\s+partners?\b",
    r"\bplacement\s+services?\b",
    r"\bmanpower\b",
    r"\bheadhunters?\b",
    r"\bsearch\s+partners?\b",
    r"\bhr\s+solutions?\b",
    r"\bhr\s+services?\b",
    r"\btop\s+mnc\b",
    r"\bleading\s+(it|fintech|product|service)\s+company\b",
]

COMPILED_AGENCY_REGEX = re.compile(
    "|".join(AGENCY_PATTERNS),
    re.IGNORECASE,
)


@dataclass(frozen=True)
class AgencyDetectionResult:
    """Result of agency detection analysis."""
    is_agency: bool
    matched_pattern: Optional[str] = None
    detected_reason: Optional[str] = None


def detect_agency(
    company_name: str | None,
    raw_payload: dict | None = None,
) -> AgencyDetectionResult:
    """Analyze company name and payload metadata to identify staffing agencies."""
    payload = raw_payload or {}

    # 1. Check explicit platform agency flags (e.g. Cutshort hiringForClient)
    if payload.get("hiringForClient") is True:
        return AgencyDetectionResult(
            is_agency=True,
            matched_pattern="hiringForClient=True",
            detected_reason="Portal explicitly flagged posting as third-party client placement",
        )

    # 2. Check explicit industry tag in payload
    industry = str(payload.get("industry") or payload.get("company_industry") or "")
    if re.search(r"\b(staffing|recruiting|human resources)\b", industry, re.IGNORECASE):
        return AgencyDetectionResult(
            is_agency=True,
            matched_pattern=industry,
            detected_reason="Company industry classified as staffing/recruiting",
        )

    # 3. Check company name regex heuristics
    if company_name:
        match = COMPILED_AGENCY_REGEX.search(company_name)
        if match:
            return AgencyDetectionResult(
                is_agency=True,
                matched_pattern=match.group(0),
                detected_reason=f"Company name matches agency pattern '{match.group(0)}'",
            )

    return AgencyDetectionResult(is_agency=False)
