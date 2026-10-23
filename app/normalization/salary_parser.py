"""Salary normalization and compensation extraction engine.

Extracts minimum and maximum compensation in INR/USD (standardized to annual amounts),
handling Indian number conventions (Lakhs, LPA, ₹, monthly wages) and international formats.
"""

import re
from typing import NamedTuple, Optional
from app.models.schemas import SalaryPeriod


class SalaryAnalysis(NamedTuple):
    salary_min: float | None
    salary_max: float | None
    salary_currency: str
    salary_period: SalaryPeriod
    salary_text: str | None
    annual_min: float | None
    annual_max: float | None
    is_estimated: bool = False


# Matches "15 - 25 LPA", "15L - 25L", "15 to 25 Lakhs", "₹12L - ₹20L", "CTC: 10-18 Lacs"
LPA_RANGE_PATTERN = re.compile(
    r"(?:(?:ctc|salary|package|compensation|pay|offer|stipend)\s*[:=-]?\s*)?"
    r"(?:₹|inr|rs\.?)?\s*(?P<min>\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lac|lacs?|l)?\s*"
    r"(?:-|to)\s*"
    r"(?:₹|inr|rs\.?)?\s*(?P<max>\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lac|lacs?|l)\b",
    re.IGNORECASE,
)

# Matches "6 LPA", "₹15 Lakhs", "CTC: 18L", "Package: 25 LPA"
LPA_SINGLE_PATTERN = re.compile(
    r"(?:(?:ctc|salary|package|compensation|pay|offer|stipend)\s*[:=-]?\s*)?"
    r"(?:₹|inr|rs\.?)?\s*(?P<val>\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lac|lacs?|l)\b",
    re.IGNORECASE,
)

# Matches "15,00,000 - 25,00,000", "300,000 - 600,000 per annum"
RAW_INR_RANGE_PATTERN = re.compile(
    r"(?:(?:ctc|salary|package|compensation|pay)\s*[:=-]?\s*)?"
    r"(?:₹|inr|rs\.?)?\s*(?P<min>\d{1,3}(?:,\d{2,3})+|\d{5,8})\s*"
    r"(?:-|to)\s*"
    r"(?:₹|inr|rs\.?)?\s*(?P<max>\d{1,3}(?:,\d{2,3})+|\d{5,8})\s*"
    r"(?:p\.?a\.?|per\s+annum|annual|\/yr|\/year)?\b",
    re.IGNORECASE,
)

# Matches "₹30,000 per month", "35k - 50k / month", "40000 pm"
MONTHLY_INR_PATTERN = re.compile(
    r"(?:(?:stipend|salary|pay|compensation)\s*[:=-]?\s*)?"
    r"(?:₹|inr|rs\.?)?\s*(?P<min>\d{1,3}(?:,\d{2,3})*|\d+)\s*(?P<min_k>k)?\s*"
    r"(?:-|to)?\s*"
    r"(?:(?:₹|inr|rs\.?)?\s*(?P<max>\d{1,3}(?:,\d{2,3})*|\d+)\s*(?P<max_k>k)?)?\s*"
    r"(?:per\s+month|\/mo|\/month|pm)\b",
    re.IGNORECASE,
)

# Matches "$120k - $160k", "$100,000 - $150,000"
USD_RANGE_PATTERN = re.compile(
    r"(?:\$|usd)\s*(?P<min>\d+(?:,\d{3})*(?:\.\d+)?)\s*(?P<min_k>k)?\s*"
    r"(?:-|to)\s*"
    r"(?:\$|usd)?\s*(?P<max>\d+(?:,\d{3})*(?:\.\d+)?)\s*(?P<max_k>k)?\s*"
    r"(?:per\s+year|\/yr|\/year|annual)?\b",
    re.IGNORECASE,
)


def _clean_number(num_str: str) -> float:
    return float(num_str.replace(",", "").strip())


