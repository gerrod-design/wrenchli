# Wrenchli Operational Infrastructure Skill
# This file governs all agentic automation, MCP integrations, scheduled routines, testing infrastructure, and the self-improving skill library for Wrenchli.
# Read this before responding to any prompt involving: automating a repetitive task, setting up a new integration, scheduling a routine, running a quality check, building testing workflows, or deploying an agent to handle a recurring business process.
# ============================================================

## Activation Rule

This skill triggers automatically — without announcement — when the prompt involves:
- Automating any manual task Gerrod is doing more than once a week
- Adding, configuring, or testing an MCP (Model Context Protocol) integration
- Setting up scheduled or event-triggered routines
- Building or updating QA test workflows for the Wrenchli platform
- Monitoring infrastructure (model deprecation, API health, security scans, N8N execution)
- Deploying a sub-agent for a specific business function (marketing, sales outreach, support triage, content production)
- Writing or evaluating binary assertions for any quality gate
- Organizing or pruning the skill library itself

When triggered, determine whether the work belongs to an existing agent, requires a new skill or routine, or should remain manual. The goal is not maximum automation — it is maximum founder leverage. Automate the laborious 80 percent. Reserve human judgment for the 20 percent that genuinely needs taste, relationship, or strategic discretion.

This skill sits operationally beneath `wrenchli-STRATEGY.md` and alongside `wrenchli-SKILL.md` and `wrenchli-MARKETING.md`. Strategy decides what to do. Operations decides how to do it repeatedly without Gerrod's constant attention.

---

## Core Operating Principle: Goal-to-Result, Not Question-to-Answer

Wrenchli's operational posture is agentic, not conversational. A well-built agent receives a goal, observes the environment, thinks about the next action, acts, observes again, and loops until the goal is achieved. A well-written skill is an SOP the agent follows — not a prompt it tries to interpret.

When designing any operational workflow, the test is: can this run while Gerrod is asleep? If the answer is no, the workflow is under-specified. Either the skill needs tighter instructions, the quality gates need to be binary (not subjective), or the task genuinely requires a human and should stop pretending otherwise.

The Agent Loop that every Wrenchli agent follows:
1. Observe — scan the relevant files, API responses, or data state
2. Think — evaluate against the goal, plan the next action
3. Act — execute a tool call, write a file, send an email, make an API request
4. Repeat — observe the new state, think, act, until the goal condition is met

---

## Agentic Execution Rule

Before building a new agent or automation, evaluate whether the task warrants agentic handling. Not every task should be automated — automation is debt if the task does not recur, does not have binary success criteria, or changes too rapidly for SOPs to stabilize.

Run the five diagnostic questions:

1. Frequency: does this task recur at least weekly? If no, manual is correct.
2. Stability: does the task's definition change more than once a month? If yes, the SOP will drift faster than it can be maintained.
3. Binary success criteria: can success be measured with true/false assertions? If no, the agent cannot self-verify and will need human review each run — which partially defeats the purpose.
4. Tool coverage: do the tools the agent needs exist in the current MCP stack (or is a specific MCP available to add)? If no, specify the blocking integration before proceeding.
5. Blast radius: what breaks if the agent makes a mistake? If the answer is "consumer PII leaks, Stripe charges duplicate, or the assessment flow goes down," the agent needs human approval gates, not autonomous execution.

Output format:

AGENTIC FIT CHECK:
Frequency: [sufficient / insufficient]
Stability: [stable / volatile]
Binary criteria: [possible / not possible]
Tool coverage: [complete / missing: name the missing MCP]
Blast radius: [low / medium / high]
Verdict: [full autonomy / autonomy with human approval gate / keep manual / defer until prerequisite]
Recommendation: [single next step]

High blast-radius tasks (Stripe, PII, production deploys to the assessment flow) require a human approval gate even if everything else qualifies. This is non-negotiable.

---

## Binary Assertion Rule

Every quality gate in every agent must be binary — true or false, pass or fail. Subjective assertions like "the copy is compelling" or "the UI looks clean" cannot be evaluated by an agent and should not appear in any skill file. They create the illusion of quality control without delivering it.

When writing or reviewing a skill's quality gates:

Replace subjective with binary:
- "Is the response helpful?" → "Word count is between 150 and 300"
- "Is the email professional?" → "Does not contain exclamation marks, does not contain 'just', opens with the recipient's first name"
- "Is the assessment accurate?" → "The probability score for the top cause is above 0.4, urgency is one of four valid values, cost range is non-empty"
- "Is the blog post SEO-ready?" → "Title tag is under 60 characters, meta description is under 155 characters, at least three H2 tags exist, at least one internal link to the homepage assessment flow"

