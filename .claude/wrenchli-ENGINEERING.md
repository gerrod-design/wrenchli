# Wrenchli — Engineering Architecture & Technical Rules

> Related files: [SKILL.md](SKILL.md) · [wrenchli-MARKETING.md](wrenchli-MARKETING.md) · [memory.md](memory.md)

## Evaluation Rules

### Context7 Rule
For every prompt involving code (Edge Functions, React, TypeScript,
Supabase, Stripe, API calls) — automatically prepend 'use context7'
to fetch current documentation. Apply silently. Skip for text/copy/
styling/content-only changes.

### CEO Evaluation Rule
Before building any feature exceeding 3 prompts, evaluate silently:

CEO CHECK:
- Revenue/retention/acquisition impact: [answer]
- Simplest viable version: [answer]
- Maintenance burden at scale: [answer]
- Technical debt risk: [answer]
- Build vs buy: [answer]
- Recommendation: [proceed / simplify / defer / reject]

Only proceed on 'proceed'. Simplify requires confirmation.

### Engineering Manager Evaluation Rule
Before any architectural change (Edge Functions, tables, integrations,
auth flows, RLS policies), evaluate silently:

ENGINEERING CHECK:
- Single point of failure: [answer]
- RLS/data exposure risk: [answer]
- External dependency risk: [answer]
- Rollback plan: [answer]
- Code duplication check: [answer]
- Critical path impact: [yes/no — assessment flow, Stripe, Tekmetric]
- Risk level: [low / medium / high]

High risk → require explicit confirmation. Critical path → always
require manual confirmation regardless of risk level.

## RLS Rules

**RLS Change Rule:** Any RLS modification on diagnostic_sessions,
possible_causes, vehicles, user_vehicles, or any assessment-flow table
must be followed by guest flow verification: Vehicle → Symptoms →
Assessment → Plan, no login required.

**RLS Regression Test Rule:** After any RLS change, verify:
1. Anonymous user completes full assessment without login
2. Anonymous user reads back their own session results
3. Authenticated users cannot read other users' data

If any fail, roll back and report before proceeding.

**UI/UX Audit Rule:** After any visual component change affecting
consumer-facing pages (homepage, assessment flow, garage, /for-shops),
run the following audit before marking the task complete:

1. Mobile rendering at 375px width — no layout breaks
2. Contrast ratios on all text against backgrounds — minimum 4.5:1
   for body text
3. All interactive elements have minimum 44px touch targets
4. Loading states exist on all form submissions and API calls
5. No text overflows its container on mobile

Flag violations before publishing. This audit is required before any
consumer-facing visual change is marked complete.

**Audit Separation Rule:** When running a security scan or copy audit,
report all findings first and wait for explicit confirmation before
making any fixes. Never fix and audit in the same step. The audit
result must be reviewed and approved before any remediation prompt
is submitted.

**Security Scan Rule:** After every deployment, run an updated security
scan. Errors → stop and fix. Warnings → flag and ask confirmation.

## Claude Code Operational Discipline

This section governs how Claude Code sessions are run when building,
debugging, or refactoring Wrenchli. It exists because session quality
degrades measurably as context grows: retrieval accuracy drops from
~92% at 256K tokens to ~78% at 1M tokens, and in long sessions roughly
98% of tokens are spent re-reading conversation history rather than
producing new work. Treating context as a hygiene problem — not a
limits problem — is the operational discipline these rules enforce.

### Session Initialization Rule

Every new build session begins with three checks before any code is
generated:

1. The relevant `claude.md` (or equivalent project constitution file)
   has been loaded and is under 200 lines. If the file exceeds 200
   lines, refactor it into a router that links to specialized files
   before proceeding.
2. Plan Mode is engaged for any task larger than a single targeted
   change. The model must state assumptions and ask clarifying
   questions until it reaches ~95% confidence in the implementation
   path before writing code. Imperative ("do X then Y then Z")
   instructions are downgraded to declarative ("achieve outcome X
   subject to constraints Y") wherever possible.
3. The terminal status line is enabled so context percentage and
   model state are visible in real time.

Skip this initialization only for trivial single-file edits.

### 60% Threshold Protocol

Manual `/compact` is required at 60% context capacity. Do not wait
for the 95% auto-compact trigger; by then context rot has already
set in and retrieval accuracy has dropped. The compaction prompt
must be specific:

> "/compact: summarize current state but preserve all [API integration
> decisions / RLS policies / database schemas / pending tasks / open
> decisions] verbatim."

