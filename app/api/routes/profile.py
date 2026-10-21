"""Candidate Profile and Resume Settings API routes.

Provides endpoints to query and update the user's personal candidate profile,
target role preferences, and full resume text for personalized Copilot tailoring.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.database import get_db_session
from app.models.entities import CandidateProfile

logger = structlog.get_logger()

router = APIRouter(prefix="/profile", tags=["Profile"])


class CandidateProfileResponse(BaseModel):
    id: str
    full_name: str
    headline: Optional[str] = None
    target_roles: List[str] = Field(default_factory=list)
    preferred_locations: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    resume_text: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None


class CandidateProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    headline: Optional[str] = None
    target_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    resume_text: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None


@router.get("", response_model=CandidateProfileResponse)
async def get_candidate_profile(
    session: AsyncSession = Depends(get_db_session),
):
    """Retrieve user's primary candidate profile or instantiate baseline defaults."""
    stmt = select(CandidateProfile).limit(1)
    result = await session.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        profile = CandidateProfile(
            full_name="Tanmay",
            headline="AI / GenAI & Backend Engineer",
            target_roles=[
                "AI Engineer",
                "Generative AI Engineer",
                "Agentic AI Engineer",
                "Backend Engineer",
                "Software Engineer",
            ],
            preferred_locations=["Bengaluru", "Hyderabad", "Pune", "Mumbai", "Remote"],
            skills=[
                "Python",
                "FastAPI",
                "PyTorch",
                "LangChain",
                "LlamaIndex",
                "RAG",
                "PostgreSQL",
                "Docker",
                "TypeScript",
                "Next.js",
            ],
            resume_text=(
                "Summary:\nEarly-career AI and Backend Software Engineer with hands-on experience "
                "building autonomous AI agents, retrieval-augmented generation (RAG) systems, and high-throughput "
                "FastAPI backends. Strong foundation in distributed data pipelines, REST APIs, and vector databases."
            ),
        )
        session.add(profile)
        await session.commit()
        await session.refresh(profile)

    return CandidateProfileResponse(
        id=profile.id,
        full_name=profile.full_name,
        headline=profile.headline,
        target_roles=profile.target_roles or [],
        preferred_locations=profile.preferred_locations or [],
        skills=profile.skills or [],
        resume_text=profile.resume_text,
        portfolio_url=profile.portfolio_url,
        github_url=profile.github_url,
        linkedin_url=profile.linkedin_url,
    )


@router.put("", response_model=CandidateProfileResponse)
async def update_candidate_profile(
    payload: CandidateProfileUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Upsert user's candidate profile, resume text, target roles, and links."""
    stmt = select(CandidateProfile).limit(1)
    result = await session.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        profile = CandidateProfile()
        session.add(profile)

    if payload.full_name is not None:
        profile.full_name = payload.full_name
    if payload.headline is not None:
        profile.headline = payload.headline
    if payload.target_roles is not None:
        profile.target_roles = payload.target_roles
    if payload.preferred_locations is not None:
        profile.preferred_locations = payload.preferred_locations
    if payload.skills is not None:
        profile.skills = payload.skills
    if payload.resume_text is not None:
        profile.resume_text = payload.resume_text
    if payload.portfolio_url is not None:
        profile.portfolio_url = payload.portfolio_url
    if payload.github_url is not None:
        profile.github_url = payload.github_url
    if payload.linkedin_url is not None:
        profile.linkedin_url = payload.linkedin_url

    await session.commit()
    await session.refresh(profile)

    logger.info("Updated candidate profile and resume text", profile_id=profile.id)

    return CandidateProfileResponse(
        id=profile.id,
        full_name=profile.full_name,
        headline=profile.headline,
        target_roles=profile.target_roles or [],
        preferred_locations=profile.preferred_locations or [],
        skills=profile.skills or [],
        resume_text=profile.resume_text,
        portfolio_url=profile.portfolio_url,
        github_url=profile.github_url,
        linkedin_url=profile.linkedin_url,
    )
