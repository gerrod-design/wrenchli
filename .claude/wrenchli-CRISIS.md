# Wrenchli Crisis Skill

# This file governs crisis identification and activation, incident response coordination across the agent team, board and investor notification protocols during material events, media and regulatory response posture, financial crisis response, data breach legal response, executive departure protocol, and agent authority during active crisis events.

# Read this before responding to any prompt involving: a potential or confirmed crisis, security incidents, data breaches, regulatory enforcement, litigation threats, executive departure, financial distress, media inquiries about sensitive matters, negative press, consumer harm events, partner disputes that escalate to legal action, or any situation where the question "is this a crisis?" is being asked.

# Owned by: Gerrod Parchmon (Founder/CEO). All crisis decisions are founder decisions — no agent has autonomous authority during an active crisis event. Rhett Holloway (Chief of Staff) coordinates execution. Evelyn Marchetti (General Counsel) leads legal response. Darya Nazari (CFO) leads financial response. Sloane Ashford (Security) leads technical incident response. All crisis actions coordinate with wrenchli-GOVERNANCE.md (board notification), wrenchli-LEGAL.md (legal obligations and litigation hold), wrenchli-FINANCE.md (financial crisis response), wrenchli-SECURITY.md (technical incident response), wrenchli-REGULATORY.md (regulatory notification obligations), and wrenchli-DECISIONS.md (conflict resolution during crisis).

# ============================================================

## Core Posture

A crisis is any event that threatens Wrenchli's ability to operate, its consumer trust, its legal standing, its financial viability, or its team integrity — and that requires a coordinated response faster than normal operating processes can provide.

The distinction between a problem and a crisis is speed and coordination. A bug in the assessment flow is a problem — it has a normal resolution path through engineering. A data breach affecting consumer PII is a crisis — it requires simultaneous legal, security, regulatory, communications, and financial response within hours, not days.

The operating principle for crisis: slow down to speed up. The instinct in a crisis is to act immediately. The discipline in a crisis is to assess before acting, because the first response sets the frame for everything that follows. A premature statement, an unauthorized disclosure, or a reactive engineering change during an active crisis can make the situation significantly worse. The Crisis Activation framework exists to ensure the first thirty minutes of any crisis produce clarity rather than noise.

**The founder is the crisis decision-maker.** No agent, no C-suite member, no outside counsel makes unilateral crisis decisions. Agents provide analysis and recommendations. Evelyn Marchetti leads legal response execution within her authority. But every material crisis decision — what to say publicly, whether to notify regulators, whether to engage a crisis PR firm, whether to settle — is Gerrod Parchmon's decision. This is non-negotiable.

**Agent authority is suspended during an active crisis.** When a crisis is declared per the activation criteria below, all agent outputs become advisory only. No agent recommendation is acted upon without explicit founder review. This prevents the compounding problem of automated recommendations creating additional exposure during an already-stressed situation.

---

## Activation Rule

This skill triggers automatically — without announcement — when the prompt involves:

- Any confirmed or suspected security incident affecting consumer data

- Any regulatory inquiry, investigation, or enforcement action

- Any litigation threat or filed lawsuit

- Any negative press inquiry or published negative coverage about Wrenchli

- Any consumer harm event — a consumer was injured, suffered financial harm, or experienced significant distress attributable to a Wrenchli assessment

- Any partner dispute that has escalated beyond the commercial resolution path

- Any executive departure — planned or unplanned — of the founder or a named C-suite member

- Financial distress — runway below 60 days, bank account access lost, Stripe account suspended, or payroll at risk

- Any question phrased as "is this a crisis?" or "how bad is this?" or "what do we do now?"

- Any situation where multiple skill files are firing simultaneously on the same event

When triggered, run the Crisis Assessment Check before any other response. The Crisis Assessment Check determines whether to activate the full crisis protocol or resolve through normal operating processes.

---

## Crisis Assessment Check

Before any crisis response action, run the four-gate Crisis Assessment Check:

1. **Scope confirmation.** What specifically happened? What is confirmed vs. suspected? What is the worst-case scope if suspicions prove correct? Who is affected — consumers, shop partners, employees, investors?

2. **Time sensitivity.** Is there a regulatory notification deadline running? Is there active ongoing harm (a breach still in progress, a consumer still at risk)? Is there a press deadline? Time sensitivity determines whether the response is measured in hours or days.

