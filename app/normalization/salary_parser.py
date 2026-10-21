"""Salary normalization and compensation extraction engine.

Extracts minimum and maximum compensation in INR (standardized to annual amounts),
handling Indian number conventions (Lakhs, LPA, ₹, monthly wages).
"""

import re
from typing import NamedTuple
from app.models.schemas import SalaryPeriod


class SalaryAnalysis(NamedTuple):
    salary_min: float | None
    salary_max: float | None
    salary_currency: str
    salary_period: SalaryPeriod
    salary_text: str | None
    annual_min: float | None
    annual_max: float | None


LPA_RANGE_PATTERN = re.compile(
    r"(?:₹|inr|rs\.?)?\s*(?P<min>\d+(?:\.\d+)?)\s*(?:-|to)\s*(?P<max>\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lac|lacs?)\b",
    re.IGNORECASE,
)

LPA_SINGLE_PATTERN = re.compile(
    r"(?:₹|inr|rs\.?)?\s*(?P<val>\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lac|lacs?)\b",
    re.IGNORECASE,
)

RAW_INR_RANGE_PATTERN = re.compile(
    r"(?:₹|inr|rs\.?)?\s*(?P<min>\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)\s*(?:-|to)\s*(?:₹|inr|rs\.?)?\s*(?P<max>\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)\s*(?:p\.?a\.?|per\s+annum|annual)?\b",
    re.IGNORECASE,
)

MONTHLY_INR_PATTERN = re.compile(
    r"(?:₹|inr|rs\.?)?\s*(?P<min>\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)\s*(?:-|to)?\s*(?P<max>\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)?\s*(?:per\s+month|\/mo|\/month|pm)\b",
    re.IGNORECASE,
)


def _clean_number(num_str: str) -> float:
    return float(num_str.replace(",", "").strip())


def parse_salary(raw_text: str | None) -> SalaryAnalysis:
    """Parse salary from text, returning raw values and annualized INR equivalent."""
    if not raw_text or not raw_text.strip():
        return SalaryAnalysis(
            salary_min=None,
            salary_max=None,
            salary_currency="INR",
            salary_period=SalaryPeriod.ANNUAL,
            salary_text=None,
            annual_min=None,
            annual_max=None,
        )

    text = raw_text.strip()

    # 1. Check for LPA / Lakhs range: "4.5 - 8 LPA"
    match = LPA_RANGE_PATTERN.search(text)
    if match:
        min_lpa = float(match.group("min"))
        max_lpa = float(match.group("max"))
        annual_min = min_lpa * 100_000.0
        annual_max = max_lpa * 100_000.0
        return SalaryAnalysis(
            salary_min=annual_min,
            salary_max=annual_max,
            salary_currency="INR",
            salary_period=SalaryPeriod.ANNUAL,
            salary_text=match.group(0).strip(),
            annual_min=annual_min,
            annual_max=annual_max,
        )

    # 2. Check for single LPA: "6 LPA"
    match = LPA_SINGLE_PATTERN.search(text)
    if match:
        val_lpa = float(match.group("val"))
        annual_val = val_lpa * 100_000.0
        return SalaryAnalysis(
            salary_min=annual_val,
            salary_max=annual_val,
            salary_currency="INR",
            salary_period=SalaryPeriod.ANNUAL,
            salary_text=match.group(0).strip(),
            annual_min=annual_val,
            annual_max=annual_val,
        )

    # 3. Check for monthly compensation: "₹30,000 per month"
    match = MONTHLY_INR_PATTERN.search(text)
    if match:
        min_m = _clean_number(match.group("min"))
        max_m = _clean_number(match.group("max")) if match.group("max") else min_m
        annual_min = min_m * 12.0
        annual_max = max_m * 12.0
        return SalaryAnalysis(
            salary_min=min_m,
            salary_max=max_m,
            salary_currency="INR",
            salary_period=SalaryPeriod.MONTHLY,
            salary_text=match.group(0).strip(),
            annual_min=annual_min,
            annual_max=annual_max,
        )

    # 4. Check for full INR numbers (>= 10,000): "300,000 - 600,000 per annum"
    match = RAW_INR_RANGE_PATTERN.search(text)
    if match:
        try:
            min_raw = _clean_number(match.group("min"))
            max_raw = _clean_number(match.group("max"))
            if min_raw >= 50_000:  # Likely annual
                return SalaryAnalysis(
                    salary_min=min_raw,
                    salary_max=max_raw,
                    salary_currency="INR",
                    salary_period=SalaryPeriod.ANNUAL,
                    salary_text=match.group(0).strip(),
                    annual_min=min_raw,
                    annual_max=max_raw,
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
    )
