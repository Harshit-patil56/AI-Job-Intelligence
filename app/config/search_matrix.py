"""Indian Tech Search Matrix Configuration.

Defines target role keywords, priority tiers, geographic hubs, and source-specific
query mappings for broad automated discovery across JobSpy, Cutshort, and Hirist.
"""

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass(frozen=True)
class SearchTarget:
    """A role query target mapped across search platforms."""
    query_title: str
    priority: str  # P1, P2, P3
    cutshort_slug: str
    hirist_keyword: str


# Target roles prioritized for AI/GenAI and Backend acceleration
SEARCH_TARGETS: List[SearchTarget] = [
    # --- P1: Direct AI / GenAI / LLM ---
    SearchTarget(
        query_title="Generative AI Engineer",
        priority="P1",
        cutshort_slug="generative-ai-jobs",
        hirist_keyword="generative-ai-jobs",
    ),
    SearchTarget(
        query_title="AI Engineer",
        priority="P1",
        cutshort_slug="artificial-intelligence-jobs",
        hirist_keyword="artificial-intelligence-jobs",
    ),
    SearchTarget(
        query_title="LLM Engineer",
        priority="P1",
        cutshort_slug="artificial-intelligence-jobs",
        hirist_keyword="llm-jobs",
    ),
    # --- P2: AI Backend / Applied ML ---
    SearchTarget(
        query_title="Machine Learning Engineer",
        priority="P2",
        cutshort_slug="machine-learning-jobs",
        hirist_keyword="machine-learning-jobs",
    ),
    SearchTarget(
        query_title="AI Backend Engineer",
        priority="P2",
        cutshort_slug="backend-developer-jobs",
        hirist_keyword="python-jobs",
    ),
    SearchTarget(
        query_title="Python Backend Engineer",
        priority="P2",
        cutshort_slug="python-jobs",
        hirist_keyword="python-jobs",
    ),
    # --- P3: Core Software / Backend ---
    SearchTarget(
        query_title="Backend Developer",
        priority="P3",
        cutshort_slug="backend-developer-jobs",
        hirist_keyword="python-jobs",
    ),
]

# Target Indian tech hubs
TARGET_LOCATIONS: Dict[str, List[str]] = {
    "P1": ["Mumbai", "Pune"],
    "P2": ["Bengaluru", "Hyderabad"],
    "REMOTE": ["Remote"],
}

ALL_TARGET_CITIES: List[str] = ["Mumbai", "Pune", "Bengaluru", "Hyderabad", "Remote"]

# Aggregator Freshness Window
MAX_AGGREGATOR_HOURS_OLD: int = 120  # 5 days strict freshness cutoff