3. **Containment status.** Has the triggering event been contained — the breach closed, the harmful content removed, the financial outflow stopped? Or is it still ongoing? An uncontained crisis requires containment before communication.

4. **Activation threshold.** Does this event meet the crisis activation threshold, or is it a serious problem resolvable through normal operating processes?

**Crisis activation threshold — ANY ONE of the following triggers full crisis protocol:**

- Confirmed unauthorized access to Tier 1 consumer PII (any quantity)

- Regulatory enforcement action received (not inquiry — action)

- Litigation filed against Wrenchli

- Verified consumer physical harm attributable to a Wrenchli assessment

- Financial event threatening payroll or 30-day operating continuity

- Negative press published with material factual errors that require correction

- Executive departure creating immediate operational gap

- Partner data breach where Wrenchli data was exposed through a partner's systems

**Below the crisis activation threshold — serious problems managed through normal processes:**

- Single consumer complaint (no litigation threat, no harm)

- Assessment inaccuracy identified (routes to wrenchli-ACCURACY.md)

- Partner dispute in commercial negotiation

- Negative social media post without press amplification

- Bug in non-critical product feature

- Vendor payment dispute

Output format:

CRISIS ASSESSMENT CHECK:

Scope: [confirmed facts / suspected facts / worst-case scenario]

Time sensitivity: [hours / days / no immediate deadline]

Containment status: [contained / ongoing — describe]

Activation threshold met: [yes — cite triggering criterion / no — route to normal process]

Immediate required actions: [list in priority order]

Crisis declared: [yes / no]

If crisis declared: all subsequent actions in this conversation follow crisis protocol. Agent authority suspended. All recommendations advisory only pending founder review.

---

## Crisis Response Framework

When a crisis is declared, response runs on four simultaneous tracks. Rhett Holloway coordinates across tracks. Each track has a lead and defined actions.

### Track 1: Containment (Lead: Sloane Ashford / Engineering)

Containment stops the ongoing harm before communication or legal response begins. For technical crises:

- Identify and close the attack vector or exposure point

- Preserve forensic evidence before remediation (do not overwrite logs)

- Isolate affected systems if necessary

- Confirm containment is complete before declaring the technical incident closed

For non-technical crises:

- Remove harmful content if applicable (incorrect assessment that caused harm, unauthorized disclosure)

- Cease the activity causing harm

- Document the state at the time of discovery

**Containment discipline:** No system change during an active security incident happens without Gerrod Parchmon's awareness. Sloane Ashford leads technical decisions but the founder is informed in real time.

### Track 2: Legal Response (Lead: Evelyn Marchetti)

Legal response runs simultaneously with containment, not after it.

**Immediate legal actions (within 2 hours of crisis declaration):**

- Litigation hold issued per wrenchli-LEGAL.md — all potentially relevant documents preserved immediately

- Outside counsel engaged if the event involves potential litigation, regulatory action, or consumer harm

- Regulatory notification deadline analysis — what laws require notification, to whom, within what timeframe

- Attorney-client privilege asserted over all crisis communications between Gerrod Parchmon and Evelyn Marchetti — communications should be marked "Privileged and Confidential — Attorney-Client Communication" from this point forward

**Legal response by crisis type:**

*Data breach:*

- State breach notification law analysis (Michigan, Ohio, and any other state with affected consumers)

- GLBA/FTC notification analysis if financial data involved

- Notification letter drafted by outside counsel before any consumer notification is sent

- Regulatory notifications filed within required timeframes (Michigan: "in the most expedient time possible"; Ohio: "in the most expedient time possible, without unreasonable delay")

- Consumer notification: plain language, accurate, not minimizing, not panicking — reviewed by Evelyn Marchetti before send

*Regulatory enforcement:*

- Response to enforcement agency coordinated exclusively through outside counsel

- No Wrenchli employee or agent communicates with the regulator without outside counsel present or advising

- Document preservation for all records relevant to the enforcement matter

- Settlement authority: any settlement offer or acceptance is a Tier 3 founder decision

*Litigation:*

- Service of process logged with date and time

- Outside litigation counsel engaged within 24 hours of service

- Answer deadline calendared

- Litigation hold broadened to cover all matter-relevant documents

- No communication with the opposing party or their counsel without outside counsel

*Consumer harm:*

- Affected consumer contacted directly by Gerrod Parchmon or Evelyn Marchetti — not by an agent, not by a form letter

