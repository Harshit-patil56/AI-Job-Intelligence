# Technology Stack Evaluation & Specification (V1)

> **Document Type:** Architectural Evaluation & Decision Document  
> **Status:** Approved Baseline  
> **Version:** 1.0  
> **Target Phase:** Phase 1 (Architecture & System Design)  
> **Parent Architecture:** [`SYSTEM_ARCHITECTURE_V1.md`](./SYSTEM_ARCHITECTURE_V1.md)  
> **Architectural Decisions:** [`ARCHITECTURE_DECISIONS_V1.md`](./ARCHITECTURE_DECISIONS_V1.md)

---

## 1. Executive Summary & Selection Philosophy

The technology stack for **AI Job Intelligence** is selected under three rigorous constraints:
1. **The ₹0 Hard Limit:** Every component must be open-source, locally hostable, or available with a reliable free-tier quota. Zero mandatory recurring software subscriptions.
2. **Single-Developer Maintainability:** Technologies must prioritize simplicity, strong typing, clean interfaces, and low operational friction.
3. **High-Trust Data Integrity:** Strong relational guarantees and validation at application boundaries to prevent data corruption or silent job drops.

---

## 2. Comprehensive Technology Evaluations

### 2.1 Primary Programming Language & Runtime: Python 3.12+
- **Purpose:** Core language for the entire modular monolith, pipeline logic, collectors, data models, and API endpoints.
- **Why Selected:** Python is the industry standard for data extraction, web harvesting, and AI/LLM integration. Python 3.12 introduces substantial interpreter speed improvements (specializing adaptive interpreter), superior error traces, and robust native type hinting (`typing` enhancements, PEP 695 type parameter syntax).
- **Free / ₹0 Justification:** Open-source (PSF License); completely free to develop and execute across any operating system.
- **Important Alternatives Considered:**
  - *Go:* Highly efficient concurrency and single-binary deployment. Not chosen because the AI/LLM SDK ecosystem, HTML parsing libraries (e.g., BeautifulSoup, selectolax), and scraping developer velocity are far more mature and flexible in Python.
  - *TypeScript / Node.js:* Strong async I/O and web ecosystem. Not chosen because data analysis, local AI execution (Ollama integration, scientific text processing), and deterministic pipeline rules are less ergonomic than modern typed Python.
- **Known Limitations:** Higher memory footprint than Go/Rust; CPU-bound workloads require process offloading (though our workload is overwhelmingly I/O-bound).

---

### 2.2 Web Framework & API Server: FastAPI
- **Purpose:** Exposes administrative controls, metrics, health checks, and the curated central feed API.
- **Why Selected:** Built on Starlette and Pydantic; offers native asynchronous request handling (ASGI), automatic interactive OpenAPI (Swagger) documentation, and deep type-system integration. Extremely lightweight and fast.
- **Free / ₹0 Justification:** Open-source (MIT License); 100% free.
- **Important Alternatives Considered:**
  - *Django:* Full-featured "batteries-included" web framework. Not chosen because it introduces massive architectural baggage (heavy ORM, template engine, session management) unnecessary for an API-driven job intelligence engine.
  - *Flask:* Lightweight WSGI framework. Not chosen due to lack of first-class async support, lack of native Pydantic validation, and manual OpenAPI documentation maintenance.
- **Known Limitations:** Requires an ASGI server (Uvicorn) to run; WebSocket handling requires dedicated connection management.

---

### 2.3 Primary HTTP Client: httpx
- **Purpose:** Executes high-speed, asynchronous HTTP queries against public ATS endpoints (Greenhouse, Lever, Ashby) and company web servers.
- **Why Selected:** Supports both synchronous and asynchronous APIs, HTTP/1.1 and HTTP/2, connection pooling, strict configurable timeouts, SSL verification, and polite rate-limit throttling via `asyncio.Semaphore`.
- **Free / ₹0 Justification:** Open-source (BSD License); 100% free.
- **Important Alternatives Considered:**
  - *requests:* Synchronous only; would block the async event loop during mass collector execution, drastically hurting throughput.
  - *aiohttp:* Powerful async client. Not chosen because its API is more verbose, it lacks HTTP/2 support out of the box, and `httpx` provides a cleaner, modern API compatible with `requests` conventions.
- **Known Limitations:** Slightly higher latency than low-level C-based curl bindings (e.g., `pycurl`), but negligible for API-rate-limited scraping.

