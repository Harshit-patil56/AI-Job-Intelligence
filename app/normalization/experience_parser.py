"""Experience parsing and extraction engine.

Extracts minimum and maximum years of experience from job descriptions,
metadata strings, and titles using robust regex patterns.
"""

import re
from typing import NamedTuple


class ExperienceAnalysis(NamedTuple):
    experience_min: float | None
    experience_max: float | None
    experience_text: str | None
    is_fresher_or_entry: bool
    is_ambiguous: bool


# Pre-compiled regular expressions for experience patterns
RANGE_PATTERN = re.compile(
    r"(?P<min>\d+(?:\.\d+)?)\s*(?:-|to|\.\.)\s*(?P<max>\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?|yr)\b",
    re.IGNORECASE,
)

MIN_PLUS_PATTERN = re.compile(
    r"(?P<min>\d+(?:\.\d+)?)\s*\+\s*(?:years?|yrs?|yr)\b",
    re.IGNORECASE,
)

MIN_PREFIX_PATTERN = re.compile(
    r"(?:min|minimum|at\s+least)\s*(?:of)?\s*(?P<min>\d+(?:\.\d+)?)\s*(?:years?|yrs?|yr)\b",
    re.IGNORECASE,
)

MAX_PREFIX_PATTERN = re.compile(
    r"(?:max|maximum|up\s+to)\s*(?P<max>\d+(?:\.\d+)?)\s*(?:years?|yrs?|yr)\b",
    re.IGNORECASE,
)

SINGLE_YEAR_EXP_PATTERN = re.compile(
    r"(?P<min>\d+(?:\.\d+)?)\s*(?:years?|yrs?|yr)\s*(?:of\s+)?(?:relevant\s+)?(?:experience|exp)\b",
    re.IGNORECASE,
)

FRESHER_KEYWORDS = [
    "fresher",
    "freshers",
    "entry level",
    "entry-level",
    "college grad",
    "university graduate",
    "recent graduate",
    "campus hire",
    "no prior experience required",
]


def parse_experience(raw_text: str | None, title: str | None = None) -> ExperienceAnalysis:
    """Parse experience requirements from title, snippet, or JD text."""
    combined = f"{title or ''} {raw_text or ''}".strip()
    if not combined:
        return ExperienceAnalysis(
            experience_min=None,
            experience_max=None,
            experience_text=None,
            is_fresher_or_entry=False,
            is_ambiguous=True,
        )

    lowered = combined.lower()

    # 1. Check for explicit Fresher / Entry-level terms
    for kw in FRESHER_KEYWORDS:
        if re.search(rf"\b{re.escape(kw)}\b", lowered):
            # If explicit fresher, min is 0.0, max is 1.0 or 2.0 unless an explicit higher range is also stated
            return ExperienceAnalysis(
                experience_min=0.0,
                experience_max=1.0,
                experience_text=kw.title(),
                is_fresher_or_entry=True,
                is_ambiguous=False,
            )

    # 2. Check for range: e.g. "0-2 years", "1 to 3 yrs"
    match = RANGE_PATTERN.search(combined)
    if match:
        min_val = float(match.group("min"))
        max_val = float(match.group("max"))
        matched_str = match.group(0).strip()
        return ExperienceAnalysis(
            experience_min=min_val,
            experience_max=max_val,
            experience_text=matched_str,
            is_fresher_or_entry=(min_val == 0.0),
            is_ambiguous=False,
        )

    # 3. Check for "X+ years"
    match = MIN_PLUS_PATTERN.search(combined)
    if match:
        min_val = float(match.group("min"))
        matched_str = match.group(0).strip()
        return ExperienceAnalysis(
            experience_min=min_val,
            experience_max=None,
            experience_text=matched_str,
            is_fresher_or_entry=(min_val == 0.0),
            is_ambiguous=False,
        )

    # 4. Check for "minimum X years"
    match = MIN_PREFIX_PATTERN.search(combined)
    if match:
        min_val = float(match.group("min"))
        matched_str = match.group(0).strip()
        return ExperienceAnalysis(
            experience_min=min_val,
            experience_max=None,
            experience_text=matched_str,
            is_fresher_or_entry=(min_val == 0.0),
            is_ambiguous=False,
        )

    # 5. Check for "X years of experience"
    match = SINGLE_YEAR_EXP_PATTERN.search(combined)
    if match:
        val = float(match.group("min"))
        matched_str = match.group(0).strip()
        return ExperienceAnalysis(
            experience_min=val,
            experience_max=val,
            experience_text=matched_str,
            is_fresher_or_entry=(val == 0.0),
            is_ambiguous=False,
        )

    # 6. Check for "up to X years"
    match = MAX_PREFIX_PATTERN.search(combined)
    if match:
        max_val = float(match.group("max"))
        matched_str = match.group(0).strip()
        return ExperienceAnalysis(
            experience_min=0.0,
            experience_max=max_val,
            experience_text=matched_str,
            is_fresher_or_entry=True,
            is_ambiguous=False,
        )

    # If no pattern was matched, return ambiguous
    return ExperienceAnalysis(
        experience_min=None,
        experience_max=None,
        experience_text=None,
        is_fresher_or_entry=False,
        is_ambiguous=True,
    )
