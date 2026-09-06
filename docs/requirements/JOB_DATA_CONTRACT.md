# Job Data Contract (V1)

> **Document Type:** Conceptual Schema & Data Semantics  
> **Status:** Approved Baseline  
> **Version:** 1.0  
> **Reference Specification:** [`V1_SPECIFICATION.md`](./V1_SPECIFICATION.md)

---

## 1. Overview
This document defines the conceptual data contracts for **Job** and **Company** entities, as well as the supporting **JobSourceReference** entity. It establishes field semantics, validation rules, nullability behavior, and the raw-data preservation architecture necessary to support high-recall ingestion, multi-source deduplication, and auditable verification.

These definitions are technology-agnostic (independent of specific databases, ORMs, or programming languages).

---

## 2. Core Architectural Guarantees

### 2.1 Immutable Raw Data Preservation
To satisfy the system's development philosophy and guard against information loss:
- The system **MUST** preserve the original, un-mutated raw payload collected from each external source.
- Reprocessing, rule refinements, and re-parsing of historical postings must be possible without re-scraping external endpoints.
- Raw records are linked to the canonical job record via source references.

### 2.2 Canonical Entity with Multi-Source References & Conflict Handling
A single physical job opportunity may be advertised across multiple platforms (e.g., LinkedIn, Naukri, Company Careers, Indeed). 
- The system produces **one canonical `Job` entity**.
- The canonical entity aggregates one or more **`JobSourceReference`** records.
- No source data is discarded upon deduplication.
- **Cross-Source Attribute Conflicts:** When sources report conflicting values for material attributes (such as experience requirements, compensation, location, or posting dates), the system does **not** automatically pick the "more permissive" value. Instead, values from each source are preserved within their respective `JobSourceReference`, the canonical attribute is marked as conflicting/uncertain, and the job is flagged for **`REVIEW`** (`review_reason = SOURCE_CONFLICT_REVIEW`) if the conflict impacts eligibility. Direct ATS / company career page information provides stronger evidence but must not silently erase conflicting evidence from other sources.

---

## 3. Job Entity Contract

The `Job` entity represents the unified, canonical job posting after ingestion, normalization, and deduplication.

### 3.1 Schema Definition

| Group | Field Name | Conceptual Type | Nullable / Optional | Description & Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **Identity** | `job_id` | Identifier (UUID/String) | No | Canonical unique identifier for the deduplicated job. |
| | `source` | String / Enum | No | Primary source identifier (e.g., `LINKEDIN`, `NAUKRI`, `CAREER_PAGE`, `INDEED`). |
| | `source_job_id` | String | No | External unique job ID supplied by the primary source. |
| | `source_url` | String (URI) | No | Direct URL where the primary source listing was discovered. |
| **Basic** | `title` | String | No | Normalized job title as advertised. |
| | `company_name` | String | No | Hiring company name as reported by the source. |
| | `company_url` | String (URI) | Yes | URL to the company profile or official domain. |
| | `location` | String | No | Normalized location string (e.g., "Mumbai, Maharashtra", "Pune, Maharashtra"). |
| | `employment_type` | Enum / String | Yes | E.g., `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`, `UNKNOWN`. |
| | `remote_type` | Enum / String | Yes | E.g., `ON_SITE`, `HYBRID`, `REMOTE`, `UNKNOWN`. |
| **Job Details** | `description` | Text | No | Full-text job description body. |
| | `responsibilities` | List of Strings | Yes | Parsed list of key duties/responsibilities (if extracted). |
| | `requirements` | List of Strings | Yes | Explicit prerequisites and educational/technical qualifications. |
| | `skills` | List of Strings | Yes | List of extracted or stated technologies/skills. |
| | `experience_requirement` | String / Range | Yes | Raw or parsed experience specification (e.g., "0-2 years", "Fresher"). |
| **Compensation** | `salary_min` | Numeric (Decimal) | Yes | Stated minimum compensation value. Null if unstated. |
| | `salary_max` | Numeric (Decimal) | Yes | Stated maximum compensation value. Null if unstated. |
| | `salary_period` | Enum / String | Yes | Pay cadence: `ANNUAL`, `MONTHLY`, `HOURLY`, `UNKNOWN`. |
| | `salary_currency` | String (ISO-4217) | Yes | Currency code (e.g., `INR`, `USD`). |
| **Dates** | `posted_at` | Timestamp | Yes | Original publication timestamp reported by source. |
| | `updated_at` | Timestamp | Yes | Last modification timestamp reported by source or system. |
| | `collected_at` | Timestamp | No | System timestamp when the posting was first captured. |
| **Verification** | `source_verified` | Boolean | No | Indicates whether the source is verified and reputable. |
| | `jd_verified` | Boolean | No | Indicates whether the JD content is authentic and accessible. |
| | `company_verified` | Boolean | No | Indicates whether employer entity identity is verified. |
| | `location_verified` | Boolean | No | Indicates whether stated location is confirmed authentic. |
| | `experience_verified` | Boolean | No | Indicates whether experience criteria are verified against text. |
| | `salary_verified` | Boolean | No | Indicates whether salary figures are explicitly verified (false if unknown). |
| | `verification_confidence` | Float (0.0 – 1.0) | No | Aggregate composite confidence score across verification checks. |
| **Classification** | `role_priority` | Enum | No | Role priority tier: `P1`, `P2`, `P3`, `NOT_RELEVANT`. |
| | `company_type` | Enum / String | Yes | Aligned with Company model (`PRODUCT`, `SERVICES`, `BOTH`, `UNKNOWN`). |
| | `company_sector` | Enum / String | Yes | Aligned with Company model (`IT`, `NON_IT`, `UNKNOWN`). |
| | `relevance_status` | Enum / String | No | High-level match alignment: `TARGET`, `ADJACENT`, `EXCLUDED`. |
| **Application** | `application_url` | String (URI) | Yes | Direct application or ATS endpoint. |
| | `application_status` | Enum | No | `NOT_APPLIED`, `SAVED`, `APPLIED_MANUALLY`, `IN_REVIEW`. |
| **Filtering & Audit** | `eligibility_status` | Enum | No | Operational status: `NEW`, `ELIGIBLE`, `REVIEW`, `REJECTED`, `DUPLICATE`, `EXPIRED`, `VERIFICATION_FAILED`. |
| | `rejection_reason` | Enum / String | Yes | Structured reason code if `REJECTED` (e.g., `EXPERIENCE_TOO_HIGH`). |
| | `review_reason` | Enum / String | Yes | Structured reason code if `REVIEW` (e.g., `SALARY_UNKNOWN`). |

