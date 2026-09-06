# Job Filters & Business Rules (V1)

> **Document Type:** Deterministic Business Rules  
> **Status:** Approved Baseline  
> **Version:** 1.0  
> **Reference Specification:** [`V1_SPECIFICATION.md`](../docs/requirements/V1_SPECIFICATION.md)

---

## 1. Guiding Principle: Maximum Recall
All filtering logic strictly enforces the core design philosophy:
> **"A potentially relevant job should NOT be silently discarded because some information is missing or ambiguous."**

Filters are structured deterministically. Where certainty cannot be established, records transition to **`REVIEW`** or **`KEEP`** rather than automatic rejection.

---

## 2. Target Roles & Priority Classification

Role evaluation assigns a **`role_priority`** to incoming postings. Role priority is distinct from operational eligibility.

### 2.1 P1 — Highest Priority (Core Target Roles)
Direct alignment with AI, GenAI, and Agentic Engineering:
- `AI Engineer`
- `GenAI Engineer`
- `Applied AI Engineer`
- `AI Software Engineer`
- `AI Developer`
- `GenAI Developer`
- `Agentic AI Engineer`
- `Agentic AI Developer`
- `LLM Engineer`
- `LLM Application Developer`
- `AI Application Engineer`
- `AI Application Developer`
- `RAG Engineer`
- `AI Agent Engineer`

### 2.2 P2 — Strong Targets (Accelerators & AI-Adjacent)
High-value technical foundations leading into generative AI systems:
- `Forward Deployed Engineer (AI/FDE)`
- `AI Backend Engineer`
- `AI/ML Software Engineer`
- `Python Backend Engineer`
- `Python Backend Developer`
- `Backend Engineer`
- `Applied Machine Learning Engineer`

### 2.3 P3 — Good Backup (Foundational Technical Roles)
Broad software and backend foundations:
- `ML Engineer`
- `Machine Learning Engineer`
- `Python Developer`
- `Software Engineer`
- `Software Developer`
- `SDE`
- `Junior Software Engineer`
- `AI Automation Engineer`
- `AI Automation Developer`

### 2.4 Title Normalization & Equivalence (Deferred)
- Role matching in V1 uses deterministic keyword and normalized string matching.
- Future phases will incorporate title normalization and semantic equivalence (e.g., automatically mapping *"Generative AI Application Developer"* to P1).
- **Status:** Semantic matching is explicitly deferred.

---

## 3. Hard Exclusions

Postings matching these criteria are assigned `role_priority = NOT_RELEVANT` and `eligibility_status = REJECTED` with `rejection_reason = EXCLUDED_ROLE`.

### 3.1 Excluded Titles & Disciplines
- `Salesforce Developer`
- Generic frontend-only roles (e.g., `Frontend Developer`, `React Developer`, `CSS Specialist`)
- `IT Support` / `Desktop Support`
- `QA / Testing` / `SDET` / `Manual Tester`
- Non-technical roles (e.g., Sales, HR, Marketing, Operations)
- Senior management/architecture roles:
  - `AI Architect`
  - `GenAI Architect`
  - `AI Product Manager`
  - `AI Business Analyst`

### 3.2 Nuanced Tech-Stack Exclusions: Java-Only & .NET-Only
- **Rule:** Exclude roles that are fundamentally centered on Java or .NET enterprise development (e.g., `Java Developer`, `Core Java Engineer`, `.NET Developer`, `C# Backend Developer`).
- **Critical Exception:** A job targeting AI Engineering or Modern Backend Engineering that mentions Java or .NET as part of a broader technology stack or legacy integration **must NOT** be automatically rejected.
- **Resolution:** If the title or core description is ambiguous, preserve as `REVIEW` with `review_reason = EXCLUSION_AMBIGUOUS` pending JD inspection.

---

## 4. Experience Rules

Experience requirements are evaluated against job-target eligibility rules:

