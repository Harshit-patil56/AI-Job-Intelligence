"""Deterministic Fallback Adapter for offline evaluation when no external LLM is configured."""

import re
from typing import List, Tuple
import structlog

from app.ai.base import BaseLLMAdapter
from app.ai.schemas import JobFitAssessment

logger = structlog.get_logger()

TECH_SKILLS_KEYWORDS = [
    "Python", "Java", "Go", "Golang", "C++", "C#", "Rust", "TypeScript", "JavaScript",
    "FastAPI", "Django", "Flask", "Spring Boot", "Node.js", "Express", "React", "Next.js",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Git", "Kafka", "RabbitMQ",
    "PyTorch", "TensorFlow", "Hugging Face", "LangChain", "LlamaIndex", "OpenAI",
    "Transformers", "RAG", "Fine-Tuning", "NLP", "Computer Vision", "LLMs", "Vector DB"
]


class DeterministicFallbackAdapter(BaseLLMAdapter):
    """Fallback synthesizer guaranteeing 100% system operational continuity without cloud keys."""

    def __init__(self):
        super().__init__(
            provider_name="FALLBACK_HEURISTIC",
            model_name="deterministic-v1.2",
            timeout=1.0,
        )

    def is_configured(self) -> bool:
        return True

    async def generate_assessment(
        self,
        user_prompt: str,
        system_prompt: str,
    ) -> Tuple[JobFitAssessment, int | None]:
        text_lower = user_prompt.lower()

        # 1. Extract tech skills
        extracted: List[str] = []
        for skill in TECH_SKILLS_KEYWORDS:
            pattern = r"\b" + re.escape(skill.lower()) + r"\b"
            if re.search(pattern, text_lower):
                extracted.append(skill)

        # 2. Identify target role
        target_role = "Software Engineer"
        if any(k in text_lower for k in ["genai", "llm", "rag", "artificial intelligence", "deep learning", "machine learning"]):
            target_role = "AI / GenAI Engineer"
        elif any(k in text_lower for k in ["backend", "api", "distributed", "server"]):
            target_role = "Backend Developer"

        # 3. Assess experience and verdict
        is_senior = any(k in text_lower for k in ["senior", "lead", "staff", "principal", "director", "5+ years", "6+ years", "7+ years", "8+ years"])
        if is_senior:
            verdict = "REJECTED"
            exp_fit = "Senior / Lead (Exceeds 2-Year Target Window)"
            reasoning = "Role mandates extensive senior/lead experience beyond the 0-2 year early career target window."
        else:
            verdict = "ELIGIBLE"
            exp_fit = "0-2 Years (Strong Early-Career Alignment)"
            reasoning = f"Role matches target '{target_role}' profile with entry/junior/associate seniority suitability."

        # 4. Standard expected skills based on role
        expected_skills = {
            "AI / GenAI Engineer": ["Python", "PyTorch", "RAG", "LangChain", "Vector DB", "Docker"],
            "Backend Developer": ["Python", "FastAPI", "SQL", "PostgreSQL", "Docker", "Redis"],
            "Software Engineer": ["Python", "TypeScript", "SQL", "Git", "Docker"],
        }
        missing = [s for s in expected_skills.get(target_role, []) if s not in extracted]

        assessment = JobFitAssessment(
            role_verdict=verdict,
            target_role=target_role,
            experience_fit=exp_fit,
            extracted_skills=extracted,
            missing_skills=missing,
            key_responsibilities=[
                f"Design, build, and deploy components for {target_role} systems",
                "Collaborate with engineering team on testing, code quality, and performance",
            ],
            confidence=0.85,
            reasoning=reasoning,
        )
        return assessment, 0
