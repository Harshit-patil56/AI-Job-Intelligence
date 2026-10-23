"""Application Copilot intelligence service.

Generates tailored application assets:
1. Tailored resume bullet points matched to the job description.
2. Concise, professional candidate outreach cover note.
3. Key interview screening questions & model response talking points.
"""

from typing import Any, List, Optional
from pydantic import BaseModel, Field
import structlog

from app.ai.base import clean_and_parse_json
from app.ai.gateway import LLMGateway
from app.ai.prompts import build_user_prompt
from app.ai.schemas import JobFitAssessment

logger = structlog.get_logger()

COPILOT_SYSTEM_PROMPT = """You are an elite career strategist and technical interview coach assisting an early-career engineer (0-2 years experience) applying for AI, GenAI, Backend, and Software Engineering roles.

Given a target job posting, generate a tailored application package:
1. tailored_bullets: 3-4 impactful resume bullet points tailored to the tech stack (using Action Verb + Tech + Impact/Metric structure).
2. cover_note: A crisp, professional 120-150 word application cover note / recruiter outreach message highlighting passion, relevant stack, and early-career velocity.
3. interview_qa: 3 high-probability technical interview questions for this specific role, each accompanied by concise talking points for an early-career candidate.

Output STRICTLY valid JSON conforming to this schema:
{
  "tailored_bullets": ["string"],
  "cover_note": "string",
  "interview_qa": [
    {
      "question": "string",
      "talking_points": "string"
    }
  ]
}
"""


class InterviewQuestion(BaseModel):
    question: str
    talking_points: str


class CopilotApplicationPack(BaseModel):
    tailored_bullets: List[str] = Field(default_factory=list)
    cover_note: str = ""
    interview_qa: List[InterviewQuestion] = Field(default_factory=list)


class CopilotService:
    """Service generating tailored resume bullets, outreach notes, and interview prep."""

    def __init__(self):
        self.gateway = LLMGateway()

    async def generate_pack(
        self,
        company: str,
        title: str,
        description: str,
        extracted_skills: Optional[List[str]] = None,
        candidate_profile: Optional[Any] = None,
        session: Optional[Any] = None,
    ) -> CopilotApplicationPack:
        """Generate tailored application pack via LLM Gateway with deterministic fallback, matching candidate resume."""
        skills_str = ", ".join(extracted_skills) if extracted_skills else "General software engineering stack"
        
        cand_name = getattr(candidate_profile, "full_name", "Tanmay")
        cand_skills = ", ".join(getattr(candidate_profile, "skills", [])) if getattr(candidate_profile, "skills", None) else "Python, FastAPI, RAG, PyTorch, Docker"
        cand_resume = getattr(candidate_profile, "resume_text", "") or ""

        user_prompt = f"""Target Company: {company}
Role Title: {title}
Extracted Tech Skills Required: {skills_str}

Candidate Background & Profile:
Candidate Name: {cand_name}
Candidate Known Skills: {cand_skills}
Candidate Resume Snippet:
{cand_resume[:1500] if cand_resume else "Early-career AI and Backend Software Engineer experienced in Python, FastAPI, RAG, and microservices."}

Job Description Snippet:
{description[:3000]}

Generate:
1. tailored_bullets: 3-4 impactful resume bullet points tailored to the tech stack (using Action Verb + Tech + Impact/Metric structure), matching candidate experience to this JD.
2. cover_note: A crisp 120-150 word application cover note / recruiter outreach message signed by {cand_name}.
3. interview_qa: 3 high-probability technical interview questions for this specific role, with concise talking points.
Output strictly valid JSON conforming to the schema."""

        configured_adapters = await self.gateway.get_active_adapters(session)
        if not configured_adapters:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=503,
                detail="No active AI provider is configured or enabled. Please add or toggle on an API key in Profile -> API settings.",
            )

        for adapter in configured_adapters:
            if self.gateway.is_in_cooldown(adapter.provider_name):
                continue
            try:
                # Use raw client generation if available or base generate
                if hasattr(adapter, "generate_assessment"):
                    # Use adapter's async HTTP client
                    async with __import__("httpx").AsyncClient(timeout=adapter.timeout) as client:
                        if adapter.provider_name == "GEMINI":
                            url = f"https://generativelanguage.googleapis.com/v1beta/models/{adapter.model_name}:generateContent"
                            res = await client.post(
                                url,
                                params={"key": adapter.api_key},
                                json={
                                    "system_instruction": {"parts": [{"text": COPILOT_SYSTEM_PROMPT}]},
                                    "contents": [{"parts": [{"text": user_prompt}]}],
                                    "generationConfig": {"response_mime_type": "application/json", "temperature": 0.2},
                                },
                            )
                            if res.status_code == 200:
                                txt = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                                return CopilotApplicationPack.model_validate(clean_and_parse_json(txt))

                        elif adapter.provider_name in ("GROQ", "OPENROUTER"):
                            endpoint = "https://api.groq.com/openai/v1/chat/completions" if adapter.provider_name == "GROQ" else "https://openrouter.ai/api/v1/chat/completions"
                            headers = {"Authorization": f"Bearer {adapter.api_key}", "Content-Type": "application/json"}
                            res = await client.post(
                                endpoint,
                                headers=headers,
                                json={
                                    "model": adapter.model_name,
                                    "messages": [
                                        {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
                                        {"role": "user", "content": user_prompt},
                                    ],
                                    "response_format": {"type": "json_object"},
                                    "temperature": 0.2,
                                },
                            )
                            if res.status_code == 200:
                                txt = res.json()["choices"][0]["message"]["content"]
                                return CopilotApplicationPack.model_validate(clean_and_parse_json(txt))

                        elif adapter.provider_name == "OLLAMA" and getattr(adapter, "base_url", None):
                            endpoint = f"{adapter.base_url}/api/chat"
                            res = await client.post(
                                endpoint,
                                json={
                                    "model": adapter.model_name,
                                    "messages": [
                                        {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
                                        {"role": "user", "content": user_prompt},
                                    ],
                                    "format": "json",
                                    "stream": False,
                                },
                            )
                            if res.status_code == 200:
                                txt = res.json().get("message", {}).get("content", "{}")
                                return CopilotApplicationPack.model_validate(clean_and_parse_json(txt))

            except Exception as exc:
                logger.warning("Copilot provider generation failed, cascading", provider=adapter.provider_name, error=str(exc))
                continue

        # If all configured providers failed, raise error instead of generating fake demo assets
        from fastapi import HTTPException
        raise HTTPException(
            status_code=502,
            detail="Failed to generate Application Copilot Pack. Configured LLM providers failed or encountered rate limits.",
        )