def format_salary_display(
    salary_min: float | None,
    salary_max: float | None,
    currency: str | None = "INR",
    period: str | None = "ANNUAL",
    existing_text: str | None = None,
    is_estimated: bool = False,
) -> str:
    """Format numeric compensation into clean, compact representation (e.g. ₹15L - ₹25L)."""
    curr = (currency or "INR").upper()
    per = (period or "ANNUAL").upper()
    est_suffix = " (Est.)" if is_estimated else ""

    if existing_text and not existing_text.lower().startswith("nan"):
        clean_text = existing_text.strip()
        if is_estimated and "(est" not in clean_text.lower():
            clean_text = f"{clean_text} (Est.)"
        return clean_text

    if salary_min is None and salary_max is None:
        return "Competitive"

    if curr in ("INR", "RS", "RUPEES"):
        symbol = "₹"
        if per == "MONTHLY" and salary_min and salary_min < 500_000:
            min_k = round(salary_min / 1000)
            if salary_max and salary_max != salary_min:
                max_k = round(salary_max / 1000)
                return f"{symbol}{min_k}k - {symbol}{max_k}k/mo{est_suffix}"
            return f"{symbol}{min_k}k/mo{est_suffix}"

        # Standard annual INR format in LPA (Lakhs per annum)
        if salary_min:
            min_l = salary_min / 100_000.0
            min_str = f"{min_l:.1f}".rstrip("0").rstrip(".")
        else:
            min_str = None

        if salary_max:
            max_l = salary_max / 100_000.0
            max_str = f"{max_l:.1f}".rstrip("0").rstrip(".")
        else:
            max_str = None

        if min_str and max_str and min_str != max_str:
            return f"{symbol}{min_str}L - {symbol}{max_str}L{est_suffix}"
        elif min_str:
            return f"{symbol}{min_str}L+{est_suffix}"
        elif max_str:
            return f"Up to {symbol}{max_str}L{est_suffix}"

    elif curr in ("USD", "$"):
        symbol = "$"
        if salary_min and salary_min >= 1000:
            min_k = round(salary_min / 1000)
            if salary_max and salary_max >= 1000 and salary_max != salary_min:
                max_k = round(salary_max / 1000)
                return f"{symbol}{min_k}k - {symbol}{max_k}k{est_suffix}"
            return f"{symbol}{min_k}k+{est_suffix}"
        elif salary_min:
            return f"{symbol}{salary_min:.0f}/hr{est_suffix}"

    return f"{salary_min or 0} - {salary_max or 0} {curr}{est_suffix}"


def estimate_market_salary(
    role_priority: str,
    experience_min: float | None = None,
    experience_max: float | None = None,
    location: str | None = None,
) -> SalaryAnalysis:
    """Provide realistic, authoritative market compensation estimates for tech roles."""
    p = (role_priority or "NOT_RELEVANT").upper()
    exp = experience_min or 1.0

    # GenAI / LLM / Agentic AI Engineer (P1)
    if "P1" in p:
        if exp < 2.0:
            s_min, s_max = 1_000_000.0, 1_800_000.0
        elif exp < 5.0:
            s_min, s_max = 1_800_000.0, 3_200_000.0
        else:
            s_min, s_max = 3_200_000.0, 5_500_000.0

    # Backend / Distributed Systems / Data (P2)
    elif "P2" in p:
        if exp < 2.0:
            s_min, s_max = 800_000.0, 1_500_000.0
        elif exp < 5.0:
            s_min, s_max = 1_500_000.0, 2_600_000.0
        else:
            s_min, s_max = 2_600_000.0, 4_200_000.0

    # SWE / Full Stack / Frontend (P3)
    elif "P3" in p:
        if exp < 2.0:
            s_min, s_max = 600_000.0, 1_200_000.0
        elif exp < 5.0:
            s_min, s_max = 1_200_000.0, 2_200_000.0
        else:
            s_min, s_max = 2_200_000.0, 3_500_000.0

    # General Tech Roles
    else:
        if exp < 2.0:
            s_min, s_max = 500_000.0, 1_000_000.0
        elif exp < 5.0:
            s_min, s_max = 1_000_000.0, 1_800_000.0
        else:
            s_min, s_max = 1_800_000.0, 3_000_000.0

    text = format_salary_display(s_min, s_max, "INR", "ANNUAL", is_estimated=True)

    return SalaryAnalysis(
        salary_min=s_min,
        salary_max=s_max,
        salary_currency="INR",
        salary_period=SalaryPeriod.ANNUAL,
        salary_text=text,
        annual_min=s_min,
        annual_max=s_max,
        is_estimated=True,
    )


