# Wrenchli — Learned Preferences & Corrections

> Related files: [SKILL.md](SKILL.md) · [ENGINEERING.md](ENGINEERING.md) · [MARKETING.md](MARKETING.md)

Read this file at the start of every session. Update it whenever
a new correction or preference is established during a conversation.

---

## Terminology Corrections

| ❌ Never use | ✅ Always use | Context |
|---|---|---|
| "diagnosis", "diagnose" | "symptom assessment", "likely causes" | All consumer-facing text |
| "Pro Only", "Professional Only" | "Shop Required" | DIY difficulty labels |
| "Always free" | "Assessment always free" | Homepage trust bar / value prop |
| "vetted shops" | "trusted shops" | Shop partner references (shops are not yet vetted) |
| "we're building" | "we built" | Product is live — never imply it's not |
| "broken" (describing repair experience) | "harder than it needs to be" | Marketing copy |
| "our platform" | "Wrenchli" | Always use the brand name |
| AutoZone | (omit entirely) | Removed — do not add back under any circumstances |

## Affiliate & Integration Rules

- Amazon affiliate tag: **wrenchli-20** (with hyphen)
- Never use: wrenchli20-20 (without hyphen) — known revenue leak
- Every Amazon URL must include `&tag=wrenchli-20`

## DIY Visibility Rule

- ONLY show DIY options when urgency is **monitor** or **schedule**
  AND difficulty is **easy** or **moderate**
- NEVER show DIY for **immediate** or **soon** urgency
- NEVER show DIY for **Shop Required** difficulty

## Urgency Levels (exact words only)

immediate · soon · schedule · monitor

## DIY Difficulty Levels (exact words only)

easy · moderate · Shop Required

## Removed Features — Do Not Rebuild

- Kai (Finance AI advisor) — removed from chat routing
- Priya (Prevention Coach) — removed from chat routing
- Jenine Parchmon leadership card — removed from About page
- Finance Providers footer column — removed from footer
- $299/month shop pricing — removed from /for-shops
- "March 2026 pilot program" banner — removed from /for-shops

## Garage & Vehicle Card Preferences

- Garage cards use premium dashboard aesthetic (Rivian/BMW ConnectedDrive style)
- Vehicle photos sourced from Unsplash API via `unsplash-search` edge function
- Unsplash query format: `{make} {model} car exterior` — exclude year (pollutes results)
- UNSPLASH_ACCESS_KEY stored as Supabase secret
- Fallback when no photo: clean dark card with vehicle name only — no icons, no illustrations, no placeholders
- Dark gradient overlay: transparent at top → #0F1117 at bottom for text readability
- Typography: Plus Jakarta Sans for labels, IBM Plex Mono for stats/numbers
- Stats bar shows: mileage, age, last assessment — separated by thin vertical dividers
- Stale mileage (90+ days) renders in orange with pulse animation
- Health ring: compact 48px in top-right corner, tooltip on hover (no inline text)
- Recall badge: orange pill ("X Open Recalls") overlaid top-left of hero
- Hover: 4px upward shift + shadow increase
- Demo vehicles exist on garage page for preview without auth (temporary)

## Session-Learned Corrections

<!-- Add new corrections below as they are discovered in sessions -->
<!-- Format: - YYYY-MM-DD: Description of correction -->

- 2026-04-12: Initial memory file seeded from SKILL.md and past session corrections
- 2026-04-12: Unsplash search queries should exclude vehicle year — returns unrelated photos. Use `{make} {model} car exterior` instead.
- 2026-04-12: UI/UX Audit Rule added to ENGINEERING.md — 5-point mandatory checklist for all consumer-facing visual changes.
