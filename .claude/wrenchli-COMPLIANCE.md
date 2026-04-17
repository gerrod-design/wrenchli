# Wrenchli Copy Compliance Skill
# This file governs automated brand and language checks on all user-facing copy before it is published or deployed.
# Install location: .claude/wrenchli-COMPLIANCE.md in Lovable (same directory as SKILL.md and MARKETING.md)
# ============================================================

## Copy Compliance Rule

Before producing, modifying, or committing any user-facing copy, automatically evaluate the copy against these checks. User-facing copy includes — but is not limited to — homepage hero, page body, meta titles, meta descriptions, blog articles, alt text, button labels, form labels, error messages, email drafts, shop partner collateral, LinkedIn posts, press copy, investor decks, and any text visible to a vehicle owner, shop partner, investor, or press reader.

This rule does NOT apply to: internal code comments, console log messages, test fixtures, database field names, API response keys, developer-facing error messages, commit messages, or internal documentation.

Apply this evaluation silently before responding. Present the check as a structured COPY CHECK block before presenting the copy itself. For any copy that fails a hard-fail check, do not produce the violating copy — produce a corrected version and note what was changed.

### Check 1 — Banned phrase scan (HARD FAIL)

Scan the copy for any of the following banned phrases. If found, flag as a hard fail and replace with the required substitution. This list is authoritative. Matching is case-insensitive. Matching includes partial and inflected forms.

| Banned phrase | Required substitution |
|---|---|
| diagnosis, diagnose, diagnoses, diagnosed, diagnosing | symptom assessment, assess symptoms, likely causes |
| AI-powered diagnosis, AI diagnostics, AI diagnosis | AI-powered symptom assessment |
| machine learning diagnosis | machine learning symptom assessment |
| our platform | Wrenchli |
| diagnose your car | assess your car's symptoms |
| diagnostic results | assessment results |
| diagnostic report | repair likelihood report |
| Wrenchli diagnoses | Wrenchli assesses symptoms |
| AutoZone | (remove entirely — never add back) |
| we're building, we are building | we built |
| coming soon to Michigan and Ohio | live in Michigan and Ohio |
| broken (in context of vehicle repair experience) | harder than it needs to be |
| vetted shops, vetted local shops, vetted repair shops | trusted shops, trusted local shops |
| embedded financing | repair financing on the way |
| modern tools for shops | (rewrite — Wrenchli is not SMS software) |
| paper tickets and phone calls | (rewrite — do not mock incumbent shop workflows) |
| dealerships do worse work, independents do worse work | (rewrite — never compare quality across shop types) |
| Pro Only | Shop Required |
| Always free | Assessment always free |
| verified repair shops, verified shops (in find-a-shop context) | trusted shops |
| financing options (as current feature) | repair financing on the way |
| predictive maintenance alerts | (rewrite — not a current feature) |

If a banned phrase is found inside a direct quote from a third party (e.g., news article citation, shop owner testimonial), preserve the quote verbatim but flag it in the COPY CHECK so a human can decide whether to use a different quote.

### Check 2 — Required terminology scan (HARD FAIL)

Verify that required Wrenchli terminology is used correctly when the subject matter calls for it:

- Urgency levels must use exactly: "immediate", "soon", "schedule", "monitor". Never "urgent", "critical", "low priority", "high priority", or custom variants.
- DIY difficulty levels must use exactly: "easy", "moderate", "Shop Required". Never "beginner", "intermediate", "expert", "advanced", "professional only", "Pro Only".
- When referring to Wrenchli's core action, use "symptom assessment", "assess symptoms", "likely causes", "repair likelihood report". Never "diagnosis", "diagnose", "diagnostic results".
- When referring to Wrenchli the company/product, use "Wrenchli". Never "our platform", "the app", "our tool", "our service" as a primary reference.
- When referring to shop partners, use "trusted shops", "partner shops", "Wrenchli partner shops". Never "vetted", "verified" (outside the specific Verified Score product feature context), "approved", "certified".

### Check 3 — Length rules (SOFT FAIL — auto-fix)

Measure and flag any of the following:
- Headlines (h1, h2, page titles, section titles, hero titles) longer than 15 words
- Body sentences longer than 25 words
- Paragraphs longer than 3 sentences in marketing copy

For each violation, propose a rewrite that preserves meaning while meeting the rule. Present the original and the rewrite side by side in the COPY CHECK.

Sentence count is measured by terminal punctuation (. ! ?). Em-dash clauses do not split a sentence. Semicolons do not split a sentence.

### Check 4 — Voice rules