- Consumer's immediate needs addressed (referral to appropriate professional, acknowledgment of the error)

- No admission of liability without Evelyn Marchetti review

- Documentation of the harm event, the consumer interaction, and all subsequent contacts

### Track 3: Communications (Lead: Gerrod Parchmon)

All external communications during a crisis are founder-approved. No exception.

**Communication hierarchy:**

1. Board and investors (if applicable) — before public statement

2. Affected parties (consumers, partners) — simultaneous with or immediately after board

3. Regulators — per legal notification obligations

4. Press — only after legal review and founder approval

5. General public (social media, website) — last, after all prior communications are sent

**The 24-hour rule:** No public statement about a crisis is issued within the first 24 hours unless a regulatory deadline or ongoing consumer harm requires it. The first 24 hours are for assessment, containment, and legal review. A premature statement that is later contradicted by facts is more damaging than a delayed accurate statement.

**What Wrenchli says publicly:**

- Confirm what is confirmed. Do not speculate about what is suspected.

- Describe what Wrenchli is doing, not what Wrenchli failed to do.

- Direct affected parties to a single point of contact.

- Do not minimize. Do not catastrophize.

- Do not assign blame to third parties unless facts are confirmed and legal has approved.

**What Wrenchli does not say publicly:**

- Specific technical details of a security incident (this aids attackers)

- Speculation about cause or scope before investigation is complete

- Legal conclusions ("we were not negligent," "this was not our fault")

- Commitments that have not been reviewed by Evelyn Marchetti

- The number of affected consumers before that number is confirmed

**Press inquiry protocol:**

- All press inquiries during a crisis are routed to Gerrod Parchmon

- No employee, contractor, or agent speaks to press during an active crisis

- The holding statement while a response is prepared: "We are aware of the situation and are conducting a thorough review. We will provide an update as soon as we have confirmed information. We take [consumer privacy / partner trust / platform integrity] seriously and are committed to addressing this appropriately."

- If a crisis PR firm is engaged, they operate under Evelyn Marchetti's and Gerrod Parchmon's direction — they do not make independent statements

**Social media during a crisis:**

- No new social media posts on any Wrenchli-controlled account during an active crisis without founder approval

- Existing posts are not deleted during an active crisis — deletion can be interpreted as evidence destruction

- Comments and direct messages are monitored but not responded to individually without legal review

### Track 4: Stakeholder Notification (Lead: Rhett Holloway, coordinating Darya Nazari)

**Board notification:**

Per wrenchli-GOVERNANCE.md, certain crises require board notification within defined timeframes:

- Security incidents affecting Tier 1 data: within 24 hours of confirmed scope

- Regulatory enforcement actions: within 48 hours of receipt

- Material legal actions: upon filing or service

- Executive departures (C-suite): immediately upon decision

- Financial events threatening operating continuity: immediately upon detection

At Wrenchli's current stage (no outside investors with board seats), board notification means Gerrod Parchmon as sole director is the board. The notification obligation is self-notification — but the documentation discipline applies regardless: a written record of when the founder became aware of the crisis, what was known at that time, and what decisions were made. This documentation becomes material in future due diligence and any subsequent legal proceedings.

**Investor notification:**

Currently no priced equity investors with formal information rights. SAFE holders do not typically have information rights. When priced investors join the cap table, crisis notification obligations activate per the investor rights agreement. Until then, Darya Nazari determines on a case-by-case basis whether SAFE holders should be notified of a material crisis, balancing relationship management against the risk of creating information asymmetry.

**Partner notification:**

Shop partners are notified of any crisis that affects data delivered to them, the availability of the platform, or the accuracy of assessments. Notification is coordinated by Rhett Holloway, reviewed by Evelyn Marchetti, and sent from Gerrod Parchmon's email. Partner notification uses the same "confirm what is confirmed" discipline as press communications.

---

## Crisis Playbooks by Type

### Playbook 1: Data Breach

**Hour 0-2 (Discovery and Containment):**

- Sloane Ashford confirms breach scope and closes attack vector

- Forensic evidence preserved — logs captured before any system changes

- Evelyn Marchetti notified — litigation hold issued immediately

- Gerrod Parchmon briefed — crisis declared if Tier 1 PII confirmed affected

- Outside privacy counsel engaged

- Agent authority suspended

**Hour 2-24 (Assessment and Legal):**

- Scope confirmed: how many consumers, what data, what time period

- Regulatory notification deadline analysis completed

- Notification letter drafted by outside counsel

- Board documentation prepared

- Consumer notification plan developed but not sent pending legal review

**Hour 24-72 (Notification):**

- Regulatory notifications filed if required

- Affected consumer notifications sent (outside counsel reviewed)

- Partner notifications sent if partner data affected

- Holding statement issued if press inquiry received

- Stripe and payment processor notified if payment data involved

**Post-Breach (Day 4+):**

- Technical remediation completed and documented

- Post-incident review conducted (what happened, how, what changes prevent recurrence)

- wrenchli-SECURITY.md updated with lessons learned

- Regulatory follow-up communications as required

- Consumer support process maintained until affected consumers have been addressed

**Data breach hard rules:**

- Never minimize the scope publicly before it is confirmed

- Never contact affected consumers before outside counsel has reviewed the notification

- Never delete logs or evidence even if they show Wrenchli's systems were at fault

- The number of affected consumers is not disclosed publicly until confirmed by forensic analysis

### Playbook 2: Regulatory Enforcement

**Receipt of enforcement action:**

- Logged with date, time, and delivery method

- Scanned and filed in legal recordbook immediately

- Evelyn Marchetti briefed within 2 hours

- Outside counsel engaged within 24 hours — enforcement response requires specialist counsel, not general corporate counsel

- Response deadline calendared with buffer (respond 5 days before the stated deadline)

- Gerrod Parchmon briefed — Tier 3 decision on response posture

**Response posture options (Gerrod Parchmon decides):**

- Cooperate fully: provide all requested documents and information, engage proactively

- Cooperate with scope limitation: provide requested information but object to overreach with outside counsel's guidance

- Contest: challenge the enforcement action through formal legal process

**What Wrenchli does not do during regulatory enforcement:**

- Does not communicate with the regulator without outside counsel present or advising

- Does not produce documents without outside counsel review of privilege claims

- Does not make public statements about the enforcement action without legal review

- Does not alter, delete, or move any document that could be relevant to the investigation

### Playbook 3: Negative Press

**Press inquiry received:**

- Routed to Gerrod Parchmon within 1 hour of receipt

- Journalist's deadline noted — this is the response window

- Evelyn Marchetti briefed

- Accuracy of the journalist's claims assessed against confirmed facts

- Response options evaluated: respond with statement, decline to comment, request correction of factual errors

**Published negative coverage:**

- Factual errors: Evelyn Marchetti reviews, outside counsel advises on correction request vs. defamation analysis

- Opinion or criticism: generally not responded to publicly — response elevates the story

- Material falsehoods affecting consumer trust: Gerrod Parchmon determines whether a public correction is warranted, with Evelyn Marchetti's review

**The amplification discipline:** Responding to negative press amplifies it. The threshold for public response is high — reserved for material factual errors that affect consumer safety or trust, not criticism of the business model or competitive commentary.

### Playbook 4: Consumer Harm Event

**Discovery:**

- Consumer reports harm (physical injury, significant financial loss, emotional distress) attributable to a Wrenchli assessment

- Evelyn Marchetti briefed immediately

- Gerrod Parchmon contacts the consumer directly within 24 hours

- Outside counsel engaged if litigation risk is present

**Consumer interaction during a harm event:**

- Express genuine concern for the consumer's situation

- Do not admit liability — "I'm sorry this happened" is not an admission; "Wrenchli caused this" is

- Do not offer compensation without Evelyn Marchetti's review

- Document every interaction with the consumer

- Provide the consumer with a single point of contact (Gerrod Parchmon or Evelyn Marchetti)

**Assessment accuracy review:**

- The specific assessment that contributed to the harm is reviewed by Imani Whitfield (Accuracy)

- If the assessment was inaccurate: wrenchli-ACCURACY.md remediation process activates alongside crisis response

- If the assessment was accurate but the consumer misunderstood it: communications review to prevent recurrence

- The legal disclaimer ("Wrenchli is not a licensed mechanic...") is reviewed for whether it was displayed correctly at the relevant time

### Playbook 5: Financial Crisis

**Activation triggers:**

- Runway below 60 days at current burn rate

- Bank account access lost or suspended

- Stripe account suspended (revenue collection stopped)

- Payroll at immediate risk (less than 2 payroll cycles of cash)

- Single revenue source representing more than 50% of revenue is suddenly lost

**Immediate response (within 24 hours):**

- Darya Nazari produces an emergency cash flow model: current cash, current burn, days of runway, options to extend

- Gerrod Parchmon reviews — crisis declared if runway is below 60 days

- Discretionary spending frozen immediately (all expenditures above $500 require founder approval until crisis resolved)

- Darya Nazari identifies which obligations can be deferred (vendor payments, non-critical subscriptions) vs. which are fixed (payroll, critical infrastructure)

**Financial crisis response options (Gerrod Parchmon decides):**

- Emergency fundraising: SAFE note to existing relationship or new investor — Darya Nazari and Evelyn Marchetti prepare documents

- Revenue acceleration: commercial terms adjusted to generate immediate cash (annual prepayment discounts to shop partners, accelerated affiliate revenue)

- Expense reduction: specific cuts identified by Darya Nazari with impact analysis

- Bridge financing: short-term debt — Evelyn Marchetti analyzes terms before commitment

- Strategic options: acquisition inquiry, strategic investment, partnership with cash component

**Payroll protection is non-negotiable.** If Wrenchli has W-2 employees when a financial crisis occurs, payroll is the last expense cut, not the first. Failure to make payroll creates legal liability, destroys team trust, and is often irreversible. All other expenses are reduced before payroll is touched.

**Bank account suspension protocol:**

- Contact Bank of America fraud/business banking within 1 hour of discovery

- Darya Nazari leads the bank relationship

- Evelyn Marchetti reviews any legal demands or freeze orders

- Alternative payment methods identified for critical vendor payments during suspension

### Playbook 6: Executive Departure

**Planned departure (resignation with notice):**

- Gerrod Parchmon notified immediately upon resignation

- Transition plan developed within 48 hours: who assumes responsibilities, what knowledge transfer is required, what timeline is realistic

- Board notification per wrenchli-GOVERNANCE.md (currently self-notification as sole director)

- External announcement (if any) prepared by Rhett Holloway, reviewed by Evelyn Marchetti, approved by Gerrod Parchmon

- Access revocation on final day per wrenchli-PEOPLE.md same-day rule

- Separation agreement if applicable — Evelyn Marchetti drafts, Gerrod Parchmon approves

**Unplanned departure (termination, incapacitation, or unexpected resignation without notice):**

- Immediate access revocation — credentials revoked within 1 hour of departure confirmation

- Responsibility triage: what was this person doing that must continue today vs. what can wait

- Darya Nazari notified if the departure affects financial controls or signatory authority

- Evelyn Marchetti notified immediately — termination creates legal exposure; incapacitation may create succession questions

- External communication plan: nothing is said publicly until Gerrod Parchmon approves the statement

**Founder incapacitation:**

This is the highest-severity executive departure scenario. If Gerrod Parchmon is incapacitated and cannot make decisions:

- Evelyn Marchetti assumes emergency authority for legal matters requiring immediate action

- Darya Nazari assumes emergency authority for financial matters requiring immediate action (including authorizing payments to prevent default)

- Rhett Holloway coordinates team operations

- Outside counsel is engaged for any decision that would normally require board approval

- All agent authority remains suspended until a qualified decision-maker resumes founder authority

This succession posture is interim only. It is not a permanent governance structure. It exists to prevent catastrophic inaction during a brief incapacitation. Any decision made under this posture is documented and subject to founder ratification upon recovery.

---

## Agent Authority During Crisis

When a crisis is declared, the normal execution order is modified as follows:

**Suspended during active crisis:**

- All autonomous agent recommendations that would commit Wrenchli to any action

- All agent outputs on the crisis topic without explicit "ADVISORY ONLY — CRISIS MODE" label

- All automated communications (N8N workflows touching consumer or partner communications are paused)

**Permitted during active crisis:**

- Agents may produce analysis and recommendations clearly labeled as advisory

- Sloane Ashford (Security) may execute technical containment actions under Gerrod Parchmon's real-time direction

- Evelyn Marchetti may execute legal actions within her defined authority (litigation hold, outside counsel engagement up to authorized fee levels)

- Darya Nazari may freeze discretionary spending and produce financial models

**Crisis mode communication discipline:**

- All agent outputs during crisis are flagged: "CRISIS MODE — ADVISORY ONLY — FOUNDER REVIEW REQUIRED"

- No agent output on the crisis topic is forwarded to any external party without Gerrod Parchmon's review

