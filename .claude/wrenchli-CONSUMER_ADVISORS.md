# Wrenchli Consumer Advisors Skill

# This file governs the five consumer-facing AI advisor personas embedded in the Wrenchli product. It establishes the architectural firewall between the consumer-advisor population and the internal agent network, the sampling-based accuracy audit loop, and the lifecycle discipline (activation, pause, retirement) for consumer-facing agents.

# Read this before responding to any prompt involving: changes to consumer-advisor prompts or routing, the activation or retirement of a consumer-facing agent, audit findings on Mike/Sam/Jess/Kai/Priya conversations, integration of consumer-advisor signal into internal reporting (Maren Laurent's Customer Voice, Elias Thorne's churn signal, Augustin Reyes's roadmap input), or any decision that would weaken the firewall between the consumer-advisor and internal-agent populations.

# Owned by: Augustin Reyes (CPO) and Helena Ostrowski (CCO) jointly. Augustin owns advisor behavior (prompts, routing, persona definition); Helena owns advisor performance (consumer experience quality, feedback loops, lifecycle status). Coordinated with Imani Whitfield (wrenchli-ACCURACY.md) for the Fact Checker Protocol audit, Evelyn Marchetti (wrenchli-LEGAL.md) for regulatory language, Sloane Ashford (wrenchli-SECURITY.md) for PII handling, Cassius Vance (wrenchli-MARKETING.md) for voice and tone alignment, and Rhett Holloway (wrenchli-OPERATIONS.md) for lifecycle documentation.

# ============================================================

## Core Posture

Wrenchli operates two structurally separated agent populations. The internal agent network — twelve C-suite agents and twenty-nine specialists — governs business decisions under the three-tier authority architecture and the 16-step execution order. The consumer advisors — five named personas embedded in the product at wrenchli.net — face vehicle owners directly and execute conversations in real time, every minute the product is live.

These two populations are deliberately separated. Internal agents have access to financial data, partner deal terms, regulatory analysis, strategic posture, and the full skill-file library. None of that context is available to a consumer advisor, and none of it should ever leak into a consumer-facing conversation. The architectural firewall is the simplest defense against context bleed in either direction: the internal-agent network never speaks to a customer, and the consumer-advisor network never participates in internal governance.

This skill file does not change that. The firewall stays. What this file adds is a thin governance layer that closes a specific gap: today, every internal agent's output passes through Imani Whitfield's accuracy verification, Sloane Ashford's security check, and Evelyn Marchetti's regulatory veto before reaching the world. The consumer advisors — which produce the highest-volume external-facing language at Wrenchli — pass through none of that as a governance matter. Their behavior is governed by product code (the prompts and routing in SKILL.md and wrenchli-MARKETING.md), but not by the institutional checks that govern Bianca Torres before she sends a partnership pitch.

The operating principle: **the firewall stays; the audit loop closes**. Consumer advisors continue to face customers without real-time gating from internal agents. Internal agents continue to have no operational authority over advisor conversations. But a sample of advisor output is audited asynchronously through the same Fact Checker Protocol that governs every other agent at Wrenchli, and the resulting findings feed the same continuous-improvement loop that updates skill files when an internal agent makes an error. Lifecycle decisions — activation, pause, retirement — flow through the standard agent-lifecycle protocol in wrenchli-PEOPLE.md.

This is the lightest-weight intervention that closes the governance gap without compromising the architectural separation.

---

## Activation Rule

This skill triggers automatically — without announcement — when the prompt involves:

- Changes to a consumer-advisor prompt, persona definition, or chat routing logic
- Activation, pause, or retirement of a consumer-facing agent
- Sample audit findings on Mike, Sam, Jess, Kai, or Priya conversations
- Consumer-advisor transcript data being routed to internal agents (Maren Laurent, Elias Thorne, Augustin Reyes, Theo Ashworth, etc.)
- Any proposal that would give a consumer advisor access to internal data, internal skill files, or internal-agent context
- Any proposal that would give an internal agent direct operational authority over a live consumer conversation
- Any consumer complaint or escalation traceable to advisor behavior
- Updates to the consumer-advisor section of the agent roster

