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

Wrenchli has a hybrid DNA: Marketplace plus Digital Product. These two DNAs have different structural traps, different winning strategies, and critically — **different geographic logic**. Feature and strategy decisions must be evaluated against the correct DNA, not the blended one. Conflating them is the leading cause of drift on this rule.

**Marketplace DNA (shop partner matching side):**
- What is sold: matching vehicle owners to repair shops based on assessed symptoms
- Primary trap: the Two-Sided Hustle — no shops without consumers, no consumers without shops
- Winning strategy: niche liquidity — dominate one tiny geographic segment until matching density becomes self-reinforcing
- Geographic logic: **local density matters**. Shop relationships require founder presence, local cost benchmarks, and matching liquidity. One metro at a time.

**Digital Product DNA (assessment platform + outcome data + AI answer engine presence):**
- What is sold: the assessment itself, the Garage Pro subscription, the AI-answer-engine presence that compounds into brand authority
- Primary trap: the J-Curve — R&D burn without revenue
- Winning strategy: minimum viable validation — prove willingness to pay and data quality before deepening feature investment
- Geographic logic: **volume matters, geography does not**. Assessment data, outcome reports, satisfaction signals, and GEO citation authority all scale on data breadth and depth. A consumer in Atlanta generating an outcome report strengthens the Value Wall identically to a consumer in Detroit.

When evaluating any decision, identify which DNA the decision primarily touches:

1. Does this decision primarily affect partner shop acquisition, shop dashboard, Verified Score mechanics, or local matching? → Marketplace DNA. Apply local-density logic. Expansion requires explicit gating.
2. Does this decision primarily affect assessment quality, consumer garage, outcome data collection, satisfaction signals, blog content, GEO positioning, or API consumption? → Digital Product DNA. Apply data-volume logic. Geography is not a gate.
3. Does this decision affect both? → Run both checks. Flag any asymmetry where one DNA's winning strategy undermines the other.

Output format:

DNA CHECK:
Primary DNA touched: [Marketplace / Digital Product / Both]
Marketplace impact: [strengthens liquidity / weakens liquidity / neutral / not applicable]
Digital Product impact: [strengthens data volume / weakens data volume / neutral / not applicable]
Geographic logic applied: [local density / national scale / both]
Two-Sided Hustle risk (Marketplace only): [low / medium / high / not applicable]
Alignment verdict: [aligned / mismatched / partial]

Flag any decision that restricts Digital Product reach to match Marketplace constraints. This is the single most common framework violation — applying marketplace logic to data generation or content production. Wrenchli's product is already live nationally; strategic discipline means optimizing for each DNA's native logic, not artificially gating the Digital Product side to mirror the Marketplace side.

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

The biggest strategic mistake is chasing 1 percent of a massive market. Monopolies are built by capturing 70 percent of a small ignored market first. But this rule applies to marketplaces, where liquidity requires concentration. It does not apply the same way to digital products, where data volume compounds across geographies.

Wrenchli runs two concurrent starting lines — one for each DNA:

**Marketplace Starting Line (strict):** Metro Detroit independent shops using Tekmetric, with Curt's Service and McInerney Auto Center as the beachhead. This is the Rogers, Arkansas of the marketplace play. Do not expand partner shop acquisition to new metros until this niche is locked per the Partner Shop Expansion thresholds below.

**Data Starting Line (nationwide from day one):** Every U.S. vehicle owner who finds Wrenchli through organic discovery, AI answer engines, or referral. The platform already serves national consumer traffic. The discipline here is not geographic — it is signal quality: are assessments accurate, are outcome reports being generated, is AI answer engine citation growing. Data breadth is a feature, not a bug. Broader consumer reach accelerates Value Wall compounding.

When evaluating a decision that involves geographic scope, determine which starting line governs:

- Partner shop outreach, shop onboarding, Verified Score publication for a specific metro, localized cost benchmarks → Marketplace Starting Line. Apply strict gating.
- Consumer acquisition channels, blog content, GEO and SEO work, outcome data collection, AI answer engine positioning, Pro subscription marketing → Data Starting Line. No gating required, but active signal monitoring applies.

**Marketplace Starting Line: status check before shop expansion.**

Before evaluating any new metro for partner shop acquisition, verify:

1. Are there at least 10 active partner shops in Metro Detroit confirming outcomes monthly?
2. Is the consumer-to-partner-shop match rate above 40 percent within Metro Detroit?
3. Is the Verified Score producing visible differentiation between partner shops?
4. Is the accuracy metric publishable and defensible?

If any answer is no, the Marketplace starting niche is not locked. Defer new-metro partner outreach.

**Data Starting Line: signal monitoring (not gating).**

