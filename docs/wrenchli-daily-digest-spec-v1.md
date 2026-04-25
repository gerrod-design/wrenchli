# Wrenchli Daily Digest — Phase 1 Specification

**Date:** 2026-04-25
**Status:** Phase 1 spec — pending founder review
**Co-leads:** Augustin Reyes (CPO) · Rhett Holloway (Chief of Staff)
**Tier:** 3 (recurring outbound surface from agent layer to founder)

---

## 1. Purpose

A single daily morning email from the C-suite agent layer to the founder
(Gerrod Parchmon), institutionalizing proactive intelligence delivery
without scaling founder reading time. This is the Layer 2 expansion of
the agent platform — moving from governance-on-demand to scheduled
intelligence work.

**Design principle:** high-signal, low-noise. The digest never pads.
Bright-Line Rule #11 ("no ceremonial commits") applies to daily contributions.

---

## 2. Format (Rhett Holloway)

**Channel:** email, plaintext-first with HTML mirror.
**Recipient:** `gerrod@wrenchli.net` (pending founder confirmation of address).
**Send time:** 06:30 ET, daily, including weekends. Skip if zero contributors.

**Subject line:**
> `Wrenchli Daily — YYYY-MM-DD — N of 12 reporting`

**Body structure (in order):**

1. **What matters most today** — Rhett-authored, max 3 lines synthesizing across that day's contributors. Omitted if zero contributors.
2. **Per-contributor sections** — only contributors with material that day. Each section:
   - Named contributor + role (e.g., "Augustin Reyes — CPO")
   - 1–3 bullets max
   - Each bullet must reference a specific datum, event, or recommendation
3. **Decisions awaiting founder** — items requiring sign-off, with link to the underlying record. Section omitted when empty.
4. **Signature** — date, count of contributing agents, link to that day's row in `daily_digest_history`.

**Hard limits:**
- Total body ≤ 600 words.
- Per-contributor section ≤ 90 words.
- No images, no charts. Plain text + minimal HTML wrapping.

---

## 3. Silence Rule (Rhett Holloway + Evren Matsuda)

> An agent contributes a section only when they have **material** to deliver:
> a datum that crosses a threshold, a signal that diverges from baseline,
> a recommendation, or an escalation. Agents with nothing material are
> silent that day. The digest does not pad. Empty sections do not appear.

