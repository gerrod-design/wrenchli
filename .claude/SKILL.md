# Wrenchli — Brand Voice, Language & Visual Design

> Related files: [wrenchli-ENGINEERING.md](wrenchli-ENGINEERING.md) · [wrenchli-MARKETING.md](wrenchli-MARKETING.md) · [memory.md](memory.md)

## Identity

Wrenchli is a consumer vehicle symptom assessment platform.
We help vehicle owners understand what is likely wrong with their
car before visiting a repair shop.

- Company: Wrenchli, Inc. (Delaware Corporation)
- Founder: Gerrod Parchmon
- Market: Michigan and Ohio (pilot)
- Site: wrenchli.net
- Partner email: partners@wrenchli.net
- Support phone: 313.312.5455

## Language Rules — ALWAYS ENFORCE

ALWAYS say:

- "symptom assessment" (never "diagnosis")
- "likely causes" (never "diagnosis" or "diagnoses")
- "assessment results" (never "diagnostic results")
- "repair likelihood report" (never "diagnostic report")
- "Wrenchli assesses symptoms" (never "Wrenchli diagnoses")
- "monitor / schedule / soon / immediate" for urgency levels
- "easy / moderate / Shop Required" for DIY difficulty

NEVER say:

- "diagnosis" or "diagnose" in any consumer-facing context
- "AI-powered diagnosis" or "machine learning diagnosis"
- "our platform" (say "Wrenchli" instead)
- "diagnose your car"
- "AutoZone" (removed — do not add back)
- "we're building" (say "we built" — product is live)
- "coming soon to Michigan and Ohio" (product is live now)
- "broken" when describing the repair experience
  (say "harder than it needs to be" instead)
- "vetted shops" (say "trusted shops" — not yet vetted)
- "embedded financing" (say "repair financing on the way")
- "modern tools for shops" (implies SMS — Wrenchli is not SMS)
- "paper tickets and phone calls" (condescending to shop owners)
- "dealerships do worse work" (never compare quality across types)

## Voice and Tone

- Primary tone: knowledgeable neighbor, not tech startup
- Secondary tone: confident, warm, direct
- Write like explaining something important to a friend who owns
  a car but is not a mechanic. Never condescending. Never salesperson.
- For consumers: empathetic, protective, straightforward
- For shop owners: respectful, peer-to-peer, efficient
- For investors/press: data-driven, ambitious, grounded
- Sentences: short declarative preferred
- Paragraphs: 2-3 sentences max in marketing copy
- Headlines: punchy, specific, benefit-first

On-brand examples:
- "Know what's wrong before you pay for it."
- "Vehicle Repair. Finally Fixed."
- "Every customer arrives already knowing what's wrong."

Off-brand examples (never write these):
- "Leverage AI-powered diagnostics to optimize your repair journey"
- "Our platform utilizes machine learning to diagnose vehicle issues"

## Visual Design

| Token | Value |
|---|---|
| Primary orange | #E07B39 |
| Dark background (nav/hero) | #0F1117 |
| Warm light background | #F8F8F6 |
| White | #FFFFFF |
| Dark text | #1A1A1A |
| Muted text | #555555 |
| Border | #CCCCCC |

- Primary font: Plus Jakarta Sans (body and UI)
- Monospace font: IBM Plex Mono (data values, codes)
- Never use: Inter, Arial, Helvetica as primary fonts

Button styles:
- Primary CTA: orange fill (#E07B39), white text, rounded
- Secondary CTA: outline, no fill, border only
- Destructive: red, used sparingly

Layout:
- Nav: dark (#0F1117), white text, orange accents
- Footer: dark background, orange section titles
- Cards: white background, 0.5px border, rounded corners

## Layout Enforcement Rules

- Never use symmetrical three-column grids for marketing sections
- Every section must have one visually dominant element
- Never center-align body text on desktop viewports
- Avoid equal-weight card grids — use asymmetric hierarchy
- All interactive elements: minimum 44px touch target on mobile

## Product Architecture

Assessment flow steps (use these exact names):
1. Vehicle Entry (year, make, model, mileage)
2. Symptom Entry (what the consumer describes)
3. Assessment Generating (AI call in progress)
4. Results Shown (possible causes with probability scores)
5. Recommendation Shown (urgency, cost range, shop questions)

Urgency levels (exact wording):
- **immediate** — safety risk, do not drive
- **soon** — address within 1-2 weeks
- **schedule** — plan a shop visit
- **monitor** — watch for changes

DIY difficulty levels (exact wording):
- **easy** — 30-60 minutes
- **moderate** — 1-3 hours
- **Shop Required** — do not show DIY option

DIY visibility rule: ONLY show when urgency is "monitor" or
"schedule" AND difficulty is "easy" or "moderate". NEVER show
for "immediate" or "soon" urgency.

## Legal and Compliance

Disclaimer required on all assessment results:
> "Wrenchli is not a licensed mechanic. This is an informational
> symptom assessment only. For professional diagnosis and repair,
> please consult a qualified automotive technician."

FTC affiliate disclosure required on pages with parts links:
> "Some links on this page are affiliate links. If you purchase
> through them, Wrenchli may earn a small commission at no
> additional cost to you."

- Privacy policy: wrenchli.net/privacy
- Terms of service: live on site
- Footer disclosure: "Wrenchli participates in affiliate programs
  including Amazon Associates."

## Consumer-Facing Text Assertion Checklist

Before publishing ANY consumer-facing text change, validate every
assertion below. If any fails, flag it and DO NOT proceed.

1. **No "diagnosis" or "diagnose"** — scan for "diagnosis",
   "diagnose", "diagnoses", "diagnosed", "diagnosing". Fail if found.

2. **No sentence over 25 words** in marketing copy (headlines, CTAs,
   hero text, landing pages, blog excerpts, UI labels). Code comments
   and internal docs are exempt.

3. **Every CTA uses an action verb** — must begin with: Get, Start,
   Run, Apply, Save, See, Try, Find, Download, etc. Fail if passive.

4. **Urgency levels exact words only** — immediate, soon, schedule,
   monitor. No substitutes.

5. **DIY difficulty exact words only** — easy, moderate, Shop Required.
   No substitutes.

Enforcement: Apply silently. Present failures as a numbered list with
the failing text quoted. Do not publish until all five pass.