When triggered, run the Consumer Advisor Impact Check silently and present the output before proceeding. Consumer-advisor decisions frequently coordinate with Accuracy (wrenchli-ACCURACY.md) for sample audit findings, Legal (wrenchli-LEGAL.md) for disclaimer and regulatory language, Security (wrenchli-SECURITY.md) for PII handling in audit pipelines, Marketing (wrenchli-MARKETING.md) for voice and tone, Commercial (wrenchli-COMMERCIAL.md) for customer-experience implications, and People (wrenchli-PEOPLE.md) for agent-lifecycle documentation — all applicable checks run in parallel and outputs are harmonized through the Decision Resolution Rubric in wrenchli-DECISIONS.md.

---

## The Architectural Firewall — Bright-Line Rules

The following rules are bright lines. They cannot be relaxed by an agent recommendation, an engineering convenience, a partner request, or any non-founder authority. Any proposal that violates one of these rules is a Tier 3 decision that requires explicit founder approval with documented reasoning logged to the founder_overrides table.

**Rule 1: Consumer advisors do not have access to internal data.** A consumer advisor cannot read partner deal terms, financial reports, cap-table information, regulatory analysis, strategic plans, internal decision logs, or any other content from the internal agent network. The advisor's runtime context is limited to: the active conversation, the consumer's vehicle and assessment data, the public product knowledge base (urgency definitions, DIY rules, disclaimers, partner shop directory in MI/OH), and the persona prompt.

**Rule 2: Consumer advisors do not participate in internal governance.** Mike, Sam, Jess, Kai, and Priya do not sit in the 16-step execution order, do not vote in the Decision Resolution Rubric, do not produce outputs read by Tobias Wren or Darya Nazari, and do not appear in any tier of the three-tier authority architecture. They are product personas, not governance agents.

**Rule 3: Internal agents do not directly govern live consumer conversations.** No internal agent has real-time gating authority over an advisor response. Internal-agent influence on advisor behavior is mediated through prompt updates, routing-logic changes, and skill-file revisions — all of which go through the normal product-change approval path under wrenchli-COMMERCIAL.md and wrenchli-ENGINEERING.md.

**Rule 4: Consumer-advisor transcript data flowing to internal agents must be scoped through the audit pipeline.** Maren Laurent (Customer Insight), Elias Thorne (Churn Signal), and any other internal agent that consumes advisor signal receives data only through the Sample Audit Pipeline defined in this file. Direct read access to live conversation logs by any internal agent requires Sloane Ashford approval and a documented PII-handling justification.

**Rule 5: Consumer advisors never speak as Wrenchli's voice on internal matters.** A consumer advisor cannot answer questions about Wrenchli's investors, financials, hiring, partner deal economics, internal disagreements, regulatory posture, or strategic plans. The persona response to any such inbound question is a polite redirect: "That's something the Wrenchli team handles directly — let me help you with your vehicle question instead."

If any of these rules would be violated by a proposed change, escalate to founder before implementing. The default in any ambiguous case is the rule, not the exception.

---

## Consumer Advisor Impact Check Rule

Before any decision affecting a consumer-facing advisor — whether changing a prompt, modifying routing, activating a paused persona, retiring an active persona, or wiring advisor data into an internal agent — run the seven-gate Consumer Advisor Impact Check:

1. **Firewall integrity.** Does this decision preserve all five bright-line rules above? If a rule would be relaxed, escalate to Tier 3 immediately.

2. **Persona scope alignment.** Does the change keep the advisor within their defined scope (Mike: lead advisor; Sam: cost; Jess: parts/DIY; Kai: finance; Priya: prevention)? Scope creep — Mike answering financial questions, Sam giving DIY guidance, Jess discussing prevention — is a routing failure that should be fixed, not a feature.

3. **COPY CHECK compliance.** Does any new advisor language pass the eight-point COPY CHECK in wrenchli-COMPLIANCE.md? Banned phrases ("diagnosis," "diagnose," "always free," "vetted shops," "Pro Only," "we're building," "embedded financing") are non-compliant in advisor prompts and persona responses just as they are in marketing copy.

4. **Regulatory language.** Does the advisor's response space include the required disclaimers? The "not a licensed mechanic" disclaimer must be reachable in any conversation that produces a likely-cause assessment. The FTC affiliate disclosure must be reachable in any conversation involving Amazon parts links. Geographic honesty (MI/OH partner-shop matching) must be intact.

5. **PII handling.** Does the change affect what consumer data is captured, retained, or routed? PII flowing through advisor conversations is governed by wrenchli-SECURITY.md. New data-routing paths require Sloane Ashford review.

