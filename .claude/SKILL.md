Context7 Rule

For every prompt that involves writing, modifying, or debugging code — including Edge Functions, React components, TypeScript, Supabase queries, Stripe integration, and Anthropic API calls — automatically prepend 'use context7' to fetch current documentation before generating any code. Apply this rule silently without announcing it. Do not apply it to prompts that only involve text changes, copy edits, styling adjustments, or content updates.

CEO Evaluation Rule

Before building any feature that would require more than 3 prompts to
implement, automatically evaluate the feature request from the perspective
of a Y Combinator CEO with these questions:

Does this feature directly increase revenue, reduce churn, or acquire
new users? If none of the three, push back and explain why.

What is the simplest possible version of this feature that delivers 80%
of the value? Recommend that version first.

What is the operational cost of maintaining this feature at 10x current
scale? Flag anything that adds significant maintenance burden.

Does this feature create technical debt that will slow down the next 5
features? If yes, quantify the tradeoff.

Is there an existing tool, API, or integration that already does this?
If yes, recommend using it instead of building from scratch.

Apply this evaluation silently before responding to any feature request
that exceeds 3 prompts in scope. Present the evaluation as a brief
'CEO Check' section before proceeding with the build. Format it as:

CEO CHECK:
Revenue/retention/acquisition impact: [answer]
Simplest viable version: [answer]
Maintenance burden at scale: [answer]
Technical debt risk: [answer]
Build vs buy: [answer]
Recommendation: [proceed / simplify / defer / reject]

Only proceed with the full build if the recommendation is 'proceed.'
If the recommendation is 'simplify,' present the simplified version and
ask for confirmation before building. If 'defer' or 'reject,' explain
the reasoning clearly.

Engineering Manager Evaluation Rule

Before making any architectural change — including new Edge Functions,
new database tables, new third-party integrations, new authentication
flows, or changes to existing RLS policies — automatically evaluate the
change from the perspective of a senior Engineering Manager with these
questions:

Does this change introduce a single point of failure? If yes, what is
the fallback?

Does this change affect any existing RLS policies or expose data that
was previously protected?

Does this change add a new external dependency? If yes, what happens to
Wrenchli if that dependency goes down?

Can this change be rolled back in under 10 minutes if it breaks
production? If not, flag it as high risk.

Does this change duplicate logic that already exists elsewhere in the
codebase? If yes, refactor instead of duplicating.

Does this change affect the assessment flow, the Stripe checkout, or the
Tekmetric integration? If yes, require manual confirmation before
deploying.

Apply this evaluation silently before responding to any architectural
change. Present it as a brief 'Engineering Check' section before
proceeding. Format it as:

ENGINEERING CHECK:
Single point of failure: [answer]
RLS/data exposure risk: [answer]
External dependency risk: [answer]
Rollback plan: [answer]
Code duplication check: [answer]
Critical path impact: [yes/no — assessment flow, Stripe, Tekmetric]
Risk level: [low / medium / high]

If risk level is high, stop and ask for explicit confirmation before
proceeding. If critical path impact is yes, always require manual
confirmation before deploying to production regardless of risk level.

Wrenchli Brand Guideline Skill
Place this file in your Lovable project at: .claude/SKILL.md
Lovable reads this at the start of every session.
============================================================
Identity
Wrenchli is a consumer vehicle symptom assessment platform.
We help vehicle owners understand what is likely wrong with their
car before visiting a repair shop.
Company: Wrenchli, Inc. (Delaware Corporation)
Founder: Gerrod Parchmon
Market: Michigan and Ohio (pilot)
Site: wrenchli.net
Partner email: partners@wrenchli.net
Support phone: 313.312.5455

Language Rules — ALWAYS ENFORCE
ALWAYS say:

"symptom assessment" (never "diagnosis")
"likely causes" (never "diagnosis" or "diagnoses")
"assessment results" (never "diagnostic results")
"repair likelihood report" (never "diagnostic report")
"Wrenchli assesses symptoms" (never "Wrenchli diagnoses")
"monitor / schedule / soon / immediate" for urgency levels
"easy / moderate / professional only" for DIY difficulty

NEVER say:

"diagnosis" or "diagnose" in any consumer-facing context
"AI-powered diagnosis"
"machine learning diagnosis"
"our platform" (say "Wrenchli" instead)
"diagnose your car"
"AutoZone" (removed — do not add back)
"we're building" (say "we built" — product is live)
"coming soon to Michigan and Ohio" (product is live now)
"broken" when describing the vehicle repair experience
(say "harder than it needs to be" instead)
"vetted shops" (say "trusted shops" — shops are not yet vetted)
"embedded financing" (say "repair financing on the way")
"modern tools for shops" (implies SMS software — Wrenchli is not SMS)
"paper tickets and phone calls" (condescending to shop owners)
"dealerships do worse work" (never compare quality across shop types)


Voice and Tone
Primary tone: knowledgeable neighbor, not tech startup
Secondary tone: confident, warm, direct
Write like you are explaining something important to a friend
who owns a car but is not a mechanic. Never condescending.
Never overly technical. Never salesperson.
For consumers: empathetic, protective, straightforward
For shop owners: respectful, peer-to-peer, efficient
For investors/press: data-driven, ambitious, grounded
Sentence style: short declarative sentences preferred.
Paragraphs: 2-3 sentences maximum in marketing copy.
Headlines: punchy, specific, benefit-first.
Examples of on-brand copy:

"Know what's wrong before you pay for it."
"Vehicle Repair. Finally Fixed."
"Every customer arrives already knowing what's wrong."
"We're fixing the vehicle repair experience — starting in
Michigan and Ohio."

Examples of off-brand copy (never write these):

