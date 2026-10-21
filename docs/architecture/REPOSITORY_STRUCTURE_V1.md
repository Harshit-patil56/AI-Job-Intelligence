# Repository Structure & Architectural Blueprint (V1)

> **Document Type:** Codebase Organization & Module Boundaries  
> **Status:** Approved Baseline  
> **Version:** 1.1 (Corrections Applied)  
> **Parent Architecture:** [`SYSTEM_ARCHITECTURE_V1.md`](./SYSTEM_ARCHITECTURE_V1.md)  
> **Schema Reference:** [`DATABASE_SCHEMA_V1.md`](./DATABASE_SCHEMA_V1.md)

---

## 1. Architectural Philosophy & Module Isolation

The system is organized as a **Modular Monolith** in Python. Modules maintain strict boundaries:

1. **Collectors do NOT filter:** Collectors only know how to communicate with upstream endpoints, respect rate limits, capture raw payloads, and map them to unvalidated raw structures.
2. **Rules do NOT scrape:** Business rules operate exclusively on normalized in-memory models. They have zero network awareness.
3. **AI does NOT query persistence directly:** The AI Gateway accepts structured inputs, checks its deterministic cache, invokes providers, and returns typed outputs.
4. **Persistence does NOT make business decisions:** Database layers provide atomic transactions, query utilities, and data mapping without deciding eligibility or priority.
5. **Orchestration manages the pipeline:** The `app/services/` layer coordinates collectors, normalizers, deduplicators, verifiers, rules, and persistence. Both the API and APScheduler invoke the orchestrator.

---

## 2. Dependency Flow

```text
       ┌───────────┐         ┌───────────┐
       │  FastAPI  │         │Scheduler  │
       │  (HTTP)   │         │(Cron/Poll)│
       └─────┬─────┘         └─────┬─────┘
             │                     │
             └──────────┬──────────┘
                        ▼
            ┌───────────────────────┐
            │ Orchestration Service │
            │ (app.services.pipeline)│
            └───────────┬───────────┘
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Collectors  │  │ Normalizer  │  │ Deduplicator│
│(GH, JobSpy) │  │  & Parsers  │  │   & Match   │
└─────────────┘  └─────────────┘  └─────────────┘
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Verification│  │ Rules Engine│  │ AI Gateway  │
│   Checks    │  │(P1/P2/P3/Ex)│  │ (Ambiguity) │
└─────────────┘  └─────────────┘  └─────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Persistence Layer    │
            │ (PostgreSQL / Models) │
            └───────────────────────┘
```

---

## 3. Directory Layout

```text
AI-Job-Intelligence/
├── app/
│   ├── __init__.py
│   ├── config/                     # Settings, environment, logging
│   │   ├── __init__.py
│   │   └── settings.py
│   ├── models/                     # SQLAlchemy 2.0 ORM & Pydantic schemas
│   │   ├── __init__.py
│   │   ├── database.py             # Engine, SessionLocal, Base
│   │   ├── entities.py             # 10 core tables with relationships
│   │   └── schemas.py              # Pydantic v2 domain schemas
│   ├── collectors/                 # Ingestion collectors
│   │   ├── __init__.py
│   │   ├── base.py                 # Abstract BaseCollector
│   │   ├── greenhouse.py           # Greenhouse Public API Collector
│   │   ├── jobspy_collector.py     # JobSpy (LinkedIn/Indeed/Glassdoor unauth)
│   │   └── hirist.py               # Hirist India Tech Portal Collector
│   ├── normalization/              # Data cleansing & parser engine
│   │   ├── __init__.py
│   │   ├── normalizer.py           # Top-level normalization logic
│   │   ├── location_parser.py      # City alias & hub classifier
│   │   ├── experience_parser.py    # Experience band & regex extractor
│   │   └── salary_parser.py        # INR / LPA / monthly salary parser
│   ├── deduplication/              # Multi-tier deduplication engine
│   │   ├── __init__.py
│   │   └── deduplicator.py         # Stages 1-4 deterministic & fuzzy dedup
│   ├── verification/               # Multi-dimension authenticity checks
│   │   ├── __init__.py
│   │   └── verifier.py             # Confidence score & record builder
│   ├── rules/                      # Deterministic filtering rules
│   │   ├── __init__.py
│   │   ├── filter_engine.py        # Deterministic evaluation pipeline
│   │   ├── role_classifier.py      # P1 / P2 / P3 / hard exclusions
│   │   └── policy.py               # Frozen rules (location, salary, age)
│   ├── ai/                         # LLM Gateway for ambiguity resolution
│   │   ├── __init__.py
│   │   ├── gateway.py              # Fallback orchestrator & circuit breaker
│   │   ├── cache.py                # SHA256 composite content cache
│   │   └── providers/              # Adapter implementations (OpenRouter, Ollama)
│   ├── services/                   # Application orchestration
│   │   ├── __init__.py
│   │   ├── pipeline.py             # Unified Ingestion & Processing Pipeline
│   │   └── company_service.py      # Company & Source registry management
│   ├── api/                        # FastAPI REST API
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application factory
│   │   └── routes/                 # Endpoints (jobs, runs, health, registry)
│   └── scheduling/                 # APScheduler integration
│       ├── __init__.py
│       └── scheduler.py            # Cron & interval job definitions
├── migrations/                     # Alembic database migrations
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── tests/
│   ├── conftest.py
│   ├── unit/                       # Unit tests (parsers, rules, dedup)
│   ├── integration/                # Pipeline integration tests
│   └── fixtures/                   # Sample payloads (Greenhouse, JobSpy)
├── scripts/                        # Management & CLI validation scripts
│   ├── run_pipeline.py             # End-to-end CLI validation runner
│   └── seed_companies.py           # Seed target Indian tech companies
├── pyproject.toml
├── alembic.ini
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Frozen Business Policy Summary (Reference)

### 4.1 Salary Rules
- **Mumbai / Navi Mumbai / Thane:** No strict minimum threshold.
- **Pune:** Minimum ₹30,000 / month (or equivalent ₹3.6 LPA). Stated compensation below this is `REJECTED` (`SALARY_BELOW_MINIMUM`).
- **Bengaluru:** Minimum ₹5.0 LPA. Stated compensation below this is `REJECTED` (`SALARY_BELOW_MINIMUM`).
- **Hyderabad:** Minimum ₹5.0 LPA. Stated compensation below this is `REJECTED` (`SALARY_BELOW_MINIMUM`).
- **Unknown Salary:** Retained as `REVIEW` (`SALARY_UNKNOWN`). **Never automatically reject.**

### 4.2 Experience Rules
- `Fresher`, `Entry-level`, `0-1`, `0-2`, `1-2` years: **KEEP** (`ELIGIBLE`).
- `1-3` years: **REVIEW** (`EXPERIENCE_AMBIGUOUS`).
- Stated minimum $\ge$ 2 years (e.g. `2-3`, `2-4`, `2-5`, `3+`, `Senior`, `Lead`): **REJECTED** (`EXPERIENCE_TOO_HIGH`).
- Ambiguous/missing experience: **REVIEW** (`EXPERIENCE_AMBIGUOUS`).

### 4.3 Freshness Rules
- Evaluated strictly using `posted_at` (original publication timestamp).
- $\le 24$ hours: Highest priority.
- $1-3$ days: High priority.
- $3-5$ days: Normal priority.
- $> 5$ days: **EXPIRED** (`JOB_TOO_OLD`), excluded from active feed.