**"Material" is defined per agent in §6** as either:
- A **threshold trigger** (e.g., error rate > X%, new Pro signups > 0, security anomaly count ≥ 1), or
- A **divergence trigger** (e.g., today's metric differs from 7-day rolling mean by > 1σ), or
- An **event trigger** (e.g., deploy occurred, regulatory filing observed, contract signed).

If none fire, the agent is silent. There is no "everything is normal"
filler line. Silence is the explicit signal that nothing is material.

**Anti-spam guardrails (Evren):**
- An agent cannot contribute a section more than 6 days in a 7-day rolling window without at least one of those days carrying a divergence or event trigger (not just a threshold trigger). This prevents threshold drift into noise.
- If a section repeats the same bullet content as the previous day, it is suppressed and Evren logs an "agent self-repetition" event for review.

**Failure trigger:** if Augustin and Rhett cannot align on a per-agent
threshold definition, that agent is held in silence (not shipped) until
alignment is reached. The agent does not enter the digest with a
hand-wave threshold.

**Aligned. Both Rhett and Augustin sign the silence rule as written.**

---

## 4. Technical Implementation (Augustin Reyes)

**Orchestration:** N8N workflow `daily-digest-orchestrator`, scheduled via N8N cron, 06:30 ET.

**Architecture:**
1. **06:25 ET — Cron fires.** N8N main workflow starts.
2. **06:25–06:28 ET — Per-agent contribution nodes** (parallel). Each agent contribution is a separate node calling a dedicated Supabase Edge Function (e.g., `digest-contrib-augustin`, `digest-contrib-keegan`). Each function:
   - Queries its data source(s) with a 20s timeout.
   - Evaluates trigger criteria from §6.
   - Returns `{ contributor, role, bullets: string[], decisions_awaiting?: string[] }` or `{ contributor, silent: true, reason }`.
   - On internal error, returns `{ contributor, silent: true, reason: "data_source_unavailable" }` (per Lorenzo, §7) — never throws into the orchestrator.
3. **06:28 ET — Rhett synthesis node** runs after all contribution nodes resolve. Receives the array of non-silent contributions, generates the "What matters most today" synthesis via the existing Lovable AI Gateway (model: `google/gemini-2.5-flash`, capped at 3 lines).
4. **06:29 ET — Assembly node** composes plaintext + HTML, applies the §2 hard limits, fails the digest if any limit is exceeded.
5. **06:29 ET — Persistence.** Insert row into `public.daily_digest_history`.
6. **06:30 ET — Send** via Resend (`RESEND_API_KEY` already configured) to `gerrod@wrenchli.net`.

**Why per-agent isolation:** failure in one contribution node never blocks
the digest. The digest ships with the contributors that succeeded; the
failed contributor is silently absent and Lorenzo logs the failure.

**Idempotency:** orchestrator checks `daily_digest_history` for a row
with today's date before sending. Manual re-runs require an explicit
override flag.

---

## 5. Schema (Keegan Alaric)

**New table:** `public.daily_digest_history`

| column | type | notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `digest_date` | date | unique; one row per day |
| `contributing_agents` | jsonb | `[{contributor, role, bullets, decisions_awaiting}]` |
| `silent_agents` | jsonb | `[{contributor, reason}]` for forensic review |
| `digest_html` | text | as sent |
| `digest_plaintext` | text | as sent |
| `recipient` | text | email address sent to |
| `sent_at` | timestamptz | nullable until send confirmed |
| `send_status` | text | `pending` / `sent` / `failed` |
| `send_error` | text | nullable |
| `created_at` | timestamptz | default `now()` |

**RLS:**
- Admins (`has_role(auth.uid(), 'admin')`) — full read.
- Service role — full write.
- No anonymous access. No authenticated non-admin access.

**Indexes:** unique on `digest_date`; btree on `sent_at`, `send_status`.

**Keegan's veto position: CLEARED.** Schema is additive, RLS is restrictive,
no foreign keys to user data, no PII stored. No platform integrity concern.

---

## 6. Per-Agent Contribution Definitions

Format per agent: **trigger criteria** → **bullet content** → **data source** → **readiness**.

### V1 contributors (ready at launch — 6 of 12)

**Rhett Holloway (Chief of Staff)** — synthesis
- *Trigger:* at least one other agent contributed.
- *Bullets:* 3-line synthesis across that day's contributions.
- *Data source:* the day's contribution array + last 7 days of `daily_digest_history`.
- *Status:* **V1 ready.**

**Augustin Reyes (CPO)** — funnel metrics
- *Triggers:* (a) yesterday's assessment count differs from 7-day mean by > 1σ; (b) Pro signups > 0; (c) any wizard step completion rate dropped > 5pp vs 7-day mean.
- *Bullets:* assessment count vs baseline, top 3 symptoms by volume, geographic spread (state-level only — see Sloane §8), Pro signup count.
- *Data source:* `diagnostic_sessions`, `funnel_metrics`, `pro_subscriptions`.
- *Status:* **V1 ready.**

**Keegan Alaric (CTO)** — platform health
- *Triggers:* (a) any edge function error rate > 1% over 24h; (b) p95 model latency > 8s; (c) any deploy in last 24h; (d) webhook queue depth > 0 at run time.
- *Bullets:* error-rate outliers (function name + rate), latency outliers, deploy summary, queue depth.
- *Data source:* Supabase analytics logs, deploy log, `webhook_queue` (or equivalent).
- *Status:* **V1 ready.**

**Sloane Ashford (CISO)** — security signal
- *Triggers:* (a) any `security_alerts` row created in last 24h and unresolved; (b) failed-auth count > baseline; (c) any new shop credentials issued.
- *Bullets:* anomaly count + types (no identifiers), failed-auth delta, new shop credential count (no shop names).
- *Data source:* `security_alerts`, auth logs, shop credentials log.
- *Status:* **V1 ready.**

**Cassius Vance (CMO)** — content + (later) engagement
- *Triggers:* (a) blog article published in last 24h; (b) blog article scheduled for today; (c) [V2] organic search query volume divergence > 1σ.
- *Bullets:* publish events, top-of-day search query (V2 only).
- *Data source:* blog publish log (V1), Search Console API (V2), social platform APIs (V2).
- *Status:* **V1 partial** — content pipeline only. Engagement metrics pending API plumbing.

**Helena Ostrowski (CCO)** — customer experience
- *Triggers:* (a) new Pro subscriber in last 24h; (b) Pro cancellation in last 24h; (c) [V2] new support ticket opened.
- *Bullets:* Pro subscriber net change, churn signal events.
- *Data source:* `pro_subscriptions` (V1), support ticket log (V2 — manual until automated).
- *Status:* **V1 partial** — Pro data ready. Support tickets V2.

### V2 expansion contributors (3 added — total 9 of 12)

**Tobias Wren (CSO)** — strategic / competitive intel
- *Triggers:* (a) Theo Ashworth's competitor watchlist flags an event; (b) Ingrid Halvorsen's market signal aggregation crosses threshold; (c) significant external news in auto-repair / consumer-tech / regulatory space.
- *Bullets:* competitor event summary, market signal, news with single-link citation.
- *Data source:* external news monitoring (V2 — needs N8N workflow), competitor watchlist (V2).
- *Status:* **V2** — needs market intel plumbing built.

**Nadia Petrov (CRO)** — shop pipeline
- *Triggers:* (a) Roman Vasquez logs an outreach event; (b) conversation scheduled; (c) pilot signed; (d) standby queue movement.
- *Bullets:* outreach count, scheduled conversations, signed pilots, queue delta.
- *Data source:* CRM-lite manual log until automated.
- *Status:* **V2** — needs pipeline tracking plumbing built.

**Darya Nazari (CFO)** — financial signal
- *Triggers:* (a) Stripe subscription created; (b) refund issued; (c) declined charge; (d) runway position diverges > 5% from last forecast; (e) any Tier-2-threshold expenditure.
- *Bullets:* Stripe activity summary, runway delta, expenditure flag.
- *Data source:* Stripe API, internal financial model.
- *Status:* **V2** — needs Stripe data plumbing built and reconciled with internal model.

### V3 expansion contributors (3 added — total 12 of 12)

**Evelyn Marchetti (General Counsel)** — regulatory signal
- *Triggers:* Amara Oduya's regulatory monitoring flags MI/OH insurance or automotive aftermarket regulation, or FTC endorsement guide update.
- *Status:* **V3** — needs Amara's monitoring formalized.

**Sienna Kilmartin (CHRO)** — people ops signal
- *Triggers:* contractor crosses 90-day or $10K threshold; classification review pending.
- *Status:* **V3** — silent until plumbing exists.

**Miles Traeger (COO)** — operational SLAs
- *Triggers:* capacity utilization across agent team; SLA breach; operational rhythm health divergence.
- *Status:* **V3** — silent until plumbing exists.

---

## 7. Monitoring (Lorenzo Bianchi)

- **Send failure:** if Resend returns non-2xx or the orchestrator does not write a `sent` row to `daily_digest_history` by 06:45 ET, Lorenzo's monitoring sends a fallback alert to the founder via SMS (using the existing `send-alert-email` + SMS escalation path) with subject `DIGEST FAILURE — YYYY-MM-DD`.
- **Per-contributor failure:** if a contribution Edge Function throws or times out, Lorenzo logs the failure to `silent_agents` with `reason: "data_source_unavailable"`. The digest still ships with the surviving contributors. No founder alert for single-contributor failure unless three consecutive days fail for the same contributor.
- **Anti-silence-rot:** if the digest sends with zero contributors three days in a row, Lorenzo escalates to Rhett — the silence rule may be miscalibrated.

---

## 8. Privacy / Security (Sloane Ashford)

**Allowed in digest body:** aggregate counts, percentages, function names, deploy SHAs, state-level geography, model latency, error rates, anonymized event types.

**Forbidden in digest body:**
- Consumer names, emails, phone numbers
- VINs, license plates
- Shop names, shop credentials, shop user emails
- Specific zip codes (state-level only)
- Specific dollar amounts in support tickets
- Any free-text user input (symptom descriptions, support messages)

Each contribution Edge Function passes its bullet output through a
`scrubPII()` helper before returning. The helper strips email patterns,
phone patterns, VIN patterns, and a configurable shop-name list.

**Sloane's veto position: CLEARED**, conditional on `scrubPII()` being
shipped in Phase 2 with unit tests covering each forbidden pattern.

---

## 9. Legal (Evelyn Marchetti)

The digest is an internal operating record. Aggregate, anonymized
metrics carry no heightened discovery risk beyond what the underlying
data already carries. Contents do not constitute legal advice, do not
make external commitments, and do not include privileged communications.

The `daily_digest_history` table is retained indefinitely by default.
Evelyn recommends a 24-month rolling retention with admin-override for
specific dates (Phase 2 implementation detail).

**Evelyn's veto position: CLEARED**, conditional on the §8 PII scrub
shipping and the 24-month retention being implemented in Phase 2.

---

## 10. Veto Register (on the spec, not the build)

| Reviewer | Role | Position | Conditions |
|---|---|---|---|
| Sloane Ashford | CISO | **Cleared** | `scrubPII()` ships in Phase 2 with unit tests |
| Evelyn Marchetti | GC | **Cleared** | PII scrub + 24-month retention in Phase 2 |
| Sienna Kilmartin | CHRO | **Cleared** | No people-data surface until V3; silent until then |
| Darya Nazari | CFO | **Cleared** | V2 financial surface gated on Stripe-model reconciliation |
| Keegan Alaric | CTO | **Cleared** | Schema additive, RLS restrictive, per-agent isolation prevents single-point failure |

No vetoes. No conditional-with-blocker. The spec is approvable as written.

---

## 11. Launch Composition

- **V1 (target ship + 14 days from Phase 2 kickoff):** Rhett, Augustin, Keegan, Sloane, Cassius (partial), Helena (partial) — **6 of 12 reporting.**
- **V2 (target +30 days after V1):** add Tobias, Nadia, Darya — **9 of 12 reporting.**
- **V3 (target +60 days after V2):** add Evelyn, Sienna, Miles — **12 of 12 reporting.**

---

## 12. Sign-offs (Phase 1 spec)

- **Co-leads:** Augustin Reyes (CPO), Rhett Holloway (Chief of Staff) — aligned on silence rule and architecture.
- **Spec checklist signed:** Tomás Rivera (Operations).
- **Countersigned:** Miles Traeger (COO).
- **Awaiting:** founder review and approval of this spec before Phase 2 build prompt is initiated.

---

*End of Phase 1 spec. No code, schema, workflow, or secret has been
created as part of this prompt. Phase 2 build will be a separate Tier 3
prompt with full veto register, named QA (Dex Calloway), named
monitoring (Lorenzo Bianchi), and a 14-day ship plan.*