For the Digital Product DNA, the equivalent question is not "are we ready to expand?" but "is the data healthy as it grows?" Monitor these signals continuously:

- Is assessment accuracy (symptom-to-confirmed-cause match rate) holding above 70 percent across all reporting regions?
- Is consumer-reported outcome volume growing month over month?
- Is the ratio of partner-confirmed to consumer-reported outcomes producing a coherent cross-check signal (partner-confirmed should validate consumer-reported, not contradict it)?
- Are any specific geographies showing anomalous data patterns that suggest gaming, spam, or systemic issues?

If any signal drifts, investigate before continuing to scale that surface. But do not throttle consumer reach based on speculative risk. The cost of missing Value Wall compounding is higher than the cost of occasional data noise.

Output format:

STARTING LINE CHECK:
DNA governed: [Marketplace / Data / Both]
Marketplace niche status (if applicable):
  Shops locked (10+ active): [yes / no — current count]
  Match rate (40%+): [yes / no — current percentage]
  Verified Score differentiation: [yes / no]
  Accuracy publishable: [yes / no]
  Status: [locked / not locked]
Data signals (if applicable):
  Assessment accuracy trend: [healthy / declining / insufficient data]
  Consumer outcome volume trend: [growing / flat / declining]
  Partner-vs-consumer outcome coherence: [coherent / contradictory / insufficient data]
  Geographic anomaly flags: [none / describe]
Expansion recommendation: [proceed on both tracks / proceed on Data only / hold Marketplace until niche locked / investigate Data signal]

Amazon did not expand past books for its Marketplace until books were dominated. But Amazon's digital infrastructure, data pipelines, and content library were never gated by geography. Wrenchli operates the same pattern: marketplace discipline on one track, data velocity on the other.

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

### DNA Signature: Hybrid — Marketplace plus Digital Product, Operating on Two Tracks

Wrenchli is a single company executing two concurrent business models with different structural logic:

**Marketplace track:** Partner shop matching in specific geographies. Currently active in Michigan and Ohio with active partner acquisition focused on Metro Detroit Tekmetric shops. Revenue model: future shop partner subscription (free during 90-day pilot). Geographic logic: strict local density required.

**Digital Product track:** Nationwide AI-powered vehicle symptom assessment platform plus outcome/satisfaction data flywheel plus AI answer engine presence. Available to any U.S. vehicle owner. Revenue model: Pro subscription ($2.99/mo, live in sandbox pending EIN) plus affiliate (Amazon active, CJ Affiliate planned) plus the compounding strategic asset of data depth. Geographic logic: data volume over geographic concentration.

Both tracks feed the same Value Wall — every outcome report improves AI accuracy which improves consumer trust which drives assessments which produces outcome reports. But the tracks have different operational requirements. Marketplace requires founder-led shop relationships, local cost benchmarks, and concentrated support. Digital Product requires automated content production, GEO-compliant publishing, consumer outcome capture at scale, and support triage that can handle national volume.

The strategic discipline is running both tracks without letting either starve the other. Roughly 85 percent of founder attention belongs on the Marketplace track (MI/OH shops). Roughly 15 percent of founder attention belongs on governance of the Digital Product track (reviewing automated outputs, setting policy, monitoring signals). The Digital Product track is designed to run largely autonomously — if it is consuming more than 15 percent of founder attention, something is under-automated.

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

### Starting Niche Status: Dual Track