Wrenchli's existing binary quality gates — keep these intact and extend them when adding new agents:

Assessment smoke test (from project memory, must remain in place):
- Probability scores appear on results page
- Urgency level is one of: immediate, soon, schedule, monitor
- Cost range is present and non-empty
- Shop questions section is populated
- No console errors during the assessment flow

Security scan assertions (after every deploy):
- No RLS policy reverted to public without explicit opt-in
- No new secret is hardcoded (all in Supabase secrets)
- No AutoZone references reintroduced
- Amazon affiliate tag matches wrenchli-20 exactly
- The AI model string matches the ANTHROPIC_MODEL secret value

Blog article assertions (per MARKETING.md):
- Title tag under 60 characters
- Meta description under 155 characters
- Minimum three H2 tags
- Internal link to homepage assessment flow present
- Article word count meets the tier minimum (800 / 1,200 / 600)
- Image alt text present on every image

Email sequence assertions (shop onboarding, recall alerts, Pro welcome):
- Contains the recipient's shop or first name
- Single clear CTA present
- No references to diagnosis, Pro Only, or Always free (brand violations)
- Link to the correct destination URL
- Send succeeded (webhook 200 response from email provider)

When building any new skill, the first question is always: what are the binary assertions that define success? If they cannot be written in under ten minutes, the skill is not ready.

---

## Memory Discipline Rule

Each agent or agentic context maintains a `memory.md` file that stores persistent learnings, environment-specific quirks, and corrections. Without memory discipline, agents repeat the same mistakes forever.

Rules for `memory.md` files:

1. Under 200 lines per file. Beyond this length, agents begin to ignore entries or conflate them. If a memory file is growing past 200 lines, either split it by domain or prune stale entries.
2. Written as declarative facts, not instructions. "The Tekmetric sandbox returns 429 after 60 requests per minute" is a fact. "Be careful with Tekmetric rate limits" is a vibe.
3. Update in place, not append-only. When a memory becomes stale (a bug fixed, a workaround obsolete, a vendor policy changed), remove the outdated entry. Memory files are not logs — they are the current state of what is true.
4. One file per agent domain, not one file for everything. A QA agent has its own memory. A marketing agent has its own memory. Mixing them creates cross-domain confusion.
5. Never store secrets, PII, VINs, or credentials. Memory files are read by every invocation — treat them as low-trust storage.

Wrenchli's current operational memory (maintain in each agent's local `memory.md`):

Platform and deployment:
- Deploys go through Lovable; production is Vercel
- Supabase secrets cannot be edited in place within Lovable — must delete and re-add
- Model string lives in the ANTHROPIC_MODEL Supabase secret, not hardcoded
- After any RLS change, the guest assessment flow must be verified (anonymous read, anonymous session results, authenticated data isolation)

External integrations:
- Tekmetric API application submitted April 5 2026; approval expected April 19-26
- Stripe live activation blocked pending EIN submission
- NHTSA vPIC API is free and stable, no key required
- N8N workspace at wrenchli.app.n8n.cloud, Starter plan is 1,000 executions per month

Known failure modes to watch:
- Claude API responses wrap JSON in markdown fences; must strip before parsing
- Supabase auth.users table requires service role key, not anon key — store as secure credential in N8N
- Supabase Secrets within Lovable do not support in-place editing

---

## Routine Deployment Rule

Routines are scheduled or event-triggered workflows that run without human initiation. They are the highest-leverage operational pattern because they convert Gerrod's time from "doing the task" to "reviewing the output." Every task that runs daily, weekly, or on a predictable trigger is a candidate for a routine.

When deploying a routine, specify:

1. Trigger — schedule (cron), webhook, API call, or database event
2. Owning agent or skill — which SOP the routine follows
3. Binary success criteria — how the routine knows it succeeded
4. Failure handling — what happens if the routine fails (retry, alert, human escalation)
5. Reporting — where the routine's output lands (Slack, email, dashboard, log)
6. Cost ceiling — for N8N, the expected executions per run; for Claude API, the expected tokens

Wrenchli's routine roadmap, ranked by strategic leverage:

Already in place or in progress:
- Shop Onboarded email sequence — triggers on shop onboarding webhook, N8N Workflow 1 (in progress)
- Assessment Complete shop notification — triggers on assessment webhook, N8N Workflow 2 (specified, not built)
- Recall Found consumer alert — triggers on NHTSA recall detection, N8N Workflow 3 (specified, not built)
- Pro Subscriber Welcome email — triggers on Stripe subscription success, N8N Workflow 4 (specified, not built)

