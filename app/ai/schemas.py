"""Schemas for LLM Gateway inferences, responses, and structured outputs.

Enforces strongly typed validation on all LLM model outputs.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class JobFitAssessment(BaseModel):
    """Structured evaluation of a job posting against career targets."""

    role_verdict: Literal["ELIGIBLE", "REVIEW", "REJECTED"] = Field(
        ...,
        description="Evaluation verdict: ELIGIBLE (strong match), REVIEW (ambiguous/borderline), REJECTED (senior/unrelated)",
    )
    target_role: str = Field(
        ...,
        description="Target category (e.g. 'AI / GenAI Engineer', 'Backend Developer', 'Software Engineer', 'Other')",
    )
    experience_fit: str = Field(
        ...,
        description="Fit assessment for 0-2 years YOE (e.g. '0-2 Years (Strong Fit)', 'Unspecified/Ambiguous', 'Senior/Lead (Mismatch)')",
    )
    extracted_skills: List[str] = Field(
        default_factory=list,
        description="Key technologies and technical skills explicitly required or preferred in the JD",
    )
    missing_skills: List[str] = Field(
        default_factory=list,
        description="Skills commonly expected for this role category that are absent from the JD or candidate gaps",
    )
    key_responsibilities: List[str] = Field(
        default_factory=list,
        description="Top 2-3 core responsibilities summarized cleanly",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score of this evaluation between 0.0 and 1.0",
    )
    reasoning: str = Field(
        ...,
        description="Concise 1-2 sentence engineering justification for the verdict",
    )


class LLMResponse(BaseModel):
    """Standardized wrapper for raw and parsed LLM inference responses."""

    provider: str
    model: str
    prompt_version: str
    input_hash: str
    parsed: JobFitAssessment
    tokens_used: Optional[int] = None
    latency_ms: float = 0.0
    from_cache: bool = False