| Stated Experience Band | Action / Status | Assigned Review / Rejection Reason |
| :--- | :--- | :--- |
| `Fresher` | **KEEP** (`ELIGIBLE`) | *None* |
| `Entry-level` | **KEEP** (`ELIGIBLE`) | *None* |
| `0–1 years` | **KEEP** (`ELIGIBLE`) | *None* |
| `0–2 years` | **KEEP** (`ELIGIBLE`) | *None* |
| `1–2 years` | **KEEP** (`ELIGIBLE`) | *None* |
| `1–3 years` | **REVIEW** | `EXPERIENCE_AMBIGUOUS` |
| `2–3 years` | **EXCLUDE** (`REJECTED`) | `EXPERIENCE_TOO_HIGH` |
| `2–4 years` | **EXCLUDE** (`REJECTED`) | `EXPERIENCE_TOO_HIGH` |
| `2–5 years` | **EXCLUDE** (`REJECTED`) | `EXPERIENCE_TOO_HIGH` |
| Minimum experience $\ge$ 2 years | **EXCLUDE** (`REJECTED`) | `EXPERIENCE_TOO_HIGH` |
| `3+ years` | **EXCLUDE** (`REJECTED`) | `EXPERIENCE_TOO_HIGH` |
| Clearly `Senior` / `Lead` / `Architect` | **EXCLUDE** (`REJECTED`) | `EXPERIENCE_TOO_HIGH` |
| Ambiguous or Unspecified Experience | **REVIEW** | `EXPERIENCE_AMBIGUOUS` |

### 4.1 Minimum Experience Threshold Rule
> [!IMPORTANT]
> **If the stated experience range starts at 2 years or more (minimum $\ge$ 2 years), the job must be EXCLUDED (`REJECTED`).**
> 
> **Examples:**
> - `"0–2 years"` $\rightarrow$ **KEEP** (`ELIGIBLE`)
> - `"1–2 years"` $\rightarrow$ **KEEP** (`ELIGIBLE`)
> - `"1–3 years"` $\rightarrow$ **REVIEW** (`review_reason = EXPERIENCE_AMBIGUOUS`)
> - `"2–3 years"` $\rightarrow$ **EXCLUDE** (`rejection_reason = EXPERIENCE_TOO_HIGH`)
> - `"2–4 years"` $\rightarrow$ **EXCLUDE** (`rejection_reason = EXPERIENCE_TOO_HIGH`)
> - `"2–5 years"` $\rightarrow$ **EXCLUDE** (`rejection_reason = EXPERIENCE_TOO_HIGH`)
> - `"3–5 years"` $\rightarrow$ **EXCLUDE** (`rejection_reason = EXPERIENCE_TOO_HIGH`)

### 4.2 Ambiguous & Unstated Experience Policy
- For ambiguous or missing experience where the minimum cannot be reliably determined, route to **`REVIEW`** (`review_reason = EXPERIENCE_AMBIGUOUS`, `experience_verified = false`) rather than silently rejecting.
- Personal experience duration is **never** hard-coded into eligibility rules; these are purely objective job-target rules.

---

## 5. Location Rules

Geographic filters prioritize metropolitan tech hubs in Western and Southern India:

### 5.1 Location Tiers
- **P1 Locations (Primary Priority):**
  - `Mumbai, Maharashtra`
  - `Navi Mumbai, Maharashtra`
  - `Thane, Maharashtra`
  - `Pune, Maharashtra`
- **P2 Locations (Secondary Priority):**
  - `Bengaluru, Karnataka`
  - `Hyderabad, Telangana`

### 5.2 Handling of Remote Roles & Unlisted Locations
- **Remote Jobs (REVIEW):**
  - Do **NOT** automatically reject remote jobs merely because the hiring company or head office is situated outside P1/P2 locations.
  - Remote jobs are retained as a dedicated **`REVIEW`** category (`review_reason = LOCATION_REMOTE_REVIEW`) until remote eligibility policies are explicitly finalized.
- **Unlisted On-Site / Hybrid Locations (REJECTED):**
  - Roles explicitly situated on-site or hybrid outside P1 and P2 regions (and without remote eligibility) are marked `REJECTED` with `rejection_reason = LOCATION_NOT_ALLOWED`.
- **Ambiguous Locations (REVIEW):**
  - Roles with unresolvable location strings or multi-city listings without clear P1/P2 or remote classification are marked `REVIEW` with `review_reason = LOCATION_AMBIGUOUS`.
- **Location Normalization:**
  - Location alias standardization (e.g., mapping "Bangalore" -> "Bengaluru", "Bombay" -> "Mumbai") is performed during the normalization stage.