**Marketplace Starting Niche (Metro Detroit Tekmetric shops):**
- Active partner shops confirming outcomes: currently below 10 (Tekmetric API approval pending, Curt's Service and McInerney Auto Center are confirmed targets)
- Match rate: not yet measurable at statistical significance
- Verified Score differentiation: not yet visible to consumers
- Accuracy publishable: intentionally not published until outcome_reports data is real
- **Status: not locked.** Strategic imperative remains: lock this niche before partner expansion to new metros.

**Data Starting Line (nationwide consumer surface):**
- Assessment platform: live and serving national traffic
- Consumer outcome data collection: partially in place (partner-shop-confirmed only; consumer-reported outcomes not yet captured — this is an urgent gap)
- AI answer engine presence: in progress (GEO rules now in wrenchli-MARKETING.md, llms.txt deployed)
- Blog content surface: 2 articles published, 24 remaining in calendar
- Pro subscription: built, sandbox active, live activation pending EIN
- **Status: operational but under-optimized.** Strategic imperative: close the consumer outcome reporting gap, accelerate blog content production, protect data quality as volume grows.

The two starting lines run concurrently, not sequentially. Work on the Data track does not wait for Marketplace lockdown. Work on the Marketplace track does not compete with Data track automation — the two should operate in separate lanes.

---

## Strategic Direction — Dynamic Guide

This section translates the baseline into near-term priorities and trigger conditions for strategic shifts. Reference this when deciding what to build next, what to defer, and when to pivot.

### Current Phase: Dual-Track Execution (April 2026 - approximately Q3 2026)

Two concurrent strategic objectives, with separate priority stacks and separate metrics. Do not let either objective starve the other.

**Marketplace Track: Niche Lockdown in Metro Detroit**

Priorities in rank order:

1. Tekmetric API approval and integration validation. If Tekmetric approval is delayed past April 26, escalate to direct outreach with Tekmetric leadership.
2. First 10 partner shops in Metro Detroit actively confirming outcomes. Curt's and McInerney first. Target 8 more through founder-led outreach.
3. N8N workflows live and delivering the 5-email shop onboarding sequence reliably.
4. Partner-confirmed outcome rate above 50 percent in the first 10 shops.
5. EIN and Stripe live activation for the Pro subscription.

**Digital Product Track: Data Flywheel Activation**

Priorities in rank order:

1. **Consumer outcome reporting mechanism.** Currently outcome_reports only captures partner-shop-confirmed outcomes. Add a consumer-reported outcome path — email or in-app prompt 14 days post-assessment asking "what was actually wrong, what did you pay, were you treated fairly, would you go back?" This is the highest-leverage gap on the Data track. Without it, the Value Wall compounds only at Marketplace speed instead of Data speed.
2. Geographic demand signal capture. Instrument assessment session data to report by metro area so that consumer demand density can be measured nationally. This becomes the signal for future Marketplace expansion — data discovers the next partner shop market rather than founder intuition guessing it.
3. Blog content production velocity. 24 articles remaining in the calendar. Full GEO compliance per wrenchli-MARKETING.md. Target pace: one article per week minimum.
4. AI answer engine citation monitoring. Track when and how Wrenchli is cited by Claude, ChatGPT, Perplexity, and Gemini. This is the Digital Product equivalent of SEO ranking tracking. Build it into the Monitoring Agent.
5. Pro subscription conversion instrumentation. Measure free-to-Pro conversion by acquisition channel and geography.

**Deferred (unchanged):**
- Partner shop expansion to new metros (until Marketplace niche locked)
- AutoLeap and Mitchell 1 integrations (Tekmetric first)
- Financing partnerships (no demand signal yet)
- Institutional investor outreach (until defensible numbers exist on both tracks)
- Paid consumer acquisition outside MI/OH (organic and GEO only on the Data track until unit economics are proven)

### Trigger Conditions for Strategic Shifts

**Partner Shop Expansion (Marketplace Track):**

Shift to expansion mode and begin Columbus, Ohio partner outreach when ALL of these are true:
- 15+ active partner shops in Metro Detroit with 50+ percent outcome confirmation rate
- Consumer-to-partner-shop match rate above 40 percent in Metro Detroit
- Verified Score showing meaningful variance between partner shops
- Shop churn below 20 percent at the 90-day pilot conclusion
- Accuracy metric above 75 percent and publishable

If all five conditions are met, the next expansion move is Columbus. Selection criteria for Columbus-after (or instead of): the metro showing the highest consumer demand signal in the Geographic Demand Heatmap (introduced in OPERATIONS.md). Data discovers the expansion path.

**Data Track Health Monitoring:**

This track does not have expansion gates. It has health signals. Investigate if any of these drift for 14+ consecutive days:

- Assessment accuracy falls below 70 percent in any region with 100+ assessments that month
- Consumer outcome reporting rate falls below 15 percent of completed assessments (once the reporting mechanism is live)
- Partner-confirmed vs consumer-reported outcomes diverge materially (contradictory signals suggest data quality problems)
- Monthly assessment volume declines for two consecutive months (suggests the acquisition channel or positioning is breaking)
- AI answer engine citation rate declines (suggests GEO work is under-delivering or the content library is stale)

A Data track signal drift is never a reason to slow Marketplace work. It is a reason to investigate the specific signal and adjust within the Data track only.

**Pivot Evaluation (both tracks):**

Trigger a pivot evaluation if ANY of these are true for 60+ consecutive days:
- Consumer-to-partner-shop match rate stalls below 20 percent in Metro Detroit (pre-assessment is not changing shop selection behavior)
- Shop outcome confirmation rate stays below 30 percent (shops are not engaged enough)
- Tekmetric approval indefinitely denied or API access revoked (the leverage pillar collapses)
- A well-funded competitor launches an identical pre-assessment product in Metro Detroit with material traction (the timing pillar closes)

In a pivot evaluation, the insight (information asymmetry between consumers and shops) is still valid. The execution vector may need to change. The Data track typically survives a Marketplace pivot because it is not dependent on a specific geography or shop relationship. This is a strategic hedge worth keeping in mind — a healthy Data track buys time for the Marketplace track to be reconfigured if required.

### What To Avoid (Anti-Patterns)

- Building features that improve the consumer experience but do not feed the outcome report loop. Anti-pattern: fancier assessment UI that does not increase outcome confirmations. Looks productive, does not build a wall.
- **Gating Digital Product reach to match Marketplace reach.** Anti-pattern: restricting blog content, GEO work, consumer acquisition, or outcome data collection to MI/OH only. The Digital Product already works nationwide. Artificially restricting it is voluntary handicap on the strongest moat.
- **Over-promising shop matching to consumers outside MI/OH.** Inverse anti-pattern to the one above. The consumer experience in non-partner metros is explicitly thinner (assessment works, shop matching does not). Any consumer-facing copy must be honest about this gap. "Wrenchli's shop matching is currently live in Michigan and Ohio, expanding one metro at a time" is the correct language for national consumer communications.
- Partner shop expansion before Marketplace niche lockdown. The single most common marketplace failure pattern. Resist even when shops in other metros request to join — the correct response is "we're not taking new metros yet, but add your shop to our waitlist."
- Lowering Marketplace thresholds to hit 10-shop target. Better to have 7 highly engaged partner shops than 10 dormant ones. Confirmation rate matters more than shop count.
- Investor conversations that require claiming metrics not yet earned on either track. "Michigan and Ohio first, with a national data flywheel already compounding" is defensible. "Nationwide platform" without the geographic nuance is inflation.
- Price-shopping against direct competitors on the shop partner tier. Pilot is free. Once priced, Wrenchli competes on Verified Score value, not monthly fee.
- Passion-led feature work on either track. If exciting but market signal absent, defer.

### Success Metrics That Actually Matter

Dual-track metrics. Rank within each track. Report on both tracks together when assessing overall strategic health.

**Marketplace Track (in rank order of strategic importance):**

1. Partner-confirmed outcome rate per active shop (Value Wall health, Marketplace contribution)
2. Active partner shop count in Metro Detroit (niche lockdown progress)
3. Consumer-to-partner-shop match rate in Metro Detroit (marketplace liquidity)
4. Verified Score variance across partner shops (differentiation emerging)
5. Shop pilot-to-paid conversion rate (future revenue validation)

**Digital Product Track (in rank order of strategic importance):**

1. Consumer-reported outcome volume (Value Wall health, Data contribution — the previously missing half of the feedback loop)
2. Assessment-to-outcome accuracy nationwide (publishable credibility)
3. AI answer engine citation rate (GEO authority)
4. Monthly assessment volume growth (acquisition health)
5. Consumer Pro subscription conversion rate (Digital Product revenue validation)
6. Partner-confirmed vs consumer-reported outcome coherence ratio (data quality cross-check)

**Vanity metrics to de-prioritize in strategic reporting:**
- Total assessment count without outcome data (noise)
- Total signups without Pro conversion or outcome contribution (noise)
- Blog traffic without citation or assessment conversion (noise)
- LinkedIn engagement (useful for shop recruiting, not a strategic indicator)

When a single decision has metrics impact across tracks, surface both. A decision that strengthens Marketplace track metric #2 but weakens Data track metric #1 is a bad trade. A decision that strengthens both is rare and should be prioritized.

---

## Integration With Existing Skills

This strategy skill works alongside — not in competition with — the existing skill files in `.claude/`:

- `wrenchli-SKILL.md` governs brand, voice, technical decisions, and codebase memory. When strategic decisions require code or brand output, strategy runs first; SKILL.md governs the execution.
- `wrenchli-MARKETING.md` governs CRO, copy, SEO, and email sequences. When strategic decisions impact the marketing surface, strategy runs first and may update wrenchli-MARKETING.md's content calendar or CRO priorities.
- The CEO Evaluation Rule and Engineering Manager Evaluation Rule in SKILL.md operate at the tactical and technical level. This Strategy skill operates at the level above those — it is the "should we even be building this" filter before CEO (worth building) and Engineering (safe to build).

Execution order for any significant decision:

1. Strategy skill evaluation (is the right problem being solved, is it qualified, does it fit the DNA and strategic direction)
2. CEO check (revenue/retention/acquisition impact, simplest version, maintenance burden, build vs buy)
3. Engineering check (single point of failure, RLS, dependencies, rollback, duplication, critical path)
4. Brand/voice compliance per SKILL.md
5. Marketing/CRO compliance per wrenchli-MARKETING.md

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
