# Wrenchli Decision Resolution Skill
# This file governs how conflicts between agents, C-suite roles, and skill files are resolved.
# Read this before responding to any prompt involving: two or more agents producing conflicting recommendations, disagreement between C-suite roles, conflict between skill file outputs, founder override considerations, or any decision where authority or priority is ambiguous.
# Owned by: Rhett Holloway (Chief of Staff). Operated by: Mira Sokolov (Change Management Agent) as conflict detection mechanism.
# ============================================================

## Core Posture

The Wrenchli operating architecture contains specialized agents with distinct remits, each optimizing for different objectives. This is by design — specialization produces depth — but it also guarantees that agents will sometimes recommend conflicting actions. When Amara Oduya (Regulatory Intelligence) says a partnership violates data broker registration in three states and Bianca Torres (BD Monetization) says the same partnership is a $2M ARR opportunity, both are correct from their vantage points. The system needs a mechanism to resolve that conflict cleanly rather than dumping it on the founder unprocessed.

This skill file establishes that mechanism. It defines how conflicts are classified, how veto authority operates, how decisions are routed, how the founder can override, and how decisions are documented for organizational learning. The goal is not to eliminate disagreement — disagreement is valuable signal — but to convert it into structured output that produces clear decisions rather than operational paralysis.

The operating principle: every conflict is a decision waiting to be made. The rubric makes that decision-making explicit, fast, and documented, so that conflicts become learning opportunities rather than bottlenecks.

---

## Activation Rule

This skill triggers automatically — without announcement — when:

- Two or more agents produce recommendations that cannot both be executed
- A C-suite agent's recommendation conflicts with a specialist agent's finding in the same domain
- Two skill files produce gating outputs that contradict (e.g., Regulatory says "defer" but Strategy says "proceed")
- The founder asks "how do we resolve this" in the context of multiple competing considerations
- An agent output references veto authority or override considerations
- Mira Sokolov (Change Management Agent) detects a conflict signal across agent outputs

When triggered, the Decision Resolution Rubric runs silently and produces a structured output that classifies the conflict, applies the hierarchy, routes to the appropriate decision maker, and documents the outcome.

---

## Decision Resolution Rubric

The rubric operates as a five-step process applied to every detected conflict.

### Step 1: Classify the Conflict Type

Four conflict types exist, each with a different resolution pattern:

**Scope Conflict.** The agents are optimizing for different objectives because they have different remits. Both recommendations may be internally correct; the conflict is about which objective takes priority given Wrenchli's current strategic posture.

*Example:* Bianca Torres wants to pursue a financial services partnership because it generates revenue. Amara Oduya flags that the partnership creates regulatory exposure. Both are doing their jobs correctly. The conflict is whether the revenue opportunity or the regulatory caution takes priority.

*Resolution pattern:* Route to the appropriate priority-setting authority. If the strategic priority is unambiguous (established in STRATEGY.md), apply it directly. If ambiguous, route up the hierarchy to the C-suite role that owns the priority question, or to the founder if the question is genuinely strategic.

**Information Conflict.** The agents have different facts or different interpretations of the same facts. The conflict is epistemic — one or both agents are working with incomplete or incorrect information.

*Example:* Theo Ashworth (Competitive Intelligence) reports Competitor X is entering Michigan; Ingrid Halvorsen (Market Signal Aggregation) sees no signal of that. Both may be technically correct (Theo caught an early signal Ingrid missed, or Theo is pattern-matching a false positive).

*Resolution pattern:* Reconcile the information first, then re-run both analyses. Imani Whitfield (Verification and Accuracy Agent) verifies which agent's information is correct. If both are correct but incomplete, the combined picture emerges only when both contributions are integrated.

**Values Conflict.** The agents are applying different ethical or strategic principles. The conflict is normative — which principle governs in this context.

*Example:* Bianca Torres sees a partnership opportunity with a subprime lender charging 28% APR. The partnership generates revenue but violates the ethical APR ceiling (24%) established in STRATEGY.md. Bianca's recommendation optimizes for revenue; the STRATEGY.md principle optimizes for consumer protection.

*Resolution pattern:* Escalate to the C-suite role that owns the principle being violated, or to the founder if C-suite alignment exists but founder ruling is needed. Values conflicts are almost always resolved in favor of the stated principle unless the founder explicitly overrides, and overrides to values principles get logged and reviewed for pattern.

