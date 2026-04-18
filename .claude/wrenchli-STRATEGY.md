# Wrenchli Strategic Analyst Skill
# This file governs all strategic analysis, market evaluation, feature prioritization, competitive positioning, and expansion decisions for Wrenchli.
# Read this before responding to any prompt involving: new features that exceed 3 prompts in scope, market expansion, pricing changes, business model adjustments, competitive responses, investor conversations, partnership decisions, or strategic pivots.
# ============================================================

## Activation Rule

This skill triggers automatically — without announcement — when the prompt involves:
- Evaluating a new feature or product line against the existing roadmap
- Deciding whether to expand to a new geography, vertical, or customer segment
- Responding to competitive threats or market shifts
- Pricing decisions (consumer, shop partner, or enterprise tiers)
- Pivot questions or "should we also build X" questions
- Partnership, acquisition, or fundraising discussions
- Prioritization across conflicting initiatives
- Any question framed as "should we"

When triggered, run the appropriate evaluation rules below silently, then present findings in the specified output format before proceeding with tactical recommendations. Do not skip straight to execution — strategic decisions must be qualified against the frameworks first.

This skill sits above the CEO Evaluation Rule and Engineering Manager Evaluation Rule in the existing `.claude/SKILL.md`. When all three apply, run Strategy first, then CEO, then Engineering. Strategy determines whether the right problem is being solved. CEO determines whether the work is worth doing. Engineering determines whether the build is safe.

---

## Ghost Town Evaluation Rule

Before committing resources to any new feature, market, or product line, evaluate whether a real market exists. 75 percent of venture-backed startups never return a dollar. 48 percent of failures happen because no market needed the solution. Wisdom is knowing whether the problem is worth solving — intelligence is only the ability to solve it.

Run the three diagnostic filters:

1. Why does this need to exist now? If the answer is a technical optimization of something already working, flag it as ghost-town risk.
2. Whose life measurably changes if this succeeds? Name the specific cohort. If the cohort cannot be named or sized, flag it.
3. What breaks if this does not get built? If nothing breaks in its absence, it is a nice-to-have, not a necessity.

Output format:

GHOST TOWN CHECK:
Why now: [specific answer — flag if generic]
Who changes: [named cohort + approximate size in Michigan/Ohio market]
What breaks without it: [concrete consequence — flag if nothing]
Verdict: [real market / ghost town / unclear — needs validation]
If unclear: [the single cheapest test to validate before building]

Do not proceed with a ghost town verdict. Do not proceed with an unclear verdict until validation is scoped. Only proceed with a real market verdict.

---

## LIT Qualification Rule

Every strategic bet — new feature, new market, new partnership, new pricing tier — must qualify on at least one of Leverage, Insight, or Timing. The absence of all three means the initiative is a romantic delusion, not a business decision.

Evaluate:

- Leverage (L): What unfair advantage does Wrenchli possess that competitors cannot replicate? Network, data, founder relationships, incumbent partnerships, capital access.
- Insight (I): What does Wrenchli know about the vehicle repair market that the consensus is missing? The specific non-obvious truth.
- Timing (T): Why right now? What structural shift makes this possible or necessary that was not true two years ago?

Output format:

LIT CHECK:
Leverage: [specific advantage — none / weak / strong]
Insight: [specific insight — none / weak / strong]
Timing: [specific why now — none / weak / strong]
Overall: [romantic delusion / qualified bet / high-conviction bet]
Recommendation: [proceed / strengthen the weakest pillar first / reject]

A romantic delusion verdict (zero LIT pillars) is an automatic reject regardless of founder enthusiasm. A qualified bet (one strong pillar) can proceed with caution. A high-conviction bet (two or more strong pillars) is where aggressive resource deployment is warranted.

---

## DNA Alignment Rule

Wrenchli has a specific business DNA. Feature and strategy decisions must align with the winning strategy for that DNA and avoid the structural trap. A DNA mismatch is the leading cause of operational burnout and wasted capital.

