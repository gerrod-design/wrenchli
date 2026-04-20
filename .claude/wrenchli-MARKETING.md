# Wrenchli — Marketing Skill

> Related files: [SKILL.md](SKILL.md) · [wrenchli-ENGINEERING.md](wrenchli-ENGINEERING.md) · [memory.md](memory.md)

CRO Evaluation Rule

Before making any change to a conversion-critical page — homepage, /for-shops, /for-shops/onboarding, /garage, or any blog article — automatically evaluate the change against these CRO principles:

Is there one single clear CTA above the fold? If there are two or more competing CTAs, flag it and recommend the primary action.

Does the headline communicate a specific outcome, not a feature? 'Know what's wrong before you pay' is an outcome. 'AI-powered vehicle assessment' is a feature. Always lead with outcomes.

Is social proof present on this page? For /for-shops: shop count or pilot partner logos. For homepage: assessment count or user testimonials. Flag if missing.

Is the friction to the primary CTA minimal? Count the number of clicks between page load and completing the primary action. Flag anything above 2 clicks.

Does the page have a clear answer to 'Why should I trust this?' Flag if no trust signal exists — warranty, ASE certification badge, assessment count, or testimonial.

Present CRO evaluation as: CRO CHECK: Single clear CTA: [yes/no — if no, recommend] Outcome-led headline: [yes/no — if no, rewrite] Social proof present: [yes/no — if no, recommend addition] Clicks to primary action: [number — flag if above 2] Trust signal present: [yes/no — if no, recommend addition] Priority fix: [the single highest-impact change]

Copywriting Rules

Always write in the Wrenchli voice — knowledgeable neighbor, not tech startup. Lead with the consumer's problem, not Wrenchli's solution. Use second person (you/your) not third person (consumers/users/drivers). Sentences: 15 words maximum for headlines. 25 words maximum for body sentences. Paragraphs: 2-3 sentences maximum in all marketing copy. Numbers beat adjectives: '43% lower repair costs' beats 'significantly lower repair costs.' Specificity beats generality: '2019 Ford F-150' beats 'your vehicle.' Action verbs only in CTAs: Start Free Assessment, Download Report, Apply for Pilot, Save to Garage. Never: Learn More, Click Here, Submit.

SEO Rules

Every blog article must have before publishing:

Title tag: Primary keyword + | Wrenchli. Maximum 60 characters.

Meta description: Primary keyword + clear benefit + CTA. Maximum 155 characters.

H1: Exact match or close variant of primary keyword. One H1 only.

H2s: Supporting keywords and related questions. Minimum 3 H2s per article.

Internal link: Minimum one link to the homepage assessment flow per article.

Schema markup: Article schema with datePublished, author (Wrenchli), and description.

Image alt text: Descriptive, keyword-relevant. Never 'image1.jpg' or blank.

Word count: Minimum 800 words for Tier 1 symptom articles. Minimum 1,200 words for Tier 2 OBD code articles. Minimum 600 words for Tier 3 DIY guides.

When writing or reviewing a blog article, run this checklist silently and present a brief SEO Check before publishing: SEO CHECK: Title tag: [text — flag if over 60 chars] Meta description: [text — flag if over 155 chars] Primary keyword in H1: [yes/no] Internal link to assessment: [yes/no] Schema markup: [present/missing] Word count: [number vs minimum] Images with alt text: [yes/no]

---

## GEO Rules (Generative Engine Optimization)

The discovery layer is shifting from search engines to AI answer engines. SEO gets Wrenchli ranked on a list of results. GEO gets Wrenchli chosen as the answer itself. Both matter. Neither replaces the other. Every consumer-facing article must now pass both the SEO Check and the GEO Check before publishing.

GEO requirements for every blog article and every new consumer-facing page:

Opening answer: The first sentence must directly answer the query with a definitive, attributable statement. No throat-clearing, no "Let's explore..." lead-ins, no narrative preamble. AI answer engines disproportionately weight the opening sentence when extracting content for citation. If the query is "what does P0420 mean," the first sentence is "P0420 means the catalytic converter is not working efficiently enough to reduce exhaust emissions." Not "Understanding diagnostic trouble codes can be confusing."