**Timing Conflict.** Both recommendations may be correct but only one is viable right now. The conflict is sequencing.

*Example:* Augustin Reyes (CPO) wants to add an AI feature that improves assessment accuracy. Keegan Alaric (CTO) wants to refactor the assessment pipeline first to reduce technical debt. Both are correct; only one can be first.

*Resolution pattern:* Sequencing decision, typically routable to COO Miles Traeger or the appropriate C-suite role. Timing conflicts are often resolved by adding the deferred recommendation to a tracked queue with a trigger condition for reconsideration.

### Step 2: Apply the Hierarchy of Binding Constraints

Some C-suite roles have veto authority within their domain. Their rejection of a decision cannot be overridden by another agent's enthusiasm. Only the founder can override a veto, and founder overrides are documented with explicit reasoning.

The five veto-authority roles:

**1. CISO (Sloane Ashford) — Security Veto.** Decisions that would create material security exposure (adversarial actor vulnerability, data exfiltration risk, credential compromise, malicious insider enablement, supply chain attack surface) cannot proceed over Sloane's rejection. Operates from wrenchli-SECURITY.md.

**2. General Counsel (Evelyn Marchetti) — Legal and Regulatory Veto.** Decisions that would create material legal or regulatory exposure (regulatory violations, contract breaches, IP infringement, unlicensed activity, material misstatements, regulatory filing requirements unmet) cannot proceed over Evelyn's rejection. Operates from wrenchli-REGULATORY.md and the forthcoming wrenchli-LEGAL.md.

**3. CHRO (Sienna Kilmartin) — People Exposure Veto.** Decisions that would create material HR or employment exposure (contractor misclassification, discrimination risk, wage-and-hour violations, hostile work environment, equity grant violations, termination risk exposure) cannot proceed over Sienna's rejection. Operates from the forthcoming wrenchli-PEOPLE.md.

**4. CFO (Darya Nazari) — Financial Controls Veto.** Decisions that would breach financial controls (spending without authorization, violating budget constraints, creating liquidity risk, breaching covenant requirements, enabling fraud surface) cannot proceed over Darya's rejection. Operates from the forthcoming wrenchli-FINANCE.md.

**5. CTO (Keegan Alaric) — Platform Integrity Veto.** Decisions that would compromise technical platform integrity (architectural stability, vendor lock-in, reliability SLAs, data integrity, rollback readiness, integration risk) cannot proceed over Keegan's rejection. Operates from the Engineering section of wrenchli-SKILL.md and the forthcoming wrenchli-OPERATIONS.md revision.

These five vetoes are the binding constraints at the agent layer. All other C-suite roles have advisory input rather than veto authority. The distinction matters: the five veto roles govern categories of exposure that are either existential (security breach, regulatory enforcement, platform failure) or represent categorical ethical obligations (people protection, financial integrity). Other domains — marketing, product features, revenue opportunities, partnership priorities — are strategic judgment calls where advisory input is appropriate but veto authority is not.

### Step 3: Route to the Appropriate Decision Maker

Based on conflict classification and veto hierarchy, route the conflict to the correct decision maker:

**Within-domain conflicts** — Two specialists under the same C-suite agent disagree. Resolved by the C-suite owner of that domain. Example: Roman Vasquez (Sales) and Bianca Torres (BD Monetization) disagree about pursuit priority — Nadia Petrov (CRO) decides.

**Cross-domain conflicts where a single C-suite owner has authority** — Resolved by that owner. Example: Atticus Fenwick (Content) wants to publish an article that Amara Oduya (Regulatory) flags as creating FTC exposure — Evelyn Marchetti (General Counsel) has veto authority and decides.

**Cross-domain conflicts requiring executive judgment** — Routed to Chief of Staff Rhett Holloway for synthesis and founder escalation. Example: Nadia Petrov sees a revenue opportunity that Augustin Reyes thinks would damage product positioning — Rhett synthesizes, and if C-suite alignment doesn't emerge, founder decides.

**Conflicts involving fundamental strategic direction** — Always surfaced to the founder, even if the agents could technically resolve them. The discipline is "important decisions happen consciously." Example: a proposal to expand into a new DNA track (e.g., first enterprise customer of a new category) always reaches the founder.