---

### 2.4 Headless Browser & Dynamic Web Rendering: Playwright
- **Purpose:** Fallback collector mechanism strictly for company career portals that rely on dynamic Client-Side Rendering (CSR / React / Angular / Vue) where static HTTP GET yields no DOM content.
- **Why Selected:** Playwright provides modern, reliable browser automation (Chromium, Firefox, WebKit) with auto-waiting selectors, network idle detection, and headless execution. It is vastly more reliable and modern than Selenium.
- **Free / ₹0 Justification:** Open-source (Apache 2.0 License); browser binaries are downloaded and managed locally at zero cost.
- **Important Alternatives Considered:**
  - *Selenium:* Traditional browser automation tool. Not chosen due to brittle driver management (chromedriver mismatch issues), slower execution, and lack of built-in modern wait-for-selector ergonomics.
  - *Puppeteer:* Node.js-first. Python port is less actively maintained than Microsoft's official Playwright Python SDK.
  - *Firecrawl:* Commercial web scraper API. Not chosen because it requires paid plans for reliable high-volume scraping, violating our ₹0 constraint. Playwright operates entirely locally and independently.
- **Known Limitations:** High RAM and CPU usage per browser instance. Must be strictly gated and used only when static HTTP requests fail.

---

### 2.5 Primary Database: PostgreSQL
- **Purpose:** Central relational store for canonical jobs, companies, sources, verification records, scheduling state, and immutable raw JSON payloads.
- **Why Selected:** PostgreSQL is the gold standard for open-source relational databases. It provides true ACID compliance, advanced indexing (B-Tree, GIN, GiST), full-text search capabilities, and native `JSONB` support for storing and querying un-mutated external source payloads.
- **Free / ₹0 Justification:** Open-source (PostgreSQL License); completely free self-hosted or via generous free cloud tiers (e.g., Neon, Supabase free tiers).
- **Important Alternatives Considered:**
  - *SQLite:* Excellent zero-config embedded database. Not chosen because concurrent writes from parallel collectors and background schedulers risk database lock contention (`database is locked`), and it lacks native server-grade connection pooling.
  - *MongoDB:* Document store. Not chosen because relational integrity (foreign keys between jobs, companies, sources, and verification records) is vital to prevent orphaned data, and PostgreSQL's `JSONB` already provides the flexibility of document storage.
- **Known Limitations:** Requires explicit service administration (or a container instance); requires periodic index vacuuming on high-churn write tables.

---

### 2.6 ORM & Data Layer: SQLAlchemy 2.0+
- **Purpose:** Object-Relational Mapping (ORM) and SQL query construction for interacting with PostgreSQL.
- **Why Selected:** SQLAlchemy 2.0 offers a modernized, fully typed declarative interface with native asynchronous support (`asyncpg` driver). It enables clean separation of domain models from database queries while allowing direct execution of optimized raw SQL when needed.
- **Free / ₹0 Justification:** Open-source (MIT License); 100% free.
- **Important Alternatives Considered:**
  - *Tortoise-ORM:* Native async ORM modeled after Django. Not chosen because it has a smaller community, fewer advanced migration tools, and lacks the battle-tested maturity of SQLAlchemy.
  - *SQLModel:* Combines Pydantic and SQLAlchemy. Not chosen because it remains in beta, has occasional version incompatibilities with newer Pydantic releases, and adds an extra layer of abstraction.
- **Known Limitations:** Steeper learning curve than simple query builders, but mitigates database regression risks.

---

### 2.7 Schema Validation & Serialization: Pydantic v2
- **Purpose:** Validates incoming collector payloads, defines internal data transfer objects (DTOs), enforces the Job Data Contract, and validates structured outputs from LLMs.
- **Why Selected:** Pydantic v2 is rewritten in Rust, delivering 5x–15x performance improvements over v1. It integrates seamlessly with FastAPI and enables strict validation of complex nested structures (e.g., compensation bands, experience ranges, ISO timestamps).
- **Free / ₹0 Justification:** Open-source (MIT License); 100% free.
- **Important Alternatives Considered:**
  - *Marshmallow:* Older serialization library. Not chosen due to lack of modern type-hint integration and significantly slower execution speed compared to Pydantic v2's Rust core.
  - *attrs / dataclasses:* Python standard tools. Not chosen because they lack native schema parsing, string-to-numeric casting, and automated OpenAPI JSON schema generation.