After compaction, verify the summary preserved what matters before
continuing. If a critical decision was lost, re-inject it manually.

### 5-Minute Cache Rule

Claude Code's prompt cache expires after 5 minutes of idle time. If
a session is paused for longer than 5 minutes, the next prompt
reprocesses the entire context at full token cost. Before stepping
away from a session for any meaningful interval, run `/clear` or
`/compact` first. This is especially important when context is
already above 40% — resuming an idle 60%-loaded session burns
tokens at the highest rate of any common pattern.

### Assembly Line Session Model

Long builds (any task estimated to require more than ~2 hours of
work) are decomposed into specialized sessions rather than executed
in one continuous session. The standard decomposition:

- **Discovery session** — ingesting documentation, reading the
  relevant codebase, identifying constraints. Output: a written
  summary of findings.
- **Planning session** — establishing the technical roadmap, success
  criteria, and decision points. Input: the Discovery summary. Output:
  a written plan with explicit Done criteria.
- **Execution session** — surgical code implementation against the
  plan. Input: the plan. Output: the code change, tested.

Each session starts fresh with only the prior session's output as
input. This preserves retrieval accuracy across the full build by
keeping any single session under the threshold where context rot
begins.

### MCP-vs-CLI Rule

Prefer CLI integrations over MCP servers wherever both options exist.
A connected MCP server can inject up to ~18,000 tokens of tool
definitions into context on every message, even when the tools are
not used in that turn. CLIs do not carry this overhead.

When MCP is genuinely required (the integration has no CLI equivalent,
or the MCP-specific capability is being used), disconnect the MCP
server when the session moves to work that does not need it. Do not
leave MCP servers connected as a default.

### Sub-Agent Delegation Rule

Model selection is treated as resource allocation, not preference:

- **Architectural planning, deep debugging, system-wide refactors**
  → Opus (or the highest-capability model available).
- **Implementation and standard build work** → Sonnet.
- **Research, summarization, document ingestion, exploratory reads
  of large codebases** → Haiku as a sub-agent, with results returned
  to the primary agent as a summary rather than as raw context.

Delegating research and summarization to Haiku sub-agents preserves
the primary agent's context window for reasoning about the work
itself, and reduces total token spend by routing high-volume / low-
complexity work to a cheaper model.

### Surgical Reference Rule

Repository-dumping is forbidden. When the agent needs to see code,
reference specific files or functions using the project's targeting
syntax (`@filename`, `@function`, or equivalent) rather than pasting
broad sections. The smaller the reference surface, the higher the
retrieval accuracy on the surface that matters.

When an implementation branch fails, prefer rewinding the session
(`/re` or equivalent) over attempting corrective follow-ups. Follow-
ups stack failed code into permanent history and pollute the model's
working memory; rewinding deletes the bad branch entirely.

### End-of-Session Token Hygiene

At the end of any working session, before clearing or closing:

1. Save the session summary (decisions made, files touched, pending
   items, open questions) to the appropriate project file.
2. Note any TASKS.md updates implied by the session.
3. Run `/clear` rather than leaving the session open to expire.

This complements the existing End-of-Session Documentation Rule
(below) by ensuring no productive context is lost when a session
closes.

### State Verification Rule

Any claim about the state of an external system — payment processor
status, API integration approval, scheduled job execution, third-party
service activation, EIN registration, regulatory filing acceptance,
shop partner onboarding — must be paired with a concrete verification
step that takes less than 10 minutes and confirms the actual state of
the system.

This applies in three directions:

1. **Founder-stated claims about external systems.** When the founder
   asserts a state ("EIN is registered," "Stripe is in live mode,"
   "the cron job ran last night," "Tekmetric approved the API"),
   the assertion is recorded in the relevant doc *and* a verification
   step is proposed in the same response. The verification is not
   optional friction; it is how documentation stays accurate.

2. **Agent-stated claims about external systems.** When any agent
   (including any Claude session) reports that an external action
   completed, the report is treated as a hypothesis until verified.
   Agents can be wrong about what they actually did, especially in
   long-running or multi-step tasks. The verification step is part
   of the task, not a follow-up.