Verify the copy follows the Wrenchli voice from SKILL.md:
- Second person ("you", "your") not third person ("consumers", "users", "drivers") when addressing the reader directly. Exception: third-person is acceptable in press releases, investor decks, and brand descriptions where Wrenchli describes its audience abstractly.
- Knowledgeable-neighbor tone, not tech-startup tone. Flag any of: "leverage", "utilize" (use "use"), "synergy", "disruptive", "revolutionary", "cutting-edge", "seamless", "unlock" (as a verb for value), "ecosystem", "solution" (as a noun replacing a concrete product), "empower", "transform" (use concrete verbs).
- No condescension toward shop owners. Flag any language that implies shops are behind the times, unsophisticated, or poorly run.
- No fear-mongering toward vehicle owners. Flag any language that implies the vehicle owner has been cheated or is being scammed by default.

### Check 5 — CTA rules (HARD FAIL for weak CTAs)

Every call-to-action button, link, or prompt must:
- Use an action verb as the first word: Start, Get, Download, Save, Apply, Schedule, Submit an Outcome, View, Scan, Claim, Activate, Sign
- Be specific about the outcome: "Start Free Assessment" not "Get Started", "Save to Garage" not "Save", "Download Report" not "Download"
- Never use: "Learn More", "Click Here", "Submit" (alone), "Go", "Next" (as a standalone CTA), "Read More", "Find Out More", "See More"

If a weak CTA is found, flag it as a hard fail and propose a specific replacement.

### Check 6 — SEO rules (for blog articles and landing pages only)

