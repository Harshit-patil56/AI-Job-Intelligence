"""Industry Standard Resume Parsing and Entity Extraction Service.

Extracts structured candidate profile data (Name, Headline, Target Roles,
Skills taxonomy, Locations, and Verified Social Links) from uploaded
PDF files or raw text/markdown resumes.

Supports:
1. Native PDF text extraction via pypdf.
2. Structured LLM extraction (when Gemini/Groq/OpenRouter/Ollama configured).
3. Robust deterministic regex and NLP taxonomy extraction (zero API cost fallback).
"""

import io
import json
import re
from typing import Any, Dict, List, Optional
import structlog

logger = structlog.get_logger()

# Standard Technical Skills Taxonomy
TECH_SKILLS_TAXONOMY = [
    # AI / ML & GenAI
    "Python", "PyTorch", "TensorFlow", "LangChain", "LlamaIndex", "RAG", "Hugging Face",
    "Transformers", "vLLM", "Ollama", "OpenAI API", "Anthropic Claude", "Gemini API",
    "Prompt Engineering", "Fine-tuning", "LoRA", "Agents", "LangGraph", "CrewAI",
    "ChromaDB", "Qdrant", "Pinecone", "Milvus", "FAISS", "Weaviate",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "LLMs",
    # Languages
    "TypeScript", "JavaScript", "Go", "Golang", "Rust", "C++", "C#", "Java", "SQL",
    # Backend & Web Frameworks
    "FastAPI", "Django", "Flask", "Node.js", "Express", "Next.js", "React", "Vue.js",
    "GraphQL", "REST APIs", "gRPC", "Microservices", "Celery", "Kafka", "RabbitMQ",
    # Databases & Storage
    "PostgreSQL", "Postgres", "Redis", "MongoDB", "MySQL", "SQLite", "Supabase", "DynamoDB",
    "Cassandra", "Elasticsearch",
    # Cloud & DevOps
    "Docker", "Kubernetes", "AWS", "GCP", "Google Cloud", "Azure", "Linux", "Git",
    "CI/CD", "GitHub Actions", "Terraform", "Prometheus", "Grafana",
]

# Standard Target Engineering Roles
ROLE_KEYWORDS = {
    "AI Engineer": ["ai", "artificial intelligence", "rag", "agents", "langchain", "llamaindex", "llm"],
    "Generative AI Engineer": ["generative ai", "genai", "llms", "prompt engineering", "fine-tuning", "lora"],
    "Agentic AI Engineer": ["agentic", "agents", "langgraph", "crewai", "multi-agent"],
    "Machine Learning Engineer": ["machine learning", "ml", "deep learning", "pytorch", "tensorflow", "scikit-learn"],
    "LLM Engineer": ["llm", "large language models", "vllm", "transformers", "hugging face"],
    "Backend Engineer": ["backend", "fastapi", "django", "flask", "microservices", "rest api", "sql"],
    "Senior Backend Engineer": ["senior backend", "distributed systems", "high throughput", "architecture"],
    "Software Engineer": ["software engineer", "software development", "full stack", "swe"],
    "Data Engineer": ["data engineer", "etl", "spark", "hadoop", "airflow", "kafka", "pipeline"],
    "MLOps Engineer": ["mlops", "model deployment", "triton", "kubeflow", "mlflow"],
}

# Standard Locations
LOCATION_KEYWORDS = [
    "Bengaluru", "Bangalore", "Hyderabad", "Pune", "Mumbai", "Delhi NCR",
    "Gurgaon", "Gurugram", "Noida", "Chennai", "Kolkata", "Remote", "Hybrid"
]


