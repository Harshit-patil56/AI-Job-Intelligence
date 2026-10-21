# AI Job Application Plan

**User:** Anonymous  
**Created:** 9/6/2026 21:02:31  
**Updated:** 10/18/2026 0:19:30  
**Exported:** 10/19/2026 12:50:41  
**Link:** [https://chatgpt.com/c/6a9d878d-c1c8-83e8-ba34-fbf81308aa58](https://chatgpt.com/c/6a9d878d-c1c8-83e8-ba34-fbf81308aa58)  

## Prompt:
9/6/2026, 9:02:31 PM

Yes. That stack is already more than enough. You currently have:
Naukri
Indeed
Wellfound
Cutshort
LinkedIn
Hirist
Instahyre
For your AI/GenAI + Backend + Software Engineer search, I would not add another portal right now.
The only thing I'd add is direct company career pages for companies you're targeting, because some good AI roles never appear on job portals.
Final setup
Daily:
Naukri → LinkedIn → Cutshort → Hirist → Indeed
2–3× per week:
Wellfound → Instahyre → selected company career pages
And your screenshot looks good — you've already organized the main portals nicely.
Don't spend more time collecting job portals. Your bottleneck now should be finding jobs + applying + skill preparation, not finding another website. Look, this is my plan for job apply. I use this platform plus career pages. Also I will give you knowledge about what are my plans, which role I am targeting, and what is my current status. Everything you know. I think this conversation we have, there will be in our past conversations, so you can cross-check, give whatever information you can have. So basically I have a problem regarding job apply. If I apply on multiple portals, it take a lot of time. Even one hour also not enough for it. I have a high limit, give one hour at least to apply, but in one hour I am not able to cover all the things. So for this we need to some plan something, like build some application or build some solution for it. So in my mind what I am thinking, we have to build one centralized application that use AI, that have one agent, or multiple agents, that go and web scrape. Also if required I can give my login access also, so we can, we cannot get any issue regarding block, so we can easily do web scrape and all. Also on the script, we can use Fireclaw and any other web scraping tools, also we can use, you have, I think we need to research. If someone builds this system or not, or we build our system. Also I applied some, I have some filters regarding location and the roles, add that also. So basically we need to first build this application. First I think you need to, first you show me what is the real problem and how we can solve it in short. Try to do much, just act like a normal short conversation. For now just give me these two things: main problem and how we can solve it. And before giving answer of it, go and do deep research, web research.

## Response:
9/6/2026, 9:02:35 PM · gpt-5-6

> **Searched 10 websites**
>
> 
>
> Worked for 4s

I did the research first. The short version is: **your problem is real, but I would not build the first version as a “scrape everything + auto-apply everywhere” bot.**

### 1. Main problem

Your actual bottleneck isn't finding job portals. It's the **fragmented job-search workflow**:

**Multiple sources → duplicate jobs → manually check filters → read JD → judge fit → customize resume → fill forms → apply → track application.**

With 7-8 portals + company career pages, even spending 1 hour/day means you're wasting a large portion of that hour on **repetitive operations rather than decision-making**.

And this is already a recognized problem: products such as Jobright and Simplify are moving toward an AI “job-search agent” that finds, matches, tailors and helps apply. ([Jobright AI](https://jobright.ai/compare/simplify?utm_source=chatgpt.com))

I also found something particularly relevant to your idea: an open-source project, **job-apply-mcp**, already attempts AI-powered job searching/application across **LinkedIn, Naukri, Wellfound, Indeed, Hirist, Glassdoor, Instahyre and Cutshort**, using Playwright and an application-tracking DB. ([GitHub](https://github.com/pulkit017/job-apply-mcp?utm_source=chatgpt.com))

So we're **not starting from zero**.

### 2. How we solve it

I would build your system as a **Personal AI Job Agent / Job Operating System**:

**Your profile + resume + preferences**

↓  

**Job collectors**  
Portals + ATS/company career pages + permitted/public sources

↓

**Normalizer + deduplicator**  
Turn everything into one common job format and remove duplicates.

↓

**AI Job Matcher**  
Score every job against:
- AI/ML / GenAI / Backend / Software roles
- location
- experience
- salary, when available
- required skills
- your resume
- your personal preferences

↓

**Priority queue**

Instead of you checking 8 websites, you get:

> **Today: 23 new jobs → 7 strong matches → 3 highly recommended**

↓

**Application Copilot**

For each selected job:
- tailor resume
- generate answers
- prepare cover letter if useful
- autofill permitted application fields
- open external application when necessary
- **you approve before final submission**

↓

**Application tracker**

Everything becomes one dashboard:

`Found → Shortlisted → Applied → Assessment → Interview → Rejected → Offer`

---

The important architectural decision is **human-in-the-loop**, especially initially.

LinkedIn explicitly prohibits unauthorized scraping/bots/automated activity, and Indeed prohibits third-party automated application bots outside its permitted tooling. ([LinkedIn](https://www.linkedin.com/help/linkedin/answer/a1341387?utm_source=chatgpt.com))

So giving the agent your login doesn't automatically make automation permitted. We should design the system around **official/public/allowed data sources first**, and use browser assistance where appropriate rather than trying to defeat platform protections.

That actually makes the project better: **the AI should automate the boring work, while you retain control over the final application.**

And there is already another interesting open-source project, `career-ops-india`, using ATS sources such as Greenhouse/Lever/Ashby alongside Indian job platforms. ([GitHub](https://github.com/AnojSKunte/career-ops-india/blob/main/README.md?utm_source=chatgpt.com))

**So the real opportunity isn't “build another job scraper.”**

It's:

> **Build Tanmay's personal AI job-search system that aggregates opportunities, understands his career target, removes duplicates, ranks jobs intelligently, prepares applications, and reduces his daily 1-hour job hunt to ~15-20 minutes of decision-making.**

That's the problem I think we should solve.

---

**Sources:**

- [Jobright vs Simplify — Feature Comparison (2026)](https://jobright.ai/compare/simplify?utm_source=chatgpt.com)
- [GitHub - pulkit017/job-apply-mcp · GitHub](https://github.com/pulkit017/job-apply-mcp?utm_source=chatgpt.com)
- [Prohibited software and extensions | LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a1341387?utm_source=chatgpt.com)

## Prompt:
9/6/2026, 9:05:29 PM

What I have and what I want. Currently I have roles. I planning this role I want. I have this much skills. I mean consider main priority to roles, targeted roles, and experience, zero to two, or zero to one. I'm lying in this range. Second point, location. I'm available on some fixed location like Mumbai, Pune, Hyderabad, this only. So I will keep this list to you. Second point was you said about resume. I think we should not add this and add them, what I want from here. My... I want all job openings, just satisfy my... If role and experience fit, so I should apply on it, not just because of also need to match skill also. But if some skills are missing, that is okay. I should try for it. For now, just give me short what you should do.

## Response:
9/6/2026, 9:05:30 PM · gpt-5-6

Yes. I’d simplify the system around **eligibility + opportunity discovery**, not resume matching.

### What the system should do

1. **Your fixed profile**
   - Target roles — highest priority
   - Experience: **0–1 / 0–2 years**
   - Locations: **Mumbai, Pune, Hyderabad** (your configurable list)
   - Other filters you decide later

2. **Collect jobs**
   - Naukri
   - LinkedIn
   - Indeed
   - Cutshort
   - Hirist
   - Instahyre
   - Wellfound
   - Company career pages / ATS
   - Other useful sources we discover

3. **Filter primarily by**
   **Role + Experience + Location**

   If these fit → **keep the job.**

4. **Skills are NOT a hard filter**
   - Skills match → show them
   - Some skills missing → **still show them**
   - AI can tell you *which skills you're missing*, but shouldn't automatically reject the job.

5. **Deduplicate**
   If the same job appears on Naukri + LinkedIn + company website → show **one job**, with all known application sources.

6. **Give you one prioritized feed**
   
   Example:

   > **47 new jobs found**
   >
   > 31 Role + Experience + Location match  
   > 8 excellent matches  
   > 23 reasonable opportunities  
   > 5 borderline  
   > 16 rejected by your hard filters

So your daily workflow becomes:

**Open one dashboard → review relevant jobs → choose where to apply.**

That's the core MVP I'd build first. **No resume matching, no automatic application, no complicated multi-agent system yet.** We first solve the biggest problem: **finding and filtering all relevant jobs in one place.**

## Prompt:
9/6/2026, 9:07:17 PM

Also, I want all openings on one centralized platform, or you can to my Telegram or WhatsApp. We can do it later. Or also on my email. It's also fine. We can, we can build one dashboard. You will decide it later. But firstly our main target is collect right and all over the required openings. We do not need to, we can't miss any opening. Accuracy is most important. Also, I am ready to give my logins also, my email login, my Naukri login. I'm okay with this. But I have one question also: this work will not damage my, damage or block my ID. Look, I do not want that. Like AI can directly go and apply. I just want you give me the right openings. Okay? And any other point that you want to show me, tell me in short.

## Response:
9/6/2026, 9:07:17 PM · gpt-5-6

Yes — now the goal is very clear.

### Our #1 objective

**Maximum recall, while keeping your accounts safe.**

The system should **collect as many relevant openings as possible**, rather than aggressively filtering them out.

Your hard filters are mainly:

**Target role + 0–2 years experience + Mumbai/Pune/Hyderabad**

Skills are **soft information**, not a reason to discard a job.

### About your account safety

Since you only want **job discovery**, we don't need to automate applications.

That's much safer.

I would **not** build the first version around logging into Naukri/LinkedIn and continuously scraping authenticated pages. Even if you provide credentials, automated activity can violate platform rules and potentially trigger anti-bot systems or account restrictions.

Instead, the architecture should prioritize:

**Public job pages + permitted APIs/feeds + company ATS/career pages + carefully controlled browser collection where permitted**

Then:

**Collector → Normalize → Deduplicate → Eligibility filter → Central database → Your dashboard**

And importantly:

> **Never automatically apply. Never bypass CAPTCHA. Never bypass rate limits or anti-bot protections.**

### One important point

We shouldn't promise literally **“100% of every opening on the internet.”** That's technically impossible because jobs can be private, short-lived, unindexed, or posted only inside closed systems.

Our engineering target should instead be:

> **Maximum possible coverage + aggressive deduplication + minimal false negatives.**

That's the right optimization for your use case.

And I agree with your priority: **accuracy/coverage comes before fancy AI agents.** First we build a reliable job-collection engine; Telegram/WhatsApp/email/dashboard can come afterward.

## Prompt:
9/6/2026, 9:08:40 PM

One more thing, you want a filter from me, right? So what filter you want from? Can you tell me this? So I can give you that I decided, or skip this part. For now I will plan how we can build it. You search it on OpenGitHub and open source any application that provide this service freely. Also check their user reviews.

## Response:
9/6/2026, 9:08:40 PM · gpt-5-6

> **Searching 4 websites**
>
> 
>
> Worked for a couple of seconds

Yes. I checked GitHub/open-source projects specifically around **job aggregation, multi-source discovery, AI matching, and India-focused job search**.

### What I found

The closest projects to what you want are:

1. **ApplyVerse** - probably the closest to our **MVP idea**. It aggregates job boards + company ATS, deduplicates jobs, supports experience/location filters, and has background watching. It is local/open-source. ([GitHub](https://github.com/theabhishekchandra/ApplyVerse?utm_source=chatgpt.com))  
   [ApplyVerse on GitHub](https://github.com/theabhishekchandra/ApplyVerse?utm_source=chatgpt.com)

2. **JobNavigator** - much closer to the **full system** you're imagining: multi-source scraping, AI scoring, React dashboard, Telegram notifications, tracking, etc. ([GitHub](https://github.com/vesaias/JobNavigator?utm_source=chatgpt.com))  
   [JobNavigator on GitHub](https://github.com/vesaias/JobNavigator?utm_source=chatgpt.com)

3. **job-apply-mcp** - extremely relevant to your Indian portals. It supports LinkedIn, Naukri, Wellfound, Indeed, Hirist, Glassdoor, Instahyre and Cutshort. However, it's primarily designed for **auto-application**, which we don't need initially. ([GitHub](https://github.com/pulkit017/job-apply-mcp?utm_source=chatgpt.com))  
   [job-apply-mcp on GitHub](https://github.com/pulkit017/job-apply-mcp?utm_source=chatgpt.com)

4. **RoleMiner** - India-focused engineering job discovery with Greenhouse/Lever/Ashby/Workday, deduplication, location/role filtering, semantic ranking and a React dashboard. ([GitHub](https://github.com/vinayjampana/role-miner?utm_source=chatgpt.com))

5. **Job Board Aggregator** - interesting for the **coverage problem**: it aggregates 1M+ jobs from 20,000+ companies across major ATS systems and has filtering/deduplication. ([GitHub](https://github.com/Feashliaa/job-board-aggregator?utm_source=chatgpt.com))

6. **career-ops-india** - particularly interesting because it has a registry of **230 Indian companies** across Greenhouse, Lever and Ashby. ([GitHub](https://github.com/AnojSKunte/career-ops-india/blob/main/README.md?utm_source=chatgpt.com))

There are also commercial products already attacking this problem. Jobright, for example, combines discovery, matching and application assistance; its own comparison page currently reports 4.8/5 from 1,461 Trustpilot reviews, although that's a vendor-published comparison, so I wouldn't treat that rating as independent evidence. ([Jobright AI](https://jobright.ai/compare/simplify?utm_source=chatgpt.com))

### My conclusion

**We should NOT build everything from scratch.**

We can potentially combine ideas/components from:

**ApplyVerse + RoleMiner + career-ops-india + job-apply-mcp**

and build a **much narrower system specifically for you**:

> **Maximum job discovery → maximum coverage → deduplication → your hard filters → centralized feed.**

No auto-apply initially.

---

### About the filters I need from you

Don't give me 30 filters. For V1, I only need:

**Hard filters**
- Target roles
- Experience range
- Locations
- Remote: Yes/No
- Internship: Yes/No
- Full-time: Yes/No
- Maximum job age: e.g. last 24h / 3 days / 7 days

**Soft information**
- Your skills
- Preferred technologies
- Roles you're willing to consider even if they're not an exact title
- Companies you definitely want / don't want

And one important setting:

**How aggressive should discovery be?**

I'd recommend **“Don't miss” mode**:

> If role + experience + location appear to fit, **keep the job**, even if the skill match is weak.

Then AI can label it *Strong / Possible / Borderline* rather than deleting it.

**That's the filter set I'd want from you before we design the architecture.**

---

**Sources:**

- [GitHub - theabhishekchandra/ApplyVerse: ApplyVerse — free, open-source Chrome extension (Manifest V3) that aggregates developer jobs from job boards and company ATS (Greenhouse, Lever, Ashby, Personio) into one de-duplicated, fit-scored list. No server, all local. · GitHub](https://github.com/theabhishekchandra/ApplyVerse?utm_source=chatgpt.com)
- [Jobright vs Simplify — Feature Comparison (2026)](https://jobright.ai/compare/simplify?utm_source=chatgpt.com)

## Prompt:
9/6/2026, 9:10:03 PM

So what will be the best strategy? We should review their code and try to build already built application, or check their logic and use in our application and try to build an application from scratch. We have a time to build application from scratch, and also this application will also help me to add and improve my portfolio and add to my resume. So we can build also. And if we build, so we have a full customization. But while we build it, we should find the best approach, best tools, best technology, best framework, which architecture. So for this we need to do some deep research also.

## Response:
9/6/2026, 9:10:04 PM · gpt-5-6

> **Searching github.com**
>
> 
>
> Worked for a couple of seconds

Yes. After the research, **I strongly recommend building our own application from scratch - but not from scratch in the sense of reinventing everything.**

The best strategy is:

> **Study the strongest open-source projects → extract their proven patterns → build our own architecture and implementation specifically for your use case.**

### Why I don't recommend simply forking one

The existing projects each solve only part of your problem.

- **ApplyVerse** is excellent for aggregation + deduplication + ATS discovery and is very close to our V1. ([GitHub](https://github.com/theabhishekchandra/ApplyVerse?utm_source=chatgpt.com))
- **JobNavigator** has a much broader architecture: multi-source collection, dashboard, AI scoring, Telegram, scheduling, etc. ([GitHub](https://github.com/vesaias/JobNavigator?utm_source=chatgpt.com))
- **career-ops-india** has a particularly good India-focused approach and directly queries ATS APIs without login/scraping. ([GitHub](https://github.com/AnojSKunte/career-ops-india/blob/main/README.md?utm_source=chatgpt.com))
- **job-apply-mcp** has useful ideas for Indian portals, filtering and persistence, but its main purpose is automated application, which we explicitly don't want in V1. ([GitHub](https://github.com/pulkit017/job-apply-mcp?utm_source=chatgpt.com))
- **Job-Scout** demonstrates a local-first multi-source architecture using JobSpy. ([GitHub](https://github.com/Jmx097/Job-Scout-public?utm_source=chatgpt.com))

So we can **borrow the engineering lessons without inheriting their limitations.**

### The architecture I would aim for

```text
                JOB SOURCES
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
   ATS APIs      Job Boards    Company Pages
       │             │             │
       └─────────────┼─────────────┘
                     ↓
              INGESTION LAYER
                     ↓
             NORMALIZATION
                     ↓
             DEDUPLICATION
                     ↓
             JOB DATABASE
                     ↓
          HARD FILTER ENGINE
      Role + Experience + Location
                     ↓
             AI ENRICHMENT
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
   Role fit     Experience     Skill info
                     ↓
              CENTRAL FEED
                     ↓
           Dashboard / Telegram
```

And **AI should not sit at the beginning of the pipeline**.

That's important.

For example, Greenhouse, Lever and Ashby expose public job APIs, and there are now libraries/projects supporting many more ATS systems. ([Jobspipe](https://jobspipe.dev/blog/public-vs-gated-ats-apis?utm_source=chatgpt.com))

So we should first collect **structured, deterministic data**, then use AI only where it adds value.

### Technology direction

My current preference would be something like:

**Backend:** Python + FastAPI  
**Database:** PostgreSQL  
**Background jobs:** Celery/Redis or a lighter async worker initially  
**Collectors:** `httpx`/asyncio + dedicated ATS adapters  
**Browser automation:** Playwright, only where genuinely necessary  
**AI:** OpenRouter so we can switch models  
**Frontend:** Next.js/React  
**Deployment:** Docker  
**Notifications:** Telegram first, email later

But **I don't want to lock these choices yet**. We should compare the alternatives properly before implementation.

For example, the public ATS landscape is actually much better than I initially expected: Greenhouse, Lever, Ashby and several other systems expose structured job endpoints, meaning we can build a large portion of our collection infrastructure without browser scraping at all. ([Conor's Code](https://conorscode.github.io/ats-api-reference/?utm_source=chatgpt.com))

### And there's a very important portfolio benefit

This won't just be:

> "I built a job scraper."

We can make it a proper **production-style GenAI system**:

**Distributed job ingestion + data normalization + entity resolution/deduplication + ranking + LLM enrichment + scheduled workers + PostgreSQL + API + React dashboard + notifications + observability.**

That is a **much stronger AIML/GenAI/backend portfolio project**.

One thing we should **not** do is build around authenticated LinkedIn/Naukri scraping just because you can give us your credentials. LinkedIn explicitly prohibits third-party crawlers/bots and unauthorized automated access, and similar restrictions can exist on other portals. ([LinkedIn](https://ac.linkedin.com/legal/user-agreement?utm_source=chatgpt.com))

So the engineering challenge becomes more interesting:

> **How do we achieve maximum job coverage without depending on fragile or prohibited scraping?**

That's the research question I would tackle next.

**Next step:** before writing any code, I think we should do a proper **architecture/technology research pass** - compare the existing repositories, source coverage, ATS APIs, JobSpy, Playwright, databases, queues, deduplication approaches, AI ranking approaches, deployment cost, and then produce our **V1 architecture + exact tech stack + development roadmap**.

---

**Sources:**

- [GitHub - theabhishekchandra/ApplyVerse: ApplyVerse — free, open-source Chrome extension (Manifest V3) that aggregates developer jobs from job boards and company ATS (Greenhouse, Lever, Ashby, Personio) into one de-duplicated, fit-scored list. No server, all local. · GitHub](https://github.com/theabhishekchandra/ApplyVerse?utm_source=chatgpt.com)
- [Which ATS APIs are actually public? The 2026 job-data reference](https://jobspipe.dev/blog/public-vs-gated-ats-apis?utm_source=chatgpt.com)
- [ATS Job API Reference — Greenhouse, Lever, Ashby, Workday, SmartRecruiters, Workable, Recruitee, Personio, BambooHR](https://conorscode.github.io/ats-api-reference/?utm_source=chatgpt.com)
- [User Agreement | LinkedIn](https://ac.linkedin.com/legal/user-agreement?utm_source=chatgpt.com)

## Prompt:
9/6/2026, 9:12:00 PM

I was looking in, tech new technologies like LLM and the... I am, if limited, we can add ChatGPT and other AI technologies, multi-AI architecture, submission approach, better database. If needed, because of the data building. So, and we do not need to, my plan was applied KD. So, we applied for that. Time also. This will be later. First what we should plan, we should define map filters first, before anything else.

## Response:
9/6/2026, 9:12:00 PM · gpt-5-6

Exactly. **Before architecture, AI agents, database, scraping, or technology choices, we should freeze the job-discovery filters.**

And I agree with your philosophy:

> **The system should maximize recall. A potentially suitable job should reach you rather than being silently filtered out.**

Let's define only the filters that actually affect whether a job enters your feed.

### Filter map — V1

**1. Target roles — HARD**
- Your primary roles
- Acceptable alternative titles/synonyms
- Roles you explicitly don't want

**2. Experience — HARD**
- Minimum: `0 years`
- Maximum: `2 years`
- Include: Fresher / Entry-level / 0–1 / 0–2
- Decide later whether to include jobs saying `1–3 years` etc.

**3. Location — HARD**
- Mumbai
- Pune
- Hyderabad
- We can make this a configurable list.
- Remote/hybrid/on-site should be separately configurable.

**4. Employment type — HARD/SOFT**
- Full-time
- Internship
- Contract
- Part-time

I'd recommend **Full-time = primary**, Internship = optional, Contract/Part-time = configurable.

**5. Job freshness**
This is important for your "don't miss openings" goal:
- Last 24 hours
- Last 3 days
- Last 7 days
- Older jobs

I would **collect older jobs too**, but clearly label them. That prevents us from accidentally losing a good opening.

**6. Skills — NOT a hard filter**
This is exactly as you said.

Example:

> AI Engineer — 0–2 years — Pune  
> Requires Python + LLM + RAG + AWS  
> You have Python + LLM but not AWS

**KEEP IT.**

The system can simply show:

`Role: Match`  
`Experience: Match`  
`Location: Match`  
`Skills: 7/10`

But it should **not reject it because of AWS**.

**7. Company filters — optional**
- Companies to prioritize
- Companies to exclude
- Startup / MNC / service company / product company

Not necessary for the first version.

---

### The most important design decision

I'd actually split the system into:

**Hard eligibility**

```text
Role
AND
Experience
AND
Location
```

↓

**Everything eligible enters the database**

↓

**AI enrichment**

```text
Skill overlap
Job quality
Role similarity
Seniority interpretation
Potential fit
```

↓

**Ranking**

```text
🔥 High priority
🟢 Good opportunity
🟡 Worth considering
```

This is much better than an AI saying **"not enough skill match → reject."**

And later, when we build the multi-agent architecture, the agents should operate **after collection**, not determine what gets collected.

So yes: **filter definition is Step 0.**

Give me your **target roles + exact locations + employment types + remote preference + how you want to handle experience ranges**, and I'll turn that into the final V1 filter specification before we touch the architecture.

## Prompt:
9/6/2026, 9:16:55 PM

ROLES

P1 — Highest Priority
- AI Engineer
- GenAI Engineer
- Applied AI Engineer
- AI Software Engineer
- AI Developer
- GenAI Developer
- Agentic AI Engineer
- Agentic AI Developer
- LLM Engineer
- LLM Application Developer
- AI Application Engineer
- AI Application Developer
- RAG Engineer
- AI Agent Engineer

P2 — Strong Targets
- Forward Deployed Engineer (AI/FDE)
- AI Backend Engineer
- AI/ML Software Engineer
- Python Backend Engineer
- Python Backend Developer
- Backend Engineer
- Applied Machine Learning Engineer

P3 — Good Backup
- ML Engineer
- Machine Learning Engineer
- Python Developer
- Software Engineer
- Software Developer
- SDE
- Junior Software Engineer
- AI Automation Engineer
- AI Automation Developer

LOCATIONS

P1 — Mumbai region
- Mumbai, Maharashtra
- Navi Mumbai, Maharashtra
- Thane, Maharashtra

P1 — Pune
- Pune, Maharashtra

P2 — Only if salary ≥ ₹5 LPA
- Bengaluru, Karnataka
- Hyderabad, Telangana

SALARY FILTERS

- Mumbai / Navi Mumbai / Thane: No strict minimum
- Pune: Minimum ₹30,000/month (₹3.6 LPA)
- Bengaluru: Minimum ₹5 LPA
- Hyderabad: Minimum ₹5 LPA

GENERAL FILTERS

- Fresher / Entry-level / 0–1 year preferred
- Up to 2 years only when genuinely suitable
- Posted within last 5 days
- Last 24 hours = highest priority
- Verify the actual JD
- Exclude misleading senior roles
- Prefer Python + Backend + APIs + LLMs + RAG + AI Agents + ML
- AI/GenAI is the primary career direction
- Backend/Software roles are supporting routes toward becoming an AI Engineer

EXCLUDE

- Salesforce Developer
- Generic frontend-only roles
- Java/.NET-only roles
- IT Support
- QA/Testing
- Non-technical roles
- AI Architect / GenAI Architect
- AI Product Manager
- AI Business Analyst Look, this is the filter that I decided in my other chat. You can cross-check it, and if you have any question, you can ask me. So can we implement this in this application that we are planning?

## Response:
9/6/2026, 9:16:56 PM · gpt-5-6

Yes. **This filter set is implementable, and I would use it as the V1 specification.** It is also structured well for the system we're planning.

I don't see a blocking question right now. There are just **3 rules I'd clarify/lock before implementation**:

1. **Salary unknown → don't exclude**
   - If a job doesn't publish salary, keep it.
   - Apply the ₹5 LPA rule for Bengaluru/Hyderabad only when salary is actually available.
   - Otherwise mark `Salary: Unknown`.

2. **“Up to 2 years when genuinely suitable” → AI interpretation**
   - `0–1` → automatically eligible.
   - `0–2` → eligible.
   - `1–2` → eligible.
   - `2+` → normally exclude, unless the JD clearly indicates fresher/entry-level suitability despite the wording.
   - `3+` → exclude.

3. **Role matching should use semantic titles, not exact title matching.**
   For example, a company might post:
   > "Generative AI Application Developer"

   It should match your **GenAI Developer / AI Application Developer** targets even though the exact title isn't in your list.

### Your V1 decision pipeline

```text
ALL COLLECTED JOBS
       ↓
Posted ≤ 5 days?
       ↓ YES
Actual JD verified?
       ↓ YES
Excluded role/company/type?
       ↓ NO
Role matches P1/P2/P3?
       ↓ YES
Experience ≤ 2 & genuinely suitable?
       ↓ YES
Location matches?
       ↓ YES
Salary rule satisfied?
       ↓
      KEEP
       ↓
P1 / P2 / P3 classification
       ↓
AI enrichment + ranking
```

**One important change:** don't make the salary filter a simple binary filter when salary is missing. Otherwise we'd lose potentially excellent jobs.

And yes, this is exactly the kind of logic we can make **fully configurable in the application**, rather than hard-coding it. You'll eventually have a settings page where you can change:

`Roles | Priority | Locations | Salary | Experience | Freshness | Exclusions`

without changing code.

Your current filter can therefore become the **initial configuration**, while the application itself becomes reusable.

I would now consider the **filter-definition phase essentially complete**. The next phase should be the deeper technical research you mentioned: **source coverage → collection methods → ATS APIs → scraping/browser strategy → deduplication → database → AI/multi-agent architecture → dashboard → deployment.**

## Prompt:
9/6/2026, 9:49:12 PM

tell me in short where we get issue now? also i have one Q we have chatgpt gemini cloaude like tool ai tools that can also do web search so why we should made one application form scrach? which approch is right ? we can set schedule on chatgpt gemini claude so why we should build applicaton form scrach can we buidd application that give better resuild than this tools is this possibke?

## Response:
9/6/2026, 9:49:31 PM · gpt-5-6

> **Searching 3 websites**
>
> 
>
> Worked for a couple of seconds

Yes - **this is the right question to ask before we build anything.**

### Where we have an issue now

Our main challenge is **job-source coverage**, not AI.

Your requirements are unusually strict:

> “Find *all possible* relevant jobs from Naukri + LinkedIn + Indeed + Cutshort + Hirist + Instahyre + Wellfound + company career pages, apply my exact filters, deduplicate them, and don't miss openings.”

A normal LLM web search is not designed to be a reliable, persistent database/collector for that.

ChatGPT can search the web and run scheduled monitoring tasks, and Gemini now supports scheduled tasks/monitors too. ([OpenAI Help Center](https://help.openai.com/en/articles/9237897?utm_source=chatgpt.com))

But there are limitations around **coverage, repeatability, structured storage, deduplication, source-specific collection, historical state, and precise filtering**.

---

## So should we build an application?

**Yes - but I would NOT build a replacement for ChatGPT/Gemini/Claude.**

Instead:

### Our application = the Job Intelligence Layer

```text
Job sources
   ↓
Our collectors
   ↓
Central database
   ↓
Deduplication
   ↓
Your exact filters
   ↓
AI agents
   ↓
Rank / classify / verify
   ↓
ONE job feed
```

And the AI models become **components inside our application**.

For example:

- **GPT** → difficult JD interpretation
- **Claude** → second opinion / verification
- **Gemini** → additional web research
- **OpenRouter** → model routing + cheaper models for bulk processing
- Traditional Python rules → deterministic filtering
- PostgreSQL → permanent job database

That is actually a much more interesting architecture.

### Can our application produce better results than simply asking ChatGPT?

**For your specific use case: yes, potentially.**

Not because our AI will be smarter than ChatGPT.

Because we'll give it something ChatGPT doesn't have in a normal conversation:

**persistent job database + source-specific collectors + your exact rules + deduplication + history + continuous ingestion.**

For example, instead of asking:

> “Find AI Engineer jobs in Mumbai.”

our system can know:

> “I've already seen these 147 jobs. These 23 are new. These 11 appeared on multiple sources. These 7 satisfy Tanmay's hard filters. These 3 were previously rejected. This one changed its JD today.”

That's the real advantage.

### And we don't need to build everything immediately.

I'd actually recommend a **hybrid strategy**:

**Phase 1:** Build the collector + database + filters.

**Phase 2:** Use existing AI models/APIs for enrichment.

**Phase 3:** Add multi-model/agent architecture only where it demonstrably improves accuracy.

**Phase 4:** Dashboard + Telegram/email.

**Phase 5:** Application assistance, *much later*.

So we're **not building an AI because AI is cool**.

We're building the infrastructure that lets multiple AI tools work on **your continuously collected job dataset**.

That distinction is important - and it makes this a much stronger portfolio project too.

---

**Sources:**

- [Searching the web with ChatGPT | OpenAI Help Center](https://help.openai.com/en/articles/9237897?utm_source=chatgpt.com)

## Prompt:
9/6/2026, 9:53:20 PM

but for now i think i should create one shcedule on gemini or chatgpt for this filfer so my job apply work so be contine right ? <ROLES 
 
P1 — Highest Priority 
- AI Engineer 
- GenAI Engineer 
- Applied AI Engineer 
- AI Software Engineer 
- AI Developer 
- GenAI Developer 
- Agentic AI Engineer 
- Agentic AI Developer 
- LLM Engineer 
- LLM Application Developer 
- AI Application Engineer 
- AI Application Developer 
- RAG Engineer 
- AI Agent Engineer 
 
P2 — Strong Targets 
- Forward Deployed Engineer (AI/FDE) 
- AI Backend Engineer 
- AI/ML Software Engineer 
- Python Backend Engineer 
- Python Backend Developer 
- Backend Engineer 
- Applied Machine Learning Engineer 
 
P3 — Good Backup 
- ML Engineer 
- Machine Learning Engineer 
- Python Developer 
- Software Engineer 
- Software Developer 
- SDE 
- Junior Software Engineer 
- AI Automation Engineer 
- AI Automation Developer 

LOCATIONS 
 
P1 — Mumbai region 
- Mumbai, Maharashtra 
- Navi Mumbai, Maharashtra 
- Thane, Maharashtra 
 
P1 — Pune 
- Pune, Maharashtra 
 
P2 — Only if salary ≥ ₹5 LPA 
- Bengaluru, Karnataka 
- Hyderabad, Telangana 

SALARY FILTERS 
 
- Mumbai / Navi Mumbai / Thane: No strict minimum 
- Pune: Minimum ₹30,000/month (₹3.6 LPA) 
- Bengaluru: Minimum ₹5 LPA 
- Hyderabad: Minimum ₹5 LPA 

GENERAL FILTERS 
 
- Fresher / Entry-level / 0–1 year preferred 
- Up to 2 years only when genuinely suitable 
- Posted within last 5 days 
- Last 24 hours = highest priority 
- Verify the actual JD 
- Exclude misleading senior roles 
- Prefer Python + Backend + APIs + LLMs + RAG + AI Agents + ML 
- AI/GenAI is the primary career direction 
- Backend/Software roles are supporting routes toward becoming an AI Engineer 
 
EXCLUDE 
 
- Salesforce Developer 
- Generic frontend-only roles 
- Java/.NET-only roles 
- IT Support 
- QA/Testing 
- Non-technical roles 
- AI Architect / GenAI Architect 
- AI Product Manager 
- AI Business Analyst> telll me which tool is best for this task which ai tools is best for this task perfeclu deepseek claude chatgpt grok gemini etc ai which one is best?

## Response:
9/6/2026, 9:53:40 PM · gpt-5-6

> **Searched 2 websites**
>
> 
>
> Worked for a couple of seconds

Yes. **For now, I would use an existing AI scheduled task instead of waiting for our application.** It keeps your job search running while we build the proper system.

### My choice: ChatGPT

For **your exact use case**, I'd pick **ChatGPT Scheduled Tasks/Work** first.

Why:

- It can run recurring tasks and perform web searches. ([OpenAI Help Center](https://help.openai.com/en/articles/10291617-what-is-agent-mode?utm_source=chatgpt.com))
- ChatGPT Work can use a cloud browser for supported web tasks, including some signed-in websites, although this should not be used to bypass site restrictions. ([OpenAI Help Center](https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt?utm_source=chatgpt.com))
- It is well suited to following your long, structured filter specification.
- You can receive notifications when the task completes. ([OpenAI Help Center](https://help.openai.com/en/articles/10291617-what-is-agent-mode?utm_source=chatgpt.com))

**Gemini is my second choice.** Gemini Spark also supports scheduled tasks and topic monitors, but Google explicitly says its monitors aren't ideal for fast-moving/time-critical information. ([Google Support](https://support.google.com/gemini/answer/17094710?hl=en-IN&utm_source=chatgpt.com))

I wouldn't choose DeepSeek/Grok/Claude as the primary scheduled job-hunting system right now. They can be useful **later as secondary models** in our own application.

### But one important limitation

Don't expect ChatGPT's scheduled task to guarantee **every job opening** across Naukri, LinkedIn, Cutshort, Hirist, Instahyre, Wellfound, Indeed and hundreds of company career pages.

That's precisely the problem our future application will solve better through **persistent source-specific collectors + database + deduplication**.

So I'd do:

**NOW**

`ChatGPT Scheduled Task → daily job discovery → you apply manually`

**IN PARALLEL**

`We build → multi-source collectors → database → dedup → your filters → AI verification → dashboard/Telegram`

This means **your job search doesn't stop while we're developing the project.**

### And I would use this exact instruction for the scheduled task

Don't simply tell it "find AI jobs." Give it your complete filter specification, and explicitly tell it:

> **Do not discard a job merely because some skills are missing. Role + experience + location are the primary eligibility criteria.**

Also ask it to return **job title, company, location, experience requirement, salary, posting date, source, application link, and why it passed your filters.**

That gives you a useful daily feed while we work on the real system.

If you want, I can create the **perfect ChatGPT Scheduled Task prompt** from your entire filter list so you can paste it directly.

---

**Sources:**

- [Scheduled tasks in ChatGPT | OpenAI Help Center](https://help.openai.com/en/articles/10291617-what-is-agent-mode?utm_source=chatgpt.com)
- [Create and manage schedules for tasks in Gemini Spark - Computer - Gemini Apps Help](https://support.google.com/gemini/answer/17094710?hl=en-IN&utm_source=chatgpt.com)

## Prompt:
9/6/2026, 9:56:53 PM

so skip this we will build our application form scrach so what should be best plan no plan 1st tell me what should be our 1st step for starting buidling this application?

## Response:
9/6/2026, 9:57:12 PM · gpt-5-6

Yes. If we've decided to build our own system, **don't start coding yet**.

### Step 1 — Define the Job Data Contract

Before choosing FastAPI, PostgreSQL, LangGraph, Playwright, agents, etc., we need to define **exactly what one collected job looks like in our system**.

For example:

```text
Job
├── title
├── company
├── location
├── salary
├── experience
├── posted_date
├── description
├── source
├── source_job_id
├── application_url
├── company_url
├── employment_type
├── remote_type
├── collected_at
├── raw_content
└── status
```

Then define:

**What makes two jobs the same?**  
→ deduplication rules.

**What makes a job eligible for Tanmay?**  
→ your filter rules.

**What information must be verified?**  
→ actual JD, location, experience, salary, posting date.

**What information can be AI-generated?**  
→ role classification, P1/P2/P3, skill analysis, ambiguity detection.

This is the foundation because **every collector, database table, AI agent, and dashboard depends on this contract.**

### Then Step 2

Once the data contract is fixed, we research:

**Naukri / LinkedIn / Indeed / Cutshort / Hirist / Instahyre / Wellfound / company ATS → how can we legally and reliably collect data from each?**

Only after that do we choose the architecture and technologies.

So our first concrete task is:

> **Design the Job Data Model + Eligibility/Filter Engine specification.**

And your role/location/experience/salary rules you've already given me become the first input to that specification.

## Prompt:
9/6/2026, 10:10:37 PM

look we need one coding Agent also for this so give me one folder name so i will create that folder in my deskstop and in we will add all doc project prt and rules and all but the main brain was u i am reviewr and gudier and also i will give i mean copy paste promte form u i will use aggy for this work ok so we will work in step by step build something test it if test pass we will move forword ok tell me best approch we need to work like expreicned and pro Dev ok also i want to learn also so we work like that also so i can get learn also 2nd point that Q u asked  deduplication rules.  u can set this your filter rules.  u have fildter actual JD, location, experience, salary, posting date.  in this i want somthng more like company name is this real company is this it or non it also in that product or service base so u i think we need to deside 1st which approch is best for workng? tell me in short

## Response:
9/6/2026, 10:10:56 PM · gpt-5-6

Yes. We should work like a **real software project**, not like “ask AI → generate 5,000 lines → hope it works.”

### Folder name

Create this on your Desktop:

```text
AI-Job-Intelligence
```

Inside, we'll maintain:

```text
AI-Job-Intelligence/
├── docs/          # requirements, architecture, decisions
├── rules/         # your job filters & business rules
├── research/      # research on tools, APIs, projects
├── src/           # actual application
├── tests/         # automated tests
├── scripts/       # utilities / experiments
├── data/          # local development data
├── prompts/       # prompts given to coding/AI agents
└── README.md
```

### How we'll work

**You = Product Owner + Reviewer + Learner**  
**Me = Architect + Technical Lead + Mentor**  
**Antigravity = Coding Agent**

Workflow:

```text
We decide
   ↓
I explain WHY + design the step
   ↓
I give you exact Antigravity prompt
   ↓
Antigravity implements
   ↓
We test
   ↓
❌ Fail → fix
✅ Pass → Git commit
   ↓
Next step
```

**No moving forward until the current step works.**

And I'll explain the important technical decisions while we build so you're learning, not just copying code.

### About your additional filters

Yes, **company intelligence should be part of the system**, but we shouldn't make it a hard rejection initially.

For each company, we can eventually determine:

```text
Company
├── Is it a real/identifiable company?
├── Industry
├── IT / Non-IT
├── Product / Services
├── Startup / MNC / etc.
├── Company website
└── Confidence
```

Then your job record can become:

```text
JOB
 ↓
Basic verification
 ↓
Company verification
 ↓
Role verification
 ↓
Eligibility filters
 ↓
AI classification
 ↓
Priority
```

### The approach I'd choose

**First build the deterministic foundation.**

Not multi-agent.  
Not LLM everywhere.  
Not scraping everywhere.

First:

**Sources → Raw Jobs → Normalized Jobs → Deduplication → Verification → Your Filters → Database**

Then we introduce AI where deterministic code isn't enough.

That's the **professional approach** and also the best learning approach for you.

**Our immediate Step 1:** create the project folder and repository, then we'll write the **V1 Requirements + Job Data Contract** before writing application code.

## Prompt:
9/6/2026, 10:23:46 PM

![38a5446a-75e2-458c-b514-0334e3326d71.png](https://chatgpt.com/backend-api/estuary/content?id=file_00000000b5fc81fa9840de6917d59d94&fn=38a5446a-75e2-458c-b514-0334e3326d71.png&cd=attachment&ts=497887&p=fs&cid=1&sig=5bbd8b8f83760ca188acfd3654b8ba75ed7ead4ef3c946171b290cc5eb0cebc3&v=0)

https://github.com/TANMAY4806w/AI-Job-Intelligence.git yes i create on repo and also opened agy in project folfer with ide what is next step?

## Response:
9/6/2026, 10:24:05 PM · gpt-5-6

> **Searching 7 websites**
>
> 
>
> Worked for a couple of seconds

Perfect. I checked your repository and the screenshot. The repo is **created correctly, but currently empty**, and Antigravity is opened in the correct project folder. ([GitHub](https://github.com/TANMAY4806w/AI-Job-Intelligence.git))

**Don't ask Antigravity to build the application yet.**

Our next step is to establish the **project foundation and requirements**. This is also good engineering practice: GitHub recommends having a clear README and using commits/branches to manage project changes. ([GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories?utm_source=chatgpt.com))

### Step 1 - Give Antigravity this prompt

Copy-paste this into the Antigravity Agent:

```text
We are starting a new production-quality portfolio project called:

AI Job Intelligence

You are the coding agent, but DO NOT start implementing the application yet.

Your first task is PROJECT INITIALIZATION ONLY.

Context:
This application will collect job openings from multiple sources, normalize and deduplicate them, verify job/company information, apply a user's configurable job-search rules, and eventually provide a centralized job feed.

Important development philosophy:
- Build incrementally.
- Do not over-engineer.
- Do not add technologies just because they are popular.
- Do not create AI agents yet.
- Do not build scrapers yet.
- Do not choose the final architecture yet.
- Do not install unnecessary dependencies.
- Every implementation step must be testable.
- We will only move to the next step after the current step passes testing.
- Keep the project portfolio-quality and production-oriented.
- Explain important technical decisions so the project owner can learn.

For now, create ONLY the basic project documentation structure:

/
├── README.md
├── docs/
│   ├── requirements/
│   ├── architecture/
│   ├── decisions/
│   └── development/
├── research/
├── rules/
├── prompts/
├── tests/
└── src/

Do not create application code yet.

Create a professional initial README.md containing:
1. Project name
2. Problem statement
3. Project goal
4. Current scope
5. Planned high-level capabilities
6. Development philosophy
7. Current project status: "Planning / Phase 0"
8. A placeholder roadmap
9. Note that this is a personal portfolio project

Do NOT invent technical decisions or claim features are implemented.

Also create:
docs/requirements/PROJECT_SCOPE.md

This document should contain only the currently known requirements from our discussion:
- Centralized job discovery
- Maximum possible job coverage
- Multiple job sources
- Deduplication
- Actual JD verification
- Role filtering
- Experience filtering
- Location filtering
- Salary filtering
- Job freshness filtering
- Company verification
- Company classification such as IT/non-IT and product/service
- AI/LLM enrichment later
- No automatic job application in V1
- Human review before any future application functionality

Do NOT invent additional requirements.

Finally:
1. Check the directory structure.
2. Check that all Markdown files are valid.
3. Run appropriate basic validation.
4. Show me exactly what files you created and the validation result.
5. Do NOT modify anything outside this project directory.
6. Do NOT commit or push to GitHub yet.

STOP after completing this task.
```

### What we expect after running it

You should see something roughly like:

```text
AI-Job-Intelligence/
├── README.md
├── docs/
│   ├── requirements/
│   │   └── PROJECT_SCOPE.md
│   ├── architecture/
│   ├── decisions/
│   └── development/
├── research/
├── rules/
├── prompts/
├── tests/
└── src/
```

**Then stop. Don't let Antigravity continue building.**

Send me its response/output (or screenshot) here.

I'll review it as your **technical lead**, and if everything passes, we'll move to **Step 2: formalize the requirements + Job Data Contract + filtering specification**.

That way we're actually building this like a professional engineering project, while you learn the reasoning behind each step.

---

**Sources:**

- [TANMAY4806w/AI-Job-Intelligence · GitHub](https://github.com/TANMAY4806w/AI-Job-Intelligence.git)
- [Best practices for repositories - GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories?utm_source=chatgpt.com)

## Prompt:
9/6/2026, 10:27:30 PM

The project initialization for AI Job Intelligence is complete.
  ──────
  ### Created Structure

    AI-Job-Intelligence/
    ├── README.md
    ├── docs/
    │   ├── architecture/
    │   │   └── .gitkeep
    │   ├── decisions/
    │   │   └── .gitkeep
    │   ├── development/
    │   │   └── .gitkeep
    │   └── requirements/
    │       └── PROJECT_SCOPE.md
    ├── prompts/
    │   └── .gitkeep
    ├── research/
    │   └── .gitkeep
    ├── rules/
    │   └── .gitkeep
    ├── src/
    │   └── .gitkeep
    └── tests/
        └── .gitkeep
  ──────
  ### Files Created

  1. **README.md**
      • Project Name: AI Job Intelligence
      • Problem Statement: Addresses fragmented job search platforms, duplicate listings, ghost/unverified postings,
      missing company classifications, and noisy results.
      • Project Goal: Build a centralized, reliable system to collect, normalize, deduplicate, verify, and filter job        
      postings with an intelligent feed.
      • Current Scope: Phase 0 (Planning & Requirements Definition). No application code, scrapers, agents, or frameworks.   
      • Planned Capabilities: Centralized discovery, normalization/deduplication, JD/company verification, targeted
      filtering, company classification, late-stage AI enrichment, and mandatory human review.
      • Development Philosophy: All 11 development principles captured directly.
      • Status: Planning / Phase 0.
      • Roadmap: Phase 0 through Phase 7 placeholder milestones.
      • Portfolio Note: Clarified as an independent, production-grade portfolio project.
  2. **PROJECT_SCOPE.md**
      • Contains strictly the 14 known requirements:
          • Centralized job discovery
          • Maximum possible job coverage
          • Multiple job sources
          • Deduplication
          • Actual JD verification
          • Role filtering
          • Experience filtering
          • Location filtering
          • Salary filtering
          • Job freshness filtering
          • Company verification
          • Company classification (IT / non-IT, product / service)
          • AI/LLM enrichment later
          • No automatic job application in V1
          • Human review before any future application functionality


  ──────
  ### Validation Results

   Check               │ Target                          │ Result │ Notes
  ─────────────────────┼─────────────────────────────────┼────────┼───────────────────────────────────────────────────────   
   Directory Structure │ docs/{requirements,architecture │ PASSED │ All 10 directories created and tracked.
                       │ ,decisions,development},        │        │
                       │ research/, rules/, prompts/,    │        │
                       │ tests/, src/                    │        │
   Markdown Syntax     │ README.md, PROJECT_SCOPE.md     │ PASSED │ Valid CommonMark/GFM syntax, clean headings, and
                       │                                 │        │ working file links.
   Scope Adherence     │ Known requirements only         │ PASSED │ No invented requirements or premature technical
                       │                                 │        │ decisions added.
   Code Isolation      │ Application code / Scrapers /   │ PASSED │ Zero application code or scrapers implemented.
                       │ AI                              │        │
   Workspace Boundary  │ Project directory               │ PASSED │ No modifications outside the workspace. No git
                       │                                 │        │ commits or pushes made.

  Project initialization complete. Awaiting your instructions for the next phase.

## Response:
9/6/2026, 10:27:49 PM · gpt-5-6

Perfect. **Step 1 passed.** The structure is clean, and importantly, Antigravity did not jump ahead into coding.

### Step 2 is next: Requirements & Data Contract

Before we touch any scraper/API/LLM, we need to answer:

> **What exactly is a “Job” in our system, and what information must we collect to decide whether it belongs in your feed?**

We'll define:

1. **Job schema** — title, company, location, salary, experience, JD, source, URL, posting date, etc.
2. **Company schema** — real company, IT/non-IT, product/service, website, etc.
3. **Your filter rules** — the P1/P2/P3 roles, locations, salary thresholds, experience, freshness and exclusions you already gave me.
4. **Deduplication rules** — when Naukri + LinkedIn + company career page are actually the same job.
5. **Verification rules** — what counts as verified vs uncertain.
6. **Keep vs reject vs flag** — especially important because your priority is **not missing good openings**.

### But one change from our earlier plan

I don't want Antigravity to design these rules itself.

**We should design the specification together first**, because these are the core business rules of your application. Then I'll give Antigravity an exact implementation prompt.

So **don't send another prompt to Antigravity yet.**

Our next step is to create the **V1 Job Data Contract + Filter Specification** here first. Once we agree on it, I'll give you the exact copy-paste prompt for Antigravity.

That will be our first real engineering milestone.

## Prompt:
9/6/2026, 10:29:22 PM

ok

## Response:
9/6/2026, 10:29:41 PM · gpt-5-6

Good. We'll proceed step by step.

**Next: V1 Job Data Contract + Filter Specification.**  
I'll design it first, you review/challenge it, and only after you approve it will we give the implementation prompt to Antigravity.

## Prompt:
9/6/2026, 10:29:47 PM

ok design it

## Response:
9/6/2026, 10:30:06 PM · gpt-5-6

Yes. Let's design **V1 carefully before coding**.

The key principle is:

> **Collect first, filter second, enrich third. Never let an uncertain AI judgment cause us to lose a potentially relevant job.**

# V1 — Job Data Contract + Filter Specification

## 1. Job record

Every source must eventually convert its job into the same structure:

```text
Job
├── identity
│   ├── job_id
│   ├── source
│   ├── source_job_id
│   └── source_url
│
├── basic
│   ├── title
│   ├── company_name
│   ├── company_url
│   ├── location
│   ├── employment_type
│   └── remote_type
│
├── job_details
│   ├── description
│   ├── responsibilities
│   ├── requirements
│   ├── skills
│   └── experience_requirement
│
├── compensation
│   ├── salary_min
│   ├── salary_max
│   └── salary_period
│
├── dates
│   ├── posted_at
│   ├── updated_at
│   └── collected_at
│
├── verification
│   ├── jd_verified
│   ├── company_verified
│   ├── salary_verified
│   └── verification_confidence
│
├── classification
│   ├── role_priority       # P1/P2/P3
│   ├── company_type        # Product/Service/Other/Unknown
│   ├── company_sector      # IT/Non-IT/Unknown
│   └── relevance_status
│
└── application
    ├── application_url
    └── application_status
```

### Important

We should **store the raw job data as well**.

Why?

If our parser makes a mistake later, we can re-process the original JD without scraping the source again.

---

# 2. Company record

Company information deserves its own entity.

```text
Company
├── company_id
├── name
├── normalized_name
├── website
├── industry
├── sector
│   ├── IT
│   ├── Non-IT
│   └── Unknown
├── business_model
│   ├── Product
│   ├── Services
│   ├── Both
│   └── Unknown
├── verified
├── verification_source
└── confidence
```

This lets us eventually answer things like:

> "Show me AI Engineer jobs from IT product companies."

without having to analyze the company from scratch every time.

---

# 3. Your eligibility engine

This is where your rules become code.

### Hard eligibility

```text
ROLE
AND
EXPERIENCE
AND
LOCATION
AND
SALARY RULE
AND
FRESHNESS
```

But **unknown information should not automatically mean rejection.**

Example:

```text
Salary = Unknown
```

For Mumbai:

→ KEEP

For Hyderabad:

→ KEEP + `salary_unknown`

Because your objective is **don't miss opportunities**.

---

# 4. Role matching

We'll maintain your three levels:

### P1

AI Engineer  
GenAI Engineer  
Applied AI Engineer  
AI Software Engineer  
AI Developer  
GenAI Developer  
Agentic AI Engineer  
Agentic AI Developer  
LLM Engineer  
LLM Application Developer  
AI Application Engineer  
AI Application Developer  
RAG Engineer  
AI Agent Engineer

### P2

Forward Deployed Engineer  
AI Backend Engineer  
AI/ML Software Engineer  
Python Backend Engineer  
Python Backend Developer  
Backend Engineer  
Applied Machine Learning Engineer

### P3

ML Engineer  
Machine Learning Engineer  
Python Developer  
Software Engineer  
Software Developer  
SDE  
Junior Software Engineer  
AI Automation Engineer  
AI Automation Developer

But **exact title matching is not enough**.

We'll eventually have:

```text
Job title
   ↓
Rule-based matching
   ↓
Semantic/LLM matching when ambiguous
   ↓
P1 / P2 / P3 / Not Relevant
```

Example:

> "Generative AI Application Developer"

should correctly map to P1.

---

# 5. Experience rules

Your rule becomes:

| JD says | Result |
|---|---|
| Fresher | KEEP |
| Entry level | KEEP |
| 0–1 | KEEP |
| 0–2 | KEEP |
| 1–2 | KEEP |
| 2 years | KEEP |
| 1–3 | **Flag / review** |
| 2–3 | **Flag / review** |
| 3+ | Normally exclude |
| Senior | Exclude |
| Lead | Exclude |
| Architect | Exclude |

The **Flag/Review** category is important.

We don't want an overly simplistic parser to throw away a good opening.

---

# 6. Location rules

### P1

```text
Mumbai
Navi Mumbai
Thane
Pune
```

### P2

```text
Bengaluru
Hyderabad
```

But Bengaluru/Hyderabad require:

```text
Salary >= ₹5 LPA
```

when salary is known.

Unknown salary:

```text
KEEP
status = SALARY_UNKNOWN
```

This preserves recall.

---

# 7. Freshness

Your rule:

```text
> 5 days old → exclude
```

Priority:

```text
0–24 hours       → 🔥 Highest
1–3 days         → High
3–5 days         → Normal
>5 days          → Exclude
```

We'll use the **actual posting date where possible**, rather than trusting only text like "2 days ago."

---

# 8. Skills

**Skills are NOT eligibility criteria.**

Instead:

```text
Skills extracted
       ↓
Compare with your skill profile
       ↓
Skill overlap information
```

Example:

```text
Role:          MATCH
Experience:    MATCH
Location:      MATCH
Salary:        MATCH
Skills:        65%
```

The job remains eligible.

This is exactly what you wanted.

---

# 9. Company verification

We should verify:

```text
Is this a real identifiable company?
```

Then classify:

```text
IT / Non-IT / Unknown
```

and:

```text
Product / Services / Both / Unknown
```

But **Unknown should not automatically exclude the job**.

Instead:

```text
company_verified = false
company_confidence = low
```

and potentially flag it for review.

---

# 10. JD verification

This is particularly important.

A job shouldn't become "verified" simply because a portal has a listing.

We want to eventually check:

```text
Does the actual JD exist?
Does the application URL work?
Is the role actually what the title claims?
Is the location correct?
Is the experience requirement correct?
Is the posting date plausible?
```

We'll store the evidence rather than just:

```text
verified = true
```

Eventually:

```text
verification
├── source_verified
├── jd_verified
├── company_verified
├── location_verified
├── experience_verified
└── salary_verified
```

This makes the system auditable.

---

# 11. Exclusions

Hard exclusions:

```text
Salesforce Developer
Frontend-only
Java-only
.NET-only
IT Support
QA
Testing
Non-technical
AI Architect
GenAI Architect
AI Product Manager
AI Business Analyst
```

But we need one nuance.

**"Python + Java" ≠ Java-only.**

If the job is genuinely an AI/Backend role and Java is merely one of several technologies, we should keep it.

So exclusion should consider the **actual JD**, not just keyword matching.

---

# 12. Deduplication

This is one of the most important parts.

Suppose:

```text
LinkedIn → AI Engineer @ XYZ
Naukri   → AI Engineer @ XYZ
Company  → AI Engineer @ XYZ
```

We want:

```text
ONE JOB
```

with:

```text
Sources:
✓ LinkedIn
✓ Naukri
✓ Company Website
```

Deduplication should progressively compare:

1. Source job ID
2. Application URL
3. Company
4. Normalized title
5. Location
6. Similarity of JD
7. Posting date

We'll eventually use **deterministic matching first + semantic similarity for ambiguous cases**.

---

# 13. Final job status

I propose these statuses:

```text
NEW
ELIGIBLE
REVIEW
REJECTED
DUPLICATE
EXPIRED
VERIFICATION_FAILED
```

And separately:

```text
P1 / P2 / P3
```

So a job could be:

> `ELIGIBLE + P1 + HIGH_PRIORITY`

rather than having one giant status field.

---

# 14. Most important architecture principle

Our pipeline should be:

```text
                COLLECT
                   ↓
              RAW JOB DATA
                   ↓
             NORMALIZE
                   ↓
            DEDUPLICATE
                   ↓
          BASIC VERIFICATION
                   ↓
          HARD FILTER ENGINE
                   ↓
          AI ENRICHMENT
                   ↓
          PRIORITY / RANKING
                   ↓
            CENTRAL FEED
```

**AI comes after collection and basic deterministic processing.**

That gives us both:

- **Reliability** from normal code
- **Intelligence** from LLMs

And later we can experiment with GPT + Gemini + Claude + other models without rebuilding the core system.

---

## One thing I want to change before we freeze it

I recommend adding one more concept:

### `REJECTION_REASON`

If a job is rejected, the system must explain why.

Example:

```text
REJECTED

Reason:
Location = Chennai

OR

Reason:
Experience = 4–6 years

OR

Reason:
Role = Salesforce Developer
```

This is extremely useful for **debugging the filter engine and measuring false negatives**.

And that's important because our primary metric is not "how many jobs did we reject?"

It's:

> **How many relevant jobs did we successfully discover and deliver to you?**

If you're happy with this structure, **Step 2 is to turn this into a formal `V1_SPECIFICATION.md` document**, and then we can give Antigravity a controlled implementation prompt.

## Prompt:
9/6/2026, 10:46:52 PM

i read all and i approve rules and logic this is perfect

## Response:
9/6/2026, 10:47:10 PM · gpt-5-6

Approved. We can now treat **V1 Job Data Contract + Filter Logic as frozen baseline requirements**.

The next step is **documentation, not implementation yet**. We want Antigravity to convert what we approved into authoritative project specs so future coding agents don't reinterpret our rules.

### Give Antigravity this prompt

```text
We have completed and approved the V1 business rules for AI Job Intelligence.

Your task is DOCUMENTATION ONLY.

Do NOT implement application code.
Do NOT install dependencies.
Do NOT choose frameworks/databases.
Do NOT design scraping architecture.
Do NOT create AI agents.
Do NOT commit or push.

Create the following files:

1. docs/requirements/V1_SPECIFICATION.md
2. docs/requirements/JOB_DATA_CONTRACT.md
3. rules/JOB_FILTERS_V1.md
4. rules/DEDUPLICATION_V1.md
5. rules/VERIFICATION_V1.md

--------------------------------------------------
CORE DESIGN PRINCIPLE
--------------------------------------------------

The system optimizes for maximum recall.

A potentially relevant job should NOT be silently discarded because
some information is missing or ambiguous.

Pipeline philosophy:

COLLECT
→ RAW DATA
→ NORMALIZE
→ DEDUPLICATE
→ BASIC VERIFICATION
→ HARD FILTERS
→ AI ENRICHMENT
→ PRIORITY/RANKING
→ CENTRAL FEED

AI must not be responsible for initial collection or deterministic
filtering when normal rules can solve the problem.

Unknown information should normally produce KEEP/REVIEW rather than
automatic rejection.

--------------------------------------------------
JOB DATA CONTRACT
--------------------------------------------------

Define a Job entity containing at minimum:

Identity:
- job_id
- source
- source_job_id
- source_url

Basic:
- title
- company_name
- company_url
- location
- employment_type
- remote_type

Job details:
- description
- responsibilities
- requirements
- skills
- experience_requirement

Compensation:
- salary_min
- salary_max
- salary_period
- salary_currency

Dates:
- posted_at
- updated_at
- collected_at

Verification:
- source_verified
- jd_verified
- company_verified
- location_verified
- experience_verified
- salary_verified
- verification_confidence

Classification:
- role_priority
- company_type
- company_sector
- relevance_status

Application:
- application_url
- application_status

Filtering/audit:
- eligibility_status
- rejection_reason
- review_reason

The system MUST also preserve raw source data so jobs can later be
reprocessed without recollecting them.

--------------------------------------------------
COMPANY DATA CONTRACT
--------------------------------------------------

Define a Company entity containing:

- company_id
- name
- normalized_name
- website
- industry
- sector: IT / NON_IT / UNKNOWN
- business_model: PRODUCT / SERVICES / BOTH / UNKNOWN
- verified
- verification_source
- confidence

Unknown company classification must NOT automatically reject a job.

--------------------------------------------------
TARGET ROLES
--------------------------------------------------

P1 — Highest Priority

- AI Engineer
- GenAI Engineer
- Applied AI Engineer
- AI Software Engineer
- AI Developer
- GenAI Developer
- Agentic AI Engineer
- Agentic AI Developer
- LLM Engineer
- LLM Application Developer
- AI Application Engineer
- AI Application Developer
- RAG Engineer
- AI Agent Engineer

P2 — Strong Targets

- Forward Deployed Engineer (AI/FDE)
- AI Backend Engineer
- AI/ML Software Engineer
- Python Backend Engineer
- Python Backend Developer
- Backend Engineer
- Applied Machine Learning Engineer

P3 — Good Backup

- ML Engineer
- Machine Learning Engineer
- Python Developer
- Software Engineer
- Software Developer
- SDE
- Junior Software Engineer
- AI Automation Engineer
- AI Automation Developer

Role matching must eventually support title normalization and
semantic equivalence.

Example:

"Generative AI Application Developer"

may map to P1 even without an exact string match.

Do NOT implement semantic matching yet.

--------------------------------------------------
EXPERIENCE RULES
--------------------------------------------------

Fresher       → KEEP
Entry-level   → KEEP
0–1 years     → KEEP
0–2 years     → KEEP
1–2 years     → KEEP
2 years       → KEEP

1–3 years     → REVIEW
2–3 years     → REVIEW

3+ years      → normally REJECT

Clearly Senior / Lead / Architect positions → REJECT

Ambiguous or missing experience → REVIEW/KEEP rather than silently
rejecting.

--------------------------------------------------
LOCATION RULES
--------------------------------------------------

P1 locations:

- Mumbai, Maharashtra
- Navi Mumbai, Maharashtra
- Thane, Maharashtra
- Pune, Maharashtra

P2 locations:

- Bengaluru, Karnataka
- Hyderabad, Telangana

Location aliases should eventually be normalized.

--------------------------------------------------
SALARY RULES
--------------------------------------------------

Mumbai / Navi Mumbai / Thane:
- No strict minimum.

Pune:
- Minimum ₹30,000/month
- Equivalent ₹3.6 LPA.

Bengaluru:
- Minimum ₹5 LPA.

Hyderabad:
- Minimum ₹5 LPA.

IMPORTANT:

If salary is unknown, DO NOT automatically reject the job.

Keep/review the job and mark:

salary_verified = false

and/or an appropriate salary-unknown review reason.

--------------------------------------------------
FRESHNESS
--------------------------------------------------

0–24 hours:
Highest priority

1–3 days:
High priority

3–5 days:
Normal priority

Older than 5 days:
Normally exclude from the active feed.

Preserve collected records even if they later become old/expired.

--------------------------------------------------
SKILLS
--------------------------------------------------

Skills are NOT a hard eligibility filter.

Preferred direction includes:

- Python
- Backend
- APIs
- LLMs
- RAG
- AI Agents
- Machine Learning

Missing skills must NOT cause automatic rejection when the role,
experience and location are otherwise suitable.

Skills will later be used for enrichment/ranking.

--------------------------------------------------
CAREER DIRECTION
--------------------------------------------------

Primary direction:
AI / GenAI Engineering

Backend/Software roles are supporting routes toward becoming an
AI Engineer.

--------------------------------------------------
EXCLUSIONS
--------------------------------------------------

Exclude:

- Salesforce Developer
- Generic frontend-only roles
- Java-only roles
- .NET-only roles
- IT Support
- QA/Testing
- Non-technical roles
- AI Architect
- GenAI Architect
- AI Product Manager
- AI Business Analyst

IMPORTANT:

"Java-only" and ".NET-only" mean the role is fundamentally centered
on those stacks.

A relevant AI/backend job mentioning Java or .NET among several
technologies must NOT automatically be rejected.

Use the actual JD eventually when resolving ambiguous exclusions.

--------------------------------------------------
DEDUPLICATION
--------------------------------------------------

The same opening may appear on LinkedIn, Naukri, company career pages,
Indeed, etc.

The goal is ONE canonical Job with multiple source references.

Potential evidence:

1. source_job_id
2. application URL
3. company
4. normalized title
5. normalized location
6. JD similarity
7. posting date

Design deduplication as staged evidence.

Deterministic/high-confidence evidence should be preferred first.

Semantic similarity may later resolve ambiguous duplicates.

Do NOT implement semantic deduplication yet.

Never permanently discard duplicate source information.

The canonical job should retain references to every source where the
opening was discovered.

--------------------------------------------------
VERIFICATION
--------------------------------------------------

Verification should eventually answer independently:

- Is the source valid?
- Does the actual JD exist?
- Is the application URL valid?
- Is the company identifiable/real?
- Is the location supported by the JD?
- Is the experience requirement supported by the JD?
- Is salary actually stated?
- Is the posting date supported/plausible?

Do NOT represent verification as only one boolean.

Verification should be auditable and confidence-aware.

--------------------------------------------------
STATUSES
--------------------------------------------------

Support conceptual statuses:

NEW
ELIGIBLE
REVIEW
REJECTED
DUPLICATE
EXPIRED
VERIFICATION_FAILED

Role priority is separate:

P1
P2
P3
NOT_RELEVANT

Priority/ranking should also remain separate from lifecycle and
eligibility status.

--------------------------------------------------
REJECTION / REVIEW AUDITABILITY
--------------------------------------------------

Every rejected job MUST have a machine-readable rejection reason.

Examples:

LOCATION_NOT_ALLOWED
EXPERIENCE_TOO_HIGH
EXCLUDED_ROLE
JOB_TOO_OLD

Every REVIEW job should similarly explain why human/AI review is
needed.

Examples:

EXPERIENCE_AMBIGUOUS
SALARY_UNKNOWN
LOCATION_AMBIGUOUS
COMPANY_UNVERIFIED

This is important because false negatives must be measurable and
debuggable.

--------------------------------------------------
V1 PRODUCT BOUNDARY
--------------------------------------------------

V1 focuses on:

- discovering jobs
- collecting jobs
- normalization
- deduplication
- verification
- filtering
- storing jobs
- presenting relevant jobs later

V1 DOES NOT automatically apply for jobs.

Any future application functionality must require human review.

--------------------------------------------------
DOCUMENTATION REQUIREMENTS
--------------------------------------------------

Organize these rules professionally across the five requested files.

Avoid unnecessary duplication between documents. Cross-reference
documents using relative Markdown links where appropriate.

V1_SPECIFICATION.md should act as the high-level authoritative
specification/index.

JOB_DATA_CONTRACT.md should define the conceptual Job and Company
schemas and field semantics.

JOB_FILTERS_V1.md should contain the complete deterministic filtering
rules and priorities.

DEDUPLICATION_V1.md should define the deduplication philosophy,
evidence hierarchy, canonical-job concept, and ambiguous-case
handling.

VERIFICATION_V1.md should define verification dimensions,
confidence/auditability principles, and unknown-data behavior.

Clearly label anything intentionally deferred to future design.

Do NOT invent implementation technologies.

After creating the documents:

1. Validate the directory structure.
2. Validate Markdown.
3. Check internal relative links.
4. Check all approved rules are represented.
5. Check for contradictions between documents.
6. Report any ambiguity you discovered rather than silently deciding it.
7. Show the files created/modified.
8. Show validation results.

STOP after documentation and validation.

Do not commit or push.
```

### Why we're doing this

These files become the project's **source of truth**.

Later, when Antigravity—or even another coding agent—starts making decisions we don't want, we can simply say:

> Implement according to `V1_SPECIFICATION.md`. Do not modify business rules.

That prevents the project from slowly drifting away from what we designed.

Once Antigravity finishes, **send me its output**. I'll review any ambiguities it finds. If it passes, we'll make our **first Git commit** and then move into technical/source research before selecting the architecture.

## Prompt:
9/6/2026, 10:51:33 PM

Validating Documentation and Constraints
  The V1 business rules, data contracts, filtering logic, deduplication hierarchy, and verification specifications have      
  been documented and validated.
  ──────
  ### Files Created & Updated

    AI-Job-Intelligence/
    ├── README.md                                    [Updated with V1 spec links & status]
    ├── docs/
    │   └── requirements/
    │       ├── JOB_DATA_CONTRACT.md                 [New: Conceptual Job, Company, & Source Ref schemas]
    │       ├── PROJECT_SCOPE.md                     [Baseline requirements]
    │       └── V1_SPECIFICATION.md                  [New: Authoritative V1 system spec & index]
    └── rules/
        ├── DEDUPLICATION_V1.md                      [New: Multi-source evidence hierarchy & merge rules]
        ├── JOB_FILTERS_V1.md                        [New: Deterministic role, exp, location, salary rules]
        └── VERIFICATION_V1.md                       [New: 8-dimension auditability & confidence rules]

  1. **V1_SPECIFICATION.md**
      • Authoritative specification and index for V1.
      • Establishes the Maximum Recall principle and the 9-stage pipeline (COLLECT → CENTRAL FEED).
      • Defines orthogonal separation between Lifecycle / Eligibility Status (NEW, ELIGIBLE, REVIEW, REJECTED, DUPLICATE,    
      EXPIRED, VERIFICATION_FAILED) and Role Priority (P1, P2, P3, NOT_RELEVANT).
      • Mandates machine-readable reason codes for all REJECTED and REVIEW decisions.
      • Explicitly establishes V1 boundaries (zero automated applications; mandatory human review).
  2. **JOB_DATA_CONTRACT.md**
      • Technology-agnostic conceptual contract for the canonical Job entity across all required groups: Identity, Basic,    
      Job Details, Compensation, Dates, Verification, Classification, Application, and Filtering/Audit.
      • Introduces the JobSourceReference entity to preserve raw payloads and retain multi-source provenance without data    
      loss.
      • Technology-agnostic conceptual contract for the Company entity (sector: IT / NON_IT / UNKNOWN, business_model:       
      PRODUCT / SERVICES / BOTH / UNKNOWN).
      • Enforces zero silent rejections on unknown company classifications or missing salary data.
  3. **JOB_FILTERS_V1.md**
      • Full deterministic rule taxonomy:
          • Role Priorities: 14 P1 roles (AI/GenAI/Agentic/LLM), 7 P2 roles (AI Backend/Applied ML/Python Backend), 9 P3     
          roles (Software/ML/Python foundations).
          • Hard Exclusions: Salesforce, generic frontend-only, IT support, QA/testing, non-technical, AI Architect/PM/BA.   
          • Tech-Stack Nuance: Distinguishes fundamental "Java-only" / ".NET-only" positions from AI/backend roles
          mentioning Java/.NET alongside modern stacks.
          • Experience Ladder: 0–2 years (KEEP), 1–3 and 2–3 years (REVIEW), 3+ years and Senior/Lead/Architect (REJECT),    
          ambiguous/missing (REVIEW/KEEP).
          • Location Tiers: P1 (Mumbai, Navi Mumbai, Thane, Pune), P2 (Bengaluru, Hyderabad).
          • Regional Salary Floors: Mumbai/Navi Mumbai/Thane (no minimum), Pune (≥ ₹30k/mo or ₹3.6 LPA), Bengaluru (≥ ₹5     
          LPA), Hyderabad (≥ ₹5 LPA). Unknown salary produces KEEP/REVIEW with salary_verified = false.
          • Freshness Cutoffs: 0–24h (Highest), 1–3d (High), 3–5d (Normal), >5d (JOB_TOO_OLD, excluded from active feed,     
          preserved in storage).
          • Skills Policy: Non-filtering advisory signals reserved for ranking/enrichment.

  4. **DEDUPLICATION_V1.md**
      • Staged evidence hierarchy:
          • Stage 1: Exact source_job_id on identical platform (Confidence: 1.0)
          • Stage 2: Canonical ATS / application URL match (Confidence: 0.98)
          • Stage 3: Composite deterministic match: company + title + location + date proximity ≤14 days (Confidence: 0.     
          90)
          • Stage 4: Ambiguous fuzzy match → flagged as review_reason = DUPLICATE_AMBIGUOUS (Confidence: 0.70–0.85)
      • Canonical field merge precedence (Direct career portal > aggregators).
      • Zero provenance loss guarantee via linked JobSourceReference records.
  5. **VERIFICATION_V1.md**
      • Multi-dimensional, independent verification:
          1. Source Validity (source_verified)
          2. Actual JD Existence (jd_verified)
          3. Application URL Validity (application_url reachability)
          4. Company Legitimacy (company_verified)
          5. Location Consistency (location_verified)
          6. Experience Consistency (experience_verified)
          7. Salary Statedness (salary_verified)
          8. Posting Date Plausibility (posted_at check)
      • Weighted composite verification_confidence score (0.0 - 1.0).
      • Explicit distinction between Hard Technical Failure (VERIFICATION_FAILED) vs. Information Ambiguity (REVIEW /        
      KEEP).

  ──────
  ### Validation Results

   Validation Check        │ Target                          │ Status │ Details
  ─────────────────────────┼─────────────────────────────────┼────────┼───────────────────────────────────────────────────   
   Directory Structure     │ docs/requirements/, rules/,     │ PASSED │ All required files and folders are positioned        
                           │ research/, prompts/, tests/,    │        │ correctly.
                           │ src/                            │        │
   Markdown Syntax         │ All 5 new/updated documents     │ PASSED │ CommonMark / GFM compliant; clean headings, code     
                           │                                 │        │ fences, and tables.
   Internal Relative Links │ Cross-document references       │ PASSED │ Portable relative links (../../rules/..., ./...)     
                           │                                 │        │ verified across all documents.
   Rule Representation     │ Core principles, roles,         │ PASSED │ 100% of approved criteria and nuances faithfully     
                           │ experience, locations,          │        │ captured.
                           │ salaries, exclusions            │        │
   Document Consistency    │ Cross-document alignment        │ PASSED │ Zero contradictions across statuses, thresholds,     
                           │                                 │        │ or data contracts.
   Technology Neutrality   │ Deferral of frameworks, DBs,    │ PASSED │ Zero application code, ORM schemas, database
                           │ scrapers, AI agents             │        │ engines, or scraper implementations.
   Repository Hygiene      │ Git commits & pushes            │ PASSED │ No git commits or pushes executed.
  ──────
  ### Ambiguities Discovered (For Future Review)

  Rather than making unilateral assumptions, the following edge cases have been identified and tagged for your input
  before implementation:

  1. Remote Roles with Head Offices Outside P1/P2 Locations:
      • Context: The location rules accept P1/P2 cities and exclude others. If a job is explicitly marked remote_type =      
      REMOTE (e.g., remote across India or global), but the company is incorporated outside P1/P2 (e.g., Delhi NCR,
      Chennai, or US-based with India remote payroll):
      • Current Stance in Docs: Treated as eligible for REVIEW if remote; explicit national/international remote criteria    
      will be finalized in Phase 5.
  2. Overlapping Broad Experience Ranges (e.g., "2–4 years" or "2–5 years"):
      • Context: Rules define 0–2 as KEEP, 1–3 and 2–3 as REVIEW, and 3+ as REJECT.
      • Current Stance in Docs: Any range overlapping 2 years that extends beyond 3 years is routed to REVIEW with
      review_reason = EXPERIENCE_AMBIGUOUS to avoid false negatives.
  3. Cross-Source Attribute Conflicts During Deduplication:
      • Context: When deduplicating the same opening discovered on both LinkedIn and Naukri, one source might state "0–2     
      years" while the other states "2–4 years", or one might list a salary while the other does not.
      • Current Stance in Docs: Direct ATS / career portal takes precedence over job boards. For conflicting salary or       
      experience data between aggregators, the more permissive or explicit field is retained for canonical evaluation        
      while retaining both raw source records.
  4. Posting Date Latency vs. Initial Ingestion:
      • Context: A high-quality role posted 6 days ago on a company website might be crawled for the first time today.       
      • Current Stance in Docs: The freshness filter applies to original publication date (posted_at > 5 days triggers       
      JOB_TOO_OLD). We will evaluate whether newly discovered postings should receive an initial grace period in Phase 5.    

  ──────
  Task completed. All requested documentation and contracts are in place. Standing by for your instructions.

## Response:
9/6/2026, 10:51:52 PM · gpt-5-6

Good. **Documentation phase passes**, but I spotted one thing we should fix *before* implementation: Antigravity introduced decisions that we had intentionally left open.

Specifically:

- Remote-job handling
- Cross-source conflict resolution
- Posting-date grace period
- Some deduplication confidence thresholds

Those shouldn't silently become product rules yet.

### My recommendation

Before coding, let's do **one short “requirements freeze” review**.

We should decide those 4 ambiguities, then:

**Requirements frozen → Git commit → technical research → architecture → implementation.**

I would **not ask Antigravity to code yet**.

For now, I recommend:

1. **Remote:** treat as a separate location category; don't reject automatically. Review until we define exact remote policy.
2. **2–4 / 2–5 years:** REVIEW, because your priority is not missing opportunities.
3. **Conflicting sources:** don't choose the "more permissive" value automatically. Preserve both and mark the field as conflicting. This is safer for accuracy.
4. **6-day-old job discovered today:** keep it out of the *fresh active feed*, but preserve it in the database. Otherwise we distort the meaning of "posted within 5 days."

Once we lock those, **we can make the first commit** and move to the genuinely interesting part: researching the best collection architecture and source strategy.

So **don't change anything yet**. We should review these four together first.

## Prompt:
9/6/2026, 10:55:04 PM

**2–4 / 2–5 years:** REVIEW, because your priority is not missing opportunities.  if the experince start form 2 to 5 so i think we should exclude it beocude my total exprince include intership + full time is 4 + 7 month so we should keep like 1 to part and 0 to part only other thib are right go head

## Response:
9/6/2026, 10:55:23 PM · gpt-5-6

Yes, agreed. That makes the experience rule much cleaner.

### Final experience rule

Because you're targeting **entry-level / early-career roles**, we'll use:

- **Fresher / 0–1 year → KEEP**
- **0–2 years → KEEP**
- **1–2 years → KEEP**
- **1–3 years → REVIEW** — because it still includes candidates around your experience level
- **2–3 years → REVIEW**
- **2–4 years → EXCLUDE**
- **2–5 years → EXCLUDE**
- **3+ years → EXCLUDE**
- **Senior / Lead / Architect → EXCLUDE**
- **Missing/unclear experience → REVIEW**

So the key rule is:

> **If the experience range starts at 2 years or more, exclude it when the upper range goes beyond your target.**

Everything else from the previous review stays unchanged.

One small correction: you mentioned **“4 + 7 month”** experience. For the job filter, we should **not hard-code your personal experience duration into the rule**. The system's target remains the role's stated entry-level/0–2 suitability. Your actual experience can later be stored in your profile for more nuanced ranking.

### Now we're ready

I consider the **V1 business rules frozen**.

Next sequence:

**1. Update the documentation with this final experience rule**  
**2. Validate**  
**3. First Git commit**  
**4. Research job-source/collection technologies**  
**5. Design architecture**  
**6. Only then start coding**

I'll give you the exact Antigravity prompt for **Step 1 (update + validate + commit preparation)** next.

## Prompt:
9/6/2026, 10:56:09 PM

ok give it

## Response:
9/6/2026, 10:56:28 PM · gpt-5-6

> **Searching 6 websites**
>
> 
>
> Worked for a couple of seconds

Yes. Give Antigravity this exact prompt. I also want it to **update the existing documentation only and create the first atomic commit**. Keeping commits small and logically focused is good Git practice. ([GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories?utm_source=chatgpt.com))

```text
We have now completed and approved the V1 requirements review.

This is a DOCUMENTATION + VERSION CONTROL step only.

Do NOT implement application code.
Do NOT install dependencies.
Do NOT select frameworks.
Do NOT design scraping architecture.
Do NOT create AI agents.
Do NOT modify the approved business logic except for the specific
experience-rule correction below.

==================================================
1. FINAL EXPERIENCE RULE - AUTHORITATIVE
==================================================

Update all relevant documentation so the experience policy is:

KEEP:
- Fresher
- Entry-level
- 0-1 years
- 0-2 years
- 1-2 years

REVIEW:
- 1-3 years

EXCLUDE:
- 2-3 years
- 2-4 years
- 2-5 years
- Any range whose minimum experience is >= 2 years
- 3+ years
- Senior
- Lead
- Architect

IMPORTANT:

If the stated experience range starts at 2 years or more,
the job must be EXCLUDED.

Examples:

"0-2 years" → KEEP
"1-2 years" → KEEP
"1-3 years" → REVIEW
"2-3 years" → EXCLUDE
"2-4 years" → EXCLUDE
"2-5 years" → EXCLUDE
"3-5 years" → EXCLUDE

For ambiguous/missing experience where the minimum cannot be
reliably determined, use REVIEW rather than silently rejecting it.

Do NOT hard-code the user's personal experience duration into
the eligibility rules. These are job-target rules.

==================================================
2. OTHER PREVIOUSLY APPROVED RULES
==================================================

Keep all other previously approved rules unchanged.

Specifically preserve:

- Maximum Recall principle
- P1/P2/P3 role priorities
- Mumbai/Navi Mumbai/Thane/Pune location rules
- Bengaluru/Hyderabad salary requirements
- Pune ₹30,000/month minimum
- 5-day freshness window
- 24-hour highest priority
- Skills are NOT a hard filter
- Approved exclusion list
- Company verification
- IT/non-IT classification
- Product/service classification
- Actual JD verification
- Multi-source provenance
- Deduplication
- Rejection/review reason codes
- No automatic job applications in V1
- Human review requirement

Do not reinterpret or improve these rules.

==================================================
3. PREVIOUSLY IDENTIFIED AMBIGUITIES
==================================================

Apply the following decisions:

A. Remote jobs

Do NOT automatically reject remote jobs merely because the
company/head office is outside Mumbai/Pune/Bengaluru/Hyderabad.

Keep remote handling as a separate REVIEW category until the
remote policy is explicitly finalized.

B. Cross-source conflicts

Do NOT automatically choose the "more permissive" value.

If sources disagree on material attributes such as:
- experience
- salary
- location
- posting date

preserve the values from each source and mark the canonical
attribute as conflicting/uncertain.

Route the job to REVIEW when the conflict affects eligibility.

Direct ATS/company information may be treated as stronger evidence,
but it must not silently erase conflicting source evidence.

C. Posting date

The active-feed freshness rule remains:

0-24 hours → highest priority
1-3 days → high priority
3-5 days → normal priority
>5 days → JOB_TOO_OLD / excluded from active feed

However, jobs discovered after their original posting date must
remain stored historically.

Do not invent a grace period.

==================================================
4. DOCUMENTS TO UPDATE
==================================================

Update where necessary:

docs/requirements/V1_SPECIFICATION.md
docs/requirements/JOB_DATA_CONTRACT.md
rules/JOB_FILTERS_V1.md
rules/DEDUPLICATION_V1.md
rules/VERIFICATION_V1.md
README.md

The documentation must remain internally consistent.

If a previous statement conflicts with the final experience rule,
replace it rather than adding contradictory text.

==================================================
5. VALIDATION
==================================================

After updating:

1. Validate Markdown syntax.
2. Validate internal relative links.
3. Search the documentation for contradictory experience rules.
4. Confirm that every approved P1/P2/P3 role remains present.
5. Confirm all locations and salary thresholds remain unchanged.
6. Confirm exclusion rules remain unchanged.
7. Confirm remote handling is marked as REVIEW/deferred.
8. Confirm cross-source conflicts are marked REVIEW/uncertain.
9. Confirm no application code was created or modified.
10. Confirm no dependencies were installed.

==================================================
6. GIT
==================================================

After all validation passes:

Create ONE atomic Git commit containing ONLY this documentation
requirements-freeze change.

Suggested commit message:

docs: freeze v1 job eligibility rules

Do NOT push to GitHub unless explicitly instructed.

After committing, report:

- Files changed
- Important rule changes
- Validation results
- Git commit hash
- Current git status

STOP after this step.

Do not proceed to architecture or implementation.
```

### After Antigravity finishes

Send me its output again.

If the validation passes, **we'll have our first stable V1 baseline**. Then we move to the next major phase: **researching the actual job sources and deciding how we're going to collect them**-which is probably the most technically important part of this project.

---

**Sources:**

- [Best practices for repositories - GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories?utm_source=chatgpt.com)

## Prompt:
9/6/2026, 11:05:57 PM

The V1 requirements review and rule freeze have been completed, verified, and committed to Git. 
  ────── 
  ### 1. Files Changed & Committed 
 
   File                                         │ Status  │ Description 
  ──────────────────────────────────────────────┼─────────┼───────────────────────────────────────────────    
   JOB_FILTERS_V1.md                            │ Updated │ Updated Section 4 to authoritatively enforce      
                                                │         │ the experience rules and minimum ≥2 years         
                                                │         │ threshold rule. Added Remote Role handling        
                                                │         │ (LOCATION_REMOTE_REVIEW) to Section 5.2 and       
                                                │         │ cross-source conflict codes to Section 9.         
                        │         │ EXPERIENCE_AMBIGUOUS, LOCATION_REMOTE_REVIEW, and 
                        │         │ SOURCE_CONFLICT_REVIEW. Added Section 10 formally recording boundary      
                        │         │ decisions. 
   JOB_DATA_CONTRACT.md │ Updated │ Updated Section 2.2 and Section 6 to mandate preserving per-source        
                        │         │ values in JobSourceReference, marking conflicting canonical 
                        │         │ attributes uncertain, routing to REVIEW, and aligning experience 
                        │         │ target semantics. 
   DEDUPLICATION_V1.md  │ Updated │ Replaced permissive field resolution in Section 5 with Section 5.1:       
                        │         │ strict cross-source conflict preservation without silently erasing        
                        │         │ conflicting source data. 
   VERIFICATION_V1.md   │ Updated │ Updated Section 2 verification table (dimensions 5 & 6) and added         
                        │         │ Sections 4.4 and 4.5 detailing remote handling and conflict 
                        │         │ protocols. 
   README.md            │ Updated │ Updated project status to Planning / Phase 0 (Requirements & Rules        
                        │         │ Frozen) with cross-references to all frozen contracts and rule 
                        │         │ documents. 
  ────── 
  ### 2. Important Rule Changes 
 
  1. Authoritative Experience Policy: 
      • KEEP: Fresher, Entry-level, 0–1 years, 0–2 years, 1–2 years. 
      • REVIEW: 1–3 years, or any posting where the minimum experience cannot be reliably determined 
      (review_reason = EXPERIENCE_AMBIGUOUS). 
      • EXCLUDE: 2–3 years, 2–4 years, 2–5 years, any range with minimum experience ≥2 years, 3+ years,       
      Senior, Lead, Architect (rejection_reason = EXPERIENCE_TOO_HIGH). 
      • Core Rule: If the stated experience range starts at 2 years or more, the job must be EXCLUDED.        
      These are strictly objective job-target rules. 
  2. Remote Jobs Policy: 
      • Remote roles are not rejected simply because the company or corporate headquarters is outside         
      Mumbai/Pune/Bengaluru/Hyderabad. 
      • Remote opportunities are retained under REVIEW (review_reason = LOCATION_REMOTE_REVIEW) pending       
      formal finalization of remote eligibility criteria. 
  3. Cross-Source Conflict Handling: 
      • When sources report conflicting values for material attributes (experience, salary, location,         
      posting date), the system never automatically selects a "more permissive" value. 
      • Values from each source are preserved in their respective JOB_DATA_CONTRACT.md, the canonical         
      attribute is flagged as conflicting/uncertain, and the job transitions to REVIEW (review_reason =       
      SOURCE_CONFLICT_REVIEW). 
      • Direct ATS/company information provides stronger weight but never erases conflicting source data.     
  4. Posting Date & Historical Archival: 
      • The active-feed freshness cutoff remains: 0–24h (highest), 1–3d (high), 3–5d (normal), >5d 
      (JOB_TOO_OLD / excluded from active feed). 
      • Late-discovered postings are excluded from the active feed but permanently preserved in historical    
      storage. No grace period is applied. 
 
  ────── 
  ### 3. Validation Results 
 
   #  │ Check Item                     │ Result │ Notes 
  ────┼────────────────────────────────┼────────┼─────────────────────────────────────────────────────────    
   1  │ Markdown Syntax                │ PASSED │ Valid CommonMark/GFM formatting across all documents.       
   2  │ Internal Relative Links        │ PASSED │ Portable relative paths (../../rules/..., ./...) 
      │                                │        │ verified. 
   3  │ Experience Rule Consistency    │ PASSED │ Zero contradictory statements. All docs reflect the min     
      │                                │        │ ≥2 years exclusion policy. 
   4  │ Target Roles Verification      │ PASSED │ All 30 approved roles (14 P1, 7 P2, 9 P3) remain 
      │                                │        │ present in JOB_FILTERS_V1.md. 
   5  │ Locations & Salary Thresholds  │ PASSED │ P1/P2 cities, Pune ₹30k/mo (₹3.6 LPA), and BLR/HYD ₹5       
      │                                │        │ LPA floors confirmed unchanged. 
   6  │ Exclusions & Nuances           │ PASSED │ Salesforce, QA, IT Support, Architect, and Java/.NET-       
      │                                │        │ centered rules confirmed unchanged. 
   7  │ Remote Handling Classification │ PASSED │ Remote roles routed to REVIEW (LOCATION_REMOTE_REVIEW).     
   8  │ Cross-Source Conflicts         │ PASSED │ Source conflict auditability and uncertain attribute        
      │                                │        │ flagging confirmed. 
   9  │ Application Code Isolation     │ PASSED │ Zero application code (.py, .ts, .sql, etc.) created or 
      │                                │        │ modified. 
   10 │ Dependency Hygiene             │ PASSED │ Zero runtime or package dependencies installed. 
  ────── 
  ### 4. Git Version Control Details 
 
  • Commit Hash: 280b01b71075390bc6f6d91f0e45575650d8f0cf (280b01b) 
  • Commit Message: docs: freeze v1 job eligibility rules 
  • Branch: master 
  • Remote Push: None (retained strictly local per instructions) 
 
  ### 5. Current Git Status 
 
    On branch master 
    nothing to commit, working tree clean 
     
  Execution stopped. Standing by for instructions on the next phase. he did one Q i want to ask he did all commits on local right not in repo so when we should do it when i am goung to sleep i mean we end todays work and go to sleep so befre that we should push this right? what real and experince dev does tell me best approchs? in short and also our next step

## Response:
9/6/2026, 11:06:15 PM · gpt-5-6

Yes — **the commit is local only.** Antigravity explicitly says `Remote Push: None`, so GitHub has not received the changes yet.

### What a professional workflow would do

At the end of today's work:

**1. Test/validate → 2. Commit locally → 3. Push to GitHub → 4. Verify GitHub → 5. Stop**

So yes, **before you sleep, push the clean, validated commit**. GitHub then becomes your remote backup.

Don't push after every tiny change. A good workflow is:

```text
Work
 ↓
Test
 ↓
Small logical commit
 ↓
Push at a stable checkpoint
```

For tonight, we have a very clean checkpoint:

`280b01b — docs: freeze v1 job eligibility rules`

I'd push that.

### Give Antigravity this tiny prompt

```text
The V1 requirements-freeze commit has been validated and is clean.

Push the current local master branch to the configured GitHub remote.

Before pushing:
1. Confirm working tree is clean.
2. Confirm the current HEAD is commit 280b01b71075390bc6f6d91f0e45575650d8f0cf.
3. Push master to the configured origin.
4. Verify the push succeeded.
5. Do not modify files.
6. Do not create another commit.

Report:
- Remote used
- Branch pushed
- Commit pushed
- Push result
```

Then send me the result.

### Our next step tomorrow

**Technical Research — Job Source Collection.**

We'll research and compare:

`Naukri | LinkedIn | Indeed | Cutshort | Hirist | Instahyre | Wellfound | Greenhouse | Lever | Ashby | Workday | company career pages`

and determine **how we can collect maximum coverage safely and reliably**.

Only after that we'll choose our architecture and tech stack.

So tonight's milestone is:

**V1 requirements frozen + committed + pushed.**

Then sleep. That's a proper development checkpoint.

## Prompt:
9/6/2026, 11:09:07 PM

no we have still time so should i give this promet to agy or we can contine working also when i want to stop i will tell u ok

## Response:
9/6/2026, 11:09:26 PM · gpt-5-6

Yes, **continue working**. You don't need to push yet.

Since you want to stop only when you say so, I suggest we keep working through the next phase and **push everything at a stable checkpoint before we finish for the day**.

But don't give Antigravity the push prompt yet.

### What we do now

We move to **Phase 1 — Technical Research**.

Our first question:

> **How can we collect the maximum possible number of relevant jobs from all your target sources, reliably and safely?**

We'll research the actual options for each source:

- Official APIs
- Public endpoints
- ATS APIs
- RSS/feeds where available
- Search engines
- Scraping
- Playwright/browser automation
- Existing open-source collectors
- Rate limits / ToS / account-risk considerations

Then we'll compare them based on:

**Coverage → Accuracy → Reliability → Cost → Account safety → Maintenance difficulty**

After that, **we choose the architecture and tech stack based on evidence**, rather than deciding beforehand that we need Playwright, LangGraph, PostgreSQL, multi-agent systems, etc.

So yes — **keep Antigravity open, but don't give it another coding task yet.**

I'll handle the research/design with you first, then I'll give you the next precise prompt when we're ready.

## Prompt:
9/6/2026, 11:14:08 PM

ok do research i will review it also

## Response:
9/6/2026, 11:14:27 PM · gpt-5-6

> **Searching 2 websites**
>
> 
>
> Worked for 4s

I did the research. The conclusion is actually quite strong.

## Research conclusion

**Do NOT start with Naukri/LinkedIn scraping.**

The best architecture for our goal is a **layered collection system**:

```text
                    JOB DISCOVERY
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   Direct ATS       Job portals       Discovery
   APIs              /boards          engines
        │                │                │
 Greenhouse          Naukri           Google
 Lever               LinkedIn         ATS discovery
 Ashby               Indeed
 Workable            Cutshort
 etc.                Hirist
                     Instahyre
                     Wellfound
        └────────────────┼────────────────┘
                         ↓
                 NORMALIZATION
                         ↓
                    DEDUPLICATION
                         ↓
                    VERIFICATION
                         ↓
                  YOUR FILTERS
```

### 1. Direct ATS should be our foundation

This is the biggest finding.

**Greenhouse** provides public job-board JSON without authentication, including job descriptions, locations, departments and IDs. ([Greenhouse Docs](https://docs.greenhouse.io/job-board.html?utm_source=chatgpt.com))

**Lever** has a public postings API that can return published jobs in JSON, including content and job IDs. ([GitHub](https://github.com/lever/postings-api?utm_source=chatgpt.com))

**Ashby** has a public job-posting API that exposes published jobs, locations and optionally compensation. ([Ashby](https://developers.ashbyhq.com/docs/public-job-posting-api?utm_source=chatgpt.com))

And the open-source research in ApplyVerse identifies additional ATS sources such as **Workable, Recruitee, Personio and SmartRecruiters**. ([GitHub](https://github.com/theabhishekchandra/ApplyVerse/blob/main/docs/ATS-AND-DORKS.md?utm_source=chatgpt.com))

This is extremely valuable because:

> **We're getting the job directly from the company's recruitment system instead of relying on Naukri/LinkedIn to have indexed it.**

That directly helps our **"don't miss openings"** objective.

---

## 2. Existing open-source projects validate this architecture

**ApplyVerse** is particularly interesting. It already combines job boards with direct ATS APIs, deduplicates listings, runs scheduled ATS sweeps, and tracks new jobs. ([GitHub](https://github.com/theabhishekchandra/ApplyVerse?utm_source=chatgpt.com))

**career-ops-india** is even more relevant to us because it has an India-focused ATS scanner covering hundreds of companies through Greenhouse/Lever/Ashby without scraping or login. ([GitHub](https://github.com/AnojSKunte/career-ops-india/blob/main/README.md?utm_source=chatgpt.com))

And **job-apply-mcp** demonstrates that Playwright can technically interact with Naukri, LinkedIn, Indeed, Hirist, Instahyre, Cutshort and Wellfound. ([GitHub](https://github.com/pulkit017/job-apply-mcp?utm_source=chatgpt.com))

So we have **proven implementation patterns to study**, rather than inventing everything ourselves.

---

## 3. But LinkedIn is a major red flag

This is important given your earlier concern about account safety.

LinkedIn explicitly prohibits third-party software that scrapes/copies its services or automates activity, and says prohibited tools can result in accounts being restricted or shut down. ([LinkedIn](https://uk.linkedin.com/legal/user-agreement?utm_source=chatgpt.com))

Its crawling terms also say automated crawling requires express permission and prohibit circumventing access controls. ([LinkedIn](https://www.linkedin.com/legal/crawling-terms?utm_source=chatgpt.com))

So **I would not put your LinkedIn account credentials into our system.**

Same principle for other portals: we need to evaluate their current terms and technical access individually rather than assuming "I own the account, therefore automation is okay."

---

# 4. Interesting discovery: Hirist

There is already an open-source Hirist scraper that extracts:

- title
- company
- salary
- skills
- experience
- city
- recruiter
- full JD

and doesn't require login according to its documentation. ([GitHub](https://github.com/logiover/hirist-tech-scraper?utm_source=chatgpt.com))

That makes Hirist a good candidate for a **controlled experimental connector** later.

---

# 5. What I think our architecture should become

I would divide sources into **tiers**.

### Tier A - Direct / structured

```text
Greenhouse
Lever
Ashby
Workable
SmartRecruiters
Recruitee
Personio
other public ATS systems
```

**Highest reliability.**

### Tier B - Public job discovery

```text
Company career pages
Search engines
ATS discovery
Public job pages
```

Used to discover companies/jobs that aren't in our seed list.

### Tier C - Job portals

```text
Naukri
Indeed
Hirist
Cutshort
Instahyre
Wellfound
LinkedIn
```

Each gets its own connector and **source-specific risk/permission policy**.

This is much better than building one giant scraper.

---

# 6. The most important architectural insight

We should **not ask an LLM to search the internet for jobs every time.**

Instead:

```text
Collectors
    ↓
Database
    ↓
Your rules
    ↓
AI verification/enrichment
    ↓
Your feed
```

Then every day we can answer:

> "What changed since yesterday?"

rather than asking an AI to rediscover the internet from scratch.

That's a **real software system**, not just a prompt.

---

# 7. What I recommend we build first

I would make our first technical milestone:

### **ATS Collector MVP**

Start with:

**Greenhouse + Lever + Ashby**

Why?

- Public APIs
- Structured JSON
- No login
- Reliable IDs
- Full/usable JD information
- Good company coverage
- Easy to test
- Low account risk

Then build:

```text
3 ATS connectors
       ↓
common Job model
       ↓
normalizer
       ↓
deduplicator
       ↓
your filter engine
       ↓
CLI output
```

**No frontend. No LLM. No multi-agent. No Playwright yet.**

If this works, we have the first real piece of our system.

Then we expand source-by-source.

---

## My current recommendation

**Architecture direction:**  
**API-first → public-source-first → browser/scraping only when necessary → AI after deterministic collection.**

And this is actually better for your portfolio because you can demonstrate:

> API integration → ETL → normalization → entity resolution → rule engine → verification → AI enrichment → distributed collectors.

That's much stronger than:

> "I made a Playwright bot that scrapes LinkedIn."

### Next step

Before coding the ATS collector, I want to research **exactly how we should discover the companies using each ATS**-because the APIs are mostly **company-specific**, not a global "give me every Greenhouse job in India" API. ApplyVerse's research confirms this limitation. ([GitHub](https://github.com/theabhishekchandra/ApplyVerse/blob/main/docs/ATS-AND-DORKS.md?utm_source=chatgpt.com))

That **company-discovery problem** is probably the next critical piece for our "don't miss openings" objective.

---

**Sources:**

- [Job Board API | Greenhouse](https://docs.greenhouse.io/job-board.html?utm_source=chatgpt.com)
- [GitHub - lever/postings-api: API documentation and examples for the lever postings REST API · GitHub](https://github.com/lever/postings-api?utm_source=chatgpt.com)
- [Ashby Job Postings API](https://developers.ashbyhq.com/docs/public-job-posting-api?utm_source=chatgpt.com)
- [User Agreement | LinkedIn](https://uk.linkedin.com/legal/user-agreement?utm_source=chatgpt.com)
- [LinkedIn Crawling Terms and Conditions](https://www.linkedin.com/legal/crawling-terms?utm_source=chatgpt.com)

## Prompt:
9/6/2026, 11:21:15 PM

i read this its was intresting also i know about some web screping tools like fireclew is this usefull for use aslo any other web screping tools or u r approch is best tell me in short after this we will go for next step

## Response:
9/6/2026, 11:21:34 PM · gpt-5-6

Yes - **Firecrawl can be useful for us**, but I would not make it the foundation.

### Best approach

**1. APIs / structured sources → first choice**
- Greenhouse
- Lever
- Ashby
- Other public ATS APIs

**2. Firecrawl → second layer**
Useful for:
- Company career pages
- Websites without APIs
- Extracting/cleaning webpage content
- Crawling multiple pages
- Turning messy HTML into structured content

[Firecrawl](https://www.firecrawl.dev/?utm_source=chatgpt.com)

**3. Playwright → when we need browser interaction**
Useful when a site requires JavaScript rendering or more complex navigation.

[Playwright](https://playwright.dev/?utm_source=chatgpt.com)

**4. Specialized scrapers → source-specific**
For sites where an existing reliable open-source collector already exists, we can evaluate it rather than reinventing it.

### So our hierarchy is:

```text
Official/Public API
       ↓
Firecrawl / HTTP crawler
       ↓
Playwright
       ↓
Source-specific scraper
```

But **we choose the method per source**, not one tool for everything.

And one important distinction:

**Firecrawl ≠ magic access to LinkedIn/Naukri.** It doesn't make prohibited/private scraping safe or automatically solve anti-bot systems.

So yes, **your Firecrawl idea is good**, and we'll likely use it - just as one component of the collection layer.

**Next step:** let's research and design the **company discovery strategy** so our ATS approach can actually achieve high coverage.

## Prompt:
9/6/2026, 11:24:21 PM

also one more point we should build evrything form free no cost ok we have to use free trail only so if there is limititon so we need to find solution or better approch

## Response:
9/6/2026, 11:24:40 PM · gpt-5-6

> **Searching 3 websites**
>
> 
>
> Worked for a couple of seconds

Yes. **This should be a hard project constraint from now on: ₹0 budget.**

We can use free tiers, open-source/self-hosted tools, and public APIs. We should **not design the architecture around a paid API and hope the free tier is enough**.

### Our free-first strategy

**Prefer, in this order:**

1. **Free public APIs** - best
2. **Open-source/self-hosted tools** - unlimited except our own machine/resources
3. **Direct HTTP requests** to permitted public pages
4. **Free Firecrawl tier** when useful - currently 1,000 credits/month, roughly 1,000 scraped pages. ([Firecrawl](https://www.firecrawl.dev/pricing?utm_source=chatgpt.com))
5. **Playwright** - open source, so no API cost
6. **LLMs** - use free models/local models where possible; reserve expensive models for cases where they actually improve accuracy

For example, Lever's published-job API is public and returns structured job data, so there's no reason to spend scraping credits on those jobs. ([GitHub](https://github.com/lever/postings-api?utm_source=chatgpt.com)) Ashby similarly provides a public job-posting API. ([Ashby](https://developers.ashbyhq.com/docs/public-job-posting-api?utm_source=chatgpt.com))

### This changes our architecture slightly

We should build a **cost-aware source router**:

```text
Can get data for free via API?
        ↓ YES
      API
        ↓ NO
Can get it directly with HTTP?
        ↓ YES
    HTTP fetch
        ↓ NO
Can open-source Playwright solve it?
        ↓ YES
   Playwright
        ↓ NO
Can free Firecrawl handle it?
        ↓ YES
   Firecrawl
        ↓ NO
     SKIP / REVIEW
```

This is better than making Firecrawl the default because **1,000 pages/month disappears quickly** if we're crawling hundreds of companies. ([Firecrawl](https://www.firecrawl.dev/pricing?utm_source=chatgpt.com))

And importantly, **we don't need to solve every source immediately**. We can build coverage progressively while keeping the system free.

I'll treat **₹0 cost / free-tier-first** as a project constraint going forward.

---

**Sources:**

- [Pricing | Firecrawl](https://www.firecrawl.dev/pricing?utm_source=chatgpt.com)
- [GitHub - lever/postings-api: API documentation and examples for the lever postings REST API · GitHub](https://github.com/lever/postings-api?utm_source=chatgpt.com)
- [Ashby Job Postings API](https://developers.ashbyhq.com/docs/public-job-posting-api?utm_source=chatgpt.com)

## Prompt:
9/6/2026, 11:27:59 PM

Firecrawl   also i notice his free creadt are less if this is not usefull for as u can remove it i am just trying to give idea to u ok u beleve on u r researcg so now tell me our next step

## Response:
9/6/2026, 11:28:18 PM · gpt-5-6

> **Searching 4 websites**
>
> 
>
> Worked for a couple of seconds

Yes - your concern about Firecrawl is valid. I checked the current pricing again: the free tier is **1,000 credits/month**, roughly 1,000 pages, with low rate limits. ([Firecrawl](https://www.firecrawl.dev/pricing?utm_source=chatgpt.com))

For **our project**, I would **remove Firecrawl from the core architecture**.

It can remain an optional fallback later, but we should **not design the system around it**. Our ₹0 requirement makes that the wrong foundation.

### Our next step

We should **not start coding yet**.

The next step is:

## Phase 2 - Source & Company Discovery Strategy

The biggest technical question now is:

> **How do we discover the maximum number of relevant companies/jobs without paid APIs or risky authenticated scraping?**

This matters because Greenhouse, Lever and Ashby give excellent structured job data, but they generally work around individual company/job-board identifiers rather than giving us a magical global database. For example, Lever's API is company/site based, while Ashby's public job-board API is based on a company's job-board name. ([GitHub](https://github.com/lever/postings-api?utm_source=chatgpt.com))

So we need to design:

**Company discovery → identify ATS → collect jobs → normalize → deduplicate → verify → apply your rules**

### I want to research these options next

1. **Curated company seed database**
   - Indian AI/tech companies
   - Startups
   - Product companies
   - Service companies
   - Companies hiring AI/backend roles

2. **ATS discovery**
   - Greenhouse
   - Lever
   - Ashby
   - Workable
   - Recruitee
   - Personio
   - SmartRecruiters
   - Workday where practical

3. **Free discovery mechanisms**
   - Public search engines
   - GitHub/open-source datasets
   - Public company career pages
   - Common Crawl
   - Existing open-source job aggregators

   Common Crawl is particularly interesting because its crawl data and CDXJ index are freely accessible. ([Common Crawl](https://commoncrawl.org/get-started?utm_source=chatgpt.com))

4. **Direct job-board sources**
   - Naukri
   - LinkedIn
   - Indeed
   - Cutshort
   - Hirist
   - Instahyre
   - Wellfound

   We'll classify each as:
   **safe/public API → public page → browser rendering → risky/not worth automating**

5. **Coverage analysis**
   
   We'll determine which combination gives us the best **recall per engineering effort**.

---

### Then we make one important decision

We'll produce a document:

**`docs/research/SOURCE_DISCOVERY_STRATEGY_V1.md`**

containing:

```text
Source
├── Discovery method
├── Data access method
├── Cost = ₹0?
├── Login required?
├── Automation risk
├── Expected coverage
├── Reliability
├── Rate-limit concerns
├── Freshness
└── Priority for V1
```

Then I'll give you **one exact prompt for Agy** to implement/document that decision.

After that:

**Source strategy → Architecture → Tech stack → Database schema → Collector interface → First collector MVP**

That's the correct order.

And yes: **keep throwing ideas at me like Firecrawl.** You don't need to decide whether they're good. Your job is to surface possibilities; I'll research them and aggressively remove anything that doesn't make sense.

---

**Sources:**

- [Pricing | Firecrawl](https://www.firecrawl.dev/pricing?utm_source=chatgpt.com)
- [GitHub - lever/postings-api: API documentation and examples for the lever postings REST API · GitHub](https://github.com/lever/postings-api?utm_source=chatgpt.com)
- [Common Crawl - Get Started](https://commoncrawl.org/get-started?utm_source=chatgpt.com)

## Prompt:
9/6/2026, 11:32:38 PM

what next ?

## Response:
9/6/2026, 11:32:56 PM · gpt-5-6

> **Searching 4 websites**
>
> 
>
> Worked for a couple of seconds

Our next step is **exactly one thing: finish the Source & Company Discovery Strategy before writing code.**

I did another quick research pass, and it confirms this is the right bottleneck.

### What we know now

- Greenhouse exposes published jobs through public GET endpoints with no authentication. ([Greenhouse Docs](https://docs.greenhouse.io/job-board.html?utm_source=chatgpt.com))
- Lever exposes published postings publicly, but its API is **company/site based**, not a global job search API. ([GitHub](https://github.com/lever/postings-api?utm_source=chatgpt.com))
- Ashby similarly exposes published jobs for a company's job board. ([Ashby](https://developers.ashbyhq.com/docs/public-job-posting-api?utm_source=chatgpt.com))
- Open-source aggregators are already using **Common Crawl to discover thousands of ATS/company identifiers**, which is very interesting for our ₹0 architecture. ([GitHub](https://github.com/Feashliaa/job-board-aggregator?utm_source=chatgpt.com))
- There are even newer open-source projects specifically focused on discovering career pages and identifying ATS platforms at scale. ([GitHub](https://github.com/Ramcharan747/careerscout?utm_source=chatgpt.com))

So the key problem isn't **"How do we scrape jobs?"**

It's:

> **"How do we discover enough companies/ATS endpoints so our collectors have maximum recall?"**

### Therefore our immediate research task

I'll establish our **V1 Source Discovery Architecture**:

```text
Company discovery
       ↓
Career-page / ATS detection
       ↓
ATS registry
       ↓
Greenhouse / Lever / Ashby / other public APIs
       ↓
Raw jobs
       ↓
Normalize
       ↓
Deduplicate
       ↓
Verify
       ↓
Your V1 filters
```

And we'll rank every discovery method by:

**Coverage × Reliability × ₹0 cost × Safety × Maintenance**

### Firecrawl

For now:

**REMOVE IT from the architecture.**

We don't need to spend our limited free credits when public APIs + direct HTTP + open-source discovery methods can do the important work.

If later we find one specific source where Firecrawl gives significant additional recall, we can add it as an **optional adapter**, not a dependency.

### After this research

The sequence will be:

**1. Source/Company Discovery Strategy ← NOW**  
**2. System Architecture**  
**3. Tech-stack decision**  
**4. Database/data model**  
**5. Collector interface**  
**6. Build first collector**  
**7. Test with real jobs**  
**8. Expand source coverage**

So **don't give Agy a coding prompt yet**.

I'll do the Source & Company Discovery research first, then give you the result to review.

---

**Sources:**

- [Job Board API | Greenhouse](https://docs.greenhouse.io/job-board.html?utm_source=chatgpt.com)
- [GitHub - lever/postings-api: API documentation and examples for the lever postings REST API · GitHub](https://github.com/lever/postings-api?utm_source=chatgpt.com)
- [Ashby Job Postings API](https://developers.ashbyhq.com/docs/public-job-posting-api?utm_source=chatgpt.com)

## Prompt:
9/6/2026, 11:34:31 PM

ok do it

## Response:
9/6/2026, 11:34:50 PM · gpt-5-6

> **Searching 3 websites**
>
> 
>
> Worked for 7s

Done. I researched the discovery problem from the **₹0 / maximum-recall** perspective.

## My conclusion

We should **not build a traditional scraper-first system**.

The strongest architecture is:

```text
                COMPANY DISCOVERY
                       ↓
          Career page / ATS detection
                       ↓
                ATS Registry
                       ↓
      ┌────────────────┼────────────────┐
      ↓                ↓                ↓
 Greenhouse         Lever            Ashby
      ↓                ↓                ↓
      └────────────────┼────────────────┘
                       ↓
              Other public ATS APIs
                       ↓
                Raw job records
                       ↓
              Normalize + Deduplicate
                       ↓
                 Verify evidence
                       ↓
                Your V1 rule engine
                       ↓
             ELIGIBLE / REVIEW / REJECT
```

### 1. ATS APIs should be our foundation

This is the biggest decision.

Greenhouse has public GET endpoints without authentication. ([Greenhouse Docs](https://docs.greenhouse.io/job-board.html?utm_source=chatgpt.com))

Lever's public postings API provides published jobs, but requires the company's Lever site/slug; it explicitly does **not** provide global full-text search. ([GitHub](https://github.com/lever/postings-api?utm_source=chatgpt.com))

Ashby similarly provides published jobs for a company's job board. ([Ashby](https://developers.ashbyhq.com/docs/public-job-posting-api?utm_source=chatgpt.com))

So the hard problem is **discovering the companies/board identifiers**, not collecting the jobs once we know them.

---

# 2. Company discovery is where we should be clever

I found several projects that validate this approach.

### Common Crawl is particularly interesting

Common Crawl provides a free URL index and its crawl data is free to access. There is no AWS account requirement when accessing the data over HTTP. ([Common Crawl](https://index.commoncrawl.org/?utm_source=chatgpt.com))

More importantly, an existing open-source job aggregator is already using Common Crawl specifically to discover ATS company identifiers and reports roughly **95,000 unique identifiers** from its harvesting process. ([GitHub](https://github.com/Feashliaa/job-board-aggregator?utm_source=chatgpt.com))

That is strong evidence that this isn't just a theoretical idea.

**Verdict: USE IT - but not immediately as our first collector.**

---

# 3. We should also exploit existing open-source company datasets

I found an even more useful resource:

**OpenJobs** has a dataset of **12,144 tech/gaming companies** and supports harvesting jobs from numerous public ATS systems. ([GitHub](https://github.com/outscal/OpenJobs?utm_source=chatgpt.com))

And `career-ops-india` has a manually curated Indian company registry covering hundreds of Indian companies across Greenhouse, Lever and Ashby. ([GitHub](https://github.com/AnojSKunte/career-ops-india/blob/main/README.md?utm_source=chatgpt.com))

This gives us a very practical starting point:

```text
Existing Indian company lists
          +
Existing tech company datasets
          +
Common Crawl discovery
          +
Our own discovered companies
          ↓
      Company Registry
```

We don't have to reinvent company discovery from zero.

---

# 4. ATS detection can be almost completely API-first

I found an open-source library that demonstrates a very useful pattern.

`ats-jobs` supports 12 ATS platforms and can take a **company domain**, probe multiple ATS endpoints, and identify which one responds. It also falls back to the company's career page when necessary and respects `robots.txt`. ([GitHub](https://github.com/shunsukefuruyama/ats-jobs?utm_source=chatgpt.com))

Another project, CareerScout, goes much further: career-page discovery → ATS detection → API extraction → normalized jobs, supporting 17 ATS platforms. ([GitHub](https://github.com/Ramcharan747/careerscout?utm_source=chatgpt.com))

We should **learn from these architectures, not blindly copy them**.

---

# 5. Our source tiers

This is the strategy I recommend freezing:

| Tier | Source | V1 decision |
|---|---|---|
| **A** | Greenhouse | BUILD |
| **A** | Lever | BUILD |
| **A** | Ashby | BUILD |
| **A** | Other public ATS APIs | BUILD progressively |
| **A** | Company career pages | DISCOVERY + verification |
| **B** | Common Crawl | COMPANY DISCOVERY |
| **B** | Existing public company datasets | SEED |
| **B** | Public job-board pages | CASE-BY-CASE |
| **C** | Browser rendering | FALLBACK |
| **C** | Firecrawl | REMOVE from core |
| **X** | Authenticated LinkedIn automation | DO NOT BUILD |
| **X** | CAPTCHA / anti-bot bypass | DO NOT BUILD |

LinkedIn is particularly clear: its current User Agreement prohibits software/scripts/robots used to scrape or copy the service and prohibits bypassing access controls. ([LinkedIn](https://ac.linkedin.com/legal/user-agreement?utm_source=chatgpt.com))

So I'm changing one thing from our earlier thinking:

**LinkedIn should remain a desired source, but NOT be a core automated collector in V1.**

That protects your account and keeps the architecture defensible.

Indeed's current Terms also make access subject to its terms and API documentation, so I don't want us casually building an unofficial scraper there either. ([Indeed](https://www.indeed.com/legal?hl=en_US&utm_source=chatgpt.com))

---

# 6. Firecrawl: officially demoted

Your instinct was correct.

### Before

```text
API
 ↓
Firecrawl
 ↓
Playwright
```

### Now

```text
Public structured API
        ↓
Direct HTTP
        ↓
Career-page discovery
        ↓
Playwright only when justified
        ↓
Manual/review queue
```

**Firecrawl is not required.**

If we later discover a specific source where it materially increases recall, we can add it as an optional adapter. It will never be a core dependency.

---

# 7. The most important architectural idea

We should create a **Company Registry**.

Something conceptually like:

```text
Company
 ├── canonical_name
 ├── website
 ├── country
 ├── industry
 ├── company_type
 ├── careers_url
 ├── ats_provider
 ├── ats_board_id
 ├── discovery_source
 ├── discovery_confidence
 ├── last_verified_at
 └── status
```

Then jobs are collected **from companies**, rather than repeatedly searching the entire internet.

This gives us:

**discover once → monitor repeatedly**

That's much more efficient.

---

# 8. Our discovery pipeline

I recommend this:

```text
                    ┌──────────────────┐
                    │ Existing datasets│
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Indian companies │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Common Crawl     │
                    │ ATS discovery    │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Career-page scan │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ ATS fingerprint  │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Company Registry │
                    └────────┬─────────┘
                             ↓
               ┌─────────────┼─────────────┐
               ↓             ↓             ↓
          Greenhouse       Lever         Ashby
               ↓             ↓             ↓
               └─────────────┼─────────────┘
                             ↓
                       JOB INGESTION
```

---

# 9. One important correction to our thinking

**Maximum recall does NOT mean scraping everything possible.**

That's a trap.

The better objective is:

> **Maximum trustworthy recall per unit of engineering effort.**

For example, getting 95% more jobs by adding a fragile scraper that constantly breaks is worse than getting 80% coverage from stable public APIs.

So our optimization target should be:

**Recall × reliability × freshness × safety / maintenance cost**

That is a much more production-engineering approach.

---

# Final decision

I would now freeze these decisions:

### Core

**Greenhouse + Lever + Ashby + additional public ATS APIs**

### Discovery

**Company datasets + Common Crawl + career-page detection**

### Processing

**Normalize → deduplicate → verify → filter**

### Browser

**Only as a controlled fallback**

### Firecrawl

**Removed from core**

### LinkedIn

**No automated scraping/login in V1**

### Indeed / other job boards

**Investigate individually; only automate when the access method is acceptable**

### Cost

**₹0**

### Philosophy

**API-first + company-first + maximum trustworthy recall**

---

## What we do next

Now I think we have enough research to move from **research → architecture**.

**Next step = design the actual system architecture and tech stack.**

That means we'll decide:

- Python or another language
- database
- HTTP client
- async/concurrency model
- scheduler
- project structure
- collector interface
- company registry design
- raw vs normalized storage
- verification architecture
- local development setup
- how to remain ₹0

**Still no coding yet.**

Once we design that, I'll give you the exact Agy prompt to document/build the architecture, and we'll review Agy's result before implementation.

---

**Sources:**

- [Job Board API | Greenhouse](https://docs.greenhouse.io/job-board.html?utm_source=chatgpt.com)
- [GitHub - lever/postings-api: API documentation and examples for the lever postings REST API · GitHub](https://github.com/lever/postings-api?utm_source=chatgpt.com)
- [Ashby Job Postings API](https://developers.ashbyhq.com/docs/public-job-posting-api?utm_source=chatgpt.com)
- [Common Crawl Index Server](https://index.commoncrawl.org/?utm_source=chatgpt.com)
- [User Agreement | LinkedIn](https://ac.linkedin.com/legal/user-agreement?utm_source=chatgpt.com)
- [Terms of Service](https://www.indeed.com/legal?hl=en_US&utm_source=chatgpt.com)

## Prompt:
9/6/2026, 11:45:13 PM

i have one Q how much company in indiea use ats system and company that not use for that this arch is not usefull is i am right ? tell me this in short

## Response:
9/6/2026, 11:45:32 PM · gpt-5-6-t-mini

You're **partly right**.

There isn't a reliable public number for exactly how many Indian companies use ATS, but **many companies—especially startups, mid-size and larger tech companies—use ATS platforms**, while a significant number of smaller companies still post jobs directly on LinkedIn/Naukri/company websites.

So **ATS-only architecture would miss jobs**.

That's why our system should be:

**ATS + job portals + company career pages + other public sources**

ATS is the **stable backbone**, not the entire system.

## Prompt:
9/6/2026, 11:46:14 PM

ok what next?

## Response:
9/6/2026, 11:46:33 PM · gpt-5-6-t-mini

Now we move to **system architecture design**.

We should decide:

**Data flow**
```text
Sources
  ↓
Collectors
  ↓
Raw job data
  ↓
Normalize
  ↓
Deduplicate
  ↓
Verify
  ↓
Your filter rules
  ↓
Job database
  ↓
Later: dashboard / Telegram / email
```

And choose the **₹0 tech stack** for each part.

I recommend we research and lock the architecture **before Agy writes any code**. Then I'll give you the exact Agy prompt for the architecture document.

## Prompt:
9/6/2026, 11:48:45 PM

ok do reseach

## Response:
9/6/2026, 11:49:04 PM · gpt-5-6-t-mini

> **Searched 2 websites**
>
> 
>
> Worked for a couple of seconds

I researched the architecture and **we now have a strong ₹0 stack recommendation**.

## Recommended architecture

```text id="s5qj5g"
                SOURCE LAYER
   ATS APIs / public pages / job portals
                    ↓
              COLLECTORS
     one adapter per source/ATS
                    ↓
               RAW STORE
        preserve original evidence
                    ↓
             NORMALIZATION
                    ↓
             DEDUPLICATION
                    ↓
              VERIFICATION
                    ↓
              RULE ENGINE
        your frozen V1 rules
                    ↓
              JOB DATABASE
                    ↓
        Dashboard / alerts later
```

### Tech stack

| Component | Decision | Why |
|---|---|---|
| Language | **Python 3.12+** | Best fit for scraping, APIs, NLP/AI and your AIML background |
| API/backend | **FastAPI** | Lightweight, async-friendly |
| HTTP | **httpx** | Async HTTP requests |
| Browser fallback | **Playwright** | Free/open-source; supports async Python and Chromium/Firefox/WebKit. ([Playwright](https://playwright.dev/python/docs/library?utm_source=chatgpt.com)) |
| Database | **PostgreSQL** | Strong relational model + search/indexing; open source |
| ORM | **SQLAlchemy** | Mature Python database layer |
| Validation | **Pydantic** | Excellent fit with FastAPI |
| Scheduling | **APScheduler** initially | Avoid adding Redis/Celery complexity too early |
| Testing | **pytest** | Standard Python testing |
| Packaging | **uv** | Fast modern Python environment/package management |
| Containers | **Docker** later | Reproducible deployment |
| AI layer | **OpenRouter / free models later** | AI comes after deterministic pipeline |
| Firecrawl | **NO** | Not needed for core ₹0 architecture |

PostgreSQL is actively supported; as of August 2026, PostgreSQL 18.6 is the current minor release of the supported 18 series. ([PostgreSQL](https://www.postgresql.org/download/?utm_source=chatgpt.com))

### One important architecture decision

I **do not recommend Redis + Celery + Kafka + Elasticsearch now**.

That would make a portfolio project look "big" without solving our actual bottleneck.

Start with:

```text
FastAPI
   +
PostgreSQL
   +
httpx
   +
Playwright
   +
APScheduler
```

Then introduce additional infrastructure **only when actual scale requires it**.

### Database design

We should separate:

```text id="q9h8qm"
companies
    ↓
sources
    ↓
raw_jobs
    ↓
jobs
    ↓
job_source_references
    ↓
verification_records
    ↓
filter_decisions
```

This is important because **we must never destroy source evidence during normalization**.

For example:

```text
LinkedIn says:       0-2 years
Company ATS says:    1-3 years
```

We store both.

Then our rules engine says:

```text
SOURCE_CONFLICT_REVIEW
```

rather than silently picking one.

### The biggest design principle

Our collectors should all implement the **same interface**.

Conceptually:

```text
BaseCollector
    ├── GreenhouseCollector
    ├── LeverCollector
    ├── AshbyCollector
    ├── CompanyCareerCollector
    ├── NaukriCollector
    ├── CutshortCollector
    └── ...
```

So adding a new source later does **not** require rewriting the whole system.

---

# What I recommend we do now

We have enough research to freeze the architecture.

**Next step: create `docs/architecture/SYSTEM_ARCHITECTURE_V1.md` and `docs/architecture/TECH_STACK_V1.md`.**

No application code yet.

I'll give you an **exact copy-paste prompt for Agy** to create those two architecture documents, then you bring Agy's result back here and I review it before we build anything.

---

**Sources:**

- [Getting started - Library | Playwright Python](https://playwright.dev/python/docs/library?utm_source=chatgpt.com)
- [PostgreSQL: Downloads](https://www.postgresql.org/download/?utm_source=chatgpt.com)

## Prompt:
9/6/2026, 11:52:03 PM

| AI layer |
| -------- |

| **OpenRouter / free models later** |
| ---------------------------------- |

| AI comes after deterministic pipeline is this frree models are enought i think we need to use multille api provider so we cant get issue of llm token also input token and rate limit issue ? rigt any think else other think i feel right  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

## Response:
9/6/2026, 11:52:22 PM · gpt-5-6-t-mini

Yes — your thinking is correct, but I would extend it a little.

The AI layer should **not depend on OpenRouter alone**. For a ₹0 project, we should build a **provider-agnostic LLM gateway**.

### Better design

```text
                 AI JOB ANALYSIS
                       ↓
                LLM Router
                       ↓
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
   Provider A      Provider B      Local Model
   free API        free API        Ollama
        ↓              ↓              ↓
        └──────────────┼──────────────┘
                       ↓
                 AI Result
```

This protects us against:

- **Token limits**
- **Rate limits**
- **Daily/monthly free quotas**
- **Provider outages**
- **One model becoming unavailable**
- **Model-specific quality differences**
- **API changes**
- **Unexpected cost**

### But there's an even more important point

We should **minimize LLM usage**, not just find more free APIs.

For example, don't ask an LLM:

> "Is this job located in Pune?"

Use deterministic Python rules.

LLM should handle things like:

```text
Messy JD
   ↓
LLM
   ↓
Extract:
- actual role
- experience interpretation
- AI/GenAI relevance
- ambiguous location
- salary interpretation
- suspicious/misleading JD
```

So:

**Python handles obvious decisions.  
LLMs handle ambiguity.**

That keeps our token usage dramatically lower.

### I would therefore change our architecture to:

```text
Deterministic pipeline
        ↓
Does it need AI?
   ↓          ↓
  NO          YES
   ↓           ↓
Decision    LLM Router
               ↓
       Free Provider APIs
               +
          Local Ollama
               ↓
        Structured output
               ↓
          Rule Engine
```

### One more important addition: caching

We should cache AI results using something like:

```text
hash(JD + prompt_version + model_version)
```

If we've already analyzed the exact same JD, **don't call an LLM again**.

This can save a huge amount of tokens.

So yes: **multiple providers + local models + routing + caching + deterministic preprocessing** is much stronger than simply saying "use free OpenRouter models."

I would update the architecture accordingly before we give Agy the architecture task.

## Prompt:
9/6/2026, 11:53:41 PM

ok

## Response:
9/6/2026, 11:54:02 PM · gpt-5-6-t-mini

Good. The AI architecture is now updated to:

**Deterministic rules first → LLM only for ambiguity → multi-provider router → local fallback → caching.**

Next, we should have Agy document the **complete V1 system architecture + tech stack**, including this AI strategy.

I’ll give you the exact Agy prompt next.

## Prompt:
9/6/2026, 11:54:07 PM

ok give me

## Response:
9/6/2026, 11:54:26 PM · gpt-5-6-t-mini

Copy-paste this **exact prompt** into Agy:

```text
We have completed the research phase for the AI-Job-Intelligence project.

IMPORTANT:
Do NOT write application code yet.
Do NOT install dependencies.
Do NOT modify source code.
Your task is DOCUMENTATION ONLY.

Project:
AI-Job-Intelligence

Repository:
https://github.com/TANMAY4806w/AI-Job-Intelligence.git

Goal:
Create a production-quality architecture for a ₹0-cost AI job intelligence system that maximizes trustworthy recall of relevant jobs across multiple sources, while respecting source terms and avoiding risky authenticated scraping/anti-bot bypass.

Before editing anything:
1. Inspect the existing repository documentation.
2. Read:
   - README.md
   - docs/requirements/PROJECT_SCOPE.md
   - docs/requirements/V1_SPECIFICATION.md
   - docs/requirements/JOB_DATA_CONTRACT.md
   - rules/JOB_FILTERS_V1.md
   - rules/DEDUPLICATION_V1.md
   - rules/VERIFICATION_V1.md
3. Make sure the architecture is consistent with those frozen requirements.

ARCHITECTURE PRINCIPLES

1. ₹0 HARD CONSTRAINT
The system must use only:
- open-source software
- free/public APIs
- free/public datasets
- local/self-hosted tools
- genuinely free tiers where appropriate

Do not design any required component that depends on a paid API/service.

2. API-FIRST / PUBLIC-SOURCE-FIRST
Preferred source order:
- public structured API
- direct public HTTP
- public career page
- browser rendering only when justified
- source-specific collector only when appropriate and permitted

3. FIRECRAWL
Do NOT include Firecrawl as a core dependency.
It may be mentioned as a possible future optional adapter, but the V1 architecture must work without it.

4. ATS
ATS is a backbone, NOT the entire system.
Architecture must support:
- Greenhouse
- Lever
- Ashby
- additional public ATS systems later
- company career pages
- job portals where technically and legally appropriate

5. COMPANY-CENTRIC DISCOVERY
Create a Company Registry concept.

The architecture should support:
Company discovery
→ career page discovery
→ ATS detection
→ ATS registry
→ source collection
→ job ingestion

Potential discovery mechanisms:
- curated public company datasets
- open-source datasets/projects
- Common Crawl
- public career-page discovery
- future discovery methods

6. MAXIMUM TRUSTWORTHY RECALL
Do not optimize only for scraping volume.
Optimize for:

recall × reliability × freshness × safety / maintenance cost

Potentially relevant jobs should not be silently discarded.

7. SOURCE SAFETY
Do NOT design:
- authenticated LinkedIn scraping
- CAPTCHA bypass
- anti-bot bypass
- security/access-control circumvention

LinkedIn should remain a desired source but must NOT be a core automated authenticated scraper in V1.

Other job portals should be evaluated individually according to available public/acceptable access methods.

8. RAW + NORMALIZED DATA
Never destroy source evidence.

Pipeline:

Sources
→ Collectors
→ Raw job records
→ Normalize
→ Deduplicate
→ Verify
→ Apply V1 rules
→ Canonical job database
→ Later: dashboard/alerts

9. PROVENANCE
Every canonical job must retain:
- source
- source job ID
- source URL
- application URL
- discovered timestamp
- source-specific evidence
- canonicalization information
- verification evidence

10. CROSS-SOURCE CONFLICTS
Never automatically choose the most permissive source.

Example:
Source A = 0–2 years
Source B = 1–3 years

Preserve both and route to:
SOURCE_CONFLICT_REVIEW

11. AI IS NOT THE PRIMARY COLLECTION ENGINE
Deterministic code should handle obvious decisions first.

LLM is only for ambiguity/enrichment such as:
- role interpretation
- ambiguous experience wording
- AI/GenAI relevance
- messy location interpretation
- salary interpretation
- suspicious/misleading JD analysis

12. AI PROVIDER AGNOSTIC DESIGN
Do NOT make OpenRouter the only AI dependency.

Design an LLM Gateway / Router supporting:
- multiple external free providers
- multiple models
- local models through Ollama or equivalent open-source local runtime
- provider fallback
- model fallback
- rate-limit awareness
- quota awareness
- timeout/retry handling
- structured output validation

The architecture should allow adding/removing providers without changing business logic.

13. AI COST/TOKEN CONTROL
Design:
- deterministic pre-filtering before LLM calls
- prompt minimization
- batching where appropriate
- caching
- result reuse
- content hashing

Recommended cache identity concept:

hash(JD content + prompt version + model version)

If the same job/JD has already been analyzed with the same prompt/model version, do not call the model again unnecessarily.

14. DATABASE
Research-backed recommendation is:
- PostgreSQL

Do not add unnecessary infrastructure yet.

Potential core entities:
- companies
- sources
- company_sources / ATS registrations
- raw_jobs
- jobs
- job_source_references
- verification_records
- filter_decisions
- ai_analysis_results
- discovery_runs
- collection_runs

15. INITIAL TECH STACK
Recommended stack to evaluate and document:

- Python 3.12+
- FastAPI
- httpx
- Playwright
- PostgreSQL
- SQLAlchemy
- Pydantic
- APScheduler
- pytest
- uv
- Docker later when useful
- Ollama/local model runtime for optional local AI

Do NOT blindly accept this stack.
Briefly validate each choice and mention alternatives only when they are materially relevant.

16. AVOID PREMATURE COMPLEXITY
Do NOT introduce:
- Kafka
- Celery
- Redis
- Elasticsearch
- Kubernetes
- microservices

unless the architecture clearly demonstrates a real V1 requirement.

Prefer a modular monolith with clean interfaces.

17. COLLECTOR INTERFACE
Architecture must define a common collector abstraction so sources can be added independently.

Conceptual example:

BaseCollector
├── GreenhouseCollector
├── LeverCollector
├── AshbyCollector
├── CompanyCareerCollector
├── NaukriCollector
├── CutshortCollector
├── HiristCollector
├── IndeedCollector
├── InstahyreCollector
└── WellfoundCollector

Do not implement these now.
Only define the architectural contract.

18. SOURCE ADAPTER INDEPENDENCE
Adding one collector must not require rewriting:
- normalization
- deduplication
- verification
- filtering
- AI logic

19. JOB DATA FLOW
Clearly document:

source discovery
→ collection
→ raw persistence
→ parsing
→ normalization
→ deterministic deduplication
→ verification
→ deterministic rule evaluation
→ LLM ambiguity handling where required
→ final status

20. STATUSES
Keep aligned with the frozen V1 specification:
- NEW
- ELIGIBLE
- REVIEW
- REJECTED
- DUPLICATE
- EXPIRED
- VERIFICATION_FAILED

Role priority:
- P1
- P2
- P3
- NOT_RELEVANT

21. OBSERVABILITY
Architecture should include a lightweight concept for:
- collector success/failure
- number of jobs collected
- number normalized
- duplicates
- verification failures
- filter outcomes
- source freshness
- API/rate-limit failures
- AI provider failures
- AI token usage where available

Do not add a heavy observability stack yet.

22. TESTABILITY
Architecture must make it possible to test collectors and business rules independently.

Include:
- unit tests
- fixture-based source responses
- parser tests
- normalization tests
- deduplication tests
- verification tests
- filter-rule tests
- AI gateway tests using mocks
- integration tests later

DOCUMENTS TO CREATE

Create:

1. docs/architecture/SYSTEM_ARCHITECTURE_V1.md

Include:
- architecture goals
- architectural principles
- high-level architecture
- component responsibilities
- end-to-end data flow
- source layer
- company discovery
- company registry
- collector architecture
- raw data strategy
- normalization
- deduplication
- verification
- rule engine
- AI gateway/router
- caching
- persistence
- scheduling
- observability
- testing strategy
- failure handling
- security/safety boundaries
- scalability considerations
- future extension points
- clear V1 boundaries

2. docs/architecture/TECH_STACK_V1.md

For each component document:
- selected technology
- purpose
- why selected
- free/₹0 justification
- important alternatives considered
- why alternatives were not selected
- known limitations

At minimum cover:
- Python
- FastAPI
- httpx
- Playwright
- PostgreSQL
- SQLAlchemy
- Pydantic
- APScheduler
- pytest
- uv
- Docker
- Ollama/local models
- multi-provider AI gateway

3. docs/architecture/ARCHITECTURE_DECISIONS_V1.md

Document the important decisions as concise ADR-style entries.

At minimum:
- API-first/public-source-first
- ATS as backbone but not sole source
- company registry
- modular monolith
- PostgreSQL
- deterministic-first filtering
- LLM gateway instead of single provider
- local model fallback
- AI caching
- Firecrawl not required
- no authenticated LinkedIn automation
- no anti-bot/CAPTCHA bypass
- no premature distributed infrastructure

4. Update README.md ONLY if necessary to add links to the new architecture documents.
Do not rewrite the existing README unnecessarily.

QUALITY REQUIREMENTS

- Keep documentation concrete and implementation-oriented.
- Avoid vague statements such as "scalable", "robust", or "production-ready" without explaining how.
- Do not claim a component is free unless it is actually free/open-source/free-tier according to the current research context.
- Distinguish between:
  1. architecture decision
  2. future option
  3. unresolved research question
- Clearly mark anything that still needs research.
- Keep V1 simple enough for one developer.
- Preserve all existing frozen business rules.
- Do not change requirements or filtering logic.

IMPORTANT STOP CONDITION

After creating the documentation:
1. Validate all internal Markdown links.
2. Check for contradictions with the existing requirements/rules.
3. Check that Firecrawl is not a required dependency.
4. Check that the ₹0 constraint is respected.
5. Check that no authenticated LinkedIn scraping or bypass mechanism is proposed.
6. Check that multi-provider AI + local fallback + caching are represented.
7. Check Git diff.
8. DO NOT commit.
9. DO NOT push.
10. Report:
   - files created/modified
   - architecture summary
   - any unresolved questions
   - validation results
   - exact git diff/stat summary

Then STOP and wait for review.
```

## Prompt:
9/7/2026, 12:02:53 AM

check this

[Attachment: Pasted markdown(20260906-183305).md]

## Response:
9/7/2026, 12:03:12 AM · gpt-5-6-t-mini

I checked Agy’s output. Overall, **this is good and matches our architecture direction**. The documentation phase is done correctly: 3 architecture docs were created, README linked, no code/dependencies/commit/push were made, and the validation checks reported clean. `Pasted markdown.md` `Pasted markdown.md`

### My verdict: **PASS, with 3 things to fix before coding**

**1. “90%+ jobs evaluated without AI” should NOT be a target yet.**  
Agy states this as an architectural point. `Pasted markdown.md`  
We don't have real data proving 90% yet. Change it to something like:

> “Maximize deterministic evaluation; use AI only when ambiguity requires it.”

Otherwise we're creating an arbitrary benchmark.

**2. PostgreSQL 16+ is fine, but don’t lock the project to a specific major version.**  
Agy repeatedly says PostgreSQL 16+. `Pasted markdown.md`  
Better architecture wording:

> PostgreSQL (currently supported stable release)

The actual installed version can be decided during implementation.

**3. The AI provider list should be treated as an implementation-time choice.**  
Agy names Gemini Free, Groq Free and OpenRouter Free. `Pasted markdown.md`  
That's reasonable, but free quotas/models can change. The **gateway abstraction** is the important decision, not those specific providers. We should verify the current free limits when implementing.

### One thing I particularly like

The architecture correctly preserves raw data and provenance instead of overwriting source information. `Pasted markdown.md`

That's essential for our conflict rule:

```text
Source A → 0-2 years
Source B → 1-3 years

        ↓

SOURCE_CONFLICT_REVIEW
```

Also, the collector hierarchy and modular-monolith approach are exactly what I wanted: we can add Naukri/ATS/company-page collectors independently without rewriting the rest of the system. `Pasted markdown.md`

### So: architecture status

**PASS → minor wording corrections → then implementation.**

I would **not redesign the architecture**. It is solid enough to move forward.

The unresolved questions Agy identified-CSR detection, Common Crawl efficiency, and secondary ATS fingerprints-are appropriate research items rather than blockers. `Pasted markdown.md`

**Next step:** make those 3 corrections, then we move to the **actual repository/project structure and database schema design** before writing collectors.

## Prompt:
9/7/2026, 12:07:57 AM

ok do it

## Response:
9/7/2026, 12:08:16 AM · gpt-5-6-t-mini

Yes. Give Agy this exact **correction-only prompt**. No coding yet.

```text id="9m9xqj"
We reviewed the V1 architecture documentation you created.

Make ONLY the following 3 documentation corrections.

IMPORTANT:
- Do NOT write application code.
- Do NOT install dependencies.
- Do NOT commit.
- Do NOT push.
- Do NOT redesign the architecture.
- Preserve all existing requirements and decisions unless explicitly changed below.

1. REMOVE THE UNPROVEN "90%+" AI TARGET

In SYSTEM_ARCHITECTURE_V1.md, you currently state that:
"90%+ of jobs [are] evaluated without AI"

This is an unverified numerical target and must not be presented as an architectural fact.

Replace it with wording such as:

"Deterministic-first evaluation: maximize deterministic evaluation and invoke AI only when ambiguity or semantic interpretation requires it."

Do NOT introduce another arbitrary percentage target.

Also check the other architecture documents for the same 90%+ claim and remove/update it wherever necessary.

2. DO NOT LOCK ARCHITECTURE TO POSTGRESQL 16+

The architecture currently repeatedly refers to:
"PostgreSQL 16+"

Change architecture-level wording to:

"PostgreSQL"

Reason:
The architecture chooses PostgreSQL as the database technology, but the exact major/minor version should be selected and verified during implementation based on the currently supported stable release and project environment.

Update this consistently in:
- SYSTEM_ARCHITECTURE_V1.md
- TECH_STACK_V1.md
- ARCHITECTURE_DECISIONS_V1.md

Do not remove PostgreSQL itself.

3. MAKE AI PROVIDER NAMES IMPLEMENTATION-TIME OPTIONS

The architecture correctly requires a provider-agnostic LLM gateway, but specific free providers/models must NOT be treated as permanent architectural dependencies because free quotas, models, limits, and availability can change.

Keep the architectural decision:

"Provider-agnostic LLM Gateway"

But describe providers such as:
- Google Gemini
- Groq
- OpenRouter
- local Ollama

as examples/current candidate providers rather than immutable dependencies.

The architecture must communicate:

LLM Gateway
→ provider adapters
→ currently available free providers
→ local model fallback

The gateway must allow providers to be added, removed, reordered, or disabled without changing business logic.

Do NOT remove the multi-provider strategy.
Do NOT remove local fallback.
Do NOT remove caching.

After making the corrections:

1. Check all three architecture documents for consistency.
2. Search the repository for:
   - "90%+"
   - "PostgreSQL 16+"
   - wording that implies Gemini/Groq/OpenRouter are permanent required dependencies
3. Fix only documentation references related to these 3 changes.
4. Validate internal Markdown links.
5. Confirm the frozen V1 requirements/rules are unchanged.
6. Run git diff.
7. Report:
   - files changed
   - exact conceptual changes made
   - validation results
   - git diff/stat summary
8. DO NOT commit.
9. DO NOT push.
10. STOP and wait for review.
```

After Agy finishes, **send me its output**. I'll do the final architecture review, and then we can move to **database schema + repository structure design**.

## Prompt:
9/7/2026, 12:26:20 AM

All three requested documentation corrections have been applied across the V1 architecture documents.      
  ──────
  ### Conceptual Changes Made

  1. Removed the Unproven "90%+" AI Target:
      • Replaced all claims asserting a fixed "90%+" AI evaluation rate with the authoritative principle:    
      │ "Deterministic-first evaluation: maximize deterministic evaluation and invoke AI only when
      │ ambiguity or semantic interpretation requires it."

      • Applied in:
          • SYSTEM_ARCHITECTURE_V1.md:454 (§11.2 Bottleneck Analysis & Mitigations)
          • ARCHITECTURE_DECISIONS_V1.md:91 (ARCHITECTURE_DECISIONS_V1.md)
      • Verified zero occurrences of "90%" remain across the entire repository.
  2. Decoupled Architecture from "PostgreSQL 16+":
      • Replaced all occurrences of PostgreSQL 16+ with generic, unconstrained PostgreSQL at the
      architectural level.
      • Applied in:
          • TECH_STACK_V1.md:68 (§2.5 Heading & §3 Trade-Off Matrix)
          • ARCHITECTURE_DECISIONS_V1.md:44 (ARCHITECTURE_DECISIONS_V1.md)
      • Verified zero occurrences of 16+ remain across the entire repository.
  3. Framed AI Providers as Implementation-Time Candidates Behind Provider Adapters:
      • Updated the architecture to strictly specify the pipeline hierarchy:


    LLM Gateway longrightarrow Provider Adapters longrightarrow Active Free Cloud Providers longrightarrow   
  Local Model Fallback

  • Explicitly documented that specific providers (Google Gemini, Groq, OpenRouter, Ollama) are
  implementation-time candidate options and examples, not immutable architectural dependencies. Any
  provider can be added, reordered, or removed via configuration without modifying pipeline business logic.  
  • Applied in:
      • SYSTEM_ARCHITECTURE_V1.md:255-292 (ASCII Architecture Diagram, §5.1 Gateway Router & Provider        
      Adapter Architecture, §9.1 Audit Metrics, §10 Testing Matrix, and §13 Scope Boundaries)
      • TECH_STACK_V1.md:144-188 (§2.12 Local AI Inference Runtime, §2.13 Provider-Agnostic LLM Gateway &
      Candidate Cloud Providers, and §3 Trade-Off Matrix)                                                    
      • ARCHITECTURE_DECISIONS_V1.md:97-117 (ARCHITECTURE_DECISIONS_V1.md & ARCHITECTURE_DECISIONS_V1.md)
                                                                                                             
  ──────
  ### Verification & Link Validation

  • Link & Anchor Integrity: Ran automated verification across all 10 Markdown files in the repository.
  All file references and heading anchor slugs resolve with 0 broken links.                                  
  • Git State: No files have been committed or pushed.
  ──────
  ### Git Diffstat

     README.md                                      |   2 +-
     docs/architecture/ARCHITECTURE_DECISIONS_V1.md | 174 +++++++++++++++++++++++++
     docs/architecture/SYSTEM_ARCHITECTURE_V1.md    | 482
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
     docs/architecture/TECH_STACK_V1.md             | 187 +++++++++++++++++++++++++++
     4 files changed, 844 insertions(+), 1 deletion(-)
    
  Awaiting your review.

## Response:
9/7/2026, 12:26:41 AM · gpt-5-6-t-mini

**PASS.** This correction is exactly what we wanted.

Agy confirms:
- the unsupported **90%+** target is removed;
- PostgreSQL is no longer locked to **16+**;
- the LLM layer is genuinely **provider-agnostic**, with cloud providers treated as replaceable candidates and Ollama as a local fallback;
- all Markdown links validate;
- no commit/push happened. `Pasted markdown.md`

One small observation: the diff is now **844 lines**, so the architecture documentation is fairly detailed. That's okay for a serious portfolio project, and I don't see a reason to cut it just for brevity.

### Architecture is now frozen.

**Next step: Database Schema + Repository Structure design.**

Before any collector code, we need to define:
```text
Repository structure
        ↓
Database entities
        ↓
Relationships
        ↓
Indexes / uniqueness
        ↓
Raw vs canonical data
        ↓
Source provenance
```

This is important because our **deduplication, verification, cross-source conflicts, and future AI analysis** all depend on getting the data model right.

I recommend we research/design **both together**, then give Agy one documentation-only task.

## Prompt:
9/7/2026, 12:27:10 AM

we will do this tommowr for now we have to shut down

## Response:
9/7/2026, 12:27:29 AM · gpt-5-6-t-mini

Absolutely. We have a clean checkpoint.

**Today’s work:**
- V1 requirements frozen
- Filtering/dedup/verification rules frozen
- Source discovery strategy researched
- Firecrawl removed from core
- ATS + company pages + portals strategy established
- System architecture documented
- Tech stack documented
- AI multi-provider + local fallback + caching designed
- Architecture corrections completed and validated

**Next session:** Database schema + repository structure design.

Good stopping point for today. Sleep well. Tomorrow we continue from exactly here.

## Prompt:
9/7/2026, 12:27:38 AM

so give me todays push promtes

## Response:
9/7/2026, 12:27:57 AM · gpt-5-6-t-mini

Yes. Since today’s work is now at a **stable checkpoint**, this is the right time to commit and push it.

Give Agy this exact prompt:

```text
We are ending today's work at a stable checkpoint.

Your task now is ONLY to create a clean Git commit and push today's completed documentation work to the GitHub repository.

IMPORTANT:
- Do NOT modify architecture content.
- Do NOT modify requirements/rules.
- Do NOT write application code.
- Do NOT install dependencies.
- Do NOT create any additional files.
- Do NOT change the branch.
- Do NOT squash or rewrite previous commits.

Repository:
https://github.com/TANMAY4806w/AI-Job-Intelligence.git

Today's completed work includes:
- V1 requirements and business rules already frozen in previous commit.
- Source & company discovery research documentation.
- V1 system architecture documentation.
- V1 technology stack documentation.
- V1 architecture decision records.
- Architecture corrections:
  1. Removed unproven "90%+" AI target.
  2. Decoupled architecture from PostgreSQL 16+.
  3. Made cloud AI providers implementation-time candidates behind a provider-agnostic LLM gateway.
- Firecrawl excluded from core V1 architecture.
- Multi-provider AI + local fallback + caching documented.
- No authenticated LinkedIn scraping or anti-bot/CAPTCHA bypass architecture.

BEFORE COMMITTING:

1. Run:
   git status
   git diff --check
   git diff --stat

2. Verify the expected files are present:
   - README.md
   - docs/architecture/ARCHITECTURE_DECISIONS_V1.md
   - docs/architecture/SYSTEM_ARCHITECTURE_V1.md
   - docs/architecture/TECH_STACK_V1.md

3. Confirm:
   - No application source code was added.
   - No dependency files were added unintentionally.
   - No secrets/API keys/credentials exist in the diff.
   - Existing frozen requirements/rules were not modified unintentionally.

4. Review the final diff once more.

COMMIT:

Create ONE atomic commit with this message:

docs: finalize v1 system architecture

PUSH:

Push the current branch to its configured GitHub remote.

After pushing, verify:

git status
git log -1 --oneline
git remote -v

Report:
- commit hash
- commit message
- files included
- push result
- final git status
- whether the working tree is clean

STOP after this.
```

### Today's Git checkpoint

You should end today with something like:

```text
280b01b  docs: freeze v1 job eligibility rules
        ↓
        ↓ today's architecture work
        ↓
NEW     docs: finalize v1 system architecture
```

That gives us **two meaningful atomic commits**, which is much better than one giant commit.

Tomorrow we start from the clean GitHub checkpoint with:

**Database Schema + Repository Structure → then implementation.**

## Prompt:
9/7/2026, 12:33:24 AM

### Commits on Sep 7, 2026

-

#### [docs: finalize v1 system architecture](https://github.com/TANMAY4806w/AI-Job-Intelligence/commit/7a44ce61588a1025ee47f67569f31c06b60265e7 "docs: finalize v1 system architecture")

[TANMAY4806w](https://github.com/TANMAY4806w) ([image](https://avatars.githubusercontent.com/u/159042497?v=4\&size=32))[TANMAY4806w](https://github.com/TANMAY4806w/AI-Job-Intelligence/commits?author=TANMAY4806w)

committed3 minutes ago

svg

### Commits on Sep 6, 2026

-

#### [docs: freeze v1 job eligibility rules](https://github.com/TANMAY4806w/AI-Job-Intelligence/commit/280b01b71075390bc6f6d91f0e45575650d8f0cf "docs: freeze v1 job eligibility rules")

[TANMAY4806w](https://github.com/TANMAY4806w) ([image](https://avatars.githubusercontent.com/u/159042497?v=4\&size=32))[TANMAY4806w](https://github.com/TANMAY4806w/AI-Job-Intelligence/commits?author=TANMAY4806w)

committed1 hour ago done see u tommowr

## Response:
9/7/2026, 12:33:43 AM · gpt-5-6-t-mini

Perfect. GitHub confirms the two clean checkpoints are in place:

`280b01b` → freeze V1 job eligibility rules  
`7a44ce6` → finalize V1 system architecture

We’re ending at a **stable, pushed state**. Tomorrow we pick up with **Database Schema + Repository Structure design**.

Good night. See you tomorrow.

## Prompt:
9/7/2026, 11:41:55 PM

ignor this resume and we have to continoe our work

[Attachment: Tanmay_Patil_AI_Engineer(6).pdf]

## Response:
9/7/2026, 11:42:17 PM · gpt-5-6-t-mini

Understood. We’ll ignore the resume for this project and continue from our last checkpoint.

### Current project checkpoint

We have already completed:

**1. V1 requirements**
- Roles, locations, salary, experience
- Freshness rules
- Review/reject rules
- Maximum-recall principle

**2. Data rules**
- Normalization
- Deduplication
- Verification
- Provenance/conflict handling

**3. Source strategy**
- ATS + job portals + company career pages
- Company-centric discovery
- API-first/public-source-first
- Firecrawl removed from core
- No authenticated LinkedIn scraping or anti-bot bypass

**4. Architecture**
- Modular monolith
- Python + FastAPI
- PostgreSQL
- httpx
- Playwright fallback
- APScheduler
- Multi-provider LLM gateway
- Local Ollama fallback
- AI caching
- Deterministic-first processing

**5. Git**
Latest checkpoint:
`7a44ce6 — docs: finalize v1 system architecture`

So the next step is exactly what we planned:

## Database Schema + Repository Structure Design

Before writing collectors, we need to design:

```text
Repository
   ↓
Modules
   ↓
Database tables
   ↓
Relationships
   ↓
Indexes / uniqueness
   ↓
Raw → canonical job lifecycle
   ↓
Source provenance
```

I suggest we **research this first**, especially the schema for `companies`, `sources`, `raw_jobs`, `jobs`, `job_source_references`, `verification_records`, `filter_decisions`, and `ai_analysis_results`, then give Agy a documentation-only implementation prompt.

That is the next thing we should do.

## Prompt:
9/7/2026, 11:42:33 PM

do research

## Response:
9/7/2026, 11:42:53 PM · gpt-5-6-t-mini

> **Searched 2 websites**
>
> 
>
> Worked for a couple of seconds

I researched the **database schema + repository structure** with our actual requirements in mind, not just a generic job scraper.

## 1. The key design decision

We should **separate raw source data from our canonical job data**.

```text
SOURCE
  ↓
raw_jobs
  ↓
normalization
  ↓
jobs
  ↓
job_source_references
```

This is the right design because one real job can appear on multiple sources, while each source can provide different/conflicting evidence.

PostgreSQL is a strong fit because it gives us normal relational constraints/indexes plus `jsonb` for preserving variable source payloads. PostgreSQL supports GIN indexing on `jsonb`; SQLAlchemy also supports explicit composite and functional indexes/constraints. ([PostgreSQL](https://www.postgresql.org/docs/12/datatype-json.html?utm_source=chatgpt.com))

---

# 2. Recommended core database

I recommend these **10 tables**, not a huge schema.

### A. `companies`

One canonical company.

```text
id
canonical_name
normalized_name
website_url
careers_url
industry
company_type
location_summary
verification_status
created_at
updated_at
```

This becomes our company registry.

---

### B. `sources`

Represents where data comes from.

```text
id
name
source_type
base_url
access_method
is_active
created_at
updated_at
```

Examples:

```text
Greenhouse
Lever
Ashby
Naukri
LinkedIn
Cutshort
Hirist
...
```

---

### C. `company_sources`

Connects a company to a particular source/ATS.

```text
id
company_id
source_id
external_company_id
external_slug
board_url
discovery_method
confidence
last_verified_at
status
```

This is **very important**.

Example:

```text
Company: Razorpay
Source: Greenhouse
external_slug: razorpay
```

For Lever:

```text
Company: X
Source: Lever
external_slug: company-slug
```

So our collector knows exactly where to query.

---

### D. `raw_jobs`

Immutable source evidence.

```text
id
company_source_id
source_job_id
source_url
application_url
raw_payload JSONB
raw_content_hash
first_seen_at
last_seen_at
collected_at
```

**Do not update the historical payload destructively.**

This is our audit/evidence layer.

---

### E. `jobs`

Our canonical representation of the actual job.

```text
id
company_id

canonical_title
normalized_title
role_priority

description
location
location_type

experience_min
experience_max
experience_text

salary_min
salary_max
salary_currency
salary_period
salary_text

posted_at
first_seen_at
last_seen_at

status
review_reason
verification_confidence

created_at
updated_at
```

This is what the future dashboard will primarily query.

---

### F. `job_source_references`

Many-to-one relationship:

```text
one canonical job
        ↓
many source appearances
```

```text
id
job_id
raw_job_id
source_id
source_job_id
source_url
application_url
source_title
source_location
source_experience
source_salary
source_posted_at
match_method
match_confidence
is_primary_source
```

This is what allows:

```text
LinkedIn ──┐
Naukri ────┼──> ONE canonical job
ATS ───────┘
```

---

### G. `verification_records`

Every verification attempt should be auditable.

```text
id
job_id
verification_run_id
source_valid
jd_exists
application_url_valid
company_valid
location_consistent
experience_consistent
salary_stated
posting_date_plausible
confidence
status
evidence JSONB
verified_at
```

Don't put all of this directly on `jobs`, because a job can be verified multiple times.

---

### H. `filter_decisions`

Your business-rule result should be stored separately.

```text
id
job_id
rule_version
status
role_priority
reason_codes
evaluated_at
```

Example:

```text
status:
REVIEW

role_priority:
P1

reason_codes:
["SOURCE_CONFLICT_REVIEW"]
```

This lets us change rules later without destroying historical decisions.

---

### I. `ai_analysis_results`

AI output should also be historical/versioned.

```text
id
job_id
provider
model
prompt_version
input_hash
output JSONB
confidence
created_at
```

This works directly with our caching design:

```text
hash(JD + prompt_version + model_version)
```

Same input/version → reuse result.

---

### J. `collection_runs`

Operational history.

```text
id
source_id
company_source_id
started_at
finished_at
status
jobs_found
jobs_created
jobs_updated
jobs_failed
error_summary
```

This will become extremely useful when a collector breaks.

---

# 3. One thing I would NOT do

Don't put everything into one monster `jobs` table.

For example:

```text
jobs
 ├── raw_greenhouse_json
 ├── raw_naukri_json
 ├── ai_result
 ├── verification_result
 ├── source_2_title
 ├── source_3_title
 ...
```

That becomes unmaintainable.

Our separation is much cleaner:

```text
raw_jobs        = what the source actually said
jobs            = what our system believes the job is
references      = where that belief came from
verification    = how confident we are
filter_decision = what our rules decided
AI analysis     = what the model inferred
```

That separation is one of the strongest parts of this architecture.

---

# 4. Deduplication design

We should **not rely on one giant unique constraint** for deduplication.

Instead, use layers:

### Level 1 - strongest

```text
(source_id + source_job_id)
```

### Level 2

```text
application_url
```

### Level 3

```text
company + normalized_title + normalized_location
```

### Level 4

JD similarity / semantic matching later.

The database should enforce the obvious uniqueness cases, while the application performs the more intelligent matching. SQLAlchemy/PostgreSQL support composite unique constraints and indexes for this clean separation. ([SQLAlchemy Documentation](https://docs.sqlalchemy.org/en/20/core/constraints.html?utm_source=chatgpt.com))

---

# 5. Important indexes

We should index around actual query patterns, not everything.

Likely important:

```text
jobs.status
jobs.role_priority
jobs.posted_at
jobs.company_id
jobs.location
jobs.normalized_title

raw_jobs(source_job_id)
raw_jobs(company_source_id, source_job_id)

job_source_references(job_id)
job_source_references(source_id, source_job_id)

company_sources(source_id, external_slug)
```

Potentially later:

```text
GIN(raw_jobs.raw_payload)
```

for JSONB queries, because PostgreSQL supports GIN indexing on `jsonb`. ([PostgreSQL](https://www.postgresql.org/docs/12/datatype-json.html?utm_source=chatgpt.com))

---

# 6. Repository structure

I recommend a **modular monolith**, matching the architecture we already approved.

```text
AI-Job-Intelligence/
│
├── app/
│   ├── api/
│   ├── collectors/
│   │   ├── base/
│   │   ├── greenhouse/
│   │   ├── lever/
│   │   ├── ashby/
│   │   └── ...
│   │
│   ├── discovery/
│   ├── normalization/
│   ├── deduplication/
│   ├── verification/
│   ├── rules/
│   ├── ai/
│   │   ├── gateway/
│   │   ├── providers/
│   │   └── cache/
│   ├── persistence/
│   ├── scheduling/
│   └── config/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   └── ...
│
├── migrations/
│
├── scripts/
│
├── docs/
│
├── rules/
│
├── pyproject.toml
├── uv.lock
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

### Why this structure?

Because each major business capability gets its own boundary:

```text
collector
   ↓
normalization
   ↓
deduplication
   ↓
verification
   ↓
rules
   ↓
AI
```

A collector should **never contain filtering logic**.

A filter should **never know how Greenhouse works**.

An AI provider should **never know about PostgreSQL**.

That separation is what will make this project look like real engineering rather than a large Python script.

---

# 7. One change from our earlier architecture

I would add a small concept called:

**`discovery_runs`**

Separate from `collection_runs`.

Because:

```text
Discovery
= find companies / ATS endpoints

Collection
= fetch jobs from known endpoints
```

These are fundamentally different operations.

That distinction will become very useful when we start Common Crawl/career-page discovery.

---

# Final schema

So our V1 database becomes:

```text
companies
    │
    └── company_sources ── sources
             │
             ↓
          raw_jobs
             │
             ↓
            jobs
             │
       ┌─────┼──────────────┐
       ↓     ↓              ↓
 references verification filter_decisions
                            │
                            ↓
                     ai_analysis_results

discovery_runs
collection_runs
```

This is the design I would use.

### Verdict

**Database: PostgreSQL + SQLAlchemy** - keep.

**Schema: normalized relational core + JSONB for raw/evidence** - keep.

**Repository: modular monolith** - keep.

**No Redis/Celery/Kafka/Elasticsearch yet** - keep.

The next action should be to have Agy turn this research into **`DATABASE_SCHEMA_V1.md` + `REPOSITORY_STRUCTURE_V1.md` + an ADR for the data model**, with no code yet. SQLAlchemy's current documentation explicitly supports the declarative ORM approach, foreign keys, composite indexes, and named constraints we would use here. ([SQLAlchemy Documentation](https://docs.sqlalchemy.org/en/20/orm/declarative_styles.html?utm_source=chatgpt.com))

---

**Sources:**

- [PostgreSQL: Documentation: 12: 8.14. JSON Types](https://www.postgresql.org/docs/12/datatype-json.html?utm_source=chatgpt.com)
- [Defining Constraints and Indexes — SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/core/constraints.html?utm_source=chatgpt.com)

## Prompt:
9/8/2026, 12:00:02 AM

i read this all think are perefcte go head

## Response:
9/8/2026, 12:00:21 AM · gpt-5-6-t-mini

Great. We’ll proceed.

### Next step: documentation only

We’ll have Agy create:

```text
docs/architecture/DATABASE_SCHEMA_V1.md
docs/architecture/REPOSITORY_STRUCTURE_V1.md
```

and add one ADR for the data-model decisions.

No database creation, migrations, or application code yet.

Use this exact prompt in Agy:

```text id="b7k5tq"
We have reviewed and approved the database/schema and repository-structure research for AI-Job-Intelligence.

IMPORTANT:
This is DOCUMENTATION ONLY.

DO NOT:
- write application code
- create database tables
- create migrations
- install dependencies
- initialize PostgreSQL
- create ORM models
- modify frozen requirements/rules
- commit
- push

Before editing:
1. Read:
   - README.md
   - docs/requirements/PROJECT_SCOPE.md
   - docs/requirements/V1_SPECIFICATION.md
   - docs/requirements/JOB_DATA_CONTRACT.md
   - rules/JOB_FILTERS_V1.md
   - rules/DEDUPLICATION_V1.md
   - rules/VERIFICATION_V1.md
   - docs/architecture/SYSTEM_ARCHITECTURE_V1.md
   - docs/architecture/TECH_STACK_V1.md
   - docs/architecture/ARCHITECTURE_DECISIONS_V1.md

2. Ensure the new documentation is consistent with all frozen requirements and the approved modular-monolith architecture.

CREATE:

1. docs/architecture/DATABASE_SCHEMA_V1.md

Document the V1 PostgreSQL data model.

Include these core tables/entities:

- companies
- sources
- company_sources
- raw_jobs
- jobs
- job_source_references
- verification_records
- filter_decisions
- ai_analysis_results
- discovery_runs
- collection_runs

For every entity document:
- purpose
- key fields
- data types at a conceptual level
- primary key
- foreign keys
- important uniqueness constraints
- important indexes
- nullable vs required fields where meaningful
- relationships
- lifecycle expectations

IMPORTANT DATA PRINCIPLES:

A. RAW VS CANONICAL

raw_jobs:
- preserves source evidence
- raw payload stored as JSONB
- source content must not be destructively overwritten

jobs:
- canonical normalized representation

job_source_references:
- connects one canonical job to multiple source appearances
- preserves source-specific values and provenance

B. COMPANY REGISTRY

companies:
- canonical company identity

company_sources:
- maps company to ATS/source
- supports provider-specific identifiers such as external slug/board ID
- stores discovery method and confidence

C. VERIFICATION

verification_records must preserve repeated verification attempts rather than overwriting history.

Include the verification dimensions already defined in VERIFICATION_V1.md.

D. FILTER DECISIONS

filter_decisions must preserve:
- rule version
- final status
- role priority
- reason codes
- evaluation timestamp

Do not duplicate the frozen rules themselves inside the schema documentation.

E. AI RESULTS

ai_analysis_results must support:
- provider
- model
- prompt version
- input hash
- structured output
- confidence
- timestamp

Explain how this supports AI caching and provider replacement.

F. RUN TRACKING

Clearly distinguish:

discovery_runs
= discovering companies / career pages / ATS endpoints

collection_runs
= collecting job records from known sources/endpoints

G. DEDUPLICATION

Document layered deduplication:

1. source + source_job_id
2. application URL
3. company + normalized title + normalized location
4. semantic/JD similarity later

Do NOT pretend the final semantic layer is purely a database constraint.

H. INDEXING

Document indexes around actual query patterns, especially:
- status
- role priority
- posted_at
- company_id
- location
- normalized title
- source identifiers
- company/source mappings

Mention JSONB/Gin indexing only as an intentional capability, not as an index on every JSONB column.

I. DATA RETENTION

Document which information should remain historical:
- raw source payloads
- source references
- verification attempts
- filter decisions
- AI analyses
- discovery/collection runs

Do not silently delete historical evidence when a job becomes expired.

J. STATUS MODEL

Keep aligned with the frozen statuses:
- NEW
- ELIGIBLE
- REVIEW
- REJECTED
- DUPLICATE
- EXPIRED
- VERIFICATION_FAILED

Role priority:
- P1
- P2
- P3
- NOT_RELEVANT

2. docs/architecture/REPOSITORY_STRUCTURE_V1.md

Document the proposed modular-monolith repository structure.

Use this approved conceptual layout:

AI-Job-Intelligence/
├── app/
│   ├── api/
│   ├── collectors/
│   │   ├── base/
│   │   ├── greenhouse/
│   │   ├── lever/
│   │   ├── ashby/
│   │   └── ...
│   ├── discovery/
│   ├── normalization/
│   ├── deduplication/
│   ├── verification/
│   ├── rules/
│   ├── ai/
│   │   ├── gateway/
│   │   ├── providers/
│   │   └── cache/
│   ├── persistence/
│   ├── scheduling/
│   └── config/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   └── ...
├── migrations/
├── scripts/
├── docs/
├── rules/
├── pyproject.toml
├── uv.lock
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md

For each major directory explain:
- responsibility
- what belongs there
- what must NOT belong there
- important dependency boundaries

Especially document these architectural boundaries:

Collectors must not contain filtering logic.

Rules must not contain source-specific collection logic.

Normalization must not depend on a particular ATS.

AI providers must not access PostgreSQL directly.

Persistence must not contain business-rule decisions.

Scheduling must orchestrate jobs, not implement business logic.

Tests should mirror the application boundaries where useful.

3. docs/architecture/ARCHITECTURE_DECISIONS_V1.md

Append ONE new ADR:

ADR-014: Normalized Relational Core with Immutable Raw Evidence

Decision:
Use PostgreSQL as the canonical persistence layer with:
- normalized relational entities for system state
- JSONB for source/raw evidence
- explicit provenance relationships
- historical verification/filter/AI records

Explain:
- context
- decision
- why
- alternatives rejected
- consequences

Also document the distinction:

raw evidence
→ canonical data
→ derived decisions

Do not modify existing ADR decisions unnecessarily.

QUALITY CHECKS

After writing the documents:

1. Validate all Markdown links.
2. Check naming consistency between:
   - DATABASE_SCHEMA_V1.md
   - JOB_DATA_CONTRACT.md
   - SYSTEM_ARCHITECTURE_V1.md
3. Check all relationships and entity names for consistency.
4. Confirm no frozen requirements/rules changed.
5. Confirm no code or migrations were created.
6. Confirm no dependencies were installed.
7. Run git diff --check.
8. Run git diff --stat.
9. Show git status.
10. DO NOT commit.
11. DO NOT push.

Report:
- files created/modified
- schema summary
- repository-structure summary
- ADR added
- validation results
- git status/diff summary

Then STOP and wait for review.
```

Once Agy finishes, bring me the output. **I’ll review the schema for logical problems before we let Agy create any actual database models.**

## Prompt:
9/8/2026, 12:10:42 AM

We have reviewed and approved the database/schema and repository-structure research for AI-Job-Intelligence.

IMPORTANT:
This is DOCUMENTATION ONLY.

DO NOT:
- write application code
- create database tables
- create migrations
- install dependencies
- initialize PostgreSQL
- create ORM models
- modify frozen requirements/rules
- commit
- push

Before editing:
1. Read:
   - README.md
   - docs/requirements/PROJECT_SCOPE.md
   - docs/requirements/V1_SPECIFICATION.md
   - docs/requirements/JOB_DATA_CONTRACT.md
   - rules/JOB_FILTERS_V1.md
   - rules/DEDUPLICATION_V1.md
   - rules/VERIFICATION_V1.md
   - docs/architecture/SYSTEM_ARCHITECTURE_V1.md
   - docs/architecture/TECH_STACK_V1.md
   - docs/architecture/ARCHITECTURE_DECISIONS_V1.md

2. Ensure the new documentation is consistent with all frozen requirements and the approved modular-monolith architecture.

CREATE:

1. docs/architecture/DATABASE_SCHEMA_V1.md

Document the V1 PostgreSQL data model.

Include these core tables/entities:

- companies
- sources
- company_sources
- raw_jobs
- jobs
- job_source_references
- verification_records
- filter_decisions
- ai_analysis_results
- discovery_runs
- collection_runs

For every entity document:
- purpose
- key fields
- data types at a conceptual level
- primary key
- foreign keys
- important uniqueness constraints
- important indexes
- nullable vs required fields where meaningful
- relationships
- lifecycle expectations

IMPORTANT DATA PRINCIPLES:

A. RAW VS CANONICAL

raw_jobs:
- preserves source evidence
- raw payload stored as JSONB
- source content must not be destructively overwritten

jobs:
- canonical normalized representation

job_source_references:
- connects one canonical job to multiple source appearances
- preserves source-specific values and provenance

B. COMPANY REGISTRY

companies:
- canonical company identity

company_sources:
- maps company to ATS/source
- supports provider-specific identifiers such as external slug/board ID
- stores discovery method and confidence

C. VERIFICATION

verification_records must preserve repeated verification attempts rather than overwriting history.

Include the verification dimensions already defined in VERIFICATION_V1.md.

D. FILTER DECISIONS

filter_decisions must preserve:
- rule version
- final status
- role priority
- reason codes
- evaluation timestamp

Do not duplicate the frozen rules themselves inside the schema documentation.

E. AI RESULTS

ai_analysis_results must support:
- provider
- model
- prompt version
- input hash
- structured output
- confidence
- timestamp

Explain how this supports AI caching and provider replacement.

F. RUN TRACKING

Clearly distinguish:

discovery_runs
= discovering companies / career pages / ATS endpoints

collection_runs
= collecting job records from known sources/endpoints

G. DEDUPLICATION

Document layered deduplication:

1. source + source_job_id
2. application URL
3. company + normalized title + normalized location
4. semantic/JD similarity later

Do NOT pretend the final semantic layer is purely a database constraint.

H. INDEXING

Document indexes around actual query patterns, especially:
- status
- role priority
- posted_at
- company_id
- location
- normalized title
- source identifiers
- company/source mappings

Mention JSONB/Gin indexing only as an intentional capability, not as an index on every JSONB column.

I. DATA RETENTION

Document which information should remain historical:
- raw source payloads
- source references
- verification attempts
- filter decisions
- AI analyses
- discovery/collection runs

Do not silently delete historical evidence when a job becomes expired.

J. STATUS MODEL

Keep aligned with the frozen statuses:
- NEW
- ELIGIBLE
- REVIEW
- REJECTED
- DUPLICATE
- EXPIRED
- VERIFICATION_FAILED

Role priority:
- P1
- P2
- P3
- NOT_RELEVANT

2. docs/architecture/REPOSITORY_STRUCTURE_V1.md

Document the proposed modular-monolith repository structure.

Use this approved conceptual layout:

AI-Job-Intelligence/
├── app/
│   ├── api/
│   ├── collectors/
│   │   ├── base/
│   │   ├── greenhouse/
│   │   ├── lever/
│   │   ├── ashby/
│   │   └── ...
│   ├── discovery/
│   ├── normalization/
│   ├── deduplication/
│   ├── verification/
│   ├── rules/
│   ├── ai/
│   │   ├── gateway/
│   │   ├── providers/
│   │   └── cache/
│   ├── persistence/
│   ├── scheduling/
│   └── config/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   └── ...
├── migrations/
├── scripts/
├── docs/
├── rules/
├── pyproject.toml
├── uv.lock
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md

For each major directory explain:
- responsibility
- what belongs there
- what must NOT belong there
- important dependency boundaries

Especially document these architectural boundaries:

Collectors must not contain filtering logic.

Rules must not contain source-specific collection logic.

Normalization must not depend on a particular ATS.

AI providers must not access PostgreSQL directly.

Persistence must not contain business-rule decisions.

Scheduling must orchestrate jobs, not implement business logic.

Tests should mirror the application boundaries where useful.

3. docs/architecture/ARCHITECTURE_DECISIONS_V1.md

Append ONE new ADR:

ADR-014: Normalized Relational Core with Immutable Raw Evidence

Decision:
Use PostgreSQL as the canonical persistence layer with:
- normalized relational entities for system state
- JSONB for source/raw evidence
- explicit provenance relationships
- historical verification/filter/AI records

Explain:
- context
- decision
- why
- alternatives rejected
- consequences

Also document the distinction:

raw evidence
→ canonical data
→ derived decisions

Do not modify existing ADR decisions unnecessarily.

QUALITY CHECKS

After writing the documents:

1. Validate all Markdown links.
2. Check naming consistency between:
   - DATABASE_SCHEMA_V1.md
   - JOB_DATA_CONTRACT.md
   - SYSTEM_ARCHITECTURE_V1.md
3. Check all relationships and entity names for consistency.
4. Confirm no frozen requirements/rules changed.
5. Confirm no code or migrations were created.
6. Confirm no dependencies were installed.
7. Run git diff --check.
8. Run git diff --stat.
9. Show git status.
10. DO NOT commit.
11. DO NOT push.

Report:
- files created/modified
- schema summary
- repository-structure summary
- ADR added
- validation results
- git status/diff summary

Then STOP and wait for review.

## Response:
9/8/2026, 12:11:04 AM · gpt-5-6-t-mini

Yes — this is the **correct Agy prompt** for the next phase.

Run it in Agy exactly as pasted. It should create only:

```text
docs/architecture/DATABASE_SCHEMA_V1.md
docs/architecture/REPOSITORY_STRUCTURE_V1.md
```

and append **ADR-014**, without creating code or migrations.

When Agy finishes, paste its **result/output here**. I’ll review the schema and repository structure carefully before we allow any implementation.

## Prompt:
9/15/2026, 10:06:19 PM

![8bd3631e-1b1a-403a-891d-5d6dedae08a7.png](https://chatgpt.com/backend-api/estuary/content?id=file_00000000d84481f582ce72027ef9756f&fn=8bd3631e-1b1a-403a-891d-5d6dedae08a7.png&cd=attachment&ts=497887&p=fs&cid=1&sig=bb636c104ff68706fceb449530a0afce2b6e3648caf4e315e5dd919a68e0d6c1&v=0)

[Attachment: DATABASE_SCHEMA_V1.md]

[Attachment: REPOSITORY_STRUCTURE_V1.md]

we are at this stage what next ?

## Response:
9/15/2026, 10:06:45 PM · gpt-5-6-t-mini

> **Reviewing schema alignment**
>
> I’m spotting a few design mismatches before implementation: frozen salary fields conflict with live company data, source references may need company-specific identifiers, and application tracking appears outside the stated V1 scope. I’m checking these boundaries before proceeding.
>
> **Audited schema and frozen rule alignment**
>
> 
>
> Worked for 9s

I checked both documents. **Do not start implementation yet.** The overall design is strong, but I found a few schema issues that we should correct now, while documentation is still cheap to change.

### 1. Important: salary rule is wrong

`REPOSITORY_STRUCTURE_V1.md` says:

> “Minimum ₹3 LPA for P1/P2 hubs” `REPOSITORY_STRUCTURE_V1.md`

That does **not** match our frozen rules.

Our actual policy is:

- Mumbai / Navi Mumbai / Thane → **no strict minimum**
- Pune → **₹3.6 LPA minimum**
- Bengaluru → **₹5 LPA minimum**
- Hyderabad → **₹5 LPA minimum**

This must be fixed before coding.

### 2. `company_sources.ats_identifier` should not be mandatory

The schema makes `ats_identifier` required. `DATABASE_SCHEMA_V1.md`

But we also support:

```text
Company → CAREER_PAGE
```

A normal company career page may have **no ATS identifier**.

So it should be nullable, while the combination of fields determines what is required for a particular source.

### 3. `raw_jobs` should point to `company_sources`

Right now `raw_jobs` points to:

```text
source_id
```

instead of directly identifying the **specific company/source endpoint**. `DATABASE_SCHEMA_V1.md`

I'd change this to:

```text
company_source_id → company_sources.id
```

and derive the source/company from that relationship.

That's cleaner because:

```text
Greenhouse
 ├── Company A board
 ├── Company B board
 └── Company C board
```

The raw record should tell us exactly **which company's Greenhouse endpoint produced it**.

### 4. Expiration logic needs one clarification

The schema says expiration can use:

```text
posted_at OR collected_at > 5 days
```

`DATABASE_SCHEMA_V1.md`

But our rule is based on the **original publication date**, not when we happened to discover it.

So `collected_at` must **not** make a fresh late-discovered job appear active.

### 5. One architectural detail I want corrected

The repository structure currently has:

```text
api
 ↓
scheduling
 ↓
collectors/discovery
```

`REPOSITORY_STRUCTURE_V1.md`

That's a little awkward.

We should have an **application/orchestration service layer** between API/scheduler and domain modules, so both API-triggered and scheduled runs can call the same pipeline.

Something like:

```text
API ─────────┐
             ↓
       Orchestration
             ↓
     Collect → Normalize
             ↓
       Dedup → Verify
             ↓
      Rules → AI → Persist
```

This isn't a huge redesign; it's a small architectural cleanup.

---

## Verdict

**Architecture: PASS**

**Database schema: PASS with corrections**

**Repository structure: PASS with corrections**

I recommend we give Agy **one correction prompt now**, then review the revised documents once more. After that, we're ready for the first real implementation step.

Use this prompt:

```text
We reviewed DATABASE_SCHEMA_V1.md and REPOSITORY_STRUCTURE_V1.md.

Make ONLY the following documentation corrections.

IMPORTANT:
- Documentation only.
- No application code.
- No migrations.
- No ORM models.
- No dependency installation.
- No PostgreSQL initialization.
- No commit.
- No push.
- Do not redesign unrelated parts.

1. FIX SALARY RULE CONSISTENCY

In REPOSITORY_STRUCTURE_V1.md and anywhere else in the newly created architecture/database documentation:

Replace any statement implying:
"Minimum ₹3 LPA for P1/P2 hubs"

with the exact frozen V1 salary policy:

- Mumbai / Navi Mumbai / Thane: no strict minimum
- Pune: minimum ₹3.6 LPA
- Bengaluru: minimum ₹5 LPA
- Hyderabad: minimum ₹5 LPA
- Unknown salary: do not automatically reject; route according to the frozen review policy

Search the new documentation for:
- "₹3 LPA"
- "3 LPA"
- "salary threshold"
- "salary minimum"

Ensure there are no contradictory statements.

2. FIX company_sources ATS IDENTIFIER NULLABILITY

In DATABASE_SCHEMA_V1.md:

`ats_identifier` must be nullable.

Reason:
Not every source is an ATS with an external board identifier. A company career page may have no ATS identifier.

Document the semantic rule:

- ATS/API source: `ats_identifier` is normally expected.
- Generic career page source: `ats_identifier` may be NULL.
- `career_url` and/or `api_endpoint` identify the endpoint where appropriate.

Do not weaken the identity/uniqueness model unnecessarily.

3. FIX raw_jobs OWNERSHIP / PROVENANCE

In DATABASE_SCHEMA_V1.md:

Change the primary ownership relationship of `raw_jobs` from:

`source_id`

to:

`company_source_id -> company_sources.id`

Reason:
A source platform can host many different company boards/endpoints.

The raw job record should identify the exact company/source configuration that produced it.

Keep the ability to derive:
company_id and source_id
through the `company_sources` relationship.

Update:
- ER diagram
- foreign-key section
- field descriptions
- indexes
- relationships
- deduplication references
- any affected text

Ensure consistency with `collection_runs`.

Do not remove source provenance.

4. FIX POSTING FRESHNESS / EXPIRATION LOGIC

The frozen V1 rule is based on ORIGINAL PUBLICATION DATE.

Therefore:

`posted_at` = primary field used for the >5 day active-feed expiration decision.

`collected_at` must NOT cause an old job discovered late to become active.

Clarify:

- old late-discovered posting -> historically stored
- if original posting date is >5 days old -> EXPIRED / not active
- `collected_at` is ingestion metadata, not the freshness basis

Do not change the frozen freshness rule.

5. IMPROVE ORCHESTRATION DEPENDENCY FLOW

In REPOSITORY_STRUCTURE_V1.md, add a lightweight application orchestration concept.

Do NOT turn the project into microservices.

Preferred conceptual flow:

API ───────────────┐
                   ↓
             Orchestration
                   ↓
       collectors / discovery
                   ↓
          normalization
                   ↓
          deduplication
                   ↓
      verification + rules
                   ↓
             AI when needed
                   ↓
             persistence

Scheduler should also call the same orchestration layer:

Scheduler → Orchestration → Pipeline

The purpose is to prevent API and scheduler from duplicating pipeline coordination logic.

You may introduce a conceptual directory such as:

`app/services/`
or
`app/orchestration/`

Choose the cleaner naming and document why.

Keep module boundaries:
- collectors do not filter
- rules do not scrape
- AI providers do not access persistence directly
- persistence does not make business decisions

6. FINAL CONSISTENCY CHECK

After modifications:

- verify DATABASE_SCHEMA_V1.md and REPOSITORY_STRUCTURE_V1.md agree
- verify consistency with SYSTEM_ARCHITECTURE_V1.md
- verify consistency with JOB_DATA_CONTRACT.md
- verify no frozen requirements/rules were changed
- search for contradictory salary statements
- verify raw_jobs provenance is consistent everywhere
- verify expiration is based on posted_at
- verify company_sources supports non-ATS career pages

Run:
- git diff --check
- git diff --stat
- git status

DO NOT:
- commit
- push
- create code
- create migrations
- install anything

Report the changes and validation results, then STOP.
```

After that revision, **we should be ready to freeze the data model and move into actual project initialization/implementation.**

## Prompt:
10/18/2026, 12:18:33 AM

there is big gap i mean we are resumig this project form lots of day so 1st we need to check status on code base in local than start next step

## Response:
10/18/2026, 12:18:57 AM · gpt-6-t-mini

> **Preparing a repository audit**
>
> I’m drafting a discovery-only prompt that verifies the repository’s current state, recent history, branches, remotes, tracked and untracked files, documentation, and architecture without modifying files, exposing secrets, committing, or pushing.
>
> **Prepared a repository audit**
>
> 
>
> Worked for 11s

You're absolutely right. We have had a significant gap, so we should **re-establish the actual local project state before making any more changes**\. My previous recommendation to immediately correct the documents was premature.

We'll treat this as a project resumption and audit session.

## Step 1 - Audit the local repository

Open Agy in your `Desktop/AI-Job-Intelligence` project folder and paste this prompt.

**standard: **

We are resuming the AI-Job-Intelligence project after a significant gap.

Before continuing development, I want a complete READ-ONLY audit of the current local repository. We must establish the actual state before deciding the next step.

**IMPORTANT: INSPECTION ONLY. DO NOT CHANGE ANYTHING.**

Do not:
- Edit, create, rename, or delete any files.
- Write application code.
- Install dependencies.
- Initialize or modify a database.
- Run migrations.
- Commit, push, pull, merge, reset, stash, or switch branches.
- Automatically fix documentation or formatting issues.
- Assume previous session notes accurately represent the current local state.

## 1. Establish Git state

Run and report the results of:

- `git rev-parse --show-toplevel`
- `git branch --show-current`
- `git branch -vv`
- `git status --short --branch`
- `git status --porcelain=v1 -uall`
- `git log -10 --oneline --decorate`
- `git remote -v`
- `git diff --stat HEAD`
- `git diff --check`
- `git ls-files`

The last known checkpoint from our previous session was commit `7a44ce6` (`docs: finalize v1 system architecture`). Verify whether that checkpoint is present locally. Do not assume it is the current HEAD.

Do not expose credentials or tokens if any remote configuration contains them.

## 2. Inspect the actual directory structure

Inspect the repository's current directory tree, including:

- `README.md`
- `docs/requirements/`
- `docs/architecture/`
- `docs/decisions/`
- `docs/development/`
- `docs/research/`
- `rules/`
- `src/` or `app/`, if present
- `tests/`
- `prompts/`
- Root-level configuration and dependency files.

Do not assume these paths all exist. Report missing directories and unexpected files.

Identify which files are:
- Tracked by Git.
- Modified but uncommitted.
- Newly created and untracked.
- Already committed.

Remember: `git diff` does not show the contents of untracked files. Inspect relevant untracked files read-only when necessary.

## 3. Establish implementation progress

Determine whether the repository currently contains any real application implementation.

Check for:
- Python application modules.
- Collector implementations.
- Company and ATS discovery logic.
- Database models or migrations.
- Normalization, deduplication and verification code.
- Filtering/rules engine.
- AI provider gateway and caching.
- Scheduling.
- API endpoints.
- Tests.
- Dependency definitions and lockfiles.
- Environment templates and Docker configuration.

Distinguish actual implemented functionality from documentation, placeholders, empty directories, and examples.

Do not install packages or execute migrations to test anything.

## 4. Review documentation checkpoints

Read the current versions of these files if they exist:

- `README.md`
- `docs/requirements/PROJECT_SCOPE.md`
- `docs/requirements/V1_SPECIFICATION.md`
- `docs/requirements/JOB_DATA_CONTRACT.md`
- `rules/JOB_FILTERS_V1.md`
- `rules/DEDUPLICATION_V1.md`
- `rules/VERIFICATION_V1.md`
- `docs/architecture/SYSTEM_ARCHITECTURE_V1.md`
- `docs/architecture/TECH_STACK_V1.md`
- `docs/architecture/ARCHITECTURE_DECISIONS_V1.md`
- `docs/architecture/DATABASE_SCHEMA_V1.md`
- `docs/architecture/REPOSITORY_STRUCTURE_V1.md`

Check whether ADR-014 exists and whether the latest database-schema and repository-structure documents are saved in the local project.

Do not correct any inconsistencies yet. Merely record them for review.

## 5. Compare local state with the last known project plan

Summarize:
- What has been completed.
- What remains incomplete.
- Whether there is any uncommitted work.
- Whether the working tree is clean.
- Whether local commits are ahead of or behind the known checkpoint, where determinable without fetching.
- Whether the local repository appears consistent with the previously established project plan.

Do not run `git fetch` or other network operations. Do not assume that remote status can be determined perfectly without contacting the remote.

## 6. Required final report

Provide these sections:

1. **Repository identity and current Git state**
2. **Latest commits and checkpoint verification**
3. **Working-tree changes**
4. **Directory structure and file status**
5. **Application implementation status**
6. **Documentation status**
7. **Issues, inconsistencies, or risks discovered**
8. **Recommended next step**

Use a concise table where helpful. Clearly separate verified facts from anything that could not be checked.

The recommended next step must be based on the repository state you actually observe-not on assumptions from previous conversations.

**STOP after reporting. Make no changes and wait for review.**

## What happens after the audit?

Bring Agy's report back here. We'll review it together and decide the next action based on the evidence.

Our sequence is\:

**Local repository audit → review Git changes → verify project checkpoints → resolve any unfinished work → resume development.**

We won't redo completed work unnecessarily, and we won't start coding until we know exactly where the project stands.



---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)