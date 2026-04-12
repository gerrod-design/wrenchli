# Wrenchli — Engineering Architecture & Technical Rules

> Related files: [SKILL.md](SKILL.md) · [MARKETING.md](MARKETING.md) · [memory.md](memory.md)

## Evaluation Rules

### Context7 Rule
For every prompt involving code (Edge Functions, React, TypeScript,
Supabase, Stripe, API calls) — automatically prepend 'use context7'
to fetch current documentation. Apply silently. Skip for text/copy/
styling/content-only changes.

### CEO Evaluation Rule
Before building any feature exceeding 3 prompts, evaluate silently:

CEO CHECK:
- Revenue/retention/acquisition impact: [answer]
- Simplest viable version: [answer]
- Maintenance burden at scale: [answer]
- Technical debt risk: [answer]
- Build vs buy: [answer]
- Recommendation: [proceed / simplify / defer / reject]

Only proceed on 'proceed'. Simplify requires confirmation.

### Engineering Manager Evaluation Rule
Before any architectural change (Edge Functions, tables, integrations,
auth flows, RLS policies), evaluate silently:

ENGINEERING CHECK:
- Single point of failure: [answer]
- RLS/data exposure risk: [answer]
- External dependency risk: [answer]
- Rollback plan: [answer]
- Code duplication check: [answer]
- Critical path impact: [yes/no — assessment flow, Stripe, Tekmetric]
- Risk level: [low / medium / high]

High risk → require explicit confirmation. Critical path → always
require manual confirmation regardless of risk level.

## RLS Rules

**RLS Change Rule:** Any RLS modification on diagnostic_sessions,
possible_causes, vehicles, user_vehicles, or any assessment-flow table
must be followed by guest flow verification: Vehicle → Symptoms →
Assessment → Plan, no login required.

**RLS Regression Test Rule:** After any RLS change, verify:
1. Anonymous user completes full assessment without login
2. Anonymous user reads back their own session results
3. Authenticated users cannot read other users' data

If any fail, roll back and report before proceeding.

**UI/UX Audit Rule:** After any visual component change affecting
consumer-facing pages (homepage, assessment flow, garage, /for-shops),
run the following audit before marking the task complete:

1. Mobile rendering at 375px width — no layout breaks
2. Contrast ratios on all text against backgrounds — minimum 4.5:1
   for body text
3. All interactive elements have minimum 44px touch targets
4. Loading states exist on all form submissions and API calls
5. No text overflows its container on mobile

Flag violations before publishing. This audit is required before any
consumer-facing visual change is marked complete.

**Audit Separation Rule:** When running a security scan or copy audit,
report all findings first and wait for explicit confirmation before
making any fixes. Never fix and audit in the same step. The audit
result must be reviewed and approved before any remediation prompt
is submitted.

**Security Scan Rule:** After every deployment, run an updated security
scan. Errors → stop and fix. Warnings → flag and ask confirmation.

## Technical Stack — Never Change Without Instruction

- AI model: claude-sonnet-4-20250514 ONLY
- Database: Supabase PostgreSQL
- Edge Functions: Deno runtime
- Frontend: React + TypeScript + Vite
- Hosting: Vercel
- CORS: always use _shared/cors.ts (never import from supabase-js)
- JSON parsing: always strip markdown code fences before parsing

## Deliberate Decisions — Never Reverse