def extract_text_and_links_from_pdf(pdf_bytes: bytes) -> tuple[str, List[str]]:
    """Extract plain text AND embedded PDF hyperlink annotations (URI actions)."""
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(pdf_bytes))
    extracted_pages: List[str] = []
    embedded_uris: List[str] = []

    for page_idx, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            extracted_pages.append(text.strip())

        # Extract embedded hyperlink annotations
        try:
            annots = page.get("/Annots")
            if hasattr(annots, "get_object"):
                annots = annots.get_object()

            if isinstance(annots, list):
                for annot_ref in annots:
                    annot = annot_ref.get_object() if hasattr(annot_ref, "get_object") else annot_ref
                    if not isinstance(annot, dict):
                        continue

                    subtype = str(annot.get("/Subtype", ""))
                    if "/Link" in subtype or subtype == "/Link":
                        action = annot.get("/A")
                        if hasattr(action, "get_object"):
                            action = action.get_object()

                        uri = None
                        if isinstance(action, dict):
                            raw_uri = action.get("/URI")
                            if raw_uri:
                                uri = str(raw_uri).strip()

                        # Fallback: /URI directly on annotation dict
                        if not uri and "/URI" in annot:
                            uri = str(annot.get("/URI")).strip()

                        if uri:
                            cleaned_uri = uri.strip("'\" \t\r\n")
                            if cleaned_uri and cleaned_uri not in embedded_uris:
                                embedded_uris.append(cleaned_uri)
        except Exception as exc:
            logger.debug("Could not parse annotations on page", page=page_idx, error=str(exc))

    full_text = "\n\n".join(extracted_pages)
    full_text = re.sub(r"\r\n", "\n", full_text)
    full_text = re.sub(r"\n{3,}", "\n\n", full_text)
    return full_text.strip(), embedded_uris


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Backward compatible helper extracting text from PDF."""
    text, _ = extract_text_and_links_from_pdf(pdf_bytes)
    return text


def normalize_github_url(raw: Optional[str]) -> Optional[str]:
    """Normalize any GitHub URL, handle, or bare domain string into canonical https://github.com/username.

    Handles:
    - https://github.com/username, http://github.com/username
    - www.github.com/username
    - Bare domains: github.com/username
    - PDF extraction spacing artifacts: github . com / username or github.com / username
    - Misplaced paths: github.com/in/username
    - Shorthand / badges: github: @username, github: username, GitHub | username
    - User site: username.github.io
    - Query parameters / hashes: ?tab=repositories, #readme
    """
    if not raw or not isinstance(raw, str):
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None

    # Strip query parameters and fragment anchors
    cleaned = cleaned.split("?")[0].split("#")[0].strip().rstrip("/")

    # Collapse PDF whitespace artifacts in domain
    cleaned = re.sub(r"github\s*\.\s*com\s*/\s*", "github.com/", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"https?\s*:\s*/\s*/\s*", "https://", cleaned, flags=re.IGNORECASE)

    # 1. username.github.io
    io_match = re.search(r"\b([a-zA-Z0-9_-]+)\.github\.io\b", cleaned, re.IGNORECASE)
    if io_match:
        user = io_match.group(1).strip()
        if user.lower() not in ["www", "api", "pages", "help"]:
            return f"https://github.com/{user}"

    # 2. github: @username or github: username or github | username
    short_match = re.search(r"\bgithub\s*[:|/-]\s*@?([a-zA-Z0-9_-]+)\b", cleaned, re.IGNORECASE)
    if short_match:
        user = short_match.group(1).strip()
        if user.lower() not in ["com", "http", "https", "www", "in"]:
            return f"https://github.com/{user}"

    # 3. Standard github.com/username or github.com/in/username
    match = re.search(r"(?:https?://)?(?:www\.)?github\.com/(?:in/)?([a-zA-Z0-9_-]+)", cleaned, re.IGNORECASE)
    if match:
        user = match.group(1).strip()
        excluded = {
            "features", "explore", "topics", "trending", "pricing", "about", "blog",
            "settings", "enterprise", "login", "signup", "marketplace", "readme",
            "orgs", "organizations", "search", "contact", "security", "pulls",
            "issues", "notifications", "dashboard", "stars", "sponsors"
        }
        if user.lower() not in excluded and len(user) >= 1:
            return f"https://github.com/{user}"

    # 4. Bare handle if labeled e.g. "@johndoe"
    if cleaned.startswith("@") and len(cleaned) > 1:
        user = cleaned[1:].strip()
        if re.match(r"^[a-zA-Z0-9_-]+$", user):
            return f"https://github.com/{user}"

    return None


def normalize_linkedin_url(raw: Optional[str]) -> Optional[str]:
    """Normalize any LinkedIn URL, handle, or bare domain string into canonical https://linkedin.com/in/slug.

    Handles:
    - https://linkedin.com/in/slug, http://linkedin.com/in/slug
    - www.linkedin.com/in/slug
    - Bare domains: linkedin.com/in/slug
    - Country subdomains: in.linkedin.com/in/slug, uk.linkedin.com/in/slug
    - PDF extraction spacing artifacts: linkedin . com / in / slug or linkedin.com / in / slug
    - Shorthand / badges: in/slug, in / slug, linkedin: in/slug, linkedin: slug
    - Query parameters / hashes: ?utm_source=..., ?originalSubdomain=..., ?trk=...
    """
    if not raw or not isinstance(raw, str):
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None

    # Strip query parameters and fragment anchors
    cleaned = cleaned.split("?")[0].split("#")[0].strip().rstrip("/")

    # Collapse PDF whitespace artifacts in domain and path
    cleaned = re.sub(r"linkedin\s*\.\s*com\s*/\s*in\s*/\s*", "linkedin.com/in/", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"linkedin\s*\.\s*com\s*/\s*", "linkedin.com/", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"https?\s*:\s*/\s*/\s*", "https://", cleaned, flags=re.IGNORECASE)

    excluded_slugs = {
        "in", "jobs", "feed", "company", "school", "mynetwork", "messaging",
        "notifications", "learning", "pulse", "posts", "help", "settings", "home"
    }

    # 1. Standard linkedin.com/in/slug or localized like in.linkedin.com/in/slug or pub/slug
    match = re.search(
        r"(?:https?://)?(?:[a-zA-Z0-9-]+\.)?linkedin\.com/(?:in|pub)/([a-zA-Z0-9_/%-]+)",
        cleaned,
        re.IGNORECASE
    )
    if match:
        slug = match.group(1).strip().strip("/")
        if slug.lower() not in excluded_slugs:
            return f"https://linkedin.com/in/{slug}"

    # 2. Shorthand "in/slug" or "in / slug" (frequent badge text on modern resumes)
    in_match = re.search(r"\bin\s*/\s*([a-zA-Z0-9_/%-]+)", cleaned, re.IGNORECASE)
    if in_match:
        slug = in_match.group(1).strip().strip("/")
        if slug.lower() not in excluded_slugs and len(slug) >= 2:
            return f"https://linkedin.com/in/{slug}"

    # 3. Shorthand "linkedin: slug" or "linkedin | slug"
    li_match = re.search(r"\blinkedin\s*[:|/-]\s*@?([a-zA-Z0-9_/%-]+)", cleaned, re.IGNORECASE)
    if li_match:
        slug = li_match.group(1).strip().strip("/")
        slug = re.sub(r"^(?:in/|pub/)", "", slug, flags=re.IGNORECASE)
        if slug.lower() not in excluded_slugs and slug.lower() not in ["com", "http", "https", "www"] and len(slug) >= 2:
            return f"https://linkedin.com/in/{slug}"

    return None


def normalize_portfolio_url(raw: Optional[str]) -> Optional[str]:
    """Normalize personal website or developer portfolio URL."""
    if not raw or not isinstance(raw, str):
        return None
    cleaned = raw.strip().rstrip(".,;)>]")
    if not cleaned:
        return None

    cleaned = cleaned.split("?")[0].split("#")[0].strip()
    if not cleaned.lower().startswith(("http://", "https://")):
        cleaned = f"https://{cleaned}"

    domain_match = re.search(r"^https?://(?:www\.)?([^/:]+)", cleaned, re.IGNORECASE)
    if domain_match:
        domain = domain_match.group(1).lower()
        excluded = [
            "github.com", "linkedin.com", "google.com", "gmail.com", "outlook.com",
            "yahoo.com", "twitter.com", "x.com", "facebook.com", "instagram.com",
            "medium.com", "youtube.com", "wikipedia.org", "w3.org", "adobe.com"
        ]
        if any(exc in domain for exc in excluded):
            return None
        return cleaned
    return None


def extract_social_and_portfolio_links(
    text: str,
    uris: Optional[List[str]] = None,
) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """Industry-standard extraction for GitHub, LinkedIn, and Portfolio links.

    Handles:
    - Embedded PDF hyperlink annotations (/Annots -> /Link -> /URI).
    - Bare URLs without protocols (github.com/..., linkedin.com/in/...).
    - Spacing artifacts introduced by PDF multi-column extraction ('github.com / username').
    - Alternate formatting ('github: username', 'in/username', 'username.github.io').
    - Normalizes outputs to clean canonical forms with query params and tracking tokens stripped.
    """
    candidate_uris = list(uris or [])

    # 1. GitHub Extraction & Normalization
    github_url: Optional[str] = None
    # Check embedded annotations first
    for u in candidate_uris:
        normalized = normalize_github_url(u)
        if normalized:
            github_url = normalized
            break

    # If not found in annotations, search text
    if not github_url:
        gh_patterns = [
            # Standard URL or bare domain with possible whitespace
            r"(?:https?://)?(?:www\.)?github\s*\.\s*com\s*/\s*(?:in/)?([a-zA-Z0-9_-]+)(?:/?)(?:[\s,\.;\)]|$)",
            # github: @username or github: username or github | username
            r"\bgithub\s*[:|/-]\s*@?([a-zA-Z0-9_-]+)\b",
            # username.github.io
            r"\b([a-zA-Z0-9_-]+)\.github\.io\b",
        ]
        for p in gh_patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                matched_str = m.group(0).strip()
                normalized = normalize_github_url(matched_str)
                if normalized:
                    github_url = normalized
                    break

    # 2. LinkedIn Extraction & Normalization
    linkedin_url: Optional[str] = None
    # Check embedded annotations first
    for u in candidate_uris:
        normalized = normalize_linkedin_url(u)
        if normalized:
            linkedin_url = normalized
            break

    # If not found in annotations, search text
    if not linkedin_url:
        li_patterns = [
            # Standard URL or bare domain with possible whitespace
            r"(?:https?://)?(?:[a-zA-Z0-9-]+\.)?linkedin\s*\.\s*com\s*/\s*in\s*/\s*([a-zA-Z0-9_/%-]+)(?:/?)(?:[\s,\.;\)]|$)",
            # in/username shorthand (badge text)
            r"\bin\s*/\s*([a-zA-Z0-9_/%-]+)(?:/?)(?:[\s,\.;\)]|$)",
            # linkedin: username or linkedin | username
            r"\blinkedin\s*[:|/-]\s*@?([a-zA-Z0-9_/%-]+)",
        ]
        for p in li_patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                matched_str = m.group(0).strip()
                normalized = normalize_linkedin_url(matched_str)
                if normalized:
                    linkedin_url = normalized
                    break

    # 3. Portfolio & Personal Website Extraction
    portfolio_url: Optional[str] = None
    # Check embedded annotations for personal websites
    for u in candidate_uris:
        normalized = normalize_portfolio_url(u)
        if normalized:
            portfolio_url = normalized
            break

    # Check text patterns if not found in annotations
    if not portfolio_url:
        pf_patterns = [
            r"\b(?:portfolio|website|web)\s*[:|-]\s*(https?://[^\s,]+)",
            r"\b(?:portfolio|website|web)\s*[:|-]\s*([a-zA-Z0-9_-]+\.[a-zA-Z]{2,}(?:/[^\s,]*)?)",
            r"https?://([a-zA-Z0-9_-]+\.(?:dev|me|io|in|tech|app|site|page))(?:/[^\s,]*)?",
            r"\b([a-zA-Z0-9_-]+\.(?:dev|me|tech|io))\b",
            r"https?://([a-zA-Z0-9_-]+\.(?:vercel\.app|netlify\.app))(?:/[^\s,]*)?",
            r"\b([a-zA-Z0-9_-]+\.(?:vercel\.app|netlify\.app))\b",
        ]
        for p in pf_patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                raw_val = m.group(1).strip()
                normalized = normalize_portfolio_url(raw_val)
                if normalized:
                    portfolio_url = normalized
                    break

    return github_url, linkedin_url, portfolio_url


def deterministic_resume_extraction(text: str, uris: Optional[List[str]] = None) -> Dict[str, Any]:
    """Extract candidate entities using deterministic regex and taxonomy matching."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    # 1. Candidate Full Name
    candidate_name = ""
    for line in lines[:5]:
        clean_line = re.sub(r"^(resume|curriculum vitae|cv|page \d+)\b", "", line, flags=re.IGNORECASE).strip()
        if not clean_line or "@" in clean_line or "http" in clean_line or "github" in clean_line or "linkedin" in clean_line:
            continue
        words = clean_line.split()
        if 2 <= len(words) <= 4 and all(re.match(r"^[A-Z][a-zA-Z.'-]*$", w) for w in words):
            candidate_name = clean_line
            break

    if not candidate_name and lines:
        first_line = lines[0]
        if len(first_line.split()) <= 4 and not any(c in first_line for c in ["@", "http", "/", "\\", ":"]):
            candidate_name = first_line

    # 2. Extract Social & Portfolio Links (using robust multi-pattern & annotation resolver)
    github_url, linkedin_url, portfolio_url = extract_social_and_portfolio_links(text, uris)

    # 3. Skills Extraction
    found_skills: List[str] = []
    text_lower = text.lower()
    for skill in TECH_SKILLS_TAXONOMY:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text_lower):
            found_skills.append(skill)

    found_skills = list(dict.fromkeys(found_skills))

    # 4. Target Roles Inference
    target_roles: List[str] = []
    for role, keywords in ROLE_KEYWORDS.items():
        score = sum(1 for kw in keywords if re.search(r"\b" + re.escape(kw) + r"\b", text_lower))
        if score >= 1:
            target_roles.append(role)

    if not target_roles:
        target_roles = ["AI Engineer", "Backend Engineer", "Software Engineer"]
    else:
        target_roles = target_roles[:4]
        # Prioritize and cap to top 4
        target_roles = target_roles[:4]

    # 5. Preferred Locations
    found_locations: List[str] = []
    for loc in LOCATION_KEYWORDS:
        if re.search(r"\b" + re.escape(loc.lower()) + r"\b", text_lower):
            canonical = "Bengaluru" if loc == "Bangalore" else ("Gurgaon" if loc == "Gurugram" else loc)
            if canonical not in found_locations:
                found_locations.append(canonical)

    if not found_locations:
        found_locations = ["Bengaluru", "Hyderabad", "Pune", "Remote"]
    elif "Remote" not in found_locations:
        found_locations.append("Remote")

    # 6. Headline synthesis
    headline = ""
    # Try finding an explicit headline near the top
    for line in lines[1:6]:
        if any(role_token in line.lower() for role_token in ["engineer", "developer", "architect", "scientist"]):
            if len(line) < 80:
                headline = line
                break

    if not headline:
        # Synthesize from top target role and top skills
        primary_role = target_roles[0] if target_roles else "Software Engineer"
        top_skills = [s for s in found_skills if s in ["Python", "FastAPI", "PyTorch", "LangChain", "TypeScript", "Next.js"]][:3]
        if top_skills:
            headline = f"{primary_role} | {', '.join(top_skills)}"
        else:
            headline = f"{primary_role}"

    return {
        "full_name": candidate_name or "Candidate",
        "headline": headline,
        "target_roles": target_roles,
        "preferred_locations": found_locations,
        "skills": found_skills,
        "github_url": github_url,
        "linkedin_url": linkedin_url,
        "portfolio_url": portfolio_url,
        "resume_text": text,
        "extraction_mode": "deterministic",
    }