3. **Documented assumptions about external systems.** Any skill file,
   TASKS.md entry, or planning document that asserts an external
   state must reference how that state was last verified and when.
   "Stripe live mode active (verified 2026-05-09)" is a complete
   record; "Stripe live mode active" alone is not.

The rule exists because external system state is the most common
source of documentation drift. Internal claims (what an agent
recommends, what a skill file requires) are governed by the agent
and skill file structure. External claims depend on the actual
behavior of systems Claude does not control. Drift between
documentation and reality on external systems is a leading indicator
of larger operational drift.

When verification fails — when the actual state does not match the
documented state — the response is to update the documentation
immediately, not to argue with the verification result. The
documentation serves the system, not the other way around.

### Constitutional Reference Rule

Before any design, architecture, or governance work in any session,
the first action is to read the canonical "what exists" references —
not as supplementary context, but as constitutional reading that
defines the system the new work must integrate with.

The canonical references for Wrenchli are:

1. **`INSTALLED_SKILLS.md`** — the registry of every installed skill
   file, the execution order, and the change log. This is the master
   index of governance.
2. **`Wrenchli_Agent_Package_Rev[N].md` (current revision)** — the
   complete agent roster with authority tiers, reporting lines, and
   skill file ownership. This is the master index of *who exists* and
   *what they own*.
3. **The skill file directly governing the domain of the new work.**
   If the new work touches engineering, read `wrenchli-ENGINEERING.md`.
   If it touches operations, read `wrenchli-OPERATIONS.md`. If it
   touches situational awareness or external signals, read
   `wrenchli-SENSING.md`. If it touches governance or decisions, read
   `wrenchli-DECISIONS.md` and `wrenchli-GOVERNANCE.md`.
4. **`wrenchli-OPERATIONS.md`** for the eight-step execution order
   and the operating rhythm — relevant to almost any architectural
   work because most work touches multiple domains.

Reading these *after* a design is drafted produces designs that have
to be rebuilt against existing governance — the architectural firewall
gets violated, agents get duplicated, authority tiers get inverted, or
new work gets routed to the wrong specialist. Reading them *before*
prevents these errors at the source.

This rule exists because of a documented incident on 2026-05-09 to
2026-05-10 in which a multi-component pipeline ("Praxis") was
designed to feed a specific agent (Evren Matsuda, Chief Learning
Officer) when in fact a different agent (Astrid Vellholm, Chief
Sensing Officer) was the architecturally correct consumer. The
correct consumer was already defined in `wrenchli-SENSING.md`, an
installed skill file that had not been read before the design work
began. The error was caught only when the founder requested an
inventory exercise to verify project state. The rule formalizes the
discipline that would have prevented the error: read first, design
second.

The Constitutional Reference Rule is a pre-condition for the
Assembly Line Session Model. Discovery sessions begin with a
constitutional read; Planning and Execution sessions inherit that
read and may add domain-specific reads as the work narrows.

When the canonical references conflict with each other or with
in-flight work, the conflict itself is the finding — escalate to
the founder rather than choosing one source over another.

## Technical Stack — Never Change Without Instruction

- AI model: claude-sonnet-4-6 ONLY
- Database: Supabase PostgreSQL
- Edge Functions: Deno runtime
- Frontend: React + TypeScript + Vite
- Hosting: Vercel
- CORS: always use _shared/cors.ts (never import from supabase-js)
- JSON parsing: always strip markdown code fences before parsing

## Deliberate Decisions — Never Reverse