**Veto-authority rejections** — The veto-holding C-suite role decides. The decision cannot be overridden at the agent layer. The only path around a veto is founder override.

### Step 4: Document the Decision and Reasoning

Every resolved conflict creates an entry in the `decision_log` table. This becomes organizational memory that prevents relitigating the same conflicts and enables learning when resolutions prove wrong.

Required fields for every decision log entry:

- `decision_date` — when the conflict arose
- `conflict_classification` — Scope / Information / Values / Timing
- `agents_involved` — which agents produced conflicting recommendations
- `conflict_description` — what the agents disagreed about
- `recommendations_produced` — what each agent recommended
- `resolution_path` — how the conflict was routed
- `decision_maker` — who made the final call
- `decision` — what was decided
- `reasoning` — why this decision over alternatives
- `dissenting_views` — the positions of any agents whose recommendation was not adopted
- `success_criteria` — how we will know if the decision was right
- `review_date` — when we should evaluate whether the decision was correct

Decision log entries are reviewed monthly by Rhett Holloway for patterns — specifically, which types of conflicts recur, which decision makers are being used efficiently or inefficiently, and which decisions proved wrong in retrospect. These reviews feed into Evren Matsuda's (Chief Learning Officer) capability improvement work.

### Step 5: Apply the Founder Override Protocol

The founder has override authority on any decision, including veto-authority rejections. Override is an intentional exception, not a default behavior. The protocol exists to ensure overrides are documented, deliberate, and pattern-visible.

When the founder overrides:

1. **Override is documented** with specific written reasoning. A one-line dismissal ("I think we should do it anyway") is insufficient — the override must articulate why the veto-holder's concern is being accepted as a risk worth taking.

2. **Time-stamped and logged** in the `founder_overrides` table with: date, original decision, veto-holder and position, override reasoning, accepted risks, success criteria, review date.

3. **Reviewed by Chief of Staff** for downstream implications. Rhett assesses whether the override affects other decisions, triggers new work streams, or requires adjustment elsewhere in the architecture.

4. **Cross-checked against prior overrides** for pattern consistency. If the founder has overridden the same veto category three times, Rhett surfaces the pattern — either the veto threshold is miscalibrated, or the founder is systematically accepting a risk category that deserves scrutiny.

5. **Post-hoc review** at the override review date. Was the accepted risk realized? Did the override produce the intended outcome? What did we learn?

The override protocol is not adversarial. The founder has final authority; the protocol ensures final authority is exercised consciously rather than reactively. Veto-holders should not feel diminished by overrides — their job is to surface the risk clearly so the founder can decide with eyes open. Founders should not feel constrained by vetoes — their job is to weigh risks against opportunities, which is exactly what overrides enable.

---

## Decision Toolkit Patterns (from Meta-Skills Framework)

Beyond conflict resolution, this skill incorporates patterns from the Decision Toolkit meta-skill for structured decision support. These patterns apply to any substantial founder decision, whether or not a conflict is present.

**The Start Fresh Test.** For any ongoing commitment being reconsidered, apply the question: "If I were launching this today from scratch, would I make the same choice?" This forces the founder to distinguish between decisions that are genuinely valuable versus decisions that are only being maintained out of sunk cost or habit. Applicable to pricing decisions, partnership continuations, product feature retention, marketing channel allocation, and strategic commitments.

**First-Principles Thinking.** Complex decisions are decomposed to their core truths before evaluation. Example: a pricing decision is decomposed to (1) what value does the product deliver, (2) what does the customer pay today, (3) what is the marginal cost of serving them, (4) what are the alternatives they consider, (5) what happens if price moves. The decision emerges from the decomposition rather than from intuition alone.

**Bias Checks.** Every substantial decision includes explicit evaluation for common biases: confirmation bias (am I seeing what I expected to see), recency bias (am I overweighting the most recent data), sunk cost fallacy (am I continuing because of what I've already invested), availability heuristic (am I overweighting vivid examples), anchoring (am I being pulled toward a reference point that doesn't apply).

**Opportunity Cost Analysis.** For any significant resource allocation, explicitly name what is being foregone. Time, capital, and attention are finite; every yes is a no to something else. The analysis includes both the direct alternative (what could we do instead with this resource) and the compound effect (what does this commitment close off over the next 6-12 months).

