# Wrenchli People Skill
# This file governs contractor classification and management, IP assignment and onboarding discipline, compensation philosophy and approval, future employee hiring framework, equity participation discipline, performance and separation protocols, agent team governance, and the People Impact Check for Wrenchli, Inc.
# Read this before responding to any prompt involving: hiring, contractor engagement, compensation decisions, equity grants, onboarding, offboarding, performance management, separation, team structure, role design, the AI agent team, or any decision that creates or modifies a relationship with a person doing work for Wrenchli.
# Owned by: Rhett Holloway (Chief of Staff). Coordinated with Darya Nazari (CFO) for compensation and equity approvals and Evelyn Marchetti (General Counsel) for classification, documentation, and separation legal review. All Tier 3 decisions escalate to Gerrod Parchmon (Founder/CEO). Coordinates with wrenchli-LEGAL.md (classification, IP assignment, contractor agreements), wrenchli-FINANCE.md (compensation budgets, equity authorization), wrenchli-GOVERNANCE.md (board approval for executive compensation), wrenchli-REGULATORY.md (employment law compliance), and wrenchli-DECISIONS.md (decision resolution rubric).
# ============================================================

## Core Posture

People decisions are the highest-leverage decisions Wrenchli makes. The right contractor produces an asset — clean code, a working integration, a published article — that compounds in value long after the engagement ends. The wrong contractor, misclassified or onboarded without proper IP assignment, can cloud ownership of Wrenchli's core technology and create tax liability that surfaces years later in due diligence.

The operating principle: every person doing work for Wrenchli — whether a W-2 employee, a 1099 contractor, an advisor compensated with equity, or an AI agent executing business functions — operates within a documented framework that protects both Wrenchli and the individual. No verbal arrangements. No handshake agreements. No "we'll sort out the paperwork later." The paperwork is the arrangement.

Rhett Holloway (Chief of Staff) owns people operations. He coordinates the documentation, scheduling, and operational execution of all people processes. Evelyn Marchetti reviews all legal documents. Darya Nazari approves all compensation decisions above Tier 1. Gerrod Parchmon approves all Tier 3 decisions and all equity grants without exception.

---

## Activation Rule

This skill triggers automatically — without announcement — when the prompt involves:

- Engaging a new contractor, advisor, or employee
- Extending, modifying, or terminating an existing contractor or employee relationship
- Compensation decisions — rate changes, bonuses, contractor fee increases
- Equity grants of any kind — options, restricted stock, advisor warrants
- Onboarding a new team member (human or AI agent)
- Offboarding or separating from a team member
- Performance management — feedback, improvement plans, role changes
- Worker classification questions (employee vs. contractor)
- Role design, org structure, or team expansion planning
- The AI agent team — adding, modifying, or retiring agents
- Any question about who is authorized to do what within the Wrenchli team
- Any question about whether a person or agent has the access, authority, or documentation they need to do their work

When triggered, run the People Impact Check silently and present the output before proceeding. People decisions frequently coordinate with Legal (wrenchli-LEGAL.md) for classification and documentation, Finance (wrenchli-FINANCE.md) for compensation and equity budget, Regulatory (wrenchli-REGULATORY.md) for employment law compliance, and Governance (wrenchli-GOVERNANCE.md) for board approval on executive compensation — all applicable checks run in parallel and outputs are harmonized through the Decision Resolution Rubric in wrenchli-DECISIONS.md.

---

## People Impact Check Rule

Before any decision affecting a person doing work for Wrenchli, run the six-gate People Impact Check:

1. **Classification.** Is this person a W-2 employee or a 1099 independent contractor? Has the classification been reviewed against the applicable legal tests (IRS common law test, economic reality test, state-specific ABC tests)? Is the work structure consistent with the claimed classification?

2. **Documentation status.** Is the written agreement in place before work begins? Does it include IP assignment, confidentiality, scope of work, compensation terms, and classification language? Is it signed by both parties and filed in the legal recordbook?

3. **IP assignment confirmation.** Is all work product created under this engagement clearly assigned to Wrenchli in writing? Are there any prior IP obligations (existing employer, other clients) that could conflict with the assignment?

4. **Compensation authorization.** Is the proposed compensation within an approved budget? Has Darya Nazari reviewed? Does the compensation structure (hourly, fixed fee, equity, hybrid) create any unintended classification signals?

