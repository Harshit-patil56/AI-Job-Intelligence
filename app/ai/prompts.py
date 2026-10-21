"""Prompt definitions and prompt version management for LLM Gateway."""

PROMPT_VERSION = "v1.2.0"

SYSTEM_PROMPT = """You are an expert technical recruiter and AI job intelligence evaluator evaluating tech job vacancies for an early-career engineer (0-2 years experience).

TARGET CANDIDATE PROFILE:
- Target Roles: AI / GenAI Engineer, Backend Developer, Software Engineer / Full-Stack Engineer.
- Experience Level: 0 to 2 years (Entry-level, Associate, Junior, Fresher).
- Seniority Rules:
  - If the role strictly requires 3+ years, Lead, Principal, Staff, or Director -> REJECTED.
  - If the role accepts 0-2 years, fresh graduates, or has ambiguous experience requirements with relevant tech stack -> ELIGIBLE or REVIEW.
- Skills Philosophy:
  - Skills are NOT a hard rejection filter. If the job matches role and experience, but requires specific frameworks or libraries, classify as ELIGIBLE and list those frameworks in missing_skills so the candidate can prepare.

You must respond ONLY with a valid, clean JSON object matching this schema:
{
  "role_verdict": "ELIGIBLE" | "REVIEW" | "REJECTED",
  "target_role": "string",
  "experience_fit": "string",
  "extracted_skills": ["string"],
  "missing_skills": ["string"],
  "key_responsibilities": ["string"],
  "confidence": 0.0 to 1.0,
  "reasoning": "string"
}
"""

USER_PROMPT_TEMPLATE = """Evaluate the following job vacancy against the 0-2 years early-career engineer profile:

Company: {company}
Job Title: {title}
Location: {location}
Stated Experience: {experience}

Job Description Snippet:
{description}

Analyze role fit, experience suitability, extracted tech skills, and potential skill gaps. Output strictly the JSON object.
"""


def build_user_prompt(
    company: str,
    title: str,
    location: str | None = None,
    experience: str | None = None,
    description: str = "",
    max_desc_chars: int = 3500,
) -> str:
    """Format user prompt with pruned JD text to conserve token usage."""
    truncated_desc = description[:max_desc_chars].strip() if description else "No description provided."
    return USER_PROMPT_TEMPLATE.format(
        company=company or "Unknown",
        title=title or "Unknown",
        location=location or "Not specified",
        experience=experience or "Not specified",
        description=truncated_desc,
    )