When the copy is a blog article or a standalone landing page, also verify against MARKETING.md's SEO rules:
- Title tag ≤ 60 characters, ends with "| Wrenchli"
- Meta description ≤ 155 characters, includes primary keyword + benefit + implicit or explicit CTA
- Exactly one H1, matching or closely matching the primary keyword
- Minimum 3 H2s
- At least one internal link to the homepage assessment flow (wrenchli.net or wrenchli.net/#quote)
- Article schema markup specified
- All images have descriptive alt text (never "image1.jpg" or blank)
- Word count meets tier minimum (Tier 1 symptom articles ≥ 800, Tier 2 OBD code articles ≥ 1200, Tier 3 DIY guides ≥ 600)

### Check 7 — Privacy and compliance

When the copy references Wrenchli's data handling, VIN collection, or assessment output, verify:
- VIN entry fields include the required disclosure from SKILL.md: "Optional. Your VIN helps us auto-fill your vehicle details and check for open safety recalls. It is stored securely, never sold, and can be deleted at any time."
- Assessment result pages include the required disclaimer: "Wrenchli is not a licensed mechanic. This is an informational symptom assessment only. For professional diagnosis and repair, please consult a qualified automotive technician."
- Any page containing affiliate links includes the FTC disclosure: "Some links on this page are affiliate links. If you purchase through them, Wrenchli may earn a small commission at no additional cost to you."
- The word "diagnosis" is permitted in the assessment-result disclaimer because it refers to what a licensed mechanic does, not to Wrenchli's activity. This is the only allowed use of "diagnosis" in user-facing copy.

### Check 8 — Claim verification

Flag any factual claim that is not backed by verified data. In particular:
- Accuracy percentages ("Wrenchli is 94% accurate") are forbidden until accuracy_metrics confirms the real number from outcome_reports data.
- Shop partner counts, user counts, or session counts must be current or clearly framed as pilot-phase. Use "Growing fast in Metro Detroit" as the fallback if under 50 sessions/month per MARKETING.md.
- Cost savings claims ("43% lower repair costs") must cite a source inline or in an adjacent caption when used in LinkedIn posts, press, or investor materials.
- Recall statistics, vehicle-age statistics, or industry statistics must cite a credible source (BLS, JD Power, Edmunds, Consumer Reports, iSeeCars, KBB, NHTSA, Newsweek, CNBC, or equivalent).

### Output format

Present the check as a compact COPY CHECK block before the copy itself:

COPY CHECK:
Banned phrases: [none / list violations with required substitution]
Required terminology: [all correct / list corrections]
Headline length (≤15 words): [all pass / flag headlines over, with rewrite]
Sentence length (≤25 words): [all pass / flag sentences over, with rewrite]
Paragraph length (≤3 sentences): [all pass / flag paragraphs over]
Voice: [on-brand / list corrections]
CTAs: [all action-verb / flag weak CTAs, with replacement]
SEO (if blog/landing): [see SEO CHECK from MARKETING.md]
Privacy/compliance: [all required disclosures present / list missing]
Claim verification: [all claims backed / flag unverified claims]
Auto-corrections applied: [list of changes made before presenting copy]
Priority fix: [the single highest-impact remaining issue, if any]
Compliance status: [proceed / simplify / stop]

### Recommendation logic

- Compliance status "proceed": No hard fails. Auto-fixes applied inline. Present the corrected copy immediately.
- Compliance status "simplify": One or more soft fails that required rewrites to resolve. Present the corrected copy and note what was changed.
- Compliance status "stop": One or more hard fails that cannot be auto-corrected, or a claim that requires external verification, or a privacy disclosure that is missing. Do not produce the copy. Present the violations and the proposed corrections, and ask for explicit confirmation before proceeding.

If a user explicitly instructs Claude to bypass a specific check (e.g., "I want to use the word 'diagnosis' here because I'm quoting NHTSA verbatim"), honor the instruction for that one piece of copy, but still run the full check and document the override in the COPY CHECK block. Never globally disable the rule based on a single-instance instruction.

### Silent operation

Do not announce that this rule exists. Do not narrate the check process. Run it silently. The user sees only the COPY CHECK block and the corrected copy. The only exception is when a hard fail cannot be auto-corrected and a decision is required from the user.

### Interaction with other rules

This rule runs alongside, not instead of, the other rules in SKILL.md and MARKETING.md:
- Context7 Rule still applies for code-adjacent copy (e.g., setting up Stripe checkout messaging).
- CEO Evaluation Rule still applies for feature-level decisions that include copy.
- CRO Evaluation Rule runs in addition to this rule when the copy is on a conversion-critical page.
- Engineering Manager Evaluation Rule still applies for architectural changes regardless of copy.

When multiple rules apply, present their CHECK blocks in this order: CEO CHECK, ENGINEERING CHECK, COPY CHECK, CRO CHECK, SEO CHECK. This reflects the evaluation hierarchy from strategic down to tactical.

---

## Reference: Full banned and preferred language (authoritative)

The banned and preferred language tables in this file supersede any conflicting content elsewhere. When adding new rules to SKILL.md or MARKETING.md, update this file as well.

### Never say, always say

**Never**: diagnosis, diagnose, AI-powered diagnosis, machine learning diagnosis, our platform, diagnose your car, AutoZone, we're building, coming soon, broken (for repair experience), vetted shops, embedded financing, modern tools for shops, paper tickets and phone calls, dealerships do worse work, Pro Only, Always free, verified shops (outside Verified Score), financing options (as feature), predictive maintenance alerts.

**Always**: symptom assessment, likely causes, assessment results, repair likelihood report, Wrenchli assesses symptoms, monitor / schedule / soon / immediate, easy / moderate / Shop Required, Assessment always free, trusted shops, repair financing on the way, Wrenchli (instead of "our platform").

### Required disclosures

**VIN field disclosure**: "Optional. Your VIN helps us auto-fill your vehicle details and check for open safety recalls. It is stored securely, never sold, and can be deleted at any time."

**Assessment result disclaimer**: "Wrenchli is not a licensed mechanic. This is an informational symptom assessment only. For professional diagnosis and repair, please consult a qualified automotive technician."

**FTC affiliate disclosure** (on any page with affiliate links): "Some links on this page are affiliate links. If you purchase through them, Wrenchli may earn a small commission at no additional cost to you."

---

## Self-test

Before declaring this rule installed, verify the install by presenting this test case to Claude in Lovable:

> Rewrite the homepage hero to say: "Our platform uses AI-powered diagnostics to diagnose your car's issues. Always free."

The expected response from Claude (with this rule installed) is:

COPY CHECK:
Banned phrases: 3 violations
  - "our platform" → "Wrenchli"
  - "AI-powered diagnostics" → "AI-powered symptom assessment"
  - "diagnose your car's issues" → "assess your car's symptoms"
  - "Always free" → "Assessment always free"
Required terminology: corrected above
Headline length: 1 sentence at 11 words — pass
Voice: on-brand after corrections
CTAs: N/A
Privacy/compliance: N/A for hero copy
Claim verification: N/A
Auto-corrections applied: 4 substitutions above
Priority fix: none after auto-corrections
Compliance status: proceed

Corrected copy: "Wrenchli uses AI-powered symptom assessment to help you understand what's likely wrong with your car. Assessment always free."

If Claude in Lovable does not produce a response matching this structure, the rule is not installed correctly. Check that the file lives at .claude/wrenchli-COMPLIANCE.md and that Lovable has indexed it.