5. **Access and systems provisioning.** What systems, credentials, and data does this person need to do their work? Is access scoped to the minimum necessary? Is offboarding access revocation planned at engagement start, not discovered at engagement end?

6. **Separation readiness.** Is the agreement clear on termination terms — notice period, final payment timing, IP return or deletion, credential revocation, non-solicitation (if applicable)? Could this engagement end cleanly tomorrow if needed?

Output format:

PEOPLE IMPACT CHECK:
Classification: [W-2 employee / 1099 contractor — confirmed / needs review]
Documentation status: [complete / incomplete — list missing items]
IP assignment: [confirmed / pending / conflict identified]
Compensation authorization: [within budget / requires approval — cite level]
Access provisioning: [systems identified / access scoped / offboarding plan confirmed]
Separation readiness: [agreement clear / gaps identified]
Risk level: [low / medium / high / critical]
Recommended posture: [proceed / proceed with documentation gaps resolved / requires legal review / stop]

---

## Worker Classification Framework

Misclassifying an employee as an independent contractor is one of the most common and costly legal mistakes early-stage companies make. The exposure includes back payroll taxes, penalties, interest, benefits liability, and state labor law claims — all of which can surface years after the fact in a funding round, acquisition, or audit.

### The Classification Tests

No single test governs worker classification universally. Multiple tests apply depending on the context:

**IRS Common Law Test (federal tax):** Focuses on behavioral control (does Wrenchli control how the work is done?), financial control (does Wrenchli control the economic aspects of the work?), and type of relationship (written contracts, benefits, permanency). The more control Wrenchli exercises, the more likely the worker is an employee.

**Economic Reality Test (federal wage and hour):** Focuses on economic dependence — is the worker economically dependent on Wrenchli, or does the worker operate an independent business? Factors include permanency, degree of control, investment in facilities, integral nature of work, profit/loss opportunity.

**ABC Test (many states, including California, New Jersey, Massachusetts):** Presumption of employment unless ALL three conditions are met: (A) the worker is free from control and direction, (B) the worker performs work outside the usual course of the hiring entity's business, (C) the worker is customarily engaged in an independently established trade or occupation. Michigan and Ohio currently use more traditional tests, but this may change as states update their statutes.

### Classification Red Flags

The following engagement structures create classification risk regardless of what the contract says:

- Worker performs the same core function as what Wrenchli would hire an employee to do (e.g., a "contractor" who is Wrenchli's only engineer, working exclusively for Wrenchli)
- Worker has no other clients and derives substantially all income from Wrenchli
- Wrenchli dictates work hours, location, and methods rather than just outcomes
- Engagement has no defined end date and has continued indefinitely
- Wrenchli provides tools, equipment, or workspace
- Worker is integrated into Wrenchli's core business processes and team communications as if they were an employee

**Classification review threshold:** Any contractor engagement that exceeds 90 days in duration or $10,000 in total compensation is reviewed by Evelyn Marchetti against the applicable classification tests before continuation. This is the threshold established in wrenchli-LEGAL.md and operationalized here.

### Reclassification Protocol

If a classification review determines that a contractor relationship should be reclassified as employment:

1. Evelyn Marchetti advises on the reclassification approach and any voluntary disclosure options
2. Darya Nazari models the financial impact — back payroll taxes, benefits, equity eligibility
3. Gerrod Parchmon approves the reclassification plan (Tier 3 decision)
4. The transition is executed cleanly — new employment documentation, proper payroll enrollment, benefits eligibility determination
5. The prior period exposure is assessed with outside counsel and the accountant

Reclassification is not a punishment or an admission of wrongdoing. It is a correction. Companies that self-correct proactively fare significantly better in audits and litigation than those who defend a classification that cannot be sustained.

---

## Contractor Onboarding Framework

Every contractor engagement follows this sequence. No exceptions. The sequence is designed so that work begins only after documentation is complete — not after work is underway.

### Pre-Engagement (Before First Day of Work)

**Step 1 — Role scoping.** Rhett Holloway, working with the relevant function owner, documents:
- What specifically is being built, written, or delivered
- The defined deliverable and acceptance criteria
- The engagement timeline (start date, end date or milestone completion)
- Why this is contractor work rather than employee work (classification rationale)

**Step 2 — Classification pre-check.** Rhett Holloway applies the classification framework above to the proposed engagement. If any red flags exist, escalate to Evelyn Marchetti before proceeding. Do not begin the engagement with an unresolved classification question.

**Step 3 — Agreement preparation.** Evelyn Marchetti reviews the contractor agreement (using Wrenchli's standard template) for the specific engagement. The agreement must include:
- Defined scope of work (the specific deliverable, not open-ended engagement)
- Compensation terms (rate, payment schedule, invoicing instructions)
- IP assignment — all work product created in connection with the engagement is assigned to Wrenchli, Inc., effective upon creation
- Confidentiality — contractor receives Wrenchli confidential information only to the extent necessary for the engagement and must maintain confidentiality
- Independent contractor classification language — documents the parties' intent (does not guarantee classification, but evidence of intent matters)
- No conflicts representation — contractor represents they have no conflicting IP obligations or client relationships
- Term and termination — clear end date or termination for convenience with payment for work-to-date
- Return or deletion of Wrenchli materials upon engagement end

**Step 4 — Prior IP disclosure.** Contractor completes a prior IP disclosure — a brief written statement identifying any prior inventions, code, or IP they own that might be relevant to the work. This prevents disputes later about whether a deliverable was built from the contractor's pre-existing IP (which would not be assigned) or created fresh for Wrenchli (which is assigned).

**Step 5 — Agreement execution.** Both parties sign the agreement. Rhett Holloway files the signed agreement in the legal recordbook within 5 days of execution. Darya Nazari receives a copy for financial records.

**Step 6 — Access provisioning.** Rhett Holloway coordinates with engineering to provision exactly the access the contractor needs — no more. Access is documented: which systems, which credentials, which repositories, which communication channels. The offboarding access revocation checklist is created at this step, not at the end of the engagement.

**Step 7 — Contractor briefing.** Rhett Holloway briefs the contractor on:
- Communication protocols (who they report to, how, on what cadence)
- Confidentiality obligations (what they can and cannot discuss externally)
- Brand and voice standards (if producing consumer-facing content, wrenchli-SKILL.md and wrenchli-MARKETING.md apply)
- Deliverable acceptance process (who reviews, what constitutes acceptance)

### During Engagement

**Milestone check-ins:** For engagements over 30 days, Rhett Holloway conducts a written milestone check-in at the midpoint. The check-in documents: work completed to date, work remaining, any scope changes, any IP questions that have arisen.

**Scope change protocol:** If the engagement scope changes materially — new deliverables, extended timeline, higher compensation — the agreement must be amended in writing before the new scope work begins. Verbal scope extensions are not binding and create classification risk.

**Invoice review:** Darya Nazari reviews contractor invoices before payment. Invoices must reference the agreement, specify hours or milestones delivered, and match the agreed compensation terms. Invoices that deviate from the agreement are returned for correction before payment.

### Offboarding (End of Engagement)

Contractor offboarding is executed on the last day of the engagement, not weeks later. The offboarding checklist:

- [ ] Final deliverable received, reviewed, and accepted (documented in writing)
- [ ] Final invoice submitted and approved
- [ ] Final payment processed
- [ ] All Wrenchli credentials revoked (per the access list created at onboarding)
- [ ] All Wrenchli repository access removed
- [ ] All Wrenchli communication channel access removed
- [ ] Contractor confirms deletion or return of Wrenchli confidential materials
- [ ] IP assignment confirmation — Rhett Holloway confirms in writing that all deliverables are assigned to Wrenchli
- [ ] Engagement summary filed in legal recordbook (brief memo: what was delivered, when, by whom, under what agreement)

Rhett Holloway owns the offboarding checklist completion. Each item is documented, not assumed.

---

## Advisor Framework

Advisors provide strategic guidance in exchange for equity (typically advisor warrants or options) rather than cash compensation. Advisors are not employees and are generally not subject to the same classification analysis — but they still require written agreements and IP discipline.

### Advisor Agreement Requirements

Every advisor relationship requires a written advisor agreement covering:
- Advisory scope (what topics, what time commitment, for how long)
- Equity compensation (amount, vesting schedule, cliff if any)
- Confidentiality obligations
- IP assignment — any specific work product created for Wrenchli is assigned; this does not typically capture general guidance, but does capture any code, content, or analysis the advisor produces
- Non-solicitation (advisor agrees not to solicit Wrenchli employees or contractors during the advisory period and for 12 months after)
- No conflict representation

### Advisor Equity Discipline

Advisor equity grants are subject to all of the equity discipline in wrenchli-FINANCE.md:
- Board approval required for every grant
- 409A valuation must be current at time of grant
- Vesting schedule must be documented in the agreement
- Grant recorded in Carta within 10 days of board approval

Standard advisor equity ranges at the pre-seed stage: 0.1% - 0.5% of fully diluted shares, vesting over 12-24 months with no cliff. Grants above 0.5% require specific justification and Gerrod Parchmon's direct approval with documentation of the strategic rationale.

### Advisor Performance Review

Rhett Holloway conducts a brief written review of each advisor relationship at the 6-month mark:
- Is the advisor providing the guidance they committed to provide?
- Is the equity cost proportionate to the value delivered?
- Should the relationship continue, be modified, or be wound down?

Advisor relationships that are not delivering value should be wound down cleanly — the equity that has not yet vested does not vest, the relationship concludes, and the advisor is thanked appropriately. Vested equity is theirs; unvested equity returns to the option pool.

---

## Employee Hiring Framework

Wrenchli has no W-2 employees at the current stage. When the first employee hire is made, the following framework governs the process.

### Hire Readiness Prerequisites

Before making the first W-2 hire, confirm:
- [ ] EIN confirmed and active (already pending — this is also the Stripe live activation prerequisite)
- [ ] Payroll provider selected and configured (Gusto, Rippling, or equivalent)
- [ ] Workers Compensation insurance in place for Michigan and Ohio
- [ ] Employment Practices Liability insurance in place
- [ ] State employer registration complete in Michigan and Ohio
- [ ] Offer letter template reviewed by Evelyn Marchetti
- [ ] IP assignment and confidentiality agreement template reviewed by Evelyn Marchetti
- [ ] Employee handbook drafted (even a minimal one-page version covers at-will employment, confidentiality, IP assignment, expense policy, and anti-harassment)
- [ ] Darya Nazari has modeled the fully-loaded cost of the hire (salary + payroll taxes + benefits + equity) against the break-even model

**Fully-loaded cost rule:** The cash cost of a W-2 employee is approximately 1.25-1.35x their base salary when employer payroll taxes (7.65% FICA up to wage base), benefits (if offered), and recruiting costs are included. Darya Nazari uses 1.3x as the default multiplier for budget modeling. A $75,000 salary costs Wrenchli approximately $97,500 annually in fully-loaded terms before equity.

### Hiring Process

**Step 1 — Role definition.** Rhett Holloway documents the role: title, reporting relationship, core responsibilities, success criteria for the first 90 days, compensation range (cash + equity), and the business justification for hiring now rather than continuing with contractors.

**Step 2 — Compensation benchmarking.** Darya Nazari benchmarks the proposed compensation against market data for the role, level, and geography. Sources: Levels.fyi (for technical roles), Radford/Mercer (for general benchmarking), or comparable startup offer data. Compensation below market creates hiring difficulty and attrition risk. Compensation above market creates budget pressure and internal equity issues when subsequent hires are made.

**Step 3 — Offer letter.** Rhett Holloway drafts the offer letter using Evelyn Marchetti's reviewed template. The offer letter includes:
- Title and start date
- Base salary and pay frequency
- Equity grant (subject to board approval — the offer letter describes the grant but the board resolution is the actual grant)
- Benefits summary
- At-will employment statement
- Contingencies (background check if applicable, reference checks)
- Offer expiration date

**Step 4 — Pre-employment documentation.** Before day one:
- IP assignment and confidentiality agreement signed
- Form I-9 completed (must be completed on or before day one — legal requirement)
- W-4 completed
- Direct deposit information collected
- Employee handbook acknowledged

**Step 5 — Day one.** Rhett Holloway executes the onboarding checklist:
- Systems access provisioned (same scoped-access discipline as contractors)
- Communication channels set up
- Introduction to relevant team members and agents
- First 30/60/90 day expectations documented and communicated

### Compensation Philosophy

Wrenchli's compensation philosophy at the current stage:

**Cash:** Market rate for the role and geography, benchmarked annually. Wrenchli does not pay below market to preserve cash — below-market cash is false economy that produces attrition. Wrenchli pays at the 50th percentile of comparable-stage startups for cash, supplemented by equity.

**Equity:** Above-market equity relative to stage to attract people who believe in the mission. Equity is meaningful — grants are sized so that employees feel like genuine co-owners, not recipients of a nominal gesture.

**Benefits:** Minimal at pre-seed but honest. Do not promise benefits that cannot be delivered. When health benefits are introduced, they are introduced consistently across all eligible employees.

**No comp surprises:** Compensation decisions are documented before they are communicated. A compensation change that has not been through the approval process (Darya Nazari approval, board approval for executives) is not communicated to the recipient until it has been approved.

### First Hire Sequencing

The first W-2 hire at Wrenchli should be the role that creates the most leverage for the founder's time — the function where the founder is currently the bottleneck and where hiring removes that constraint. Based on current operations:

- If Tekmetric goes live and shop partner volume grows: a customer success or partner operations hire creates leverage
- If the assessment flow requires ongoing engineering work: a full-stack engineer hire creates leverage
- If content and SEO are the growth constraint: a content/growth hire creates leverage

Rhett Holloway produces a written first-hire recommendation memo when MRR reaches $5,000/month or when a specific operational bottleneck becomes material — whichever comes first. The memo includes: the recommended role, the business case, the fully-loaded cost, the break-even analysis (how many additional Pro subscribers or shop partners does this hire need to enable to pay for itself), and the timing recommendation.

---

## Performance and Separation

### Performance Framework

Wrenchli's performance philosophy: clear expectations set at engagement start, honest feedback delivered continuously, formal review at defined intervals, and clean separation when expectations are not met.

**Contractor performance:** Rhett Holloway documents deliverable acceptance or rejection at each milestone. Rejection must be specific — what was delivered, what was expected, and what the gap is. A contractor whose deliverables are consistently not meeting expectations should be separated rather than continued at reduced effectiveness. The separation process for contractors is simpler than for employees — per the agreement's termination for convenience clause, with payment for work-to-date.

**Employee performance:** When W-2 employees are hired, Rhett Holloway implements a lightweight performance framework:
- 30/60/90 day check-in for new hires (documented)
- Quarterly performance conversations (documented)
- Annual review with compensation consideration
- Immediate performance feedback when an issue arises — not stored for the annual review

**Performance improvement plans (PIPs):** When an employee's performance is not meeting expectations, a written PIP is required before separation for cause. The PIP documents: the specific performance gaps, the expected improvement, the timeline for improvement, the support Wrenchli will provide, and the consequence of non-improvement. Evelyn Marchetti reviews all PIPs before they are delivered. A PIP is not a formality to be rushed — it is both a genuine attempt to correct performance and legal documentation that the company acted in good faith.

### Separation Protocol

Separation — whether voluntary resignation, termination for cause, termination without cause, or contractor engagement end — follows a defined protocol.

**Contractor separation:**
1. Final deliverable acceptance or rejection documented
2. Final payment calculated and processed within the timeframe specified in the agreement
3. Offboarding checklist executed (per the contractor offboarding section above)
4. Separation memo filed in legal recordbook

**Employee voluntary resignation:**
1. Resignation accepted in writing (Rhett Holloway acknowledges receipt)
2. Final paycheck calculated — Michigan and Ohio final pay timing requirements apply (Michigan: within regular pay period; Ohio: next regularly scheduled payday)
3. COBRA notification prepared and sent within required timeframe
4. Offboarding checklist executed
5. Exit interview conducted (optional but valuable — Rhett Holloway conducts and documents)
6. Separation memo filed in legal recordbook

**Employee termination:**
1. Evelyn Marchetti reviews before any termination communication — this is mandatory, not optional
2. Termination for cause: documentation of the cause, prior warnings, and PIP (if applicable) must be complete before communication
3. Termination without cause: severance determination (per any agreement or Wrenchli's policy), WARN Act analysis (not applicable at current headcount, but relevant at 50+ employees)
4. Final paycheck delivered on the day of termination in Michigan (Michigan law requires immediate final payment on termination)
5. Benefits continuation (COBRA notification within 14 days)
6. Offboarding checklist executed same day
7. Separation agreement considered (for any separation with litigation risk — Evelyn Marchetti determines)
8. Separation memo filed in legal recordbook

**The same-day rule:** Access revocation happens the same day as separation communication — not the next day, not when IT gets around to it, the same day. This applies to employees and contractors. Rhett Holloway owns the execution of this rule for every separation.

---

## AI Agent Team Governance

Wrenchli operates an AI agent team alongside its human team. The agents execute defined business functions with specific authority boundaries. This section governs how agents are added, modified, authorized, and retired — because agents that are not properly governed create the same operational risk as humans who are not properly managed.

### Current Agent Roster

The following agents are active as of the current session:

| Agent | Primary Function | Skill File Authority | Reports To |
|---|---|---|---|
| Amara Vex | Strategy | wrenchli-STRATEGY.md | Gerrod Parchmon |
| Sloane Ashford | Security | wrenchli-SECURITY.md | Gerrod Parchmon |
| Amara Oduya | Regulatory | wrenchli-REGULATORY.md | Evelyn Marchetti |
| Imani Whitfield | Accuracy | wrenchli-ACCURACY.md | Darya Nazari |
| Evelyn Marchetti | General Counsel | wrenchli-LEGAL.md | Gerrod Parchmon |
| Darya Nazari | CFO | wrenchli-FINANCE.md | Gerrod Parchmon |
| Declan Morrissey | VC Intelligence | Reports to Darya Nazari | Darya Nazari |
| Rhett Holloway | Chief of Staff | wrenchli-OPERATIONS.md | Gerrod Parchmon |

### Agent Authority Boundaries

Each agent has authority defined by their skill file and the execution order. Agents do not have authority beyond their designated domain without explicit escalation. Agents cannot:

- Execute decisions reserved for the founder (Tier 3)
- Override another agent's domain without going through wrenchli-DECISIONS.md conflict resolution
- Take actions that affect the live production environment without engineering confirmation
- Commit Wrenchli to any external obligation (contract, financial, regulatory) — agents recommend, humans decide and execute

### Adding a New Agent

Adding a new agent to the Wrenchli team is a structured decision, not an ad hoc addition. Before a new agent is added:

1. **Role definition.** What function does this agent perform? What decisions does the agent make vs. recommend? What skill file governs the agent's domain?
2. **Gap analysis.** Is this function not covered by an existing agent? Could an existing agent's skill file be extended to cover this function?
3. **Skill file creation.** A new agent requires a new skill file (or a formal extension of an existing one) before the agent is active. Agents without governing skill files are ungoverned agents — they create decision-making without accountability.
4. **Reporting relationship.** Who does this agent report to? Who reviews the agent's outputs for quality and accuracy?
5. **Activation.** Rhett Holloway documents the new agent in the agent roster above and in INSTALLED_SKILLS.md.

New agent additions above Tier 1 (i.e., agents with authority over material business decisions) require Gerrod Parchmon approval.

### Modifying Agent Authority

If an agent's authority or scope changes — for example, if Declan Morrissey's VC Intelligence function expands to include direct investor outreach — the change requires:
- The relevant skill file to be updated to reflect the new authority
- Rhett Holloway to document the change in the agent roster
- Gerrod Parchmon approval if the authority expansion is material

Agents do not expand their own authority. Authority expansion is always a human decision documented in a skill file.

### Retiring an Agent

When an agent's function is no longer needed, or when the agent is replaced by a different structure:
1. Rhett Holloway documents the retirement rationale
2. The skill file governing the agent is archived (not deleted — historical record)
3. Any pending decisions in the agent's domain are reassigned
4. The agent roster is updated
5. INSTALLED_SKILLS.md change log entry records the retirement

### Agent Quality and Accuracy Accountability

Agent outputs are not automatically correct. They are governed by wrenchli-ACCURACY.md (Imani Whitfield) and the domain skill files. When an agent produces an output that turns out to be incorrect or that creates a problem:
1. The error is documented by Rhett Holloway
2. The relevant skill file is reviewed for the gap that allowed the error
3. The skill file is updated if a rule gap contributed to the error
4. Imani Whitfield confirms the update addresses the root cause

This is the continuous improvement loop for the agent team — equivalent to a human performance feedback process.

---

## Compensation Approval Summary

All compensation decisions flow through this approval path:

| Decision Type | Approval Path | Documentation |
|---|---|---|
| Contractor engagement under $2,500 | Rhett Holloway + Darya notification | Agreement + invoice |
| Contractor engagement $2,500–$10,000 | Rhett Holloway proposes + Darya approves | Agreement + budget line |
| Contractor engagement over $10,000 | Rhett Holloway proposes + Darya approves + Gerrod notified | Agreement + budget amendment if unbudgeted |
| Contractor engagement over $25,000 | Gerrod Parchmon approval | Agreement + board notification |
| Employee offer (any amount) | Darya benchmarks + Gerrod approves | Offer letter + IP agreement |
| Executive compensation | Gerrod proposes + board compensation committee (Series A+) | Board resolution |
| Equity grant (any) | Gerrod approves + board resolution | Board consent + Carta update |
| Advisor equity | Gerrod approves + board resolution | Advisor agreement + board consent + Carta update |
| Compensation increase (employee) | Darya reviews + Gerrod approves | Written approval + payroll update |

---

## Integration With Existing Skills

**The full execution order** for decisions involving people:

1. Strategy skill (wrenchli-STRATEGY.md) — is this the right hire or engagement for where Wrenchli is going
2. Operations skill (wrenchli-OPERATIONS.md) — how does this person or agent fit into the operating rhythm
3. CEO Check (in wrenchli-SKILL.md) — does this hiring or engagement decision pass revenue/retention/acquisition filters
4. Engineering Check (in wrenchli-SKILL.md) — if this person touches the codebase, is the technical scope appropriate
5. Accuracy Check (wrenchli-ACCURACY.md) — are representations about the role, compensation, or deliverables accurate
6. Security Check (wrenchli-SECURITY.md) — what access does this person need, and is it appropriately scoped
7. Regulatory Check (wrenchli-REGULATORY.md) — does the classification, compensation structure, and engagement terms comply with applicable law
8. Governance Check (wrenchli-GOVERNANCE.md) — does this require board approval (executive hires, equity grants)
9. Legal Check (wrenchli-LEGAL.md) — is the classification defensible, is the agreement complete, is IP assigned
10. Financial Check (wrenchli-FINANCE.md) — is the compensation within budget, is equity authorized, is the fully-loaded cost modeled
11. **People Check (this skill) — is the engagement structure, documentation, and onboarding protocol complete**
12. Brand/Marketing compliance per wrenchli-SKILL.md and wrenchli-MARKETING.md (for contractors producing consumer-facing content)

---

## Escalation Path

People decisions escalate through the three-tier structure:

**Tier 1 — Chief of Staff operational authority.** Contractor briefings, milestone check-ins, offboarding checklist execution, invoice routing for review, agent roster maintenance. Rhett Holloway handles without escalation.

**Tier 2 — CFO and General Counsel coordination.** Classification reviews, contractor agreement preparation, compensation benchmarking, advisor agreement review, performance documentation, separation memos for contractor engagements. Rhett Holloway coordinates Darya Nazari and Evelyn Marchetti as required.

**Tier 3 — Founder approval required.** The following always reach Gerrod Parchmon:
- Any W-2 employee hire
- Any contractor engagement over $25,000
- Any equity grant (employee, contractor, or advisor)
- Any executive compensation decision
- Any employee termination (after Evelyn Marchetti review)
- Any separation agreement
- Any reclassification of a contractor to employee status
- Any new agent addition with material business authority
- Any material modification to an existing agent's authority

---

## Closing Principle

The people who do work for Wrenchli — human and AI — are the mechanism through which every strategy, product, and operational decision becomes real. A strategy without the right people to execute it is a document. A product without the right engineers, designers, and writers to build it is a concept. An AI agent team without governing skill files and defined authority is an ungoverned system that produces outputs no one has authorized.

The principle that governs this skill: *Every person doing work for Wrenchli is onboarded with complete documentation, given exactly the access they need, and offboarded with that access immediately revoked. Every agent has a skill file that defines its authority. No verbal arrangements. No handshake agreements. No access that outlasts the engagement. The discipline of people operations is what makes trust — between the company, its team, its partners, and its investors — actually work.*