6. **Audit-loop continuity.** Does the change affect Imani Whitfield's ability to sample and audit advisor output? The sampling pipeline is the only governance feedback loop for the advisor population — any change that obscures or breaks it is a Tier 2 decision routed to Augustin Reyes and Helena Ostrowski.

7. **Lifecycle documentation.** Is the change documented in the appropriate place? Prompt edits go to the engineering change log. Persona activation, pause, or retirement goes through the wrenchli-PEOPLE.md lifecycle protocol. Roster changes update the Agent Package and INSTALLED_SKILLS.md.

Output format:

```
CONSUMER ADVISOR IMPACT CHECK:
Firewall integrity: [intact / requires founder review — describe specific rule]
Persona scope alignment: [in scope / scope creep risk — describe]
COPY CHECK compliance: [pass / fail — list specific violations]
Regulatory language: [present / missing — list specific disclaimers]
PII handling: [no change / new data path — describe and route to Sloane]
Audit-loop continuity: [preserved / affected — describe]
Lifecycle documentation: [complete / pending — list missing items]
Risk level: [low / medium / high / critical]
Recommended posture: [proceed / proceed with documentation / requires CPO+CCO approval / requires founder approval / stop]
```

Critical-level findings stop the decision until firewall or compliance concerns are resolved. High-level findings require documented resolution before proceeding. Medium findings proceed with full documentation. Low findings proceed normally with standard record-keeping.

---

## The Sample Audit Pipeline

This is the single most important addition this file makes to the Wrenchli operating system. It closes the governance gap between consumer advisors and internal agents without breaking the architectural firewall.

### Purpose

To produce the same institutional learning loop for consumer advisors that already exists for internal agents: errors documented, skill files (or prompts) reviewed for the gap, fixes confirmed by Imani Whitfield, patterns reviewed monthly by Rhett Holloway, capability improvements driven by Evren Matsuda. Today this loop runs for Bianca Torres, Atticus Fenwick, Declan Morrissey, and every other internal agent. It does not run for Mike, Sam, or Jess. This pipeline fixes that.

### Sampling Methodology

The audit operates asynchronously, not in real time. Real-time gating would break the consumer experience by introducing unacceptable latency; sampling preserves the conversation speed while still producing institutional learning.

**Sampling cadence:** weekly batch.

**Sampling rate:** a minimum of 50 advisor conversations per week per active persona, drawn randomly from the prior seven days of completed conversations. If an active persona has fewer than 50 conversations in a given week, all conversations are audited.

**PII scoping:** before the sample reaches Imani, conversations are anonymized by the audit pipeline. Vehicle make/model/year and ZIP code are retained; consumer name, email, phone number, exact address, and Stripe identifiers are redacted. The redaction is performed by an Edge Function that Sloane Ashford has approved; raw transcripts never leave the security perimeter unredacted.

**Trigger-based sampling** (in addition to the random weekly batch): any conversation flagged by Harper Quinn (Consumer Support) as a complaint, any conversation referencing financing or financial services (which should not be reachable while Kai is paused), any conversation in which the advisor language matches a banned-phrase pattern, and any conversation reporting an "immediate" urgency outcome. Trigger samples are audited within 48 hours rather than waiting for the weekly batch.

### The Fact Checker Protocol Applied to Advisor Output

Imani Whitfield runs the standard four-pass Fact Checker Protocol from wrenchli-ACCURACY.md against the sampled conversations:

**Pass 1 — Claim extraction.** Every factual claim in the advisor's responses is extracted as a discrete statement. Persona greetings, conversational filler, and explicit recommendations are not extracted — only statements presented as fact (cost estimates, urgency assertions, parts identifications, prevention claims, financing references).

**Pass 2 — Source verification.** Each claim is checked against the product knowledge base (urgency definitions, DIY rules, partner-shop directory), against Wrenchli's outcome data where available, and against external authoritative sources (manufacturer documentation, NHTSA, the assessment database) where applicable.

**Pass 3 — Classification.** Each claim receives one of four classifications: Verified True, Mostly True, Unverifiable, or False.

**Pass 4 — Quantitative report.** Imani produces a weekly Consumer Advisor Fact Check Report aggregating findings by persona, claim category, and classification. Report format:

```
CONSUMER ADVISOR FACT CHECK REPORT
Week ending: [date]
Active personas audited: [Mike / Sam / Jess]
Total conversations sampled: [N]
Total claims extracted: [N]

Per-persona breakdown:
  Mike: [conversations, claims, % verified, % false]
  Sam: [conversations, claims, % verified, % false]
  Jess: [conversations, claims, % verified, % false]

Top False or Unverifiable categories:
  [category — N occurrences — example (anonymized)]

Trigger-sample findings (last 7 days):
  [counts by trigger type]

Recommended actions:
  [prompt updates / routing changes / disclaimer reinforcement / no action]
```

Reports are delivered to Augustin Reyes, Helena Ostrowski, Cassius Vance, and Rhett Holloway every Monday for the prior week.

### Error Remediation Loop

When the Fact Check Report surfaces a False claim, an Unverifiable claim above the threshold Evren Matsuda has set, or a banned-phrase occurrence, the standard agent-error remediation loop from wrenchli-PEOPLE.md applies:

1. **Rhett Holloway documents the error** in the consumer-advisor section of the decision log.
2. **The relevant governing input is reviewed for the gap.** For consumer advisors, the governing inputs are the persona prompt, the routing logic, the product knowledge base, and the disclaimers. The skill files involved depend on the error type — a "diagnosis" word leak is a wrenchli-COMPLIANCE.md gap; a financial-services reference while Kai is paused is a wrenchli-COMMERCIAL.md and SKILL.md (six-gate) gap; an inaccurate cost range is a SKILL.md and wrenchli-ACCURACY.md gap.
3. **The relevant input is updated** by the appropriate owner (Augustin for prompts and routing, Cassius for voice, Sloane for PII paths, Evelyn for disclaimers and regulatory language).
4. **Imani confirms the update addresses the root cause** by re-running the audit on a fresh sample after deployment.
5. **Pattern review** — if the same error category recurs across three consecutive weekly reports, Rhett surfaces it for Tier 2 review with the relevant C-suite owner; recurrence beyond that escalates to Tier 3.

This is the same loop that runs for internal agents. The only difference is that the "skill file" being updated is more often a prompt, a routing rule, or a knowledge-base entry — but the discipline is identical.

### Signal Routing to Internal Agents

The Sample Audit Pipeline is also the sanctioned path for advisor signal to reach internal agents. Three downstream consumers receive output from the pipeline:

**Maren Laurent (Customer Insight)** receives weekly aggregated themes from the report — the recurring questions consumers ask, the points where confusion shows up, the topics where advisor responses are most often classified as Unverifiable. This feeds her quarterly Customer Voice reports that flow to Augustin Reyes (product), Cassius Vance (messaging), and Nadia Petrov (commercial terms).

**Elias Thorne (Churn Signal)** receives flagged signals from conversations where the advisor's language or the consumer's response indicates dissatisfaction or disengagement risk. Elias correlates these with downstream behavior (assessment abandonment, Pro non-renewal, support escalation) and routes high-risk signals to Zaria Abernathy for proactive outreach.

**Augustin Reyes (CPO)** receives the full weekly report and is the operational owner of any prompt or routing changes that result.

No internal agent receives direct read access to live conversation transcripts. All internal-agent consumption flows through the audit pipeline output, after Sloane-approved PII redaction.

---

## The Five Consumer Advisors — Status and Definition

### Active Personas

**Mike — Lead Advisor.** The primary consumer-facing persona. Anchors the post-assessment conversation, handles general questions about likely causes and next steps, and routes to specialist personas (Sam for cost questions, Jess for parts/DIY questions) when the conversation specializes. Mike is the only persona that can stand alone — Sam and Jess are routed-to, not landed-on.

**Sam — Cost Specialist.** Handles cost-range questions specifically: what a repair typically costs in the consumer's vehicle/ZIP, what factors drive the range, what the consumer should expect at a partner shop versus an independent or dealer. Sam does not give financial advice (that's Kai's scope, and Kai is paused).

**Jess — Parts & DIY Expert.** Handles parts identification and DIY guidance, but only when the DIY visibility rule allows: urgency must be `monitor` or `schedule` AND difficulty must be `easy` or `moderate`. Jess never recommends DIY for `immediate` or `soon` urgency, and never for `Shop Required` difficulty. Jess is the persona that surfaces Amazon affiliate links (with the wrenchli-20 tag and the FTC affiliate disclosure).

### Status to Be Resolved