---

## 4. Supporting Entity: JobSourceReference

When multiple sources report the same opening, each source's ingestion event is preserved in a `JobSourceReference`.

### 4.1 Schema Definition
- `reference_id`: Unique identifier for the discovery event.
- `job_id`: Foreign key referencing the canonical `Job`.
- `source`: Source platform identifier (e.g., `LINKEDIN`, `NAUKRI`, `CAREER_PAGE`).
- `source_job_id`: The ID assigned by that specific platform.
- `source_url`: URL of the posting on that platform.
- `application_url`: Direct application link extracted from this source.
- `posted_at`: Publication date reported by this source.
- `collected_at`: Timestamp when this source was ingested.
- `raw_payload`: Unaltered, complete response payload (JSON, HTML snippet, or structured text).

---

## 5. Company Entity Contract

The `Company` entity standardizes corporate entities to allow consistent classification and verification across jobs.

### 5.1 Schema Definition

| Field Name | Conceptual Type | Nullable / Optional | Allowed Values / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `company_id` | Identifier | No | UUID / Unique String | Canonical unique identifier for the company. |
| `name` | String | No | Non-empty string | Raw/reported company name. |
| `normalized_name` | String | No | Normalized string | Standardized legal or operating name (lowercased, stripped of legal entities like "Pvt Ltd"). |
| `website` | String (URI) | Yes | Valid URI | Official domain of the company. |
| `industry` | String | Yes | E.g., FinTech, HealthTech, EdTech | Specific industrial vertical. |
| `sector` | Enum | No | `IT`, `NON_IT`, `UNKNOWN` | High-level sector classification. Default: `UNKNOWN`. |
| `business_model` | Enum | No | `PRODUCT`, `SERVICES`, `BOTH`, `UNKNOWN` | Primary operational business model. Default: `UNKNOWN`. |
| `verified` | Boolean | No | `true`, `false` | Indicates whether identity is verified through trusted reference. |
| `verification_source`| String | Yes | E.g., `OFFICIAL_DOMAIN`, `LINKEDIN_PAGE`, `REGISTRY` | Provenance of the verification. |
| `confidence` | Float (0.0 – 1.0) | No | Range 0.0 to 1.0 | Confidence level of verification and classification. |

### 5.2 Company Classification Rules & Tolerance
- **Zero Silent Rejections:** An `UNKNOWN` sector or `UNKNOWN` business model **must NOT** cause automatic rejection of a job posting.
- Jobs associated with unverified or newly discovered companies proceed to the filtering pipeline normally, flagging `company_verified = false` and raising `review_reason = COMPANY_UNVERIFIED` only if company verification is mandatory for that evaluation step.

---

## 6. Nullability, Defaults, and Unknown Data Semantics

To maintain the **maximum recall** principle:
1. **Unknown Salary:** `salary_min`, `salary_max`, and `salary_period` remain null. `salary_verified` is set to `false`. The job is marked with `review_reason = SALARY_UNKNOWN` and preserved in the feed.
2. **Experience Target Semantics:**
   - Any stated experience range starting at 2 years or more (minimum $\ge$ 2 years, e.g., 2–3, 2–4, 2–5, 3+) or Senior/Lead/Architect is `REJECTED` (`rejection_reason = EXPERIENCE_TOO_HIGH`).
   - Experience bands 0–1, 0–2, 1–2 years are `KEEP` (`ELIGIBLE`).
   - The 1–3 years band is routed to `REVIEW` (`review_reason = EXPERIENCE_AMBIGUOUS`).
   - Missing or ambiguous experience where the minimum cannot be reliably determined is routed to `REVIEW` (`review_reason = EXPERIENCE_AMBIGUOUS`, `experience_verified = false`) rather than silently rejecting. Personal experience duration is never hard-coded.
3. **Remote Role Semantics:** If `remote_type = REMOTE`, the job is not rejected because the company or corporate headquarters is outside P1/P2 hubs; it is routed to `REVIEW` (`review_reason = LOCATION_REMOTE_REVIEW`) pending finalized remote policy.
4. **Missing Application URL:** If no direct ATS or application URL is discovered, `source_url` is retained as the fallback.
5. **Cross-Source Attribute Conflicts:** When sources conflict on material fields affecting eligibility, the canonical attribute is marked uncertain and routed to `REVIEW` (`review_reason = SOURCE_CONFLICT_REVIEW`).
6. **Audit Immutability:** Once a record is marked `REJECTED` or `REVIEW`, the associated `rejection_reason` or `review_reason` must never be null.

---

## 7. Deferred Elements
- **Database Schemas & DDL:** Concrete relational schemas (PostgreSQL) or document structures are deferred to Phase 1.
- **Serialization Frameworks:** Pydantic models, ORM entities, and JSON Schema validators will be introduced during implementation testing.