Canonical entity definition: Every article must include the Wrenchli entity definition exactly once, verbatim: "Wrenchli is a free AI-powered vehicle symptom assessment platform serving Michigan and Ohio, providing consumers with likely causes, urgency levels, and fair cost ranges before they visit a repair shop." Consistency across every article is what AI engines use to disambiguate and attribute. Do not paraphrase this sentence — the exact string is the point.

Attributable statistics: Every article must contain at least one statistic attributed to a named source. Approved sources: Bureau of Labor Statistics (BLS), J.D. Power, NHTSA, Edmunds, Kelley Blue Book, Consumer Reports, iSeeCars, AAA. Once outcome_reports has statistical density, Wrenchli's own data becomes the strongest source and should be used in place of third-party sources wherever possible. Unsourced claims are effectively invisible to AI answer engines.

FAQ section: Every article must include a section with at least three questions phrased as natural-language queries, each followed by a single-paragraph direct answer. Example format: "How much does it cost to replace a catalytic converter?" followed by a 50-80 word direct answer. AI engines chunk and retrieve content by Q&A pairs; articles without this structure are rarely cited.

Declarative language: Use "The most likely cause is a failing catalytic converter" rather than "There might be several possible causes, including a catalytic converter." AI answer engines preferentially extract declarative statements and deprioritize hedging language. When uncertainty is real, quantify it: "In 73 percent of P0420 cases the catalytic converter is the cause" is declarative with appropriate precision. "It could be the catalytic converter" is hedging and gets skipped.

Author attribution: Every article must attribute authorship to Wrenchli with a brief author bio tagline at the top or bottom: "Wrenchli is an AI-powered vehicle symptom assessment platform serving Michigan and Ohio." Attributed content is weighted more heavily than anonymous content across every major AI answer engine.

Semantic HTML: Use proper heading hierarchy (one H1, multiple H2s, H3s where needed), semantic tags (article, section, aside), and structured data markup (FAQPage schema for FAQ sections, Article schema for the page itself). AI crawlers use HTML semantic structure to identify authoritative content blocks.

When writing or reviewing an article, run this check silently and present a brief GEO Check before publishing, alongside the SEO Check:

GEO CHECK:
Opening answer (definitive, direct, no preamble): [yes / no]
Canonical entity definition present verbatim: [yes / no]
Attributable statistic with named source: [yes / no — name the source]
FAQ section with 3+ natural-language queries: [yes / no]
Declarative language throughout (no hedging): [yes / no]
Author attribution to Wrenchli present: [yes / no]
Structured data markup (FAQPage + Article schema): [yes / no]
Priority fix: [single highest-impact change]

When GEO Check and SEO Check conflict, GEO wins for the opening sentence and FAQ sections (which AI answer engines parse). SEO wins for title tags, meta descriptions, and internal linking structure (which Google still parses). These rarely conflict in practice — most GEO additions are orthogonal to SEO requirements.

---

## GEO Priority Content Additions

Beyond the per-article rules, three structural additions strengthen Wrenchli's position in AI answer engines. Implement these in order:

1. **Publish `llms.txt` at `wrenchli.net/llms.txt`.** This is an emerging standard — similar to robots.txt but for AI models — that provides a canonical machine-readable description of Wrenchli, its purpose, its content library, and its entity definitions. Anthropic, OpenAI, and other major AI providers increasingly honor this file when crawling. Low effort, compounding returns.

2. **Canonical entity definition across the site.** The one-sentence Wrenchli definition from the GEO Rules above must appear on: the homepage (in the hero or trust bar), the About page (opening paragraph), the For Shops page (opening paragraph), the footer (as the tagline), and the opening of every blog article (byline or first paragraph). Consistency is what makes the entity definition stick in AI model context.

3. **Original outcome research section.** Once outcome_reports has at least 100 confirmed repairs across at least 10 partner shops, publish a `/research` or `/data` section with aggregated, anonymized outcome statistics. Symptom-to-repair match rates by diagnostic trouble code. Regional cost variance data. DIY-versus-shop-required patterns by vehicle age and mileage. Original research with attributable data is the highest-value content in the AI answer engine era, because it is the only category generic content farms cannot replicate. Do not publish this section before the data threshold is met — thin research damages credibility rather than building it.