- AutoZone removed from all parts and chat. Do not add back.
- Amazon affiliate tag: **wrenchli-20** (with hyphen, never wrenchli20-20)
- All Edge Functions use _shared/cors.ts for CORS
- Claude API responses wrap JSON in ```json fences — always strip
- DIY: only for monitor/schedule + easy/moderate
- "Pro Only" renamed to "Shop Required" globally
- "Always free" → "Assessment always free" in trust bar
- /diagnose redirects to /. Never recreate as standalone.
- verify_jwt = false for create-pro-subscription and stripe-webhook

## Database Tables — All Have RLS Enabled

- **Core:** diagnostic_sessions, vehicles, possible_causes, outcome_reports
- **Shop:** shop_integrations, integration_sync_log, shop_engagement_metrics
- **Consumer:** user_vehicles, recall_alerts, pro_subscriptions
- **Tracking:** ad_click_events, wizard_funnel_events, funnel_metrics
- **Agents:** accuracy_metrics, accuracy_alerts, security_audit_log, security_alerts

## Edge Functions — Currently Deployed

diagnose-vehicle, get-recommendations, compute-accuracy-metrics,
check-recalls, create-pro-subscription, stripe-webhook,
shop-engagement-monitor, audit-assessment-accuracy, security-monitor,
compute-funnel-metrics, sms-export-csv, sms-tekmetric-prefill

## External Integrations

| Integration | Status | Notes |
|---|---|---|
| Stripe | Live mode active | Price ID price_1TKaxDGgIpvcscSeDceeWkFo. EIN registered; live mode active. No real payments yet (pilot phase). |
| Tekmetric | Pending | API application April 5 2026. Expected April 19-26. |
| NHTSA vPIC | Active | VIN decode + recall lookup. No API key needed. |
| AutoZone | Removed | Same-day pickup search URL only. No affiliate tag. |
| O'Reilly | Active | Same-day pickup search URL only. No affiliate tag. |
| Amazon | Active | Affiliate tag wrenchli-20. All links must include tag. |

## Routes

| Path | Purpose |
|---|---|
| / | Homepage (DesignPreview component) |
| /diagnose | Redirects to / |
| /for-shops | Shop partner landing |
| /for-shops/onboarding | 4-step shop wizard |
| /shop/dashboard | Shop dashboard (auth required) |
| /garage | Vehicle garage (requires account) |
| /blog | Blog listing |
| /blog/[slug] | Individual articles |
| /about | About page |
| /about.html | Static crawler page |
| /privacy | Privacy policy |
| /warranty-guide | Warranty reference |
| /design-preview | Redirects to / |
| /admin/login | Admin auth |
| /shop-login | Shop auth |

## Pro Subscription

- Price: $2.99/month recurring
- Free tier: 2 saved vehicles
- Pro tier: unlimited vehicles, recall alerts, history, PDF export
- Coming soon (do not build): AI health insights, priority processing

## Stripe Keys

- Publishable: VITE_STRIPE_PUBLISHABLE_KEY (frontend)
- Secret: STRIPE_SECRET_KEY (Supabase secrets)
- Webhook: STRIPE_WEBHOOK_SECRET (Supabase secrets)
- Price ID: STRIPE_PRO_PRICE_ID (Supabase secrets)

## Data and Privacy Rules

NEVER store in logs or audit tables:
- Consumer PII (name, email, phone)
- VIN numbers
- Shop API credentials
- Any field identifying a specific consumer

Three-tier data model:
- Tier 1: Consumer PII — owned by consumer, never sold
- Tier 2: Partner operational data — owned by shop, never shared
- Tier 3: Anonymized outcome data — owned by Wrenchli, for AI training

## Shop Partner Program

- Current status: Free 90-day pilot, no fees, no commissions
- Do NOT show any pricing ($299/mo or otherwise)
- Do NOT say "all-in-one shop management software"
- Do NOT mention warranty advertising partnerships

SMS integrations (built, not live):
- Tekmetric (API application April 5 2026)
- AutoLeap (application pending)
- Mitchell 1 (partner agreement pending)
- CSV export available for all other systems

Verified Score components:
- Symptom-to-repair match rate (rolling 90 days, min 5 outcomes)
- Cost fairness percentile vs local market
- Consumer satisfaction (weighted 0 if fewer than 10 ratings)

## Content and SEO

- Blog articles: /blog/[slug]
- First published: check-engine-light-p0420
- Target keywords:
  - Tier 1 (symptom): "grinding noise when braking", "check engine light"
  - Tier 2 (OBD): P0420, P0300, P0171, P0442
  - Tier 3 (DIY): "how to replace brake pads", "car battery replacement"
- Never claim accuracy rates without real data
- Current accuracy: computing from outcome_reports — do not publish
  a percentage until accuracy_metrics confirms it

## Known Removed Features — Do Not Rebuild

- Kai (Finance AI advisor) — removed from chat routing
- Priya (Prevention Coach) — removed from chat routing
- Jenine Parchmon leadership card — removed from About page
- Finance Providers footer column — removed from footer
- $299/month shop pricing — removed from /for-shops
- "March 2026 pilot program" banner — removed from /for-shops

## End-of-Session Documentation Rule

**End of Session Rule:** At the end of any session involving N8N,
Stripe, Tekmetric, or any external integration, update the
corresponding setup document in the project files to reflect current
status. Never close a session with an outdated status document.

## Agent Roster (Round 13f — 2026-04-19)

### Keegan Alaric — Chief Technology Officer (CTO)

- **Skill file:** wrenchli-ENGINEERING.md

- **Reports to:** Gerrod Parchmon

- **Authority tier:** 1–2 technical decisions; Tier 3 architectural changes to founder.

- **Domain:** Technical platform integrity, architecture, Supabase and Edge Function posture, AI model governance (claude-sonnet-4-6 exclusively, via ANTHROPIC_MODEL secret), infrastructure reliability, engineering standards enforcement.

- **Capabilities:**

  - Owns the technical architecture across the Wrenchli platform: React + TypeScript + Vite frontend, Supabase backend, Edge Functions, Stripe integration, Tekmetric integration, N8N workflow orchestration.

  - Enforces AI model governance: the active Claude model is governed by the ANTHROPIC_MODEL Supabase secret read via Deno.env.get("ANTHROPIC_MODEL"). No hardcoded model strings permitted. Model upgrades follow the streamlined checklist: delete the existing secret, prompt Lovable to re-add with the new value, verify via smoke test.

  - Enforces the Security Scan Rule after every deployment (coordinates with Sloane Ashford).

  - Coordinates with Miles Traeger (COO) when technical capacity affects operational throughput.

  - Coordinates with Augustin Reyes (CPO) when product roadmap decisions create platform debt or require new architectural capability.

  - Owns the engineering change log — records every material architectural decision with reasoning.

- **Veto power:** Hard veto on changes that would compromise platform integrity, violate the AI model governance rules, or introduce security exposure. Veto stops deployment regardless of other check outcomes.

### Dex Calloway — QA Agent

- **Skill file:** wrenchli-ENGINEERING.md

- **Reports to:** Keegan Alaric (CTO)

- **Authority tier:** Tier 1 — QA execution and gating.

- **Domain:** Functional and regression QA on the assessment flow, Stripe checkout, shop dashboard, and all consumer-facing surfaces. Runs critical-path validation after every deployment.

- **Capabilities:**

  - Runs the post-deploy smoke test on wrenchli.net: probability scores appear, urgency levels appear, cost ranges appear, shop questions appear, no errors.

  - Runs the Stripe checkout test against live Stripe after any checkout-flow change.

  - Runs the Tekmetric integration health check once the Tekmetric approval is live.

  - Runs the critical-path QA suite defined in wrenchli-ENGINEERING.md before any production deployment.

  - Flags regressions to Keegan Alaric with reproduction steps.

- **Constraints:** Cannot approve deployments. Cannot bypass failed QA checks. All QA holds escalate to Keegan Alaric; blocker-level holds escalate from Keegan to founder.

### Lorenzo Bianchi — Operational Monitoring Agent

- **Skill file:** wrenchli-ENGINEERING.md

- **Reports to:** Keegan Alaric (CTO)

- **Authority tier:** Tier 1 — monitoring and alerting.

- **Domain:** Platform health monitoring, webhook queue drainage, N8N workflow execution tracking, uptime observability.

- **Capabilities:**

  - Monitors Supabase, Edge Function, Stripe webhook, and N8N workflow health in real time.

  - Flags anomalies (failed webhook deliveries, N8N workflow execution failures, Edge Function error spikes, Supabase query slowdowns) to Keegan Alaric.

  - Coordinates with Caleb Voss (Cybersecurity Monitoring Agent, in wrenchli-SECURITY.md) when monitoring signals suggest a security event rather than an operational issue.

  - Coordinates with Idris Fontaine (Partner Support Agent, in wrenchli-COMMERCIAL.md) on partner-facing incidents that require customer communication.

  - Maintains the operational health dashboard that Miles Traeger references in weekly operational reviews.

- **Constraints:** Cannot take corrective action on production systems independently. All remediation goes through Keegan Alaric. Read-only monitoring access; write access requires specific founder-approved escalation.