"Leverage AI-powered diagnostics to optimize your repair journey"
"Our platform utilizes machine learning to diagnose vehicle issues"
"Disruptive technology transforming the automotive repair ecosystem"


Visual Design
Primary orange: #E07B39
Dark background (nav/hero): #0F1117
Warm light background (content): #F8F8F6
White: #FFFFFF
Dark text: #1A1A1A
Muted text: #555555
Border color: #CCCCCC
Primary font: Plus Jakarta Sans (all body and UI text)
Monospace font: IBM Plex Mono (data values, percentages, codes)
Never use: Inter, Arial, Helvetica as primary fonts
Button style:

Primary CTA: orange fill (#E07B39), white text, rounded
Secondary CTA: outline style, no fill, border only
Destructive: red, used sparingly

Nav: dark (#0F1117) background, white text, orange accents
Footer: dark background (#0F1117 or similar), orange section titles
Cards: white background, 0.5px border, rounded corners

Product Architecture
The assessment flow has these exact steps — use these names:
Step 1: Vehicle Entry (year, make, model, mileage)
Step 2: Symptom Entry (what the consumer describes)
Step 3: Assessment Generating (AI call in progress)
Step 4: Results Shown (possible causes with probability scores)
Step 5: Recommendation Shown (urgency, cost range, shop questions)
Urgency levels (exact wording):

immediate — safety risk, do not drive
soon — address within 1-2 weeks
schedule — plan a shop visit
monitor — watch for changes

DIY difficulty levels (exact wording):

easy — 30-60 minutes
moderate — 1-3 hours
professional only — do not show DIY option

DIY visibility rule: ONLY show DIY option when urgency is
"monitor" or "schedule" AND difficulty is "easy" or "moderate".
NEVER show DIY option for "immediate" or "soon" urgency.

Technical Stack — Never Change Without Instruction
AI model: claude-sonnet-4-20250514 ONLY
No other AI models (not GPT, not Gemini, not other Claude versions)
Database: Supabase PostgreSQL
Edge Functions: Deno runtime
Frontend: React + TypeScript + Vite
Hosting: Vercel
CORS: always use _shared/cors.ts (never import from supabase-js directly)
JSON parsing: always strip markdown code fences before parsing
Claude API responses (Claude wraps JSON in ```json fences)

Amazon Affiliate
Affiliate tag: wrenchli-20
Every Amazon URL must include: &tag=wrenchli-20
Never use: wrenchli20-20 (wrong — missing hyphen)
URL format: https://www.amazon.com/s?k=[search+terms]&tag=wrenchli-20

Data and Privacy Rules
NEVER store in logs or audit tables:

Consumer PII (name, email, phone)
VIN numbers
Shop API credentials or credential values
Any field that could identify a specific consumer

The three-tier data model:
Tier 1: Consumer PII — owned by consumer, never sold
Tier 2: Partner operational data — owned by shop, never shared
Tier 3: Anonymized outcome data — owned by Wrenchli, used for AI training

Shop Partner Program
Current status: Free 90-day pilot, no fees, no commissions
Do NOT show or mention:

Any pricing for shop partners ($299/mo or any other amount)
"All-in-one shop management software" (Wrenchli is not SMS)
Warranty advertising partnerships (not yet established)

SMS integrations (built, not yet live with real credentials):

Tekmetric (API application submitted April 5, 2026)
AutoLeap (integration built, application pending)
Mitchell 1 (integration built, partner agreement pending)
CSV export available for all other systems

Verified Score components:

Symptom-to-repair match rate (rolling 90 days, min 5 outcomes)
Cost fairness percentile vs local market
Consumer satisfaction (weighted 0 if fewer than 10 ratings)


Routing
/ → homepage (new design, DesignPreview component)
/diagnose → redirects to /
/for-shops → shop partner landing page
/for-shops/onboarding → 4-step shop onboarding wizard
/shop/dashboard → shop partner dashboard (auth required)
/garage → vehicle garage (requires account)
/blog → blog listing page
/blog/[slug] → individual blog articles
/about → about page with Our Story, Leadership, Why Detroit
/about.html → static HTML for AI agent/crawler readability
/privacy → privacy policy
/warranty-guide → manufacturer warranty reference chart
/design-preview → redirects to /
/admin/login → admin authentication
/shop-login → shop partner authentication

Content and SEO
Blog articles live at: /blog/[slug]
First article published: check-engine-light-p0420
Target keywords by tier:
Tier 1 (symptom): "grinding noise when braking", "check engine light"
Tier 2 (OBD codes): P0420, P0300, P0171, P0442
Tier 3 (DIY): "how to replace brake pads", "car battery replacement"
Never claim accuracy rates without real data behind them.
Current accuracy: being computed from outcome_reports — do not
publish a specific percentage until accuracy_metrics confirms it.

Layout Enforcement Rules
Never use symmetrical three-column grid layouts for marketing sections.
Every page section must have one visually dominant element.
Never center-align body text on desktop viewports.
Avoid equal-weight card grids — use asymmetric layouts that create
visual hierarchy.
All interactive elements must have a minimum 44px touch target on mobile.

Legal and Compliance
Disclaimer required on all assessment results:
"Wrenchli is not a licensed mechanic. This is an informational
symptom assessment only. For professional diagnosis and repair,
please consult a qualified automotive technician."
FTC affiliate disclosure required on all pages with parts links:
"Some links on this page are affiliate links. If you purchase
through them, Wrenchli may earn a small commission at no
additional cost to you."
Privacy policy live at: wrenchli.net/privacy
Terms of service: live on site
Affiliate disclosure in footer: "Wrenchli participates in
affiliate programs including Amazon Associates."