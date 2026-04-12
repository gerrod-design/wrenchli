# Wrenchli — Open Action Items

> Related files: [SKILL.md](SKILL.md) · [ENGINEERING.md](ENGINEERING.md) · [MARKETING.md](MARKETING.md) · [memory.md](memory.md)

## Critical

- [ ] **Find EIN and activate Stripe live mode** — Stripe sandbox is active (price ID `price_1TKaxDGgIpvcscSeDceeWkFo`). Live mode blocked until EIN is registered. Status: *waiting on EIN*
- [x] **Fix symptom_reports and repair_recommendations cross-session RLS policies** — Fixed April 12 2026. Status: *complete*

## This Week

- [ ] **Call Curt's Service and McInerney Auto Center** — Pilot shop outreach for Michigan market. Status: *not started*
- [ ] **Send Tekmetric follow-up** — Email support@tekmetric.com and security@tekmetric.com re: API application submitted April 5 2026. Expected approval April 19-26. Status: *waiting on response*
- [ ] **Complete N8N Workflows 3 and 4** — Requires Supabase service role key to be configured in N8N. Status: *blocked on key*
- [ ] **Fix remaining 369 audit-copy errors** — Run `node scripts/audit-copy.mjs` and resolve all consumer-facing text violations. Status: *in progress*

## This Month

- [ ] **Build N8N Workflow 5 — Weekly Agent Digest** — Automated weekly summary of agent activity and accuracy metrics. Status: *not started*
- [ ] **Apply to CJ Affiliate for AutoZone and O'Reilly** — Affiliate program applications for parts revenue. Note: AutoZone removed from product; affiliate would be link-only if approved. Status: *not started*

## Completed — April 12 2026 (Tonight)

- [x] **Garage vehicle card redesign** — Replaced basic list-item cards with premium dashboard-style cards inspired by Rivian/BMW ConnectedDrive. Full-width hero, corner health ring, stats bar with IBM Plex Mono, recall badge, stacked CTAs, hover lift animation. Status: *complete*
- [x] **Unsplash integration for garage vehicle photos** — Created `unsplash-search` edge function and `useVehiclePhoto` hook. Replaces SVG silhouettes with real vehicle photography via Unsplash API. Dark gradient overlay for text readability. Fallback to clean dark card if no photo found. Query optimized to `{make} {model} car exterior` (year excluded for better results). Status: *complete*
- [x] **Demo mode for garage** — Added temporary demo vehicles (F-150, Camry, CR-V) to garage page so cards can be previewed without authentication. Status: *complete*
- [x] **UI/UX Audit Rule added to ENGINEERING.md** — 5-point checklist (mobile 375px, contrast 4.5:1, 44px touch targets, loading states, no text overflow) required before any consumer-facing visual change is marked complete. Status: *complete*