def parse_salary(raw_text: str | None) -> SalaryAnalysis:
    """Parse salary from text, returning raw values and annualized equivalent."""
    if not raw_text or not raw_text.strip():
        return SalaryAnalysis(
            salary_min=None,
            salary_max=None,
            salary_currency="INR",
            salary_period=SalaryPeriod.ANNUAL,
            salary_text=None,
            annual_min=None,
            annual_max=None,
            is_estimated=False,
        )

    text = raw_text.strip()

    # 1. Check for LPA / Lakhs range: "4.5 - 8 LPA", "15L - 25L", "12 to 18 Lakhs"
    match = LPA_RANGE_PATTERN.search(text)
    if match:
        min_lpa = float(match.group("min"))
        max_lpa = float(match.group("max"))
        annual_min = min_lpa * 100_000.0
        annual_max = max_lpa * 100_000.0
        disp_text = format_salary_display(annual_min, annual_max, "INR", "ANNUAL")
        return SalaryAnalysis(
            salary_min=annual_min,
            salary_max=annual_max,
            salary_currency="INR",
            salary_period=SalaryPeriod.ANNUAL,
            salary_text=disp_text,
            annual_min=annual_min,
            annual_max=annual_max,
            is_estimated=False,
        )

    # 2. Check for single LPA: "6 LPA", "15L"
    match = LPA_SINGLE_PATTERN.search(text)
    if match:
        val_lpa = float(match.group("val"))
        annual_val = val_lpa * 100_000.0
        disp_text = format_salary_display(annual_val, annual_val, "INR", "ANNUAL")
        return SalaryAnalysis(
            salary_min=annual_val,
            salary_max=annual_val,
            salary_currency="INR",
            salary_period=SalaryPeriod.ANNUAL,
            salary_text=disp_text,
            annual_min=annual_val,
            annual_max=annual_val,
            is_estimated=False,
        )

    # 3. Check for USD range: "$120k - $160k"
    match = USD_RANGE_PATTERN.search(text)
    if match:
        min_raw = _clean_number(match.group("min"))
        if match.group("min_k") or min_raw < 1000:
            min_raw *= 1000.0
        max_raw = _clean_number(match.group("max"))
        if match.group("max_k") or max_raw < 1000:
            max_raw *= 1000.0
        disp_text = format_salary_display(min_raw, max_raw, "USD", "ANNUAL")
        return SalaryAnalysis(
            salary_min=min_raw,
            salary_max=max_raw,
            salary_currency="USD",
            salary_period=SalaryPeriod.ANNUAL,
            salary_text=disp_text,
            annual_min=min_raw,
            annual_max=max_raw,
            is_estimated=False,
        )

    # 4. Check for monthly compensation: "₹30,000 per month", "35k/mo"
    match = MONTHLY_INR_PATTERN.search(text)
    if match:
        min_m = _clean_number(match.group("min"))
        if match.group("min_k"):
            min_m *= 1000.0
        if match.group("max"):
            max_m = _clean_number(match.group("max"))
            if match.group("max_k"):
                max_m *= 1000.0
        else:
            max_m = min_m

        annual_min = min_m * 12.0
        annual_max = max_m * 12.0
        disp_text = format_salary_display(min_m, max_m, "INR", "MONTHLY")
        return SalaryAnalysis(
            salary_min=min_m,
            salary_max=max_m,
            salary_currency="INR",
            salary_period=SalaryPeriod.MONTHLY,
            salary_text=disp_text,
            annual_min=annual_min,
            annual_max=annual_max,
            is_estimated=False,
        )

    # 5. Check for full INR numbers (>= 50,000): "15,00,000 - 25,00,000", "300,000 - 600,000 per annum"
    match = RAW_INR_RANGE_PATTERN.search(text)
    if match:
        try:
            min_raw = _clean_number(match.group("min"))
            max_raw = _clean_number(match.group("max"))
            if min_raw >= 50_000:  # Likely annual
                disp_text = format_salary_display(min_raw, max_raw, "INR", "ANNUAL")
                return SalaryAnalysis(
                    salary_min=min_raw,
                    salary_max=max_raw,
                    salary_currency="INR",
                    salary_period=SalaryPeriod.ANNUAL,
                    salary_text=disp_text,
                    annual_min=min_raw,
                    annual_max=max_raw,
                    is_estimated=False,
                )
        except (ValueError, TypeError):
            pass

    return SalaryAnalysis(
        salary_min=None,
        salary_max=None,
        salary_currency="INR",
        salary_period=SalaryPeriod.ANNUAL,
        salary_text=None,
        annual_min=None,
        annual_max=None,
        is_estimated=False,
    )