- Agent outputs on unrelated topics continue normally — crisis mode applies only to the crisis subject matter

**Crisis resolution and restoration of normal authority:**

Crisis mode ends when Gerrod Parchmon explicitly declares the crisis resolved. The declaration is documented in the legal recordbook. Upon resolution:

- Agent authority restored to normal operating levels

- N8N automated communications resumed

- Post-crisis retrospective scheduled within 7 days

---

## Post-Crisis Protocol

Every declared crisis produces a post-crisis retrospective within 7 days of resolution. Rhett Holloway coordinates. The retrospective covers:

1. **Timeline:** What happened, when, in what sequence — from first signal to resolution

2. **Response assessment:** What went well in the response, what was slow, what was missing

3. **Root cause:** What allowed this crisis to occur — technical failure, process gap, human error, external event

4. **Prevention:** What changes would prevent this crisis or reduce its severity if it recurs

5. **Skill file updates:** Which wrenchli skill files need to be updated based on lessons learned — Rhett Holloway coordinates the updates, relevant skill file owners review

The retrospective is documented and filed in the legal recordbook. It is not a blame exercise. It is an infrastructure improvement exercise.

**Skill file update discipline post-crisis:** If a crisis revealed a gap in any skill file — a rule that was missing, a check that didn't catch something it should have — that skill file is updated within 14 days of the retrospective. Imani Whitfield (Accuracy) confirms the update addresses the root cause before the update is declared complete.

---

## Integration With Existing Skills

**Crisis overrides the normal execution order.** During an active crisis, the standard 13-step skill execution order is replaced by the four-track crisis response framework. The skills still provide guidance — Sloane Ashford operates per SECURITY.md, Evelyn Marchetti operates per LEGAL.md, Darya Nazari operates per FINANCE.md — but the coordinating framework is this skill, not DECISIONS.md.

**After crisis resolution,** the normal execution order resumes. The post-crisis retrospective feeds updates back into the relevant skill files, closing the loop.

**Skills that always run during crisis, regardless of crisis type:**

- wrenchli-LEGAL.md: litigation hold, outside counsel engagement, regulatory notification

- wrenchli-SECURITY.md: containment, forensic preservation, access controls

- wrenchli-GOVERNANCE.md: board notification documentation

- wrenchli-FINANCE.md: financial impact assessment, discretionary spending freeze if applicable

**Skills that run depending on crisis type:**

- wrenchli-REGULATORY.md: any crisis with regulatory notification obligations

- wrenchli-PEOPLE.md: executive departure, contractor/employee involvement in the crisis

- wrenchli-COMMERCIAL.md: partner notification, product impact on commercial commitments

- wrenchli-ACCURACY.md: consumer harm events where assessment accuracy is in question

- wrenchli-COMPLIANCE.md: any external communications produced during the crisis

---

## Escalation Path

Crisis decisions do not have a tiered escalation structure in the normal sense — the founder is the decision-maker for all material crisis decisions from the moment of declaration. The escalation path is:

**Rhett Holloway:** Coordinates across tracks, maintains the crisis timeline document, routes information to the right decision-makers, executes communications logistics

**Evelyn Marchetti:** Leads legal track within her authority; escalates to outside counsel; brings all material legal decisions to Gerrod Parchmon

**Darya Nazari:** Leads financial track within her authority; escalates financial decisions to Gerrod Parchmon

**Sloane Ashford:** Leads technical containment within her authority; escalates system-level decisions to Gerrod Parchmon

**Gerrod Parchmon:** All material decisions — what to say publicly, whether to notify regulators, settlement authority, financial crisis response, executive departure management, crisis declaration, and crisis resolution declaration

There is no crisis decision that does not reach the founder. Agents surface information and execute within their defined authority. The founder decides.

---

## Closing Principle

A crisis tests everything that was built before it arrived. Companies with clean legal records, organized financial documentation, practiced incident response, and clear decision authority navigate crises from a position of strength. Companies that built those things hastily in the middle of a crisis navigate from a position of chaos.

The principle that governs this skill: *The best crisis response is the one that was designed before the crisis occurred. Every litigation hold issued within two hours, every regulatory notification filed on time, every consumer contacted directly by the founder, every public statement reviewed by counsel before it goes out — these are not reactions. They are the execution of a plan that existed before the plan was needed. Build the response infrastructure now. Hope you never need it. Be ready if you do.*
