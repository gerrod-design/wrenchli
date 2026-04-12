# Wrenchli — Open Action Items

> Related files: [SKILL.md](SKILL.md) · [ENGINEERING.md](ENGINEERING.md) · [MARKETING.md](MARKETING.md) · [memory.md](memory.md)

## Critical

- [ ] **Find EIN and activate Stripe live mode** — Stripe sandbox is active (price ID `price_1TKaxDGgIpvcscSeDceeWkFo`). Live mode blocked until EIN is registered. Status: *waiting on EIN*
- [x] **Fix symptom_reports and repair_recommendations cross-session RLS policies** — Fixed April 12 2026. Dropped overly permissive ALL policies. Anon restricted to INSERT-only; authenticated scoped to own sessions. Guest reads handled by edge functions (service role). Status: *complete*

## This Week

- [ ] **Call Curt's Service and McInerney Auto Center** — Pilot shop outreach for Michigan market. Status: *not started*
- [ ] **Send Tekmetric follow-up** — Email support@tekmetric.com and security@tekmetric.com re: API application submitted April 5 2026. Expected approval April 19-26. Status: *waiting on response*
- [ ] **Complete N8N Workflows 3 and 4** — Requires Supabase service role key to be configured in N8N. Status: *blocked on key*
- [ ] **Fix remaining 369 audit-copy errors** — Run `node scripts/audit-copy.mjs` and resolve all consumer-facing text violations. Status: *in progress*

## This Month

- [ ] **Build N8N Workflow 5 — Weekly Agent Digest** — Automated weekly summary of agent activity and accuracy metrics. Status: *not started*
- [ ] **Apply to CJ Affiliate for AutoZone and O'Reilly** — Affiliate program applications for parts revenue. Note: AutoZone removed from product; affiliate would be link-only if approved. Status: *not started*