---

## 6. Compensation (Salary) Rules

Compensation thresholds are region-aware and safeguard against substandard offers while accommodating regional realities.

### 6.1 Regional Salary Thresholds
- **Mumbai / Navi Mumbai / Thane:**
  - No strict minimum threshold required.
- **Pune:**
  - Minimum **₹30,000 / month** (or equivalent **₹3.6 LPA**).
  - Stated compensation below this threshold: `REJECTED` with `rejection_reason = SALARY_BELOW_MINIMUM`.
- **Bengaluru:**
  - Minimum **₹5.0 LPA**.
  - Stated compensation below this threshold: `REJECTED` with `rejection_reason = SALARY_BELOW_MINIMUM`.
- **Hyderabad:**
  - Minimum **₹5.0 LPA**.
  - Stated compensation below this threshold: `REJECTED` with `rejection_reason = SALARY_BELOW_MINIMUM`.

### 6.2 Unknown Salary Protocol
- **Strict Rule:** If salary is not disclosed or cannot be extracted, **DO NOT automatically reject the job.**
- **Action:** Retain the job in `KEEP` / `REVIEW` status, set `salary_verified = false`, and attach `review_reason = SALARY_UNKNOWN`.

---

## 7. Freshness Rules

Job freshness governs visibility within the active discovery feed:

| Age / Recency | Feed Priority | Action |
| :--- | :--- | :--- |
| **0–24 hours** | **Highest Priority** | Immediate top-of-feed display |
| **1–3 days** | **High Priority** | Active feed priority |
| **3–5 days** | **Normal Priority** | Standard active feed display |
| **> 5 days** | **Excluded from Active Feed** | Marked `EXPIRED` / Archived (`rejection_reason = JOB_TOO_OLD`) |

### Historical Preservation Guarantee
- Postings older than 5 days are excluded from the *active* feed, but their collected raw records, normalization details, and metadata are **permanently preserved** in the database for analytics, market tracking, and deduplication reference.

---

## 8. Skills Handling: Enrichment, Not Elimination

Skills are an **advisory and ranking dimension**, NOT a hard eligibility gate.

### 8.1 Preferred Skill Direction
- `Python`
- `Backend Architecture & Systems`
- `REST / GraphQL / gRPC APIs`
- `LLMs & Prompt Engineering`
- `RAG (Retrieval-Augmented Generation)`
- `AI Agents & Frameworks`
- `Machine Learning Foundations`

### 8.2 Non-Rejection Policy
- **Absence of specific preferred skills must NEVER cause automatic rejection** if the job title, experience level, and location satisfy the criteria.
- Skill presence will be utilized in later phases (Phase 6) to rank and calculate candidate alignment scores.

---

## 9. Machine-Readable Reason Taxonomy

### Rejection Reason Codes (`rejection_reason`)
- `LOCATION_NOT_ALLOWED`: Location is confirmed on-site/hybrid outside P1/P2 hubs and not remote.
- `EXPERIENCE_TOO_HIGH`: Required experience has minimum $\ge 2$ years (e.g., 2–3, 2–4, 2–5, 3+ years) or title is Senior/Lead/Architect.
- `EXCLUDED_ROLE`: Matches prohibited domains or architect/management classifications.
- `JOB_TOO_OLD`: Publication date exceeds the 5-day active feed threshold.
- `SALARY_BELOW_MINIMUM`: Disclosed compensation is below the regional minimum.

### Review Reason Codes (`review_reason`)
- `EXPERIENCE_AMBIGUOUS`: 1–3 years band, or unstated/unparseable minimum experience.
- `LOCATION_REMOTE_REVIEW`: Remote job with company/head office outside P1/P2 hubs pending finalized remote policy.
- `SOURCE_CONFLICT_REVIEW`: Conflicting attributes across multiple sources affecting eligibility.
- `SALARY_UNKNOWN`: No salary reported; requires manual discretion.
- `LOCATION_AMBIGUOUS`: Unresolved location string or mixed-location posting.
- `COMPANY_UNVERIFIED`: Company legitimacy or sector classification unverified.
- `EXCLUSION_AMBIGUOUS`: Ambiguous mention of excluded tech stacks (e.g., Java/.NET alongside modern stacks).
