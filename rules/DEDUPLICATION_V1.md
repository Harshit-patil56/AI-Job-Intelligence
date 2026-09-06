# Deduplication Rules & Evidence Hierarchy (V1)

> **Document Type:** Data Processing & Deduplication Specification  
> **Status:** Approved Baseline  
> **Version:** 1.0  
> **Reference Specification:** [`V1_SPECIFICATION.md`](../docs/requirements/V1_SPECIFICATION.md)  
> **Data Contract:** [`JOB_DATA_CONTRACT.md`](../docs/requirements/JOB_DATA_CONTRACT.md)

---

## 1. Philosophy & Objective
Modern employers cross-post identical openings across multiple job boards, staffing platforms, and direct corporate career portals (e.g., LinkedIn, Naukri, Indeed, and direct ATS systems like Greenhouse, Lever, or Workday).

### Core Goals
1. **Single Canonical Representation:** Identify cross-source duplicates and merge them into **one canonical `Job` entity**.
2. **Zero Loss of Provenance:** **Never permanently discard duplicate source information.** Every discovery of an opening is preserved as a linked [`JobSourceReference`](../docs/requirements/JOB_DATA_CONTRACT.md#4-supporting-entity-jobsourcereference).
3. **Deterministic First:** Prioritize clear, deterministic evidence before resorting to probabilistic or semantic comparisons.

---

## 2. Deduplication Evidence Hierarchy

Deduplication operates through a tiered, staged evaluation pipeline. A match at an earlier stage creates an immediate merge event, preventing unnecessary downstream computation.

```text
Incoming Ingested Record
         │
         ▼
[Stage 1: Exact External Identity Match] ─── (Matches existing source_job_id on same platform)
         │ No
         ▼
[Stage 2: Exact Application/ATS Endpoint Match] ─── (Direct match on canonical ATS URL)
         │ No
         ▼
[Stage 3: Composite Deterministic Match] ─── (Normalized Company + Title + Location + Close Date)
         │ No
         ▼
[Stage 4: Ambiguous / Text Overlap Match] ─── (Partial title/location match + high JD signature overlap)
         │ No
         ▼
[Stage 5: New Canonical Job] ───────────── (Record is created as a new canonical Job)
```

---

## 3. Staged Evidence Definitions

### Stage 1: Exact Source Identity Match (Confidence: 1.0)
- **Condition:** An incoming record shares both `source` (e.g., `LINKEDIN`) and `source_job_id` with an existing record.
- **Action:** Update the existing record's `updated_at` or `collected_at` timestamps and record a duplicate/refresh event. Do not create a second job.

### Stage 2: Canonical Application / ATS URL Match (Confidence: 0.98)
- **Condition:** Different sources point to an identical direct applicant tracking URL (e.g., `https://boards.greenhouse.io/company/jobs/12345` or `https://jobs.lever.co/company/abcde`).
- **Action:** Merge into the existing canonical job as a new `JobSourceReference`.

### Stage 3: Composite Deterministic Match (Confidence: 0.90)
- **Condition:** A strict conjunction of four normalized attributes:
  1. `normalized_company_name` (exact match)
  2. `normalized_title` (exact match across standardized title strings)
  3. `normalized_location` (identical primary city/region)
  4. Posting date proximity (difference between `posted_at` dates is $\le 14$ days)
- **Action:** Merge into the canonical job as a new `JobSourceReference`.

### Stage 4: Ambiguous Case & Fuzzy Overlap Handling (Confidence: 0.70 – 0.85)
- **Condition:** Normalized company matches, but title or location differs slightly (e.g., *"Python Backend Engineer"* vs. *"Software Engineer - Python Backend"*, or *"Mumbai"* vs. *"Navi Mumbai"*), accompanied by high text similarity in core JD requirements.
- **Action:**
  - Do **NOT** automatically merge without verification.
  - Do **NOT** silently discard.
  - Create a merge candidate record and flag with `review_reason = DUPLICATE_AMBIGUOUS` for review.

---

## 5. Canonical Entity Merge Rules & Cross-Source Conflict Handling

When multiple source records are linked into a single canonical `Job`, canonical fields are resolved according to explicit precedence rules:

| Field | Canonical Resolution Precedence | Rationale |
| :--- | :--- | :--- |
| `title` | Most descriptive title from direct career page > LinkedIn > Naukri > aggregators. | Direct sources usually reflect official internal titles. |
| `description` | Highest byte count / most completely formatted JD. | Prevents truncated aggregator previews from overwriting complete JDs. |
| `posted_at` | Earliest verified `posted_at` timestamp across linked sources. | Accurately reflects true age and freshness of the opening. |
| `application_url` | Direct ATS / official career page URL takes strict priority over aggregator redirect URLs. | Provides the cleanest candidate experience. |
| `salary` | Disclosed salary from a verified source populates an unstated salary. If sources conflict, mark attribute uncertain. | Preserves stated data while tracking discrepancies. |
| `experience_requirement` | If sources conflict on stated experience, preserve both and mark attribute uncertain. | Prevents masking higher seniority requirements. |

### 5.1 Cross-Source Material Conflict Policy
> [!IMPORTANT]
> **Do NOT automatically choose the "more permissive" value when sources disagree.**
> 
> If sources disagree on material attributes:
> - **Experience Requirements** (e.g., Source A reports "0–2 years" while Source B reports "2–4 years")
> - **Compensation** (e.g., conflicting salary ranges across platforms)
> - **Location** (e.g., conflicting city listings)
> - **Posting Date** (e.g., contradictory publication timestamps)
> 
> The system must:
> 1. Preserve the exact values from each source within its linked [`JobSourceReference`](../docs/requirements/JOB_DATA_CONTRACT.md#4-supporting-entity-jobsourcereference).
> 2. Mark the canonical attribute as **conflicting / uncertain**.
> 3. Route the job to **`REVIEW`** (`review_reason = SOURCE_CONFLICT_REVIEW`) whenever the conflict affects eligibility.
> 4. While direct ATS or company portal information is treated as stronger evidence, it must **never** silently erase conflicting evidence from other sources.

---

## 6. Preserving Raw Source Information
When a record is classified as a duplicate:
1. The new payload is wrapped in a [`JobSourceReference`](../docs/requirements/JOB_DATA_CONTRACT.md#4-supporting-entity-jobsourcereference) containing the un-mutated `raw_payload`.
2. The reference is appended to the canonical job's references collection.
3. If the duplicate reveals previously unstated information (e.g., an unstated salary was disclosed on Naukri while omitted on LinkedIn), the canonical job populates the missing field while recording the source reference. If data conflicts with existing records, the conflict policy above is triggered.

---

## 7. Deferred Capabilities
- **Semantic Vector Deduplication:** Using text embeddings (e.g., cosine similarity of embeddings of job descriptions) to identify semantic duplicates is explicitly deferred to later phases.
- **Cross-Lingual Deduplication:** Automated translation and multi-lingual cross-referencing are deferred.
