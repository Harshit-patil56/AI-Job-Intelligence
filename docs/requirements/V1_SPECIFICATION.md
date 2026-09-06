# V1 Specification: AI Job Intelligence

> **Document Type:** Authoritative Specification & Index  
> **Status:** Approved Baseline  
> **Version:** 1.0  
> **Phase:** Phase 0 (Planning & Business Rules)

---

## 1. Executive Summary & Purpose
**AI Job Intelligence** is a production-oriented, personal portfolio project designed to bring order, verification, and precision to job discovery. Modern job searches suffer from fragmented boards, rampant duplicates, unverified/ghost postings, and coarse filters.

This document serves as the high-level authoritative specification and architectural index for Version 1 (V1). It unifies core business rules, operational constraints, data schemas, and pipeline stages.

---

## 2. Core Design Principle: Maximum Recall
The guiding philosophy across all processing stages is **optimizing for maximum recall**:

> **"A potentially relevant job must NOT be silently discarded because some information is missing or ambiguous."**

In traditional scraping or filtering tools, records with missing salary, incomplete experience tags, or unclassified companies are abruptly dropped. In **AI Job Intelligence**:
- Incomplete or ambiguous data transitions to a **`REVIEW`** or **`KEEP`** status rather than automatic rejection.
- High-recall intake ensures opportunities are captured first, while rigorous audit trails preserve visibility into why jobs are retained, flagged, or rejected.

---

## 3. Pipeline Philosophy & Stages
The system processes data linearly through nine conceptual stages. AI/LLM components are strictly quarantined to late-stage enrichment and semantic tasks. Deterministic rules govern all early steps.

```text
[1. COLLECT] 
     │
[2. RAW DATA] ────── (Immutable raw preservation)
     │
[3. NORMALIZE] ──── (Canonical field standardisation)
     │
[4. DEDUPLICATE] ── (Multi-source evidence linking)
     │
[5. BASIC VERIFICATION] ─ (Multi-dimensional validity & confidence)
     │
[6. HARD FILTERS] ─ (Deterministic role, experience, location, freshness, salary)
     │
[7. AI ENRICHMENT] ─ (Deferred: semantic tag extraction, deep summarisation)
     │
[8. PRIORITY/RANKING] ─ (Priority tiers: P1, P2, P3)
     │
[9. CENTRAL FEED] ── (Curated presentation & human review)
```

### Stage Directives
1. **Deterministic Precedence:** AI must not be responsible for initial collection or deterministic filtering when rule engines can solve the problem deterministically.
2. **Raw Data Preservation:** Raw responses from every source must be stored immutably to allow reprocessing without re-scraping.
3. **Auditability First:** Every stage transition must leave a machine-readable audit trail.

---

## 4. Career Direction & Role Alignment
The project is tailored toward a specific career focus:
- **Primary Direction:** AI Engineer / Generative AI Engineer / Agentic AI Engineer.
- **Supporting Route:** Backend Engineering (specifically Python/API-centric) and Core Software Engineering roles that act as viable accelerators toward AI engineering.

Detailed role tiers, priority definitions, and hard exclusions are specified in [`JOB_FILTERS_V1.md`](../../rules/JOB_FILTERS_V1.md).

---

## 5. System Statuses & Separation of Concerns
To prevent conflating lifecycle progress with candidate preference, status is divided into two distinct dimensions:

### 5.1 Lifecycle & Eligibility Status (`eligibility_status`)
| Status | Conceptual Meaning |
| :--- | :--- |
| `NEW` | Collected and ingested, pending normalization and verification. |
| `ELIGIBLE` | Passed all deterministic verification and hard filter checks. |
| `REVIEW` | Requires human or secondary evaluation due to ambiguity (e.g., missing salary, borderline experience). |
| `REJECTED` | Definitively excluded based on deterministic criteria (e.g., senior title, excluded stack, outside location). |
| `DUPLICATE` | Identified as a duplicate of an existing canonical job and merged into its source references. |
| `EXPIRED` | Verified as no longer active, closed, or older than active freshness thresholds. |
| `VERIFICATION_FAILED` | Failed authenticity or reachability verification (e.g., 404 JD link, invalid source). |

### 5.2 Role Priority (`role_priority`)
Role priority is evaluated orthogonally to eligibility:
- **`P1`**: Highest priority target roles (Direct AI, GenAI, Agentic AI, LLM, RAG).
- **`P2`**: Strong target roles (AI Backend, Applied ML, Python Backend).
- **`P3`**: Good backup roles (Software Engineer, Backend, Python Developer, ML Engineer).
- **`NOT_RELEVANT`**: Non-matching or excluded technical disciplines.

*Ranking and feed sorting operate on role priority, freshness, and compensation without altering the underlying eligibility lifecycle.*

---

## 6. Auditability & Machine-Readable Reasons
False negatives must be completely measurable and debuggable. Every transition to `REJECTED` or `REVIEW` requires an explicit, machine-readable reason code:

### Standard Rejection Reasons (`rejection_reason`)
- `LOCATION_NOT_ALLOWED`: Location is confirmed on-site/hybrid outside P1/P2 regions and not remote.
- `EXPERIENCE_TOO_HIGH`: Stated experience requirement has minimum $\ge 2$ years (e.g., 2–3, 2–4, 2–5, 3+ years) or is Senior/Lead/Architect.
- `EXCLUDED_ROLE`: Role explicitly belongs to excluded domains (e.g., Salesforce, generic frontend-only, QA, IT support).
- `JOB_TOO_OLD`: Posting date exceeds active feed threshold (> 5 days).
- `SALARY_BELOW_MINIMUM`: Explicitly stated compensation falls below regional minimum threshold.

### Standard Review Reasons (`review_reason`)
- `EXPERIENCE_AMBIGUOUS`: Stated experience is in the 1–3 years band, or minimum experience cannot be reliably determined.
- `LOCATION_REMOTE_REVIEW`: Remote job with company/head office outside P1/P2 hubs pending finalized remote policy.
- `SOURCE_CONFLICT_REVIEW`: Disagreement between sources on material attributes (experience, salary, location, date) affecting eligibility.
- `SALARY_UNKNOWN`: Compensation details are missing from posting (triggering `salary_verified = false`).
- `LOCATION_AMBIGUOUS`: Location string cannot be deterministically resolved to allowed regions.
- `COMPANY_UNVERIFIED`: Employer identity or classification is unresolved or pending confidence review.

---

## 7. V1 Product Boundaries & Human Oversight
The boundaries for Version 1 are explicitly constrained:

### What V1 Includes
- Ingesting job postings from multiple sources.
- Preserving raw source payloads.
- Data normalization into a canonical schema.
- High-confidence deduplication with multi-source linking.
- Multi-dimensional, auditable verification.
- Deterministic filtering across role, experience, location, freshness, and salary.
- Curated central feed presentation.

### What V1 Strictly Prohibits
- **No Automated Applications:** The system will **not** automatically apply to jobs.
- **Mandatory Human Review:** Any future application functionality must mandate explicit human review, manual confirmation, and user sign-off prior to submission.
- **No Premature AI Agents / Scrapers:** Phase 0 strictly defines contracts and rules prior to choosing scraping tools, databases, or runtime frameworks.

---

## 8. Document Index & Cross-References
The detailed specifications are modularized across the following documents:

- **Data Contracts:** [`JOB_DATA_CONTRACT.md`](./JOB_DATA_CONTRACT.md)  
  *Defines the conceptual Job, Company, and Source Reference schemas, fields, types, and raw-data preservation guarantees.*
- **Deterministic Filtering Rules:** [`JOB_FILTERS_V1.md`](../../rules/JOB_FILTERS_V1.md)  
  *Specifies target role priorities (P1/P2/P3), experience logic, location tiers, regional salary thresholds, freshness cutoffs, and exclusion logic.*
- **Deduplication Specification:** [`DEDUPLICATION_V1.md`](../../rules/DEDUPLICATION_V1.md)  
  *Details multi-source evidence hierarchy, canonical representation, source-linking rules, and ambiguous-duplicate handling.*
- **Verification Specification:** [`VERIFICATION_V1.md`](../../rules/VERIFICATION_V1.md)  
  *Defines multi-dimensional verification dimensions, confidence scoring principles, and unknown-data retention rules.*
- **Project Scope Baseline:** [`PROJECT_SCOPE.md`](./PROJECT_SCOPE.md)  
  *High-level discovery scope and boundary agreements.*

---

## 9. Deferred Capabilities (Explicitly Tagged for Future Phases)
The following capabilities are formally deferred beyond Phase 0:
- **Semantic Title Equivalence:** AI-driven semantic mapping (e.g., mapping "Generative AI Application Developer" to P1) is deferred until after exact/normalized string matching is tested.
- **Semantic Deduplication:** Embedding-based or LLM-based JD similarity deduplication is deferred; V1 relies on staged deterministic evidence.
- **AI / LLM Enrichment:** Automated extraction of tech stacks, JD summarization, and candidate fit scoring are deferred to Phase 6.
- **Automated Ingestion / Scraper Implementation:** Web scrapers, scrapers architecture, and scheduling systems will be addressed in Phase 2.

---

## 10. Authoritative Policy on Boundary Decisions
1. **Remote Jobs:** Remote openings are **not** rejected simply because the company or corporate headquarters is outside P1/P2 metropolitan areas. Remote opportunities are categorized under **`REVIEW`** (`review_reason = LOCATION_REMOTE_REVIEW`) until the explicit remote policy is finalized.
2. **Cross-Source Discrepancies:** The system does **not** assume a "more permissive" value when sources disagree. When disparate sources report conflicting material attributes (experience, salary, location, publication date), all values are preserved, the canonical attribute is flagged as conflicting/uncertain, and the job transitions to **`REVIEW`** (`review_reason = SOURCE_CONFLICT_REVIEW`) if eligibility is impacted. Direct ATS data serves as stronger evidence but never silently purges conflicting source data.
3. **Posting Date & Historical Storage:** Freshness cutoffs are strictly enforced against original publication dates: >5 days is marked `JOB_TOO_OLD` and excluded from the active feed. All discovered records remain permanently stored historically for market tracking, deduplication, and analytics. No discovery grace period is applied.