- **Known Limitations:** Strict type validation requires explicit custom validators for fuzzy/dirty web strings.

---

### 2.8 Job Scheduling & Pipeline Orchestration: APScheduler
- **Purpose:** Orchestrates periodic collector runs, daily freshness sweeps, and weekly company discovery tasks.
- **Why Selected:** APScheduler runs directly inside the Python application process. It supports cron-style and interval schedules, handles missed jobs, and can persist job execution state directly in PostgreSQL. It eliminates the need for heavyweight message brokers (Redis, RabbitMQ, Celery).
- **Free / ₹0 Justification:** Open-source (MIT License); 100% free.
- **Important Alternatives Considered:**
  - *Celery + Redis:* Industry standard for distributed task queues. Not chosen because running Celery workers, a Redis broker, and monitoring tools adds massive operational overhead, violates our "single-developer simplicity" philosophy, and is totally unnecessary for our I/O-bound workload.
  - *Cron (Linux crontab):* Simple OS-level scheduling. Not chosen because it lacks in-app lifecycle hooks, cross-platform reproducibility (Windows development vs. Linux deployment), and programmatic execution telemetry.
- **Known Limitations:** Runs in-process; horizontal scaling across multiple compute instances requires a shared persistent job store or external coordinator.

---

### 2.9 Automated Testing Suite: pytest + pytest-asyncio
- **Purpose:** Test runner and assertion framework for unit testing, rule validation, parser verification, and mocked integration testing.
- **Why Selected:** Pytest offers the most expressive, fixture-driven testing ecosystem in Python. Combined with `pytest-asyncio` and `pytest-mock`, it allows mocking external HTTP responses and LLM endpoints effortlessly, ensuring 100% deterministic test suite execution without network calls.
- **Free / ₹0 Justification:** Open-source (MIT License); 100% free.
- **Important Alternatives Considered:**
  - *unittest (Standard Library):* Verbose class-based syntax; less powerful fixture architecture and parameterization capabilities.
- **Known Limitations:** Requires careful configuration of event loop scopes when running complex async test suites.

---

### 2.10 Package & Dependency Management: uv (Astral)
- **Purpose:** Extremely fast Python package installation, resolution, virtual environment management, and deterministic lockfile generation (`uv.lock`).
- **Why Selected:** Written in Rust by Astral, `uv` is 10x–100x faster than `pip` and `poetry`. It manages Python versions, virtual environments, and workspace dependencies reliably with zero build-step overhead.
- **Free / ₹0 Justification:** Open-source (MIT / Apache 2.0); 100% free.
- **Important Alternatives Considered:**
  - *Poetry:* Widely used dependency manager. Not chosen because lockfile resolution can be exceptionally slow on large dependency graphs, and environment switching can be clunky.
  - *Pip + virtualenv:* Standard toolset. Not chosen due to lack of native lockfile enforcement and slow resolution.
- **Known Limitations:** Relatively new tool (though backed by Astral and already widely adopted in production Python ecosystems).

---

### 2.11 Containerization & Local Deployment: Docker & Docker Compose
- **Purpose:** Standardizes the local development and deployment environment, bundling the FastAPI application, PostgreSQL database, and browser binaries into an easily reproducible container setup.
- **Why Selected:** Ensures zero "works on my machine" discrepancy between development environments (Windows/macOS/Linux) and deployment targets. Docker Compose provides single-command spin-up of the entire system.
- **Free / ₹0 Justification:** Docker Engine and Docker Compose are free and open-source under Apache 2.0 (and free for personal portfolio development under Docker Desktop / Podman).
- **Important Alternatives Considered:**
  - *Kubernetes / Helm:* Production container orchestration. Strongly rejected as premature over-engineering for V1.
  - *Bare-metal local installation:* Viable for initial local development, but introduces platform-specific setup friction (e.g., PostgreSQL service installation on Windows).
- **Known Limitations:** Requires Docker daemon installed on the host machine.

---

