"""Candidate Profile and Resume Settings API routes.

Provides endpoints to query and update the user's personal candidate profile,
target role preferences, and full resume text for personalized Copilot tailoring.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
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
        from app.services.resume_parser import normalize_portfolio_url
        norm_pf = normalize_portfolio_url(payload.portfolio_url)
        profile.portfolio_url = norm_pf or (payload.portfolio_url.strip() if payload.portfolio_url.strip() else None)
    if payload.github_url is not None:
        from app.services.resume_parser import normalize_github_url
        norm_gh = normalize_github_url(payload.github_url)
        profile.github_url = norm_gh or (payload.github_url.strip() if payload.github_url.strip() else None)
    if payload.linkedin_url is not None:
        from app.services.resume_parser import normalize_linkedin_url
        norm_li = normalize_linkedin_url(payload.linkedin_url)
        profile.linkedin_url = norm_li or (payload.linkedin_url.strip() if payload.linkedin_url.strip() else None)

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


class ParsedResumeResponse(BaseModel):
    full_name: str
    headline: str
    target_roles: List[str]
    preferred_locations: List[str]
    skills: List[str]
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    resume_text: str
    extraction_mode: str


class ParseResumeTextRequest(BaseModel):
    resume_text: str
    prefer_llm: bool = True


@router.post("/parse-text", response_model=ParsedResumeResponse)
async def parse_resume_text_endpoint(
    payload: ParseResumeTextRequest,
):
    """Parse raw resume text/markdown and extract structured candidate profile data."""
    from app.services.resume_parser import parse_resume_content
    result = await parse_resume_content(payload.resume_text, prefer_llm=payload.prefer_llm)
    return ParsedResumeResponse(**result)


@router.post("/upload-resume", response_model=ParsedResumeResponse)
async def upload_resume_file_endpoint(
    file: UploadFile = File(...),
):
    """Extract and parse structured candidate profile from uploaded PDF or text resume."""
    from app.services.resume_parser import extract_text_from_pdf, parse_resume_content

    filename = (file.filename or "").lower()
    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    extracted_text = ""
    extracted_uris: List[str] = []
    if filename.endswith(".pdf"):
        try:
            from app.services.resume_parser import extract_text_and_links_from_pdf
            extracted_text, extracted_uris = extract_text_and_links_from_pdf(content)
        except Exception as exc:
            logger.error("Failed to extract text from PDF", error=str(exc))
            raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF resume: {str(exc)}")
    else:
        # Plain text, markdown, or text-based documents
        try:
            extracted_text = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                extracted_text = content.decode("latin-1")
            except Exception:
                raise HTTPException(status_code=400, detail="Could not decode text file.")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="No readable text could be extracted from the uploaded document.")

    from app.services.resume_parser import parse_resume_content
    result = await parse_resume_content(extracted_text, uris=extracted_uris, prefer_llm=True)
    return ParsedResumeResponse(**result)

