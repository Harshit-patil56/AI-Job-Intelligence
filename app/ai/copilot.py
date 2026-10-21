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

        configured_adapters = self.gateway.get_configured_adapters()
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

            except Exception as exc:
                logger.warning("Copilot provider generation failed, cascading", provider=adapter.provider_name, error=str(exc))
                continue

        # Fallback synthesizer: produces clean, high-quality personalized application assets
        bullets = [
            f"Engineered high-throughput backend services and APIs utilizing {extracted_skills[0] if extracted_skills else 'Python'} and asynchronous design patterns.",
            f"Designed automated data ingestion workflows and composite caching mechanisms, accelerating query response latency.",
            f"Collaborated on production microservices with containerized deployment, automated testing, and comprehensive logging.",
        ]
        cover = (
            f"Hi Hiring Team at {company},\n\n"
            f"I am writing to express my strong interest in the {title} opening. "
            f"With a strong foundation in {' and '.join(extracted_skills[:2]) if extracted_skills else 'Python and backend development'}, "
            f"I have built production-grade APIs, automated intelligence pipelines, and reliable services. "
            f"I am excited about {company}'s technical trajectory and look forward to contributing impactful, maintainable code.\n\n"
            f"Best regards,\n{cand_name}"
        )
        qa = [
            InterviewQuestion(
                question=f"How would you architect a backend service in this role to handle asynchronous workloads?",
                talking_points="Discuss async event loops, background task management, non-blocking HTTP requests with httpx/asyncio, and transactional database commits.",
            ),
            InterviewQuestion(
                question=f"What is your approach to handling database locking and high concurrency in {company}'s stack?",
                talking_points="Highlight WAL (Write-Ahead Logging) mode, busy timeouts, connection pooling, and separating long-running network operations from write transactions.",
            ),
            InterviewQuestion(
                question="How do you quickly ramp up on missing frameworks or technologies listed in this JD?",
                talking_points="Emphasize rapid learning loops: reading official docs, building working proof-of-concepts, debugging stack traces, and applying clean design patterns.",
            ),
        ]
        return CopilotApplicationPack(
            tailored_bullets=bullets,
            cover_note=cover,
            interview_qa=qa,
        )