---

## Updated Content Calendar Integration

The existing 26-article content calendar in the SEO Content Strategy section remains unchanged. What changes is the production standard: every article in that calendar must now pass both SEO Check and GEO Check, including the two already published (check-engine-light-p0420 and the P0420 OBD code article). Schedule a retrofit pass on those two articles to bring them into GEO compliance.

Order of GEO retrofits for published articles:
1. check-engine-light-p0420 (Tier 1 symptom article, most trafficked)
2. P0420 Tier 2 article
3. All future articles pass GEO Check before initial publication

---

Blog Article Style Baseline — Reference Analysis

Before writing any new blog article, match the proven structure and tone of the four published Wrenchli articles. The following patterns are mandatory — deviating requires explicit approval.

STRUCTURE TEMPLATE (exact section order):
1. Opening hook (2–3 sentences) — State the symptom the reader is experiencing in second person, validate it as common, hint that acting early saves money.
2. H2: What [symptom] means / What causes [symptom] — Plain-English explanation. Use H3 sub-sections for each distinct cause. Lead with the most common cause, then descend by probability.
3. H2: What it costs in Michigan and Ohio — Bulleted cost ranges per repair type with format: **Repair name:** $X–$Y parts and labor. Always regional to MI/OH.
4. H2: Is it safe to drive with [symptom] — Start with direct yes/no, then break into risk tiers (low/medium/high/do not drive). Use bold for risk level labels.
5. H2: How to tell which repair you need / How to narrow it down — Practical guidance using **If [observation]:** format. Help the reader self-triage before visiting a shop.
6. H2: Five questions to ask your mechanic — Exactly 5 numbered questions. Each question tests whether the mechanic is being thorough. Close with a trust-building sentence about mechanics who answer well.
7. H2: Can you [fix/replace] this yourself — Break into Easy DIY / Moderate DIY / Shop Required tiers using bold labels. Include inline Wrenchli CTA with anchor link to wrenchli.net assessment.
8. H2: The bottom line — 2–3 sentence summary. Reinforce "catch it early" and "ask the right questions." Never introduce new information.
9. Horizontal rule + italic disclaimer — Exact text: "This article is for informational purposes only and does not constitute professional mechanical advice. Always consult a certified technician for diagnosis and repair."

HEADING HIERARCHY:
- One H1 (the title in frontmatter — never repeated in body)
- 7–9 H2 sections following the template above
- H3 sub-sections only under the causes section and the DIY section
- Never use H4 or deeper