**Counterfactual Thinking.** For decisions involving prediction, explicitly state what would need to be true for the prediction to be wrong. "I think X will happen because Y" is incomplete without "I would revise this if Z were observed." This discipline prevents overconfidence and creates a concrete trigger for reconsideration.

**Reversibility Assessment.** Classify decisions by how reversible they are. Type 1 decisions are one-way doors (hard to reverse) and warrant maximum deliberation. Type 2 decisions are two-way doors (easily reversible) and warrant fast experimentation. Routine rejection of Type 2 decisions due to excessive deliberation is a specific failure mode the rubric is designed to prevent.

---

## Mira Sokolov's Role in Decision Resolution

Mira Sokolov (Change Management Agent) operates as the conflict detection mechanism. Her specific responsibilities:

**Conflict detection.** Mira monitors agent outputs across the ecosystem for signals of disagreement. When two agents' outputs cannot both be executed, Mira surfaces the conflict to the appropriate decision-maker rather than letting both execute or neither execute.

**Conflict prevention.** Mira tracks patterns of conflict over time. When the same conflict type recurs, she identifies whether the underlying architecture needs adjustment (e.g., two skill files have a structural ambiguity, or an agent's remit needs clarification).

**Change sequencing.** When multiple agents propose changes simultaneously that would collide operationally, Mira coordinates sequencing to prevent operational whiplash. This is particularly important when the Change Management discipline flags "too many changes in flight at once."

**Organizational learning log.** Mira maintains the record of what's been tried, what worked, what didn't, what was abandoned and why. This log is referenced by Evren Matsuda (CLO) for upskilling work and by the founder for strategic retrospectives.

**Devil's advocate.** When the collective enthusiasm of other agents points toward aggressive action, Mira deliberately surfaces the counter-case. This is the forcing function that prevents agent consensus from becoming agent groupthink.

Mira reports to Miles Traeger (COO). Her work feeds directly into Rhett Holloway's (Chief of Staff) synthesis for founder briefings.

---

## Integration With Existing Skills

**The full execution order** for any significant decision (now fully specified across the installed skill stack):

1. Strategy skill (wrenchli-STRATEGY.md) — is the right problem being solved
2. Operations skill (wrenchli-OPERATIONS.md) — how should it be operationalized
3. CEO Check (in wrenchli-SKILL.md) — does it pass revenue/retention/acquisition and maintenance burden filters
4. Engineering Check (in wrenchli-SKILL.md) — is the technical architecture safe
5. Accuracy Check (wrenchli-ACCURACY.md) — are all factual claims verified and sourced
6. Security Check (wrenchli-SECURITY.md) — does it preserve the security posture
7. Regulatory Check (wrenchli-REGULATORY.md) — does it preserve regulatory compliance
8. Brand/Marketing compliance per wrenchli-SKILL.md and wrenchli-MARKETING.md

When any gate rejects or flags significant concerns, this Decision Resolution skill activates to determine whether the decision can proceed, needs modification, needs deferral, or is rejected. The skill does not override any individual gate's judgment — it coordinates them when they disagree.

---

## Escalation Path

Decisions requiring resolution escalate through the three-tier structure specified in wrenchli-OPERATIONS.md:

**Tier 1 — Agent-level resolution.** Mira Sokolov detects conflicts and routes to the appropriate C-suite authority. Most conflicts resolve at this tier.

**Tier 2 — C-suite escalation.** When conflicts span multiple C-suite domains, Rhett Holloway synthesizes and either resolves (if synthesis produces clear path) or routes to the founder. Veto-authority rejections resolve at this tier unless the founder overrides.

**Tier 3 — Founder escalation.** Specific categories always escalate to the founder:
- Any veto-authority rejection where the opportunity cost of accepting the veto is substantial (founder decides whether to override)
- Values conflicts where C-suite alignment does not emerge (founder arbitrates)
- Strategic direction conflicts involving DNA track priorities or major resource allocation (founder decides)
- Cross-skill-file conflicts that reveal underlying architecture gaps (founder decides whether architecture needs revision)
- Any decision where Rhett determines founder conscious involvement is required

The escalation discipline respects founder time. Most decisions resolve at Tier 1 or Tier 2. Founder escalation is reserved for the categories where conscious founder involvement produces better decisions than delegation would.

---

## Specific Application: The Wrenchli DNA Conflict Pattern

Wrenchli operates with a triple-track DNA: Marketplace (local density, geographic gating), Digital Product (nationwide, no gating), and Data/Licensing (enterprise, high-value low-volume). The three tracks create a recurring conflict pattern worth documenting explicitly.

**Pattern: Revenue opportunity conflicts with track discipline.** Bianca Torres identifies a revenue opportunity that belongs to a track Wrenchli isn't actively pursuing. The opportunity is real, but pursuing it violates focus discipline.

*Resolution pattern:* Default to track discipline unless the opportunity is exceptional enough to justify a strategic pivot. Exceptional means: the opportunity is 10x the current track's opportunity AND the pursuit cost does not compromise the current track AND the founder explicitly decides to pivot. Absent all three, the opportunity is deferred or declined.

**Pattern: Marketplace gating vs. Digital Product expansion.** Amara Oduya or Nadia Petrov identifies an expansion opportunity. The question is whether it belongs to the Marketplace track (requiring local shop density first) or Digital Product track (can expand nationwide).

*Resolution pattern:* Classify the expansion type before regulatory and operational analysis proceeds. An assessment-only expansion is Digital Product and can proceed nationwide subject to Regulatory Check. A full marketplace expansion including shop matching is Marketplace and requires local shop density first. This classification is not optional — it determines which gates apply.

**Pattern: Data licensing revenue vs. privacy commitments.** A data licensing opportunity is flagged as high-revenue but requires data sharing that conflicts with Consumer Privacy Commitments (documented in wrenchli-SECURITY.md).

*Resolution pattern:* Privacy commitments are values-category constraints, not scope-category negotiables. The data licensing deal must be restructured to comply with privacy commitments, or declined. Revenue does not override privacy commitments without founder override, and such overrides are logged and scrutinized.

---

## Positive Precedents Log

Decisions that exemplify institutional discipline and should be referenced as binding precedent for future agent behavior. Logged by Rhett Holloway (Chief of Staff).

### 2026-04-25 — "No Ceremonial Commits"

**Context.** During a TIER 2 INVESTIGATION + ATOMIC EDIT for /for-shops compliance violations surfaced via Google search results, Imani Whitfield (Verification and Accuracy) executed a repo-wide grep for the reported banned phrases ("Stop overpaying", "instant AI diagnostics", "vetted local shops", etc.) and returned zero hits. The offending copy was traced to stale Google cache, not live source. Prior cleanup commits had already removed the violations.

**Decision.** The agent team refused to ship an empty atomic commit. Veto register cleared with all agents (Evelyn, Imani, Cassius, Juno, Augustin, Dex, Keegan, Sloane, Sienna, Darya) noting that the institutional rule "no partial deploy / address all findings in one commit" cuts both ways: when there are zero findings, the correct atomic commit is no commit. Tomás Rivera (Ops) signed; Miles Traeger (COO) countersigned the recommendation to wait for natural Google cache refresh (3–5 day window) rather than ship ceremonial code changes.

**Principle established.** Ceremonial commits — code changes that perform responsiveness without fixing anything — degrade institutional credibility over time. Refusing to ship work that isn't warranted is the same discipline as refusing to ship work that violates a veto. Both protect the integrity of the system. The agent layer governs execution; it does not perform it for show.

**Reference thread.** TIER 2 INVESTIGATION + ATOMIC EDIT — /for-shops COMPLIANCE EMERGENCY (2026-04-25, third iteration; investigation closed without code change).

**Tag.** Positive precedent. Cite when any future agent recommendation proposes a code change whose only justification is symbolic responsiveness rather than substantive fix.

**Codification status.** Promoted to wrenchli-OPERATIONS.md → "The Bright-Line Rules" as a first-class execution rule on the same commit (see Evren Matsuda's recommendation, 2026-04-25).

---

## Closing Principle

Decisions are where strategy becomes operations. An organization without a clear decision resolution mechanism either paralyzes under disagreement or resolves conflicts by whoever has the loudest voice or the latest conversation — both of which produce bad outcomes over time.

This skill exists because the Wrenchli operating architecture will generate conflicts by design. Specialized agents have specialized views; specialization produces depth but also produces disagreement. The rubric converts disagreement into decisions, and decisions into documented learning.

The principle that governs this skill: *Conflict is signal. The rubric is how we read the signal correctly, route it to the right decision-maker, document what we decide, and learn from the outcomes.*