- AutoZone removed from all parts and chat. Do not add back.
- Amazon affiliate tag: **wrenchli-20** (with hyphen, never wrenchli20-20)
- All Edge Functions use _shared/cors.ts for CORS
- Claude API responses wrap JSON in ```json fences — always strip
- DIY: only for monitor/schedule + easy/moderate
- "Pro Only" renamed to "Shop Required" globally
- "Always free" → "Assessment always free" in trust bar
- /diagnose redirects to /. Never recreate as standalone.
- verify_jwt = false for create-pro-subscription and stripe-webhook

## Database Tables — All Have RLS Enabled

- **Core:** diagnostic_sessions, vehicles, possible_causes, outcome_reports
- **Shop:** shop_integrations, integration_sync_log, shop_engagement_metrics
- **Consumer:** user_vehicles, recall_alerts, pro_subscriptions
- **Tracking:** ad_click_events, wizard_funnel_events, funnel_metrics
- **Agents:** accuracy_metrics, accuracy_alerts, security_audit_log, security_alerts

## Edge Functions — Currently Deployed

diagnose-vehicle, get-recommendations, compute-accuracy-metrics,
check-recalls, create-pro-subscription, stripe-webhook,
shop-engagement-monitor, audit-assessment-accuracy, security-monitor,
compute-funnel-metrics, sms-export-csv, sms-tekmetric-prefill

## External Integrations

| Integration | Status | Notes |
|---|---|---|
| Stripe | Sandbox active | Price ID price_1TKaxDGgIpvcscSeDceeWkFo. Live pending EIN. |
| Tekmetric | Pending | API application April 5 2026. Expected April 19-26. |
| NHTSA vPIC | Active | VIN decode + recall lookup. No API key needed. |
| AutoZone | Removed | Same-day pickup search URL only. No affiliate tag. |
| O'Reilly | Active | Same-day pickup search URL only. No affiliate tag. |
| Amazon | Active | Affiliate tag wrenchli-20. All links must include tag. |

## Routes

| Path | Purpose |
|---|---|
| / | Homepage (DesignPreview component) |
| /diagnose | Redirects to / |
| /for-shops | Shop partner landing |
| /for-shops/onboarding | 4-step shop wizard |
| /shop/dashboard | Shop dashboard (auth required) |
| /garage | Vehicle garage (requires account) |
| /blog | Blog listing |
| /blog/[slug] | Individual articles |
| /about | About page |
| /about.html | Static crawler page |
| /privacy | Privacy policy |
| /warranty-guide | Warranty reference |
| /design-preview | Redirects to / |
| /admin/login | Admin auth |
| /shop-login | Shop auth |

## Pro Subscription

- Price: $2.99/month recurring
- Free tier: 2 saved vehicles
- Pro tier: unlimited vehicles, recall alerts, history, PDF export
- Coming soon (do not build): AI health insights, priority processing

## Stripe Keys

- Publishable: VITE_STRIPE_PUBLISHABLE_KEY (frontend)
- Secret: STRIPE_SECRET_KEY (Supabase secrets)
- Webhook: STRIPE_WEBHOOK_SECRET (Supabase secrets)
- Price ID: STRIPE_PRO_PRICE_ID (Supabase secrets)

## Data and Privacy Rules

NEVER store in logs or audit tables:
- Consumer PII (name, email, phone)
- VIN numbers
- Shop API credentials
- Any field identifying a specific consumer

Three-tier data model:
- Tier 1: Consumer PII — owned by consumer, never sold
- Tier 2: Partner operational data — owned by shop, never shared
- Tier 3: Anonymized outcome data — owned by Wrenchli, for AI training

## Shop Partner Program

- Current status: Free 90-day pilot, no fees, no commissions
- Do NOT show any pricing ($299/mo or otherwise)
- Do NOT say "all-in-one shop management software"
- Do NOT mention warranty advertising partnerships

SMS integrations (built, not live):
- Tekmetric (API application April 5 2026)
- AutoLeap (application pending)
- Mitchell 1 (partner agreement pending)
- CSV export available for all other systems

Verified Score components:
- Symptom-to-repair match rate (rolling 90 days, min 5 outcomes)
- Cost fairness percentile vs local market
- Consumer satisfaction (weighted 0 if fewer than 10 ratings)

## Content and SEO

- Blog articles: /blog/[slug]
- First published: check-engine-light-p0420
- Target keywords:
  - Tier 1 (symptom): "grinding noise when braking", "check engine light"
  - Tier 2 (OBD): P0420, P0300, P0171, P0442
  - Tier 3 (DIY): "how to replace brake pads", "car battery replacement"
- Never claim accuracy rates without real data
- Current accuracy: computing from outcome_reports — do not publish
  a percentage until accuracy_metrics confirms it

## Known Removed Features — Do Not Rebuild

- Kai (Finance AI advisor) — removed from chat routing
- Priya (Prevention Coach) — removed from chat routing
- Jenine Parchmon leadership card — removed from About page
- Finance Providers footer column — removed from footer
- $299/month shop pricing — removed from /for-shops
- "March 2026 pilot program" banner — removed from /for-shops
