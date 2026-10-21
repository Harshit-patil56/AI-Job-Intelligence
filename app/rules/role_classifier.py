"""Role classification and hard exclusion logic.

Implements Section 2 & 3 of JOB_FILTERS_V1:
- P1 (Core Target AI/GenAI roles)
- P2 (Accelerators & AI-Adjacent roles)
- P3 (Foundational Technical roles)
- Hard Exclusions (Salesforce, QA, IT Support, pure Frontend, Senior/Architect)
"""

import re
from typing import NamedTuple
from app.models.schemas import RejectionReason, ReviewReason, RolePriority


class RoleClassification(NamedTuple):
    priority: RolePriority
    matched_role: str | None
    is_excluded: bool
    rejection_reason: RejectionReason | None
    review_reason: ReviewReason | None


# Section 2.1: P1 Roles (Core GenAI / AI Engineering)
P1_ROLES = [
    "ai engineer",
    "genai engineer",
    "generative ai engineer",
    "applied ai engineer",
    "ai software engineer",
    "ai developer",
    "genai developer",
    "generative ai developer",
    "agentic ai engineer",
    "agentic ai developer",
    "llm engineer",
    "llm application developer",
    "ai application engineer",
    "ai application developer",
    "rag engineer",
    "ai agent engineer",
]

# Section 2.2: P2 Roles (Accelerators & AI-Adjacent)
P2_ROLES = [
    "forward deployed engineer",
    "fde",
    "ai backend engineer",
    "ai ml software engineer",
    "python backend engineer",
    "python backend developer",
    "backend engineer",
    "applied machine learning engineer",
]

# Section 2.3: P3 Roles (Foundational Technical Roles)
P3_ROLES = [
    "ml engineer",
    "machine learning engineer",
    "python developer",
    "software engineer",
    "software developer",
    "sde",
    "sde 1",
    "sde i",
    "junior software engineer",
    "ai automation engineer",
    "ai automation developer",
]

# Section 3.1: Explicitly Excluded Disciplines & Titles
EXCLUDED_KEYWORDS = [
    "salesforce",
    "frontend developer",
    "front end developer",
    "react developer",
    "angular developer",
    "vue developer",
    "css specialist",
    "ui developer",
    "it support",
    "desktop support",
    "helpdesk",
    "technical support",
    "qa engineer",
    "quality assurance",
    "sdet",
    "manual tester",
    "automation tester",
    "test engineer",
    "hr recruiter",
    "talent acquisition",
    "marketing specialist",
    "sales executive",
    "operations manager",
    "ai architect",
    "genai architect",
    "ai product manager",
    "ai business analyst",
]

# Senior / Lead Exclusions (0-2 years target profile)
SENIOR_KEYWORDS = [
    "senior",
    "sr.",
    "lead",
    "principal",
    "staff",
    "architect",
    "director",
    "head of",
    "vp",
    "vice president",
]

# Section 3.2: Java/.NET only checks
JAVA_DOTNET_PATTERNS = [
    r"\bjava developer\b",
    r"\bcore java engineer\b",
    r"\b\.net developer\b",
    r"\bc# backend developer\b",
    r"\bdotnet developer\b",
]


def classify_role(title: str, description: str = "") -> RoleClassification:
    """Classify normalized job title and context into P1, P2, P3, or EXCLUDED."""
    t_clean = title.lower().strip()
    d_clean = description.lower()[:2000]

    # 1. Check for Senior / Lead / Architect in Title
    for sk in SENIOR_KEYWORDS:
        if re.search(rf"\b{re.escape(sk)}\b", t_clean):
            return RoleClassification(
                priority=RolePriority.NOT_RELEVANT,
                matched_role=sk,
                is_excluded=True,
                rejection_reason=RejectionReason.EXPERIENCE_TOO_HIGH,
                review_reason=None,
            )

    # 2. Check Hard Exclusions in Title
    for ex in EXCLUDED_KEYWORDS:
        if re.search(rf"\b{re.escape(ex)}\b", t_clean):
            return RoleClassification(
                priority=RolePriority.NOT_RELEVANT,
                matched_role=ex,
                is_excluded=True,
                rejection_reason=RejectionReason.EXCLUDED_ROLE,
                review_reason=None,
            )

    # 3. Check Java/.NET-Only exclusion with AI exception rule
    for pat in JAVA_DOTNET_PATTERNS:
        if re.search(pat, t_clean):
            # Exception: if title or JD prominently mentions AI/LLM/GenAI, route to REVIEW
            if any(term in d_clean for term in ("genai", "llm", "rag", "artificial intelligence", "agent")):
                return RoleClassification(
                    priority=RolePriority.P3,
                    matched_role="Java/.NET with AI context",
                    is_excluded=False,
                    rejection_reason=None,
                    review_reason=ReviewReason.EXCLUSION_AMBIGUOUS,
                )
            return RoleClassification(
                priority=RolePriority.NOT_RELEVANT,
                matched_role="Java/.NET Enterprise",
                is_excluded=True,
                rejection_reason=RejectionReason.EXCLUDED_ROLE,
                review_reason=None,
            )

    # 4. Check P1 Roles
    for r in P1_ROLES:
        if re.search(rf"\b{re.escape(r)}\b", t_clean):
            return RoleClassification(
                priority=RolePriority.P1,
                matched_role=r,
                is_excluded=False,
                rejection_reason=None,
                review_reason=None,
            )

    # 5. Check P2 Roles
    for r in P2_ROLES:
        if re.search(rf"\b{re.escape(r)}\b", t_clean):
            return RoleClassification(
                priority=RolePriority.P2,
                matched_role=r,
                is_excluded=False,
                rejection_reason=None,
                review_reason=None,
            )

    # 6. Check P3 Roles
    for r in P3_ROLES:
        if re.search(rf"\b{re.escape(r)}\b", t_clean):
            return RoleClassification(
                priority=RolePriority.P3,
                matched_role=r,
                is_excluded=False,
                rejection_reason=None,
                review_reason=None,
            )

    # If title mentions Python or AI/ML anywhere
    if "python" in t_clean or "ai" in t_clean or "machine learning" in t_clean:
        return RoleClassification(
            priority=RolePriority.P3,
            matched_role="Generic Python/AI Mention",
            is_excluded=False,
            rejection_reason=None,
            review_reason=None,
        )

    # Fallback: Not relevant for our specific focus
    return RoleClassification(
        priority=RolePriority.NOT_RELEVANT,
        matched_role=None,
        is_excluded=True,
        rejection_reason=RejectionReason.EXCLUDED_ROLE,
        review_reason=None,
    )