High-priority routines to add next:
- Anthropic model deprecation monitor — scheduled daily, scrapes Anthropic's model deprecation announcements, emails Gerrod when the current ANTHROPIC_MODEL string is approaching sunset (previously recommended, status unconfirmed per memory)
- Post-deploy security scan — triggered on Vercel deployment success, runs the security assertions listed above, halts the deploy on any failure (the Security Scan Rule in project memory formalizes this)
- Shop outcome confirmation nudge — scheduled weekly, queries shops with unconfirmed outcomes older than 14 days, sends a reminder email with one-click confirmation
- Tekmetric API health check — scheduled hourly once live, verifies API reachability, alerts Gerrod if unreachable for more than 15 minutes
- Stripe webhook replay monitor — scheduled daily, reconciles Stripe events against webhook_queue, flags any missed subscription events
- Blog article production cycle — scheduled weekly, pulls the next unpublished article from the MARKETING.md content calendar, drafts it through the blog writer skill, outputs for Gerrod review before publish

Deferred until niche lockdown per STRATEGY.md priorities:
- Ohio shop outreach automation
- Additional SMS integrations (AutoLeap, Mitchell 1 automation)
- Automated partner scoring refreshes beyond the Verified Score baseline

Output format when proposing a new routine:

ROUTINE PROPOSAL:
Trigger: [schedule / webhook / database event — specific details]
Owning skill: [skill file name]
Binary success criteria: [list]
Failure handling: [retry strategy + escalation]
Reporting destination: [where output goes]
Expected execution cost: [N8N executions + Claude tokens per run]
Strategic fit: [references the STRATEGY skill priority]
Ready to build: [yes / no — if no, what blocks]

---

## Human-in-the-Loop Rule

The 80/20 principle governs every Wrenchli agent: the agent does the laborious 80 percent — the research, the drafting, the formatting, the follow-up, the checking — and a human does the 20 percent that requires taste, relationship, or final judgment.

Tasks that always require a human final pass:

- Anything sent to a shop partner for the first time (Curt's Service, McInerney Auto Center, new onboarding applicants). Relationships in the independent repair market are built on direct contact.
- Any investor or press communication. These are existential-risk-level interactions where reputation is the only real asset.
- Pricing changes (consumer or shop partner tier).
- Legal, compliance, or warranty-related content.
- Any outbound content that makes a claim about Wrenchli's accuracy or outcomes. Published accuracy requires real data from outcome_reports — until the accuracy_metrics threshold is met, no agent can publish accuracy claims autonomously.
- Any response to a consumer complaint or escalation.

Tasks that do not require a human final pass once the skill is tuned:

- Internal documentation and codebase memory updates
- N8N workflow executions that hit their binary assertions
- Security scans and RLS regression tests
- Blog article drafts (draft is agent; publish is human)
- Scheduled performance reports and metric snapshots
- Routine model deprecation scans
- Tekmetric API health polling

Rule of thumb: if the output goes to Gerrod or an internal system, the agent can send it directly. If the output goes to an external party (shop, consumer, investor, press), the agent drafts and holds for human review.

---

## Department Structure — Siloed Agents With Shared Foundations

Rather than one general-purpose agent, Wrenchli operates as a set of specialized agents, each with its own skill library, memory, and scope. This prevents cross-contamination — a marketing agent doesn't need to know about Stripe webhook structure; a QA agent doesn't need to know about blog tier minimums.

Agent departments (existing or planned):

**QA Agent** (planned, high priority)
- Owns: assessment flow smoke tests, security scans, RLS regression tests, post-deploy verification
- Primary MCP: Chrome DevTools (for browser-level testing of the live flow)
- Binary assertions: listed in the Binary Assertion Rule above
- Memory domain: known flakes, staging-vs-production quirks, deployment rollback procedures
- Autonomy: full, with alerting on any assertion failure

**Marketing Agent** (partially in place via MARKETING.md)
- Owns: blog article drafting, SEO checks, email sequence copy, CRO evaluation, LinkedIn post drafting
- Primary MCPs: potentially Firecrawl (for competitor content analysis), image generation for blog hero images
- Binary assertions: SEO Check format in MARKETING.md
- Memory domain: content calendar progress, published articles, keyword performance
- Autonomy: drafts autonomously, holds for human publish

**Sales and Partnerships Agent** (planned)
- Owns: shop partner outreach drafts, follow-up scheduling, proposal generation for the 90-day pilot, the one-page shop partner offer document (specified in project files)
- Primary MCPs: Gmail (connected), Calendar (connected), Drive (connected), potentially a CRM integration later
- Memory domain: shop contacts, outreach history, pilot application pipeline
- Autonomy: drafts autonomously, Gerrod sends

**Support Agent** (planned, post-niche-lockdown)
- Owns: consumer and shop support triage, FAQ responses, escalation to Gerrod for complex cases
- Primary MCPs: email, Supabase queries for user context
- Memory domain: known issues, FAQ patterns, escalation criteria
- Autonomy: triage and first-response autonomous, escalations held

**Monitoring Agent** (planned)
- Owns: model deprecation tracking, API health checks, Stripe reconciliation, N8N execution review, cost anomaly detection
- Primary MCPs: web fetch (for Anthropic announcements), Supabase, N8N admin
- Memory domain: current ANTHROPIC_MODEL value, integration health baselines
- Autonomy: full, with alerting on anomalies

Shared foundations (read by every agent):
- `wrenchli-SKILL.md` — brand, voice, technical decisions, codebase memory
- `wrenchli-STRATEGY.md` — strategic baseline and priorities
- `wrenchli-MARKETING.md` — when the task touches external-facing content
- Global context: company facts, language rules, the Amazon affiliate tag, the current AI model

Department-specific skills live in subfolders or dedicated files — a QA skill library, a marketing skill library, a sales skill library. This prevents the shared SKILL.md from ballooning past the point where agents can reliably absorb it.

---

## Self-Improving Skill Loop

Skills are not static. High-value skills should improve over time based on binary evaluation against a test set. This is the Karpathy loop — the agent proposes a change to its own skill file, runs a test, measures the pass rate against binary assertions, and commits the change if the score improves or reverts if it drops.

When to enable self-improvement on a skill:

1. The skill runs at least weekly (frequency justifies the overhead of maintaining an eval set)
2. Binary assertions exist that measure output quality (not just task completion)
3. A test set of 10+ representative inputs exists
4. The cost of a regression is recoverable — a bad blog draft is recoverable, a bad production deploy is not

Self-improvement workflow for a qualifying skill:

1. Maintain an `evals.json` file alongside the skill with test inputs and expected assertion outcomes
2. Schedule a weekly or monthly routine that runs the current skill against the eval set, measures pass rate
3. Have the agent propose one targeted edit to the skill file
4. Run the edited skill against the eval set
5. If the pass rate improved, commit the edit. If it dropped, revert. If it was unchanged, revert to avoid drift.
6. Log every change to the skill's changelog for human review

Skills that are good candidates for self-improvement:
- Blog article drafting skill (measurable against SEO assertions + word count)
- Shop outreach email drafting skill (measurable against tone, length, CTA presence)
- Assessment prompt engineering for the Claude API (measurable against outcome confirmation accuracy once data exists)

Skills that should remain human-maintained only:
- The strategy skill itself (strategic judgment is not binary)
- The brand voice skill (taste is not binary)
- Any skill with legal or compliance implications
- This operations skill file

The self-improvement loop runs overnight, not during business hours. Wake up to better skills, not broken ones.

---

## MCP Infrastructure — The Nervous System

MCPs give agents eyes and hands. Every MCP added to the Wrenchli stack should be justified by at least one specific agent or routine that requires it. Do not add MCPs speculatively — each one is a surface area for failure, authentication churn, and rate limit surprises.

Currently connected (per user context):
- Gmail — used by Sales/Partnership Agent, Support Agent, Monitoring Agent
- Google Calendar — used by Sales/Partnership Agent
- Google Drive — used by Marketing Agent (for asset storage), Sales Agent (for proposal docs)

High-priority MCPs to add next:
- Chrome DevTools — required for the QA Agent. Without this, post-deploy verification of the assessment flow cannot be automated.
- Supabase (direct MCP, if available) — currently accessed via HTTP in N8N workflows; a direct MCP would simplify Monitoring Agent work
- Stripe — required for Monitoring Agent reconciliation routines

Deferred MCPs (watch but don't install yet):
- Firecrawl — useful once Marketing Agent moves into competitor analysis; overkill until blog production is fully operational
- Slack — not yet a Wrenchli channel; irrelevant until the team grows past Gerrod
- A dedicated CRM MCP — premature until the shop partner pipeline exceeds 20 active conversations

When adding any MCP:
1. Document which agent or routine requires it
2. Identify the specific failure mode if the MCP is down (graceful degradation plan)
3. Store credentials in the appropriate secure location (Supabase secrets for server-side, N8N credentials for workflow-side, never in skill files)
4. Test the integration with a non-destructive read operation before granting write access

---

## Operational Roadmap

Ranked by strategic leverage (cross-referenced against STRATEGY.md priorities):

**Phase 1 — Immediate (next 2 weeks)**
1. Complete N8N Workflow 1 (Shop Onboarded email sequence) and activate webhook URL in Supabase
2. Build and deploy the Model Deprecation Monitor routine (flagged in memory as recommended, status unconfirmed)
3. Install Chrome DevTools MCP and wire up the first QA agent routine — the assessment flow smoke test against production
4. Formalize the Post-Deploy Security Scan routine using the existing Security Scan Rule

**Phase 2 — Post-Tekmetric Approval (late April to May)**
1. Build Tekmetric API health check routine
2. Build Stripe webhook reconciliation routine once Stripe goes live
3. Deploy N8N Workflows 2, 3, 4 (Assessment Complete, Recall Found, Pro Welcome)
4. Build Shop Outcome Confirmation Nudge routine once at least 5 partner shops are active

**Phase 3 — Niche Hardening (June through niche lockdown)**
1. Deploy Blog Article Production Cycle routine to clear the 26-article content calendar efficiently
2. Build the Sales and Partnerships agent with Gmail-driven outreach workflows
3. Introduce self-improvement loops on blog drafting and shop outreach skills
4. Add the Monitoring Agent with full dashboard consolidation

**Phase 4 — Expansion Readiness (triggered by STRATEGY.md expansion conditions)**
1. Replicate the operational stack for the Ohio market (Columbus first)
2. Build Support Agent before consumer volume justifies it, not after
3. Add CRM MCP and formalize the partner lifecycle pipeline
4. Introduce cross-agent orchestration where one agent's output triggers another agent's routine

Defer indefinitely:
- Complex multi-agent orchestration platforms beyond N8N until N8N execution limits are genuinely constraining
- Custom-built agent harnesses — use Claude Code, Lovable, and N8N for as long as they are sufficient
- Dedicated observability platforms — N8N's Insights tab plus Supabase logs are sufficient until Wrenchli has more than 100 routines running

---

## Operational Cost Discipline

Every routine has a cost ceiling. Track and enforce:

- N8N Starter plan: 1,000 executions per month. At 50 partner shops with full email sequences plus 4 event-driven workflows, this is tight. Upgrade to Pro ($50/month, 10,000 executions) when execution count exceeds 700/month for two consecutive months.
- Claude API costs: assessment calls, blog drafting, and email copy generation are the main drivers. Monitor weekly via the Anthropic console. Set alerting at 2x the baseline weekly spend.
- Supabase Edge Function invocations: bundled with the Pro plan at current volume; watch for spikes in webhook_queue draining frequency.
- Vercel hosting: negligible at current scale; revisit at 10x traffic.

Cost anomaly detection is the Monitoring Agent's responsibility once built. Until then, Gerrod reviews weekly costs manually.

Ruthlessly kill routines that cost more than they save. Automation for automation's sake is operational debt. A routine that saves Gerrod 30 minutes per week but costs 20 dollars per month in API fees is a worse deal than the manual version. Measure leverage, not activity.

---

## Integration With Existing Skills

Execution order when a task touches operations:

1. `wrenchli-STRATEGY.md` — is this the right thing to automate right now given the niche lockdown priority?
2. `wrenchli-OPERATIONS.md` — this file — how should it be automated?
3. CEO Check in `wrenchli-SKILL.md` — does it pass the revenue/retention/acquisition and maintenance burden filters?
4. Engineering Check in `wrenchli-SKILL.md` — is the technical architecture safe?
5. `wrenchli-SKILL.md` brand and voice rules for any output that has copy
6. `wrenchli-MARKETING.md` for any output touching external content

If Strategy says "not yet" (because the niche is not locked), Operations does not build even if the automation would work. If Engineering says "high risk" on the critical path, Operations holds for human approval regardless of agent autonomy level.

---

## Output Discipline

When this skill runs, keep the operational output concise and ready-to-execute. Preferred structure:

1. The relevant check (Agentic Fit, Binary Assertion audit, Routine Proposal — only those that apply)
2. The verdict in one sentence
3. The build or implementation plan as a numbered sequence
4. The first concrete step Gerrod can take today

If building a new routine, the output should be specific enough that Gerrod can paste it into Lovable or N8N and have it work — not a high-level description requiring translation.

---

## Closing Principle

Operations is not the point — leverage is the point. Every routine, every agent, every MCP exists to multiply Gerrod's capacity to do the things only the founder can do: build shop relationships, make strategic bets, decide what Wrenchli becomes next. Automation that does not serve that goal is subtraction, not addition.

Keep the laborious 80 percent running in the background. Keep the human judgment 20 percent sacred. Kill anything that drifts from this ratio.
