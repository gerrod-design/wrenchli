# Wrenchli Finance Module — Build Spec (Draft v1)

**Status:** Draft for founder review. Do not implement until approved.
**Owner:** Darya Nazari (CFO) signs off on financial logic; Gerrod Parchmon approves scope and phasing.
**Authority:** Per `wrenchli-FINANCE.md` and `wrenchli-DECISIONS.md`. CFO veto applies.

---

## 1. Why this spec exists

The original ask was to build, in one pass: (1) Finance Dashboard, (2) Expenditure forms, (3) Cap Table Manager, (4) Finance Reports, (5) cleanup flagging.

Building all five at once would conflict with the governance file in three concrete ways:

1. **Cap table duplication.** `wrenchli-FINANCE.md` § Cap Table Platform names **Carta** as the authoritative record and explicitly forbids spreadsheets, documents, or memory as substitutes. A custom in-app cap table becomes a fourth unauthoritative copy.
2. **Source-of-truth gap.** P&L, balance sheet, cash flow, runway, and 13-week forecast all require data the app does not own (bank, accountant ledger, Carta, Stripe payouts reconciled to deposits). Without ingesting those, generated "reports" would be presentation, not finance.
3. **Approval controls cannot be enforced today.** The Expenditure Approval Matrix requires dual auth (Gerrod + Darya), one-way-door escalation, and wire-transfer dual control above $5K. The app currently has a single `admin` role, no step-up auth, no segregation of duties, no immutable audit trail.

This spec defines what to build, what NOT to build in-app, role/auth changes required, and a phased plan.

---

## 2. Source-of-truth decisions (do not skip)