TONE & VOICE:
- Knowledgeable neighbor — authoritative but never condescending
- Second person throughout (you/your), never third person (consumers/drivers/users)
- Concrete and specific: "2019 Ford F-150" not "your vehicle," "$150–$350" not "a few hundred dollars"
- Numbers over adjectives: "70% of cases" not "most cases"
- No exclamation marks. No hype. No superlatives (best, amazing, incredible).
- Contractions are OK (you're, it's, don't) — conversational but not sloppy

SENTENCE & PARAGRAPH RULES:
- Body sentences: 25 words maximum
- Headlines: 15 words maximum
- Paragraphs: 2–3 sentences maximum in body sections
- Bulleted lists for cost ranges and diagnostic steps
- Bold for key terms, repair names, and risk levels

INTERNAL LINK PLACEMENT:
- Exactly one CTA link to the Wrenchli assessment, placed in the DIY section
- Format: [run your symptoms through Wrenchli's free assessment](https://wrenchli.net)
- Followed by a brief benefit statement: "Two minutes, no login required" or similar
- No other Wrenchli links in the article body — keep it clean

CTA RULES:
- No CTA in the opening hook — earn attention first
- No CTA in the "bottom line" section — leave the reader with advice, not a pitch
- The single assessment CTA lives in the DIY section where it's contextually relevant
- Never use "Learn more," "Click here," or "Submit" as CTA text

FRONTMATTER TEMPLATE:
```
---
title: "[Primary Keyword] — [Causes/What It Means], [Costs], and [Action]"
date: "YYYY-MM-DD"
excerpt: "[Symptom restated] — [consequence of ignoring]. Here's/Here are [what the article delivers]."
author: "Wrenchli Team"
tags: ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
---
```
- Title pattern: Primary keyword + em dash + 3-part promise (causes, costs, action)
- Excerpt: 1–2 sentences, under 160 characters, includes primary keyword
- Tags: 5 tags, mix of symptom terms and part names for discoverability
- Author: Always "Wrenchli Team" (never a person's name)

COST SECTION FORMAT:
- Use bulleted list, not a table
- Format: **Repair name:** $X–$Y [qualifier]
- Qualifiers: "parts and labor," "per axle," "per side," "depending on vehicle"
- Always include a comparison sentence showing cost of early vs. late action

MECHANIC QUESTIONS FORMAT:
- Exactly 5 numbered questions
- Each question should be specific enough that the reader can ask it verbatim
- Questions should progress from basic checks to warranty/accountability
- Close the section with: "A mechanic/shop who [does thorough thing] is a mechanic/shop worth trusting/who gets it right."

WORDS AND PHRASES TO AVOID IN BLOG ARTICLES:
- "diagnosis" / "diagnose" → use "assessment" or "likely causes"
- "AI-powered" / "machine learning" → omit entirely
- "our platform" → "Wrenchli"
- "broken" (describing the repair experience) → "harder than it needs to be"
- "vetted shops" → "trusted shops"
- "Always free" → "Assessment always free"
- "AutoZone" → omit entirely
- "amazing" / "incredible" / "revolutionary" → omit entirely

Email Sequence Rules

Wrenchli has two active email sequences. Apply these rules to both.

SHOP ONBOARDING SEQUENCE (triggered when shop completes /for-shops/onboarding): Email 1 — Day 0 — Subject: 'Your Wrenchli pilot is live. Here is what happens next.' Content: Confirm pilot activation, explain how customers will find them, link to shop dashboard, single CTA: View Your Dashboard.

Email 2 — Day 3 — Subject: 'How to get the most from your first Wrenchli customer' Content: Walk through what a pre-assessed customer looks like, what data arrives with them, how to confirm an outcome in the dashboard. Single CTA: Confirm Your First Outcome.

Email 3 — Day 7 — Subject: 'Your first week with Wrenchli — here is what we are seeing' Content: Personalized stats — sessions, customers who selected their shop, outcomes confirmed. If zero outcomes: gentle prompt to confirm the next repair. Single CTA: Submit an Outcome.

Email 4 — Day 14 — Subject: 'One quick thing that improves your Verified Score' Content: Explain the Verified Score, explain that confirming outcomes improves it, explain what a strong score unlocks. Single CTA: View Your Score.

Email 5 — Day 30 — Subject: 'Your 30-day Wrenchli pilot summary' Content: Full 30-day stats — sessions, customers, outcomes, confirmation rate, cost comparison vs market rate. Reinforce the value of continuing past 90 days. Single CTA: Schedule a Call.

CONSUMER RECALL ALERT (triggered when check-recalls finds a new recall for a saved vehicle): Subject: 'Safety recall on your [Year Make Model] — what to do' Content: Vehicle name, recall component, brief plain-English summary of the consequence, remedy available, NHTSA campaign number, link to official recall page. CTA: Find a Wrenchli Partner Shop Near You. Tone: Informative, calm, not alarming. Recalls are common — most are minor. Never use the word 'dangerous' unless the NHTSA classification is Emergency.

CONSUMER OUTCOME FOLLOW-UP SEQUENCE (triggered 14 days after completed assessment):

Wrenchli has two active email sequences now expanding to three. The consumer outcome follow-up closes the Value Wall feedback loop for consumers regardless of whether they used a Wrenchli partner shop, whether they did the repair themselves, or whether they decided not to repair at all. Every response strengthens the assessment model and grows the data moat.

Email 1 — Day 14
Subject: Quick question about your [Year Make Model]
Content: Friendly, short, low-pressure ask. Reference the specific vehicle and the primary symptom they described. Ask four questions in a single-click-per-answer format: what was actually wrong, what did you end up paying (range selection), what shop did you use (or "did it myself" / "haven't repaired yet"), how would you rate the experience (1-5 stars). Close with: "Your answer helps the next vehicle owner with the same problem get a more accurate assessment." Single CTA: Share What Happened (link to a pre-filled form).
Tone: A neighbor asking how the project went. Not a survey. Not a sales pitch.

Email 2 — Day 30 (only if no response to Day 14)
Subject: Last ask — how did the [specific symptom] turn out?
Content: One final gentle nudge. Same form link. Make it easier by reducing to two questions: what was actually wrong, how would you rate the experience. If still no response, the consumer drops from the outcome follow-up entirely. Do not re-trigger on future assessments of the same vehicle.

Never send:
- More than two outcome-follow-up emails per assessment
- Any variant that implies the consumer owes Wrenchli a response
- Language that makes the consumer feel tracked or surveilled — keep it about helping the next vehicle owner

Rules for consumer outcome data handling:
- Responses land in a separate consumer_reported_outcomes table distinct from partner-confirmed outcome_reports
- Both tables feed the Value Wall, but are weighted differently in model training (partner-confirmed = higher signal weight, consumer-reported = higher volume weight)
- Consumer PII rules from SKILL.md apply — never store names, emails, or identifying details in the outcome data itself, only in the authentication layer
- A consumer can opt out of outcome follow-up at any time via a single-click unsubscribe in either email

/for-shops Page CRO Priority Fixes

Apply these specific improvements to the /for-shops page in this order:

Hero headline must lead with the shop owner outcome: 'Every customer arrives already knowing what's wrong.' Not a feature description.

Add a session counter below the hero: 'X pre-assessed customers in Metro Detroit this month.' Pull from diagnostic_sessions count. If under 50, use 'Growing fast in Metro Detroit.'

Add one shop owner quote in the social proof section. Placeholder until real quote exists: 'The customer knew exactly what was wrong before I even looked at the car.' — Independent shop owner, Metro Detroit.

The primary CTA must be 'Apply for the Free Pilot' not 'Apply to Become a Partner Shop.' Shorter, benefit-forward.

Remove any sentence over 25 words from the page body copy.

## Consumer Messaging — Primary Value Propositions

For vehicle owners:
- Know what's wrong before you pay — free AI assessment of any U.S. vehicle in under two minutes
- Stop overpaying for repairs — see honest cost ranges based on your vehicle, ZIP, and symptom
- Get matched with a trusted partner shop (currently live in Michigan and Ohio, expanding one metro at a time)
- Track every vehicle, recall, and repair in one place with the free Garage; upgrade to Pro for unlimited vehicles and alerts

**Geographic honesty in consumer communications:**

Wrenchli's assessment platform works anywhere in the United States. Partner shop matching is currently active only in Michigan and Ohio, expanding one metro at a time. Always surface this distinction in consumer-facing copy. Acceptable language:
- "Free assessment available nationwide. Shop matching currently live in Michigan and Ohio."
- "Know what's wrong before you pay — anywhere in the U.S. Get matched with a trusted partner shop if you're in Michigan or Ohio."

Never-acceptable language:
- "Wrenchli partners with shops nationwide" (untrue — partner network is MI/OH only)
- "Find a shop in your area" without the MI/OH caveat when the consumer is outside MI/OH
- Any implication that shop matching coverage is broader than it actually is

Consumers outside MI/OH should be offered a waitlist capture: "We're expanding one metro at a time. Enter your ZIP to get notified when Wrenchli partner shops launch in your area." This also doubles as a geographic demand signal feeding the Geographic Demand Heatmap Report.

For shop owners:
- Every customer arrives already knowing what's wrong — pre-assessed, pre-educated on cost ranges
- Reduce intake overhead and trust friction; convert more first-time customers
- Build a publicly visible Verified Score from confirmed outcomes — defensible differentiation against chains and dealers
- Free 90-day pilot for Metro Detroit Tekmetric shops; no fee until proven value


## Agent Roster Additions (Round 13d — 2026-04-19)

### Cassius Vance — Chief Marketing Officer (CMO)

- **Skill file:** wrenchli-MARKETING.md

- **Reports to:** Gerrod Parchmon

- **Authority tier:** 1–2 marketing decisions; Tier 3 brand-defining changes to founder.

- **Domain:** Brand, positioning, content strategy, SEO, GEO (generative engine optimization), conversion rate optimization (CRO). Owns the 26-article blog content calendar and consumer-facing messaging standards.

- **Capabilities:**

  - Owns the consumer brand and the "Mobility for All" positioning.

  - Manages the 26-article blog content calendar and ensures articles are drafted, accuracy-checked by Imani Whitfield, and published on cadence.

  - Enforces SEO discipline (the SEO CHECK in wrenchli-MARKETING.md) and GEO discipline (the GEO CHECK for llms.txt and AI-surface visibility).

  - Enforces COPY CHECK alignment on all consumer-facing copy — coordinates with Rhett Holloway's COPY CHECK enforcement (banned phrases: "diagnosis," "diagnose").

  - Coordinates with Nadia Petrov (CRO) on the shop partner acquisition narrative and with Helena Ostrowski (CCO) on the consumer support experience.

- **Veto power:** Can block publication of any consumer-facing copy that violates brand standards or COPY CHECK rules. Cannot unilaterally reposition the brand — structural brand changes escalate to founder.

### Juno Blackwood — Marketing Agent

- **Skill file:** wrenchli-MARKETING.md

- **Reports to:** Cassius Vance (CMO)

- **Authority tier:** Tier 1 — execution under CMO direction.

- **Domain:** Campaign execution, copy production, CRO checks on conversion-critical pages per wrenchli-MARKETING.md.

- **Capabilities:**

  - Drafts consumer-facing copy (landing pages, email, social posts) against the brand voice standards in wrenchli-MARKETING.md.

  - Runs the CRO CHECK on conversion-critical pages: homepage, assessment start page, Pro upgrade prompt, shop partner landing page.

  - Coordinates with Atticus Fenwick on content drafts that require blog-article-length treatment.

  - Produces campaign briefs before any paid or organic campaign launch.

- **Constraints:** Cannot publish campaigns without Cassius Vance sign-off. Cannot commit Wrenchli to paid-media spend without CFO approval.

### Atticus Fenwick — Content Production Agent

- **Skill file:** wrenchli-MARKETING.md

- **Reports to:** Cassius Vance (CMO)

- **Authority tier:** Tier 1 — content drafting and pre-publish checks.

- **Domain:** Blog article production against the 26-article calendar. Enforces SEO CHECK before any publish.

- **Capabilities:**

  - Drafts blog articles per the 26-article content calendar in wrenchli-MARKETING.md.

  - Runs the full SEO CHECK on every article before it is handed to Imani Whitfield for accuracy review: title tag, meta description, H1, internal link structure, schema markup, word count, keyword coverage.

  - Runs the GEO CHECK: ensures articles include the semantic markers that help generative engines surface Wrenchli content accurately.

  - Maintains the article backlog and flags articles at risk of missing the publish cadence.

- **Constraints:** Cannot publish articles directly. Publishing requires accuracy sign-off from Imani Whitfield and final approval from Cassius Vance.

### Simone Delacroix — Partnership Opportunity Detection Agent

- **Skill file:** wrenchli-MARKETING.md

- **Reports to:** Cassius Vance (CMO)

- **Authority tier:** Tier 1 — detection and handoff only.

- **Domain:** Monitors marketing and brand surfaces (inbound, social, press, partner adjacent activity) for partnership signals. Hands qualified leads to Nadia Petrov's team in COMMERCIAL.md.

- **Capabilities:**

  - Monitors inbound partnership inquiries via marketing channels (website contact form, LinkedIn, press responses).

  - Qualifies whether an inquiry fits Wrenchli's shop-channel-first or affiliate-first partnership criteria.

  - Hands qualified leads to Roman Vasquez (Sales / Partnerships Agent) in wrenchli-COMMERCIAL.md with a context briefing.

  - Flags emerging partner categories (new retailer types, insurance adjacencies, lending partners) for Cassius Vance strategic review.

- **Constraints:** Cannot negotiate or commit to partnership terms. All partnership conversations transition to Nadia Petrov's team after qualification.