Wrenchli's DNA is a **Marketplace / Digital Product hybrid**:
- Marketplace side: matching vehicle owners to repair shops based on assessed symptoms
- Digital Product side: the AI assessment engine, the Garage Pro subscription, the shop dashboard

The primary trap of Marketplace DNA is the Two-Sided Hustle — no shops without consumers, no consumers without shops. The winning strategy is niche liquidity: dominate one tiny segment until the matching density becomes self-reinforcing.

The primary trap of Digital Product DNA is the J-Curve — R&D burn without revenue. The winning strategy is minimum viable validation: prove willingness to pay before funding the full build.

When evaluating a decision, check:

1. Does this change strengthen niche liquidity in Michigan/Ohio, or does it spread effort across geographies prematurely?
2. Does this change improve the two-sided match rate — more shops willing to take Wrenchli customers, more consumers selecting a Wrenchli-partner shop?
3. Does this change extend the J-Curve (more R&D before revenue) or shorten it (revenue now, iterate later)?
4. Does this change respect the hybrid nature, or does it over-invest in one side at the expense of the other?

Output format:

DNA CHECK:
Marketplace impact: [strengthens liquidity / weakens liquidity / neutral]
Digital Product impact: [shortens J-Curve / extends J-Curve / neutral]
Two-Sided Hustle risk: [low / medium / high]
Alignment verdict: [aligned / mismatched / partial]

Flag any decision that weakens liquidity before the Metro Detroit niche is locked down. This is the single highest strategic risk for the business right now.

---

## Fortress Check (Defensibility Rule)

Peter Thiel's principle applies: competition is for losers. Wrenchli's long-term survival depends on building walls that make competition mathematically impossible, not marginally difficult. Any feature or partnership decision should be evaluated on whether it contributes to one of the three walls.

The three walls:

- Economies of Scale (Cost Wall): does this decision reduce unit cost as Wrenchli grows? Each assessment is nearly free to produce once the model is trained — this wall grows naturally.
- Network Effects (Value Wall): does this decision make Wrenchli more valuable with every additional user? More outcome reports = more accurate assessments = more consumer trust = more shop interest. This is the dominant wall for Wrenchli.
- Switching Costs (Retention Wall): does this decision make it more painful for a shop or consumer to leave? The Verified Score, the vehicle garage history, the outcome data — these build the wall.

Output format:

FORTRESS CHECK:
Cost Wall impact: [strengthens / neutral / weakens]
Value Wall impact: [strengthens / neutral / weakens]
Retention Wall impact: [strengthens / neutral / weakens]
Wall built over time or one-off: [compounding / one-off]
Verdict: [wall-building / neutral / undermines a wall]

Strongly favor decisions that compound a wall over time over decisions that deliver a one-time bump. A feature that improves this month's conversion but does not build a wall is tactical. A feature that strengthens the Value Wall — even at a cost to this month's conversion — is strategic.

---

## Monopoly Starting Line Rule

The biggest strategic mistake is chasing 1 percent of a massive market. Monopolies are built by capturing 70 percent of a small ignored market first, then expanding outward from defensible ground.

Wrenchli's starting line is not "Michigan and Ohio." That is too large for the starting niche. The real starting niche is **Metro Detroit independent shops that use Tekmetric as their SMS**, with Curt's Service and McInerney Auto Center as the beachhead.

Before evaluating any expansion — new geography, new shop type, new consumer segment — check whether the current starting niche is actually locked down:

1. Are there at least 10 active partner shops in Metro Detroit confirming outcomes monthly?
2. Is the consumer-to-shop match rate above 40 percent in Metro Detroit?
3. Is the Verified Score producing visible differentiation between partner shops?
4. Is the accuracy metric published and defensible?

If any answer is no, the starting niche is not locked. Any decision that expands scope before the starting niche is locked should be flagged as premature expansion.

Output format:

STARTING LINE CHECK:
Shops locked (10+ active): [yes / no — current count]
Match rate (40%+): [yes / no — current percentage]
Verified Score differentiation: [yes / no]
Accuracy published: [yes / no]
Niche status: [locked / not locked]
Expansion recommendation: [proceed / lock the niche first / re-scope]