### 2.12 Local AI Inference Runtime (Candidate: Ollama)
- **Purpose:** Provides 100% offline, local LLM execution as a fallback when external free-tier API quotas are exhausted or offline operation is required.
- **Why Selected as Candidate:** Ollama is the leading candidate runtime for local inference because it wraps llama.cpp with a clean REST API compatible with standard HTTP clients. It enables running quantized state-of-the-art open models (e.g., Llama-3-8B-Instruct, Mistral-7B, Qwen-2.5) on standard consumer hardware with CPU or GPU acceleration.
- **Free / ₹0 Justification:** Open-source (MIT License); 100% free with open weights.
- **Important Alternatives Considered:**
  - *Direct llama.cpp / ctransformers:* Lower-level C++ bindings. Viable alternative if direct embedded process execution is preferred over a daemon model during implementation.
  - *vLLM:* High-throughput inference server. Not chosen because it requires high-end Linux CUDA environments and is overkill for low-volume single-user classification.
- **Known Limitations:** Inference speed depends on host hardware (GPU recommended for sub-second responses; CPU execution takes 3–10 seconds per prompt).

---

### 2.13 Provider-Agnostic LLM Gateway & Candidate Cloud Providers
- **Purpose:** Custom abstraction layer that routes semantic classification queries across modular provider adapters before falling back to the local model runtime.
- **Architectural Design:** Follows a strict provider adapter pattern (`BaseLLMAdapter`). The gateway abstracts model calls behind a uniform interface, allowing free-tier providers to be added, removed, reordered, or disabled via configuration at implementation time without modifying core pipeline or filtering rules.
- **Candidate Free-Tier Cloud Providers (Implementation Options):**
  Current free-tier providers evaluated for initial implementation include:
  - *Google Gemini API (Free Tier):* Candidate for high-context extraction under zero-cost developer quotas.
  - *Groq Cloud (Free Tier):* Candidate for fast inference on open models under free developer tiers.
  - *OpenRouter / Hugging Face Free Models:* Candidate aggregators providing rotating free-tier open models.
- **Free / ₹0 Justification:** Operates strictly within published zero-cost developer quotas; zero credit card or billing commitments required.
- **Important Alternatives Considered:**
  - *Single Provider (e.g., OpenAI / Anthropic):* Requires paid API credits, violating the ₹0 hard constraint.
  - *Hardcoded Single Free Provider:* Brittle; risk of rate limiting or free-tier model deprecation. The abstracted gateway allows seamless switching between active adapters.
- **Known Limitations:** Free tiers impose rate limits (RPM/RPD); mitigated by deterministic-first evaluation, aggressive SHA256 caching, and local model failover.

---

## 3. Technology Trade-Off Matrix

| Dimension | Selected Technology | Primary Benefit | Key Compromise / Trade-Off | Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Language** | Python 3.12+ | Rich AI/scraping ecosystem; rapid iteration | Higher memory footprint than Go/Rust | ₹0 |
| **API** | FastAPI | Native async; auto OpenAPI; Pydantic validation | Requires ASGI server (Uvicorn) | ₹0 |
| **HTTP** | httpx | Async + sync; HTTP/2 support; connection pool | Slightly slower than raw C-bindings | ₹0 |
| **Browser** | Playwright | Robust headless rendering for CSR career pages | High memory/CPU overhead (used only as fallback) | ₹0 |
| **Database** | PostgreSQL | ACID reliability; rich JSONB indexing; relational integrity | Requires dedicated service instance | ₹0 |
| **ORM** | SQLAlchemy 2.0 | Typed modern declarative queries; asyncpg engine | Steeper learning curve | ₹0 |
| **Schemas** | Pydantic v2 | Rust-accelerated validation; strict typing | Strict parsing requires custom string sanitizers | ₹0 |
| **Scheduler** | APScheduler | In-process lightweight scheduling; zero message broker | In-process execution (not horizontally distributed) | ₹0 |
| **Testing** | pytest | Fixture-based testing; async support; high productivity | Requires configuration for async event loops | ₹0 |
| **Package Tool** | uv | Instant package resolution & virtualenv isolation | Relatively young tool ecosystem | ₹0 |
| **Deployment** | Docker Compose | Reproducible multi-platform environment | Requires container engine installed | ₹0 |
| **Local AI** | Local Model Runtime (Candidate: Ollama) | 100% offline fallback; ₹0 token cost | Inference latency tied to local host GPU/CPU | ₹0 |
| **Cloud AI** | Multi-Provider Gateway (Candidates: Gemini, Groq, OpenRouter) | High quality; failover resilience; ₹0 operation | Subject to free-tier rate limits (handled by cache) | ₹0 |