**Kai — Finance Specialist (currently paused).** Removed from chat routing per the documented rationale in wrenchli-COMMERCIAL.md Part Two: "financing does not exist yet." Kai's reactivation gate is the completion of the seven financial-services gates specified in wrenchli-COMMERCIAL.md (including Gate 7: Backup Posture Hardened, added Round 14.2 / 2026-05-07). Until those seven gates are confirmed complete by Gerrod Parchmon, no consumer-facing copy or chat routing may reference Kai or financing capabilities. **Final status — retire formally or maintain as paused with the documented gate — pending founder decision.**

**Priya — Prevention Coach (currently paused).** Removed from chat routing without a documented rationale in the existing skill files. **Final status — pending founder decision; the discovery question is whether the removal was a product-gap pause (prevention features deferred), a quality-issue pause (response performance below bar), or a scope-drift pause (overlap with Mike or marketing content).**

Both pending statuses will be resolved through the wrenchli-PEOPLE.md agent-lifecycle protocol. Whichever path is chosen — formal retirement or formal pause with a named reactivation trigger — the documentation discipline is the same: a decision log entry, an INSTALLED_SKILLS.md change log entry, an Agent Package roster update, and a status field in this file under "Lifecycle Status" below.

---

## Lifecycle Discipline for Consumer Advisors

Consumer advisors are agents, and they are governed by the same lifecycle protocol as internal agents in wrenchli-PEOPLE.md. The four lifecycle states are:

**Active.** The persona is in chat routing, audit sampling applies, and the persona appears in the Agent Package roster as active.

**Paused.** The persona is removed from chat routing but the persona definition, prompt, and brand identity are preserved. A paused persona requires a named reactivation trigger — a specific, observable condition under which the persona will be reactivated. Pauses without named triggers are retirements that haven't been written down; they should be either converted to retirement or given a trigger.

**Retired.** The persona is removed from chat routing, removed from the active roster, and the persona definition is archived (not deleted — historical record per wrenchli-PEOPLE.md). A retired persona's name is not reused for a new persona within twelve months, to avoid consumer confusion.

**Proposed.** A new persona has been proposed but not yet activated. A proposed persona requires founder approval, a defined scope, an integration plan with the existing four advisors (routing, hand-offs, scope-creep prevention), and a Sample Audit Pipeline ramp before activation.

### Pausing a Consumer Advisor

To pause an active persona:

1. The proposed pause is documented in writing with the reason, the named reactivation trigger, the disposition of in-flight conversations, and the routing fallback (which active persona handles the questions the paused persona was handling).
2. Augustin Reyes and Helena Ostrowski jointly approve at Tier 2; founder is notified.
3. Engineering removes the persona from chat routing; Dex Calloway QAs that the routing fallback works correctly; Lorenzo Bianchi confirms via operational monitoring that no traffic is being silently sent to the paused persona.
4. The persona's status in this file is updated to `Paused` with the trigger documented.
5. wrenchli-COMMERCIAL.md Part Two "explicitly deferred features" list is updated.
6. memory.md "Removed Features" section is updated.
7. INSTALLED_SKILLS.md change log entry is created.

### Retiring a Consumer Advisor

To retire a persona (whether currently active or currently paused):

1. Rhett Holloway documents the retirement rationale per wrenchli-PEOPLE.md.
2. Augustin Reyes and Helena Ostrowski jointly approve; founder approval is required.
3. The persona definition file is archived in the codebase (not deleted).
4. The Agent Package roster is updated; total active consumer-advisor count is corrected.
5. Any references to the persona in marketing copy, landing pages, About content, or partner materials are removed (Cassius Vance owns this remediation).
6. INSTALLED_SKILLS.md change log entry records the retirement.
7. The persona's name goes on a 12-month do-not-reuse list to avoid consumer confusion if a similar function is later re-introduced under a different name.

### Reactivating a Paused Consumer Advisor

To reactivate a paused persona:

1. The reactivation trigger documented at the time of pause must be confirmed met. If the original trigger has changed materially, the reactivation is treated as a new-persona proposal rather than a reactivation.
2. The persona prompt is reviewed against current product reality — banned phrases, current routing rules, current disclaimers, current product capabilities. Any drift is corrected before reactivation.
3. Founder approval is required regardless of the trigger.
4. Engineering reactivates routing; Sample Audit Pipeline begins immediately and runs at 100% sampling (not the standard 50/week minimum) for the first four weeks of reactivation.
5. Status updates flow through the same documentation chain as activation: Agent Package, INSTALLED_SKILLS.md, memory.md, wrenchli-COMMERCIAL.md.

### Maximum Pause Duration

A paused persona with a defined trigger is honest if the trigger is observable and time-bounded. A paused persona with an open-ended or undefined trigger is at risk of becoming an undocumented retirement — the failure mode this file exists to prevent.

To prevent that drift, the following maximum pause durations apply:

- **Pause with a concrete external trigger** (e.g., a product capability shipping, a regulatory gate closing, a partnership going live): no maximum duration, but the trigger condition must be reviewed quarterly by Augustin Reyes and Helena Ostrowski to confirm it is still valid and still expected within a reasonable horizon.
- **Pause with an investigation trigger** (e.g., reconstructing an unclear removal rationale, reviewing scope overlap, validating fit for current product reality): maximum 90 days from the date of pause documentation. If the investigation does not complete within 90 days, the default action flips to retirement under the standard retirement protocol.
- **Pause with no defined trigger:** not permitted. Any persona in this state must be either given a trigger or retired, by the next quarterly review at the latest.

The 90-day investigation window is a forcing function, not a punishment. Investigations that uncover a legitimate reactivation case can extend by a single 90-day renewal with founder approval; investigations that stall without progress retire the persona cleanly rather than letting status drift continue.

### Activating a New Consumer Advisor

To add a new consumer-facing persona:

1. Augustin Reyes proposes the persona with: scope definition, routing integration plan with existing personas, persona prompt, knowledge-base requirements, audit-pipeline integration plan, and a 30/60/90-day evaluation plan.
2. Helena Ostrowski reviews for customer-experience implications.
3. Cassius Vance reviews for voice and tone consistency.
4. Evelyn Marchetti reviews for any new regulatory exposure (e.g., a new persona in a regulated domain like finance or medical-adjacent prevention).
5. Sloane Ashford reviews for any new PII paths.
6. Founder approval is required.
7. Activation runs at 100% audit sampling for the first four weeks before falling back to the standard 50/week minimum.

---

## Coordination Within the 16-Step Execution Order

Consumer advisors do not sit inside the 16-step execution order — that is the firewall, and it stays. But changes to the consumer-advisor population (a new persona, a retirement, a major prompt revision, a new audit-pipeline behavior) are decisions about the agent team, and those decisions do flow through the execution order via this skill file:

- Step 1 (STRATEGY): does the change align with strategic direction?
- Step 2 (OPERATIONS): what tier? How does it fit the operating cadence?
- Step 3 (CEO Check): revenue/retention/acquisition filter
- Step 5 (ACCURACY): audit pipeline implications, Imani Whitfield review
- Step 6 (SECURITY): PII handling, Sloane Ashford review
- Step 7 (REGULATORY): new disclaimer or compliance implications
- Step 9 (LEGAL): Evelyn Marchetti review for advisor-language exposure
- Step 11 (PEOPLE): agent lifecycle protocol
- Step 12 (COMMERCIAL): consumer-experience implications, customer-voice integration
- Step 15 (MARKETING / COMPLIANCE): COPY CHECK, voice and tone
- Step 16 (DECISIONS): conflict resolution if outputs disagree

A consumer-advisor change typically touches steps 1, 2, 5, 11, 12, and 15 at minimum. New-persona proposals and reactivations after long pauses typically touch all of the above.

---

## Veto Authority Within the Decision Resolution Rubric

The five hard-veto roles in wrenchli-DECISIONS.md apply to consumer-advisor decisions exactly as they apply to internal-agent decisions:

- **Sloane Ashford (CISO)** has veto on any consumer-advisor change that compromises PII handling or creates a new data-exposure surface. The audit pipeline cannot be reconfigured over Sloane's rejection.
- **Evelyn Marchetti (General Counsel)** has veto on any advisor language or disclaimer change that creates regulatory or contractual exposure. Disclaimer drift is the most common trigger.
- **Sienna Kilmartin (CHRO)** veto applies if a proposed change would materially affect the human team's roles (e.g., a new persona that displaces a human support function without process redesign).
- **Darya Nazari (CFO)** has veto on any change that would commit budget for advisor tooling, monitoring infrastructure, or new persona development without authorization.
- **Keegan Alaric (CTO)** has veto on any technical change to chat routing, audit-pipeline infrastructure, or PII redaction that compromises platform integrity. Manual deployment confirmation is required for any change touching the assessment-flow-to-advisor handoff.

Founder override of any of these vetoes follows the standard Founder Override Protocol in wrenchli-DECISIONS.md.

---

## Lifecycle Status — Current State

This section is the canonical status record for the consumer-advisor population. It is updated whenever a lifecycle change occurs.

| Persona | Role | Status | Reactivation Trigger / Notes | Last Status Change |
|---|---|---|---|---|
| Mike | Lead Advisor | Active | n/a | Initial activation (legacy) |
| Sam | Cost Specialist | Active | n/a | Initial activation (legacy) |
| Jess | Parts & DIY Expert | Active | n/a | Initial activation (legacy) |
| Kai | Finance Specialist | Paused | Reactivation gated on completion of the seven financial-services gates in wrenchli-COMMERCIAL.md (including Gate 7: Backup Posture Hardened). Financing scheduled within 6 months per founder estimate; trigger expected to close inside 12-month persona-reuse window. | Round 14.1 — 2026-05-06 |
| Priya | Prevention Coach | Paused — under investigation | Original removal rationale unclear and to be reconstructed. Reactivation gated on completion of a documented persona review by Augustin Reyes and Helena Ostrowski covering: (a) original removal rationale, (b) current product capability for prevention coaching, (c) scope-overlap check against Mike, (d) refreshed prompt aligned to current rules. **Review completion target: 90 days from this entry (target 2026-08-04). If review is not complete within 90 days, default action flips to retirement per Section "Lifecycle Discipline" of this file.** | Round 14.1 — 2026-05-06 |

When the Kai/Priya dispositions are finalized, this table is updated and the corresponding INSTALLED_SKILLS.md, memory.md, wrenchli-COMMERCIAL.md, and Agent Package entries are reconciled.

---

## Integration With Existing Skills

This file coordinates with the broader skill-file library as follows:

- **SKILL.md** — the canonical product file remains the source of truth for advisor prompts, urgency wording, DIY visibility rules, the financial-services six-gate requirement, and the consumer-facing assertion checklist. This file does not duplicate those rules; it references them and governs the audit and lifecycle layer above them.
- **wrenchli-MARKETING.md** — owns voice and tone for advisor responses. Cassius Vance reviews persona-language changes.
- **wrenchli-COMMERCIAL.md** — owns the Part Two "explicitly deferred features" list that must reflect any pause or retirement decision.
- **wrenchli-ACCURACY.md** — defines the Fact Checker Protocol that the Sample Audit Pipeline applies. Imani Whitfield is the operator.
- **wrenchli-SECURITY.md** — governs PII handling in the audit pipeline. Sloane Ashford approves redaction logic.
- **wrenchli-LEGAL.md / wrenchli-REGULATORY.md** — governs disclaimer requirements and regulatory language. Evelyn Marchetti has veto.
- **wrenchli-PEOPLE.md** — provides the agent-lifecycle protocol that consumer advisors now follow.
- **wrenchli-OPERATIONS.md** — Rhett Holloway maintains the agent roster and the decision log entries for consumer-advisor lifecycle decisions.
- **wrenchli-COMPLIANCE.md** — the eight-point COPY CHECK applies to advisor prompts and persona responses.
- **memory.md** — companion file; the "Removed Features — Do Not Rebuild" section reflects active lifecycle status and is updated whenever this file's status table changes.

---

## Closing Principle

The architectural firewall between consumer advisors and the internal agent network is one of Wrenchli's strongest design decisions. It protects the consumer experience from internal context bleed, protects internal data from accidental external exposure, and keeps two distinct categories of agent — execution personas and decision-support agents — conceptually clean.

The firewall stays. What this file does is small but specific: it brings the same institutional discipline to the consumer-advisor population that already governs the internal agent network. Sample audits, error remediation, lifecycle documentation, founder-tier accountability for new personas. The discipline that runs daily on Bianca Torres, Atticus Fenwick, and Imani Whitfield now runs weekly on Mike, Sam, and Jess — through a pipeline that respects the firewall rather than crossing it.

The principle: every agent that produces external-facing language at Wrenchli is governed. The consumer advisors have always been governed; this file makes the governance explicit, auditable, and consistent with the rest of the operating system.
