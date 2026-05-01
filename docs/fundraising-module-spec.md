# Fundraising Module — Specification

**Status:** Draft spec (not built)
**Owner:** Darya Nazari (CFO, controls) · Gerrod Parchmon (Founder, sole decision-maker on terms)
**Source of truth for cap table:** Carta (external) — do NOT duplicate as system of record
**Source skill:** `.claude/wrenchli-FUNDRAISING.md`
**Related spec:** `docs/finance-module-spec.md`

---

## Why this is a spec, not a build

The FUNDRAISING skill file gates raise activation behind a 10-point readiness checklist (90 days recurring revenue, 6 months runway, clean Carta records, etc.). Building dashboards, pipelines, and SAFE tooling before those gates are satisfied would create the appearance of an active raise — which violates the "Raise from strength. Lock the narrative before outreach" closing principle. Spec first, build only what passes governance.

---

## 1) Fundraising Dashboard

**Purpose:** Single read-only view of raise readiness against the 10 gates.

**Surface:** `/admin/fundraising` (admin-only, gated by `has_role(uid, 'admin')`).

**Data sources:**
- Readiness gates: manual checklist in `fundraising_readiness` table (10 boolean gates + last-verified timestamp + verifier user_id).
- Runway: pulled from Finance module (blocked — Finance Phase 2 not built).
- Recurring revenue: Stripe subscriptions (already wired via `check-subscription`).
- Cap table snapshot: **link out to Carta**, never mirrored.

**Phase gate:** Cannot ship until Finance Phase 2 (expenditure tracking) lands, since runway is computed from it.

---

## 2) Investor Pipeline

**Purpose:** Track investor conversations through stages without becoming a CRM.

**Stages (fixed):** Sourced → Intro Sent → First Meeting → Diligence → Term Sheet → Closed/Passed.

**Tables:**
- `investor_contacts` (id, name, firm, email, source, created_at, founder_notes)
- `investor_pipeline_events` (id, contact_id, stage, occurred_at, note, recorded_by)

**RLS:** admin-only read/write. No public surface. PII (investor emails) encrypted at rest per privacy policy.

**Out of scope:** automated outreach, email sync, calendar integration. Founder logs manually.

---

## 3) Pitch Deck Builder

**Decision: do NOT build.**

Rationale: pitch decks are narrative artifacts owned by the founder. A templated builder produces generic decks — exactly what the skill file warns against ("Lock the narrative before outreach"). Use Google Slides / Pitch / Figma. The platform should host the *data room link*, not the deck creation tool.

**Replacement deliverable:** add a `pitch_deck_url` field on the readiness dashboard pointing to the canonical deck location.

---

## 4) Data Room Access Flow

**Purpose:** Time-boxed, auditable investor access to the 7-section data room.

**Flow:**
1. Founder creates access grant: investor email + expiration (default 14 days, hard cap 30).
2. System generates signed magic-link token (similar to existing `referral_packages` pattern).
3. Investor accesses `/data-room/:token` — read-only, watermarked with their email.
4. **Auto-revoke 5 days after investor passes** (founder marks "Passed" → cron flips `revoked_at`).
5. Every view/download logged to `data_room_access_log` (token, ip, user_agent, section, occurred_at).

**Sections (7, per skill file):** Corporate, Financials, Product, Team, Market, Legal, References.

**Storage:** private Supabase bucket `data-room` (does not exist yet — would need creation). Files signed-URL'd per request, never publicly listed.

**NDA gate:** if investor flagged `requires_nda=true` (non-standard VCs), block access until NDA accepted (checkbox + timestamp + IP captured).

**Phase gate:** requires Evelyn Marchetti (legal) sign-off on NDA template before launch.

---

## 5) SAFE Term Worksheet

**Purpose:** Model 3 conversion scenarios for any inbound SAFE before founder accepts.

**Inputs:**
- Investment amount ($)
- Valuation cap ($)
- Discount rate (%)
- MFN flag (bool)
- Pro-rata flag (bool)
- Side letter terms (free text → flagged for Evelyn review)

**Outputs (3 scenarios required):**
1. **Priced round at cap** — % ownership at conversion
2. **Priced round below cap** — discount applies, % ownership
3. **Acquisition before priced round** — payout per SAFE terms

**Constraints:**
- YC standard form only — non-standard SAFEs auto-flag for legal review.
- MFN with side letter → hard block, cannot mark "Accepted" without Evelyn approval logged.
- Output is a worksheet, NOT a binding document. All execution still happens in Carta.

**Surface:** `/admin/fundraising/safe-worksheet` (admin-only).

---

## Build order (when gates pass)

1. `fundraising_readiness` table + dashboard read view (depends on Finance Phase 2)
2. `investor_contacts` + pipeline (standalone, can ship independently)
3. SAFE worksheet (standalone, pure calculation, no DB writes initially)
4. Data room access flow (depends on legal NDA template + storage bucket setup)
5. ~~Pitch deck builder~~ — rejected, use external tools

---

## Governance flags raised

- **Carta is source of truth** — any feature that stores cap table data locally is a violation. Spec enforces link-out only.
- **Sole decision-maker on terms** — no automation may "accept" or "decline" investor terms. All status changes require founder action logged with user_id.
- **Data room auto-revoke** — must be enforced server-side (cron + RLS), not client-side.
- **PII encryption** — investor emails fall under existing AES-256-GCM bidirectional encryption rule.

---

**Closing principle (from skill file):** *Raise from strength. Lock the narrative before outreach. Verify every number.*