async def parse_resume_content(
    text: str,
    uris: Optional[List[str]] = None,
    prefer_llm: bool = True,
) -> Dict[str, Any]:
    """Parse resume text into structured candidate profile data with LLM fallback."""
    if not text or not text.strip():
        return {
            "full_name": "",
            "headline": "",
            "target_roles": [],
            "preferred_locations": [],
            "skills": [],
            "github_url": None,
            "linkedin_url": None,
            "portfolio_url": None,
            "resume_text": "",
            "extraction_mode": "empty",
        }

    # Deterministic baseline is always computed with embedded URIs and robust regex
    baseline = deterministic_resume_extraction(text, uris)

    if not prefer_llm:
        return baseline

    # If Gemini API key is configured, attempt enhanced semantic parsing
    try:
        from app.config.settings import settings
        import httpx
        from app.ai.base import clean_and_parse_json

        if settings.gemini_api_key and settings.gemini_api_key.strip():
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"
            params = {"key": settings.gemini_api_key}
            prompt = (
                "You are an expert technical recruiter and resume parser.\n"
                "Analyze the candidate's resume text below and extract structured JSON with exactly these keys:\n"
                "- full_name: string (Candidate's actual full name)\n"
                "- headline: string (Professional headline, e.g. 'Senior AI & Backend Software Engineer')\n"
                "- target_roles: list of strings (3 to 5 relevant technical roles they qualify for)\n"
                "- preferred_locations: list of strings (Preferred cities or 'Remote')\n"
                "- skills: list of strings (Normalized list of engineering technologies, languages, tools, frameworks)\n"
                "- github_url: string or null\n"
                "- linkedin_url: string or null\n"
                "- portfolio_url: string or null\n\n"
                "Return ONLY valid JSON with no markdown formatting.\n\n"
                f"Resume Text:\n{text[:4000]}"
            )
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json", "temperature": 0.1},
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, params=params, json=payload)
                if resp.status_code == 200:
                    raw_data = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = clean_and_parse_json(raw_data)
                    llm_gh = normalize_github_url(parsed.get("github_url"))
                    llm_li = normalize_linkedin_url(parsed.get("linkedin_url"))
                    llm_pf = normalize_portfolio_url(parsed.get("portfolio_url"))

                    return {
                        "full_name": parsed.get("full_name") or baseline["full_name"],
                        "headline": parsed.get("headline") or baseline["headline"],
                        "target_roles": parsed.get("target_roles") or baseline["target_roles"],
                        "preferred_locations": parsed.get("preferred_locations") or baseline["preferred_locations"],
                        "skills": parsed.get("skills") or baseline["skills"],
                        "github_url": llm_gh or baseline["github_url"],
                        "linkedin_url": llm_li or baseline["linkedin_url"],
                        "portfolio_url": llm_pf or baseline["portfolio_url"],
                        "resume_text": text,
                        "extraction_mode": "llm (gemini)",
                    }
    except Exception as exc:
        logger.warning("LLM resume extraction failed; using deterministic extraction", error=str(exc))

    return baseline