| Data type | Authoritative system | App role |
|---|---|---|
| Cap table, SAFEs, options, 409A | **Carta** (or equivalent) | Read-only mirror at most. No CRUD. |
| Bank balances, transactions | **Bank of America** | Read-only via manual upload or Plaid (future). |
| GL, AP, AR, invoices, journal entries | **Accounting system** (QuickBooks / Xero — TBD) | None until a system is selected. |
| Stripe revenue, MRR, churn, payouts | **Stripe** | Already mirrored read-only in app. Extend dashboards. |
| Amazon affiliate revenue (`wrenchli-20`) | **Amazon Associates portal** | Read-only manual entry monthly OR ad_click_events as proxy. |
| Expense receipts, business purpose, approvals | **App (proposed)** | New. App becomes record-of-truth for the approval workflow only — not for the GL. |
| Insurance policies, renewal calendar | **App (proposed)** | New. Lightweight registry. |
| Investor pipeline (Declan's CRM data) | **App (proposed)** | New. Already partially implied by FUNDRAISING.md. |
| Outside counsel matters & spend authorizations | **App (proposed)** | New. Closes Round 6 gap noted in FINANCE.md. |

**Rule:** the app does NOT replace Carta or the accounting system. It captures workflow + approvals and exposes read-only metrics already in Stripe/Supabase.

---

## 3. Roles & auth changes required BEFORE any finance build

Current state: one `app_role` enum value (`admin`) gates all admin pages.

Required additions (separate migration, founder approval gate):

```sql
ALTER TYPE app_role ADD VALUE 'cfo';
ALTER TYPE app_role ADD VALUE 'founder';
ALTER TYPE app_role ADD VALUE 'finance_viewer';
```

Plus:

- Step-up reauth (password re-prompt) for any expenditure approval, any one-way-door action, and any export of financial PII. Recorded in a new `financial_audit_log` table — append-only, no UPDATE/DELETE policy, even for admins.
- Dual-authorization helper: actions over configured thresholds require two distinct user IDs to record approval before execution. Same user cannot occupy both slots.
- Lockdown of new routes by role (not just `isAdmin`).

If these auth changes are not approved, **Phase 2 onward cannot ship.** Phase 1 below uses existing `admin` only.

---

## 4. Phased build plan

### Phase 1 — Read-only Finance Dashboard (admin role; lowest risk)

Single new page: `/admin/finance`.

Sections, all sourced from data the app already has:

- **Pro Subscriptions:** active count, trialing count, past_due, canceled-this-period, MRR (count × $2.99), gross adds vs. churn (last 30 / 90 days). Source: `pro_subscriptions`.
- **Assessment volume:** complete + outcome_reported sessions / day / week / month. Source: `diagnostic_sessions` (already used by `assessment-count` edge function).
- **Affiliate proxy:** Amazon click count by week, click-to-Amazon CTR if measurable. Source: `ad_click_events` filtered to `destination = 'amazon'`. Clearly labeled "engagement proxy, not revenue."
- **API cost flag:** placeholder card that reads from a new `manual_finance_inputs` table where Darya can enter monthly Anthropic spend. Used to compute "API spend as % of gross revenue" per FINANCE.md § API Cost Discipline.
- **Runway tile:** placeholder reading from `manual_finance_inputs` (cash on hand + monthly net burn entered by CFO). Page computes runway months and color-codes per FINANCE.md thresholds (>6 healthy, 3–6 caution, <3 crisis red).

No writes to the app from outside parties. CFO updates monthly inputs via a small form. Page restricted to `admin` role. Acceptance: visible to Gerrod + Darya, accurate against Stripe dashboard within 1%.

**Deliverable:** 1 page, 1 small admin-only edit form, 1 new table. ~half a build session.

### Phase 2 — Expenditure approval workflow (BLOCKED on Section 3 auth changes)

Single approval queue, NOT a GL replacement.

- Submit an expenditure: amount, category, vendor, description, business purpose, receipt upload (storage bucket: `finance-receipts`, private), one-way-door flag.
- Routing: matrix logic from FINANCE.md determines required approvers based on amount + one-way-door flag.
- Approvers see pending queue, must step-up reauth to approve/reject, leave a note. Each action writes to `financial_audit_log`.
- Outcome: app does NOT pay anything. It produces an approval record that gets attached to the actual payment in BoA / Stripe / vendor portal. Reduces "verbal approval" risk per FINANCE.md Discipline 2.

Out of scope: actually moving money, vendor master file management, AP automation.

### Phase 3 — Read-only mirrors (Carta + Accounting), if/when feasible

Decision-gated. Do nothing here until:
1. Phase 1 + 2 are stable.
2. Carta API access is available (paid tier) AND founder approves the integration cost.
3. Accounting system is selected and has a sync-friendly API.

If approved, this becomes a read-only viewer page showing cap table snapshot and trial balance. Still no in-app CRUD on equity or GL.

### Phase 4 — Reports

Defer until Phase 3. "Generate Finance Reports" without integrated source data produces fiction. The Phase 1 dashboard already covers what is currently knowable.

### Phase 5 — Cleanup flagging (this spec, item 5)

See Section 6 below — addressed standalone, not bundled with build work.

---

## 5. What we are explicitly NOT building

- In-app cap table CRUD (use Carta).
- In-app GL, journal entries, trial balance (use accounting system).
- In-app SAFE / convertible note creation (legal documents — Evelyn Marchetti + Carta).
- In-app payroll (use payroll provider).
- In-app wire transfer initiation (the bank).
- Any "AI generates your P&L" feature. Hard no per ACCURACY.md.

These are explicit non-goals so the next session does not silently expand scope.

---

## 6. Item 5 — Truncated FINANCE.md flag (resolved this session separately)

`/.claude/wrenchli-FINANCE.md` ends mid-sentence at `*Know what every dollar costs. Know what eve` (line 576). The Closing Principle was cut off during install.

**Action items for governance review (not this session, not auto-fixed):**
1. Founder restores the original closing sentence (only the founder/CFO knows the intended wording).
2. Add a CI check that verifies all `.claude/wrenchli-*.md` files end with a newline AND a complete sentence (no trailing word fragment, no unbalanced markdown).
3. Consider a one-time integrity sweep of all 16 skill files for similar truncation. Sweep is a separate task and must not be combined with any UI build per Core memory rule "Fixes & audits never in the same step."

A tracking file has been created at `docs/governance-flags.md` listing this and any future flags.

---

## 7. Approval gates before any code ships

Per `wrenchli-DECISIONS.md` and the 16-step execution order in FINANCE.md § Integration With Existing Skills:

| Gate | Owner | Required for |
|---|---|---|
| Strategy fit | Tobias Wren / founder | Whole spec |
| Engineering check (RLS, audit log immutability, role enum migration) | Keegan Alaric | Phases 1, 2 |
| Accuracy check (no fabricated financial outputs) | Imani Whitfield | Phases 1, 2, 4 |
| Security check (PII handling, step-up auth, audit log) | Sloane Ashford | Phase 2 onward |
| Regulatory check (SOX-lite controls, recordkeeping) | Amara Oduya | Phase 2 onward |
| Legal check (Carta integration ToS if Phase 3) | Evelyn Marchetti | Phase 3 |
| Financial check (matrix correctness, threshold values) | Darya Nazari | Phases 1, 2 |
| Founder approval | Gerrod Parchmon | All phases |

---

## 8. Next action requested from founder

Approve, in writing, ONE of:

- (a) Proceed with **Phase 1 only**. Read-only dashboard + manual inputs. No new roles needed.
- (b) Proceed with **Phase 1 + auth changes from Section 3**, queueing Phase 2 for a separate approved session.
- (c) Revise this spec — what should change?
- (d) Park the entire finance module; address the truncated FINANCE.md flag only.
