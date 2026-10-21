# Database Schema Specification (V1)

> **Document Type:** Physical Database Schema & Relational Model  
> **Status:** Approved Baseline  
> **Version:** 1.1 (Corrections Applied)  
> **Parent Specification:** [`JOB_DATA_CONTRACT.md`](../requirements/JOB_DATA_CONTRACT.md)  
> **Architecture Decision:** [`ADR-002: PostgreSQL as Unified Store`](./ARCHITECTURE_DECISIONS_V1.md#adr-002-postgresql-as-unified-relational-and-raw-payload-store)

---

## 1. Overview & Principles

This document specifies the concrete relational database schema for PostgreSQL (with SQLite dialect compatibility for unit testing). The design reflects three foundational architectural guarantees:

1. **Immutable Raw Ingestion Evidence:** Raw HTTP payloads and source artifacts are preserved permanently in `raw_jobs` (JSONB) and linked to the exact configured endpoint (`company_sources.id`).
2. **Canonical Entity Aggregation:** One canonical job in `jobs` links to one or more `job_source_references`, ensuring deduplication preserves provenance without overwriting source differences.
3. **Auditability & Traceability:** All verification checks (`verification_records`), deterministic business rule runs (`filter_decisions`), AI inferences (`ai_analysis_results`), and ingestion runs (`collection_runs`) maintain isolated historical records.

---

## 2. Entity-Relationship Overview

```text
companies (1) ──────< company_sources (M) ──────< raw_jobs (M)
       │                      │                         │
       │                      │                         │
       │ (1)                  │ (1)                     │ (1)
       ▼                      ▼                         ▼
     jobs (1) ───────────< job_source_references (M)
       │
       ├────< verification_records (M)
       ├────< filter_decisions (M)
       └────< ai_analysis_results (M)

sources (1) ──< company_sources (M)
sources (1) ──< collection_runs (M)
company_sources (1) ──< collection_runs (M)
```

---

## 3. Physical Table Definitions

### 3.1 `companies`
Stores standardized corporate entity profiles.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | PRIMARY KEY | UUIDv4 string identifier |
| `name` | `VARCHAR(255)` | No | | Official or advertised company name |
| `normalized_name` | `VARCHAR(255)` | No | UNIQUE, INDEX | Lowercased, stripped of legal suffixes (Pvt Ltd, Inc, etc.) |
| `website` | `VARCHAR(512)` | Yes | | Primary corporate domain URI |
| `industry` | `VARCHAR(100)` | Yes | | Specific industrial vertical (FinTech, HealthTech, etc.) |
| `sector` | `VARCHAR(50)` | No | DEFAULT 'UNKNOWN' | IT, NON_IT, UNKNOWN |
| `business_model` | `VARCHAR(50)` | No | DEFAULT 'UNKNOWN' | PRODUCT, SERVICES, BOTH, UNKNOWN |
| `verified` | `BOOLEAN` | No | DEFAULT FALSE | Verified against curated registry |
| `verification_source` | `VARCHAR(100)` | Yes | | e.g. OFFICIAL_DOMAIN, REGISTRY, LINKEDIN |
| `confidence` | `FLOAT` | No | DEFAULT 0.0 | Confidence score (0.0 to 1.0) |
| `created_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | Record last update timestamp |

---

### 3.2 `sources`
Catalog of supported ingestion channels and ATS platforms.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(50)` | No | PRIMARY KEY | Code identifier (e.g. GREENHOUSE, LEVER, ASHBY, HIRIST, JOBSPY) |
| `name` | `VARCHAR(100)` | No | | Display name (e.g. Greenhouse ATS) |
| `source_type` | `VARCHAR(50)` | No | | ATS, JOB_BOARD, CAREER_PORTAL, AGGREGATOR |
| `base_url` | `VARCHAR(512)` | Yes | | Root endpoint for the platform |
| `is_active` | `BOOLEAN` | No | DEFAULT TRUE | Whether collectors actively query this source |
| `created_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | Registration timestamp |

---

### 3.3 `company_sources`
Maps companies to their specific ATS boards or career endpoints.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | PRIMARY KEY | UUIDv4 string identifier |
| `company_id` | `VARCHAR(36)` | No | FK(`companies.id`), INDEX | Associated company |
| `source_id` | `VARCHAR(50)` | No | FK(`sources.id`), INDEX | Associated source/ATS |
| `ats_identifier` | `VARCHAR(255)` | **Yes** | INDEX | ATS board token/slug (NULL for standard career portals) |
| `career_url` | `VARCHAR(1024)` | Yes | | Direct link to public career page |
| `api_endpoint` | `VARCHAR(1024)` | Yes | | Structured API endpoint URL if available |
| `discovery_method` | `VARCHAR(50)` | No | DEFAULT 'MANUAL' | MANUAL, REGISTRY_SCRAPE, HEURISTIC |
| `confidence` | `FLOAT` | No | DEFAULT 1.0 | Discovery confidence score (0.0 to 1.0) |
| `is_active` | `BOOLEAN` | No | DEFAULT TRUE | Active polling flag |
| `last_collected_at` | `TIMESTAMPTZ` | Yes | | Timestamp of last harvest |
| `created_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | Update timestamp |

**Indexes & Constraints:**
- `UNIQUE(company_id, source_id, ats_identifier)`

---

### 3.4 `raw_jobs`
Immutable raw payloads collected from external endpoints.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | PRIMARY KEY | UUIDv4 string identifier |
| `company_source_id` | `VARCHAR(36)` | No | FK(`company_sources.id`), INDEX | Exact company/source endpoint that produced this payload |
| `source_job_id` | `VARCHAR(255)` | No | INDEX | External unique identifier on the source platform |
| `source_url` | `VARCHAR(2048)` | No | | URL where the posting was captured |
| `application_url` | `VARCHAR(2048)` | Yes | | Direct application URL extracted |
| `raw_payload` | `JSONB` | No | | Unaltered raw JSON/HTML data |
| `raw_content_hash` | `VARCHAR(64)` | No | INDEX | SHA-256 hash of payload for change detection |
| `first_seen_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | When first captured |
| `last_seen_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | When last confirmed active during harvest |
| `collected_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | Ingestion timestamp |

**Indexes & Constraints:**
- `UNIQUE(company_source_id, source_job_id)`

---

### 3.5 `jobs`
The canonical, deduplicated representation of a physical job opening.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | PRIMARY KEY | UUIDv4 string identifier |
| `company_id` | `VARCHAR(36)` | No | FK(`companies.id`), INDEX | Hiring company |
| `canonical_title` | `VARCHAR(255)` | No | | Official job title |
| `normalized_title` | `VARCHAR(255)` | No | INDEX | Lowercase sanitized title for deterministic matching |
| `role_priority` | `VARCHAR(20)` | No | DEFAULT 'NOT_RELEVANT' | P1, P2, P3, NOT_RELEVANT |
| `description` | `TEXT` | No | | Cleaned full job description text |
| `location` | `VARCHAR(255)` | No | | Normalized primary location string |
| `location_type` | `VARCHAR(50)` | No | DEFAULT 'UNKNOWN' | ON_SITE, HYBRID, REMOTE, UNKNOWN |
| `experience_min` | `FLOAT` | Yes | | Stated minimum years of experience |
| `experience_max` | `FLOAT` | Yes | | Stated maximum years of experience |
| `experience_text` | `VARCHAR(255)` | Yes | | Raw experience requirement snippet |
| `salary_min` | `NUMERIC(12, 2)` | Yes | | Minimum compensation value |
| `salary_max` | `NUMERIC(12, 2)` | Yes | | Maximum compensation value |
| `salary_currency` | `VARCHAR(10)` | Yes | DEFAULT 'INR' | ISO currency code |
| `salary_period` | `VARCHAR(20)` | Yes | DEFAULT 'ANNUAL' | ANNUAL, MONTHLY, HOURLY |
| `salary_text` | `VARCHAR(255)` | Yes | | Raw compensation text |
| `posted_at` | `TIMESTAMPTZ` | Yes | INDEX | **Original publication date** (used for >5d expiration) |
| `first_seen_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | When first ingested by our system |
| `last_seen_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | When last confirmed alive on any source |
| `status` | `VARCHAR(30)` | No | DEFAULT 'NEW', INDEX | NEW, ELIGIBLE, REVIEW, REJECTED, DUPLICATE, EXPIRED, VERIFICATION_FAILED |
| `rejection_reason` | `VARCHAR(100)` | Yes | | Structured rejection code |
| `review_reason` | `VARCHAR(100)` | Yes | | Structured review code |
| `verification_confidence` | `FLOAT` | No | DEFAULT 0.0 | Aggregate verification confidence (0.0 to 1.0) |
| `application_url` | `VARCHAR(2048)` | Yes | | Best direct application link |
| `application_status` | `VARCHAR(30)` | No | DEFAULT 'NOT_APPLIED' | NOT_APPLIED, SAVED, APPLIED_MANUALLY |
| `created_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | DB row creation time |
| `updated_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | DB row update time |

---

### 3.6 `job_source_references`
Tracks each external discovery and appearance of a canonical job.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | PRIMARY KEY | UUIDv4 string identifier |
| `job_id` | `VARCHAR(36)` | No | FK(`jobs.id`), INDEX | Reference to canonical job |
| `raw_job_id` | `VARCHAR(36)` | No | FK(`raw_jobs.id`), INDEX | Reference to raw ingested record |
| `source_id` | `VARCHAR(50)` | No | FK(`sources.id`) | Ingestion source platform |
| `source_job_id` | `VARCHAR(255)` | No | | External job ID on that platform |
| `source_url` | `VARCHAR(2048)` | No | | Source listing URL |
| `application_url` | `VARCHAR(2048)` | Yes | | Application URL found on this source |
| `source_title` | `VARCHAR(255)` | Yes | | Title as reported by this source |
| `source_location` | `VARCHAR(255)` | Yes | | Location as reported by this source |
| `source_experience` | `VARCHAR(255)` | Yes | | Experience as reported by this source |
| `source_salary` | `VARCHAR(255)` | Yes | | Salary as reported by this source |
| `source_posted_at` | `TIMESTAMPTZ` | Yes | | Publication date reported by this source |
| `match_method` | `VARCHAR(50)` | No | | EXACT_EXTERNAL_ID, CANONICAL_ATS_URL, COMPOSITE_DETERMINISTIC |
| `match_confidence` | `FLOAT` | No | DEFAULT 1.0 | Deduplication match confidence (0.0 to 1.0) |
| `is_primary_source` | `BOOLEAN` | No | DEFAULT FALSE | Whether this is the primary canonical source |
| `created_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | Record creation timestamp |

---

### 3.7 `verification_records`
Audit trail of verification runs per job.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | PRIMARY KEY | UUIDv4 string identifier |
| `job_id` | `VARCHAR(36)` | No | FK(`jobs.id`), INDEX | Canonical job |
| `source_valid` | `BOOLEAN` | No | | True if source is verified and reputable |
| `jd_exists` | `BOOLEAN` | No | | True if job description content is present and valid |
| `application_url_valid` | `BOOLEAN` | No | | True if application URL is well-formed and responsive |
| `company_valid` | `BOOLEAN` | No | | True if company entity is verified |
| `location_consistent` | `BOOLEAN` | No | | True if stated location is recognized |
| `experience_consistent`| `BOOLEAN` | No | | True if experience requirements parsed cleanly |
| `salary_stated` | `BOOLEAN` | No | | True if salary is disclosed |
| `posting_date_plausible`| `BOOLEAN` | No | | True if posting date is not future/impossible |
| `confidence` | `FLOAT` | No | | Overall composite confidence score |
| `status` | `VARCHAR(30)` | No | | PASSED, WARNING, FAILED |
| `evidence` | `JSONB` | Yes | | Detailed check breakdown and diagnostics |
| `verified_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | Execution timestamp |

---

### 3.8 `filter_decisions`
Versioned historical audit record of rule engine evaluations.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | PRIMARY KEY | UUIDv4 string identifier |
| `job_id` | `VARCHAR(36)` | No | FK(`jobs.id`), INDEX | Canonical job evaluated |
| `rule_version` | `VARCHAR(50)` | No | | Version tag of the rule engine (e.g. 'v1.0.0') |
| `status` | `VARCHAR(30)` | No | | ELIGIBLE, REVIEW, REJECTED, EXPIRED |
| `role_priority` | `VARCHAR(20)` | No | | P1, P2, P3, NOT_RELEVANT |
| `reason_codes` | `JSONB` | No | | Array of reason code strings (e.g. ["SALARY_UNKNOWN"]) |
| `decision_details` | `JSONB` | Yes | | Breakdown of each rule evaluation |
| `evaluated_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | Timestamp of evaluation |

---

### 3.9 `ai_analysis_results`
Cached, versioned AI inferences for ambiguous listings.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | PRIMARY KEY | UUIDv4 string identifier |
| `job_id` | `VARCHAR(36)` | No | FK(`jobs.id`), INDEX | Canonical job |
| `provider` | `VARCHAR(50)` | No | | Provider used (OPENROUTER, OLLAMA, GEMINI) |
| `model` | `VARCHAR(100)` | No | | Model identifier (e.g. deepseek/deepseek-chat) |
| `prompt_version` | `VARCHAR(50)` | No | | Prompt template version string |
| `input_hash` | `VARCHAR(64)` | No | INDEX | SHA-256(JD + prompt_version + model) |
| `output_payload` | `JSONB` | No | | Structured LLM extraction output |
| `confidence` | `FLOAT` | No | | Self-reported model confidence |
| `tokens_used` | `INTEGER` | Yes | | Token consumption metrics |
| `created_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | Inference timestamp |

---

### 3.10 `collection_runs`
Operational monitoring and telemetry of harvest runs.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | PRIMARY KEY | UUIDv4 string identifier |
| `source_id` | `VARCHAR(50)` | No | FK(`sources.id`), INDEX | Ingestion source |
| `company_source_id` | `VARCHAR(36)` | Yes | FK(`company_sources.id`), INDEX | Specific company board (if targeted run) |
| `started_at` | `TIMESTAMPTZ` | No | DEFAULT NOW() | Run start timestamp |
| `finished_at` | `TIMESTAMPTZ` | Yes | | Run completion timestamp |
| `status` | `VARCHAR(30)` | No | DEFAULT 'RUNNING' | RUNNING, SUCCESS, PARTIAL, FAILED |
| `jobs_found` | `INTEGER` | No | DEFAULT 0 | Total raw items discovered |
| `jobs_created` | `INTEGER` | No | DEFAULT 0 | New canonical jobs created |
| `jobs_updated` | `INTEGER` | No | DEFAULT 0 | Existing jobs merged or updated |
| `jobs_failed` | `INTEGER` | No | DEFAULT 0 | Errors encountered |
| `error_summary` | `TEXT` | Yes | | Diagnostic error trace if failed |

---

## 4. Freshness and Expiration Semantic Rule

> [!IMPORTANT]
> **Active Feed Freshness Gate:**
> - The criterion for keeping a job in the active feed (age $\le 5$ days) is evaluated **strictly using `posted_at`** (the original publication timestamp).
> - If `posted_at` is older than 5 days at the time of discovery, the job is saved historically to PostgreSQL but marked `status = 'EXPIRED'`, `rejection_reason = 'JOB_TOO_OLD'`, and excluded from the active dashboard feed.
> - `collected_at` and `first_seen_at` are ingestion audit timestamps and **never** override an old `posted_at` date to make a stale listing appear fresh.
> - If `posted_at` is completely missing or unparseable, `first_seen_at` serves as the provisional fallback publication date with `review_reason = 'POSTED_DATE_AMBIGUOUS'`.