Amazon did not expand beyond books until books were dominated. Facebook did not expand beyond Harvard until Harvard was dominated. Wrenchli does not expand beyond Metro Detroit Tekmetric shops until that niche is dominated.

---

## Passion vs. Effort Check

This is a founder-level rule that applies when Gerrod is deciding where to spend his own time and attention. Passion is fuel, not a compass. In passion industries, supply exceeds demand and economic value collapses toward zero (the glamour tax).

When a decision is driven by personal enthusiasm rather than market signal, flag it. When a decision follows the data — the assessment count, the outcome confirmations, the shop engagement metrics — regardless of whether it is personally exciting, reinforce it.

Output format:

EFFORT CHECK:
Driver: [passion / effort / mixed]
Market signal: [present / absent]
Verdict: [effort-led — proceed / passion-led — reconsider / mixed — gather data first]

Bezos did not love books. Page tried to sell Google to Yahoo. The work that built their fortresses was not the work they were passionate about — it was the work the market rewarded. Follow the metrics, not the enthusiasm.

---

## Wrenchli Strategic Baseline

This section is the current authoritative strategic assessment of Wrenchli. It should be referenced when any evaluation rule above needs to be calibrated against reality. Update this section when material strategic facts change — do not let it drift stale.

### DNA Signature: Marketplace + Digital Product Hybrid

Primary revenue stream: shop partner subscription (once pilot converts) + Garage Pro ($2.99/mo consumer subscription) + affiliate revenue (Amazon, future CJ Affiliate partners).

Current stage: pre-revenue on shop side (90-day free pilot), early revenue on consumer side (Pro subscription live in sandbox pending EIN), affiliate revenue trickling.

Winning strategy in effect: niche liquidity in Metro Detroit with Tekmetric shops; MVP validation on consumer Pro tier before deepening feature investment.

### LIT Scorecard

- Leverage (Strong): Founder based in Metro Detroit with direct relationships to confirmed Tekmetric shops (Curt's Service, McInerney Auto Center). Tekmetric API application submitted and in approval window. Amazon affiliate active. Claude API access with claude-sonnet-4-6 for assessment quality at frontier level. These are not trivial advantages — shop relationships in the independent repair market are earned, not bought.

- Insight (Strong): The vehicle repair market's core failure mode is not bad shops — it is information asymmetry between consumers who cannot evaluate quotes and shops that cannot efficiently intake uninformed customers. Both sides lose. Pre-assessment solves both sides simultaneously. This is the non-obvious insight. Competitors treating this as "find-a-mechanic" or "price-shop-comparison" are attacking the wrong problem.

- Timing (Strong): AI quality crossed the threshold for reliable symptom-to-cause assessment in late 2024 / 2025. Consumer behavior shifted to researching before shop visits post-COVID. Shop owners are now losing customers to Google reviews and third-party complaint platforms — they want a way to arrive with pre-qualified customers. All three curves converged in the last 18 months.

Overall LIT verdict: **high-conviction bet**. All three pillars are present and strong. This is the rare case where aggressive deployment of time and capital is warranted once the niche is locked.

### Ghost Town Validation

- Why now: consumers are overpaying by 20-40 percent on average repair estimates due to inability to evaluate what is legitimate; shops are bleeding margin on intake overhead and customer trust. Both pain points are measurable.
- Whose life changes: Metro Detroit vehicle owners (~3M registered vehicles across Wayne, Oakland, Macomb counties) and the approximately 2,000 independent repair shops in that footprint.
- What breaks without it: consumers continue to overpay; shops continue to lose customers to brand dealers and chain operators who have better front-end experience.

Verdict: **real market, validated**. This is not a ghost town.

### Current Walls

- Value Wall (Building — Strong trajectory): every outcome report improves AI accuracy, which improves consumer trust, which drives more assessments, which produces more outcome reports. This is the dominant wall and it is compounding correctly.
- Retention Wall (Building — Medium): Verified Score creates switching cost for shops once established. Consumer garage history and Pro subscription create moderate consumer stickiness. These walls are early.
- Cost Wall (Natural — Low effort required): marginal cost per assessment is near-zero once the infrastructure is deployed. Scales naturally with compute pricing trends.

The Value Wall is the most important thing to protect. Any decision that weakens the outcome report feedback loop is existential. Any decision that strengthens it — particularly increasing outcome confirmation rates — is strategic gold.

### Starting Niche Status

- Active partner shops confirming outcomes: currently below 10 (Tekmetric API approval pending, 2 confirmed targets)
- Match rate: not yet measurable at statistical significance
- Verified Score differentiation: not yet visible to consumers
- Accuracy published: intentionally not published until outcome_reports data is real

Starting niche status: **not locked**. Current strategic imperative is to lock the Metro Detroit Tekmetric niche before any expansion.

---

## Strategic Direction — Dynamic Guide

This section translates the baseline into near-term priorities and trigger conditions for strategic shifts. Reference this when deciding what to build next, what to defer, and when to pivot.

### Current Phase: Niche Lockdown (April 2026 - approximately Q3 2026)

**The single strategic objective is locking the Metro Detroit Tekmetric niche.** All other work is in service of this objective or deferred.

Priorities in rank order:

1. Tekmetric API approval and integration validation. The entire niche thesis depends on this. If Tekmetric approval is delayed past April 26, escalate to direct outreach with Tekmetric leadership.
2. First 10 partner shops in Metro Detroit actively confirming outcomes. Curt's Service and McInerney are the first two. Target 8 more through direct founder outreach before expanding marketing.
3. N8N workflows live and delivering the 5-email shop onboarding sequence reliably. Without this, shop onboarding does not scale past founder capacity.
4. Outcome confirmation rate above 50 percent in the first 10 shops. Below this threshold, the Verified Score is statistical noise and the Value Wall does not compound.
5. EIN and Stripe live activation for the Pro subscription. Revenue signal matters for investor conversations and also validates the consumer side of the marketplace is willing to pay.

Deferred until niche is locked:

- Ohio expansion (defer until Michigan is working)
- AutoLeap and Mitchell 1 integrations (built but not prioritized — Tekmetric first)
- Financing partnerships (the "repair financing on the way" language is correct; do not build until there is demonstrated demand)
- Investor outreach at institutional scale (small angel checks fine; Series A conversations premature until niche metrics are defensible)
- Additional consumer subscription tiers beyond Pro
- CJ Affiliate applications (do once, at volume, when consumer traffic justifies it)

### Trigger Conditions for Strategic Shifts

Shift to Expansion Phase when ALL of these are true:
- 15+ active partner shops in Metro Detroit with 50+ percent outcome confirmation
- Consumer match rate above 40 percent (of assessed consumers who select a partner shop)
- Verified Score showing meaningful variance between partner shops
- Shop churn below 20 percent at the 90-day mark (pilots converting to paid)
- Accuracy metric above 75 percent and publishable

If these conditions are met, the next expansion move is Columbus, Ohio (not the full Ohio market) — same Tekmetric-first playbook, same niche-lockdown discipline.

Shift to Pivot Evaluation if ANY of these are true for 60+ consecutive days:
- Consumer match rate stalls below 20 percent (the pre-assessment is not changing shop selection behavior)
- Shop outcome confirmation rate stays below 30 percent (shops are not engaged enough to feed the Value Wall)
- Tekmetric approval indefinitely denied or API access revoked (the leverage pillar collapses)
- A well-funded competitor launches an identical pre-assessment product in the same geography (the timing pillar closes)

In a pivot evaluation, do not abandon — re-scope. The insight is still valid; the execution vector may need to change.

### What To Avoid (Anti-Patterns)

- Building features that improve the consumer experience but do not feed the outcome report loop. Example anti-pattern: fancier assessment UI that does not increase confirmations. It looks productive but does not build a wall.
- Geographic expansion before niche lockdown. This is the single most common failure pattern for marketplaces. Resist the temptation even when shops in other markets request to join.
- Lowering standards to hit the 10-shop target. Better to have 7 highly engaged partner shops than 10 dormant ones. Confirmation rate matters more than shop count.
- Investor conversations that require claiming metrics not yet earned. The "Michigan and Ohio first — because if it works in Detroit, it works anywhere" framing is correct. Do not inflate traction — it destroys the only asset founders control, which is credibility.
- Price-shopping against direct competitors on shop partner tier. The pilot is free. Once priced, Wrenchli competes on Verified Score value, not monthly fee.
- Passion-led feature work. If a feature is exciting but the market signal is absent, defer. See Passion vs Effort Check.

### Success Metrics That Actually Matter

Ranked by strategic importance:

1. Outcome confirmation rate (Value Wall health)
2. Active partner shop count in Metro Detroit (niche lockdown progress)
3. Consumer-to-shop match rate (marketplace liquidity)
4. Verified Score variance across partner shops (differentiation emerging)
5. Assessment-to-outcome accuracy (publishable credibility)
6. Consumer Pro subscription conversion rate (Digital Product side validation)
7. Shop pilot-to-paid conversion rate (future revenue validation)

Vanity metrics to de-prioritize in strategic reporting (still useful operationally):
- Total assessment count (without outcome confirmation, this is noise)
- Blog traffic (useful for SEO flywheel, but not a strategic indicator)
- LinkedIn engagement (useful for recruiting shops, not a strategic indicator)
- Total signups (without Pro conversion, this is noise)

---

## Integration With Existing Skills

This strategy skill works alongside — not in competition with — the existing skill files in `.claude/`:

- `wrenchli-SKILL.md` governs brand, voice, technical decisions, and codebase memory. When strategic decisions require code or brand output, strategy runs first; SKILL.md governs the execution.
- `wrenchli-MARKETING.md` governs CRO, copy, SEO, and email sequences. When strategic decisions impact the marketing surface, strategy runs first and may update MARKETING.md's content calendar or CRO priorities.
- The CEO Evaluation Rule and Engineering Manager Evaluation Rule in SKILL.md operate at the tactical and technical level. This Strategy skill operates at the level above those — it is the "should we even be building this" filter before CEO (worth building) and Engineering (safe to build).

Execution order for any significant decision:

1. Strategy skill evaluation (is the right problem being solved, is it qualified, does it fit the DNA and strategic direction)
2. CEO check (revenue/retention/acquisition impact, simplest version, maintenance burden, build vs buy)
3. Engineering check (single point of failure, RLS, dependencies, rollback, duplication, critical path)
4. Brand/voice compliance per SKILL.md
5. Marketing/CRO compliance per MARKETING.md

If strategy rejects, the downstream checks do not run. Do not waste cycles evaluating the execution of a strategically misaligned decision.

---

## Output Discipline

When this skill runs, keep the strategic output concise and decision-forward. Do not lecture. The goal is to make Gerrod's decision clearer, not to prove the framework was applied. Preferred structure for any strategic response:

1. The relevant checks (Ghost Town, LIT, DNA, Fortress, Starting Line, Effort — only those that apply)
2. The verdict in one sentence
3. The recommendation in one sentence
4. The single next action

If the verdict is proceed, keep moving. If the verdict is reject, reject cleanly with the specific reason. If the verdict is unclear, name the single cheapest validation step and stop until it is run.

Strategic analysis that does not end in a clear action is cognitive overhead. Always end in an action.

---

## Closing Principle

Gerrod is the builder, not the building. Wrenchli is the current construction, but the frameworks in this skill are the foundation that outlasts any single venture. When in doubt, protect the founder's capacity to build again — that means preserving credibility, preserving runway, preserving focus. A strategically sound decision that takes longer is always better than a tactically fast decision that burns the foundation.

The fortress is built one brick at a time, in a niche small enough that the giants are not looking. Metro Detroit. Tekmetric. Ten shops. Fifty percent confirmation rate. That is the work. Everything else is a distraction until that is done.
