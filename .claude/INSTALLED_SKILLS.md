# Installed Skills Registry

# Last updated: 2026-04-18

## Active Skills (execution order)

1. wrenchli-STRATEGY.md — Strategic analysis, market evaluation, expansion decisions

2. wrenchli-OPERATIONS.md — Agentic automation, MCP integrations, routines, QA

3. SKILL.md — Brand, voice, technical decisions, codebase memory

4. wrenchli-MARKETING.md — CRO, copywriting, SEO, email sequences

5. wrenchli-SECURITY.md — Cybersecurity posture, threat modeling, incident response, partner security due diligence, audit cadence

6. wrenchli-REGULATORY.md — Regulatory monitoring, multi-jurisdiction compliance, expansion discipline, regulatory authority interaction

7. wrenchli-ACCURACY.md — Anti-hallucination discipline, source citation, Fact Checker protocol, verification across agents

8. wrenchli-DECISIONS.md — Decision Resolution Rubric, veto hierarchy, conflict routing, founder override protocol

9. wrenchli-GOVERNANCE.md — Corporate governance, board operations, decision rights, fiduciary duties, D&O, ESG posture

10. wrenchli-LEGAL.md — Entity structure, IP protection, contract framework, dispute resolution, outside counsel, legal records, litigation readiness

11. wrenchli-FINANCE.md — Financial controls, cap table discipline, unit economics, budget approval, financial reporting, banking and cash management, outside counsel spend authorization, investor relations, Financial Impact Check

12. wrenchli-PEOPLE.md — Contractor classification and onboarding, IP assignment discipline, compensation philosophy and approval, employee hiring framework, equity participation, performance and separation protocols, agent team governance, People Impact Check

13. wrenchli-COMMERCIAL.md — Shop partner lifecycle, integration partner governance, affiliate relationships, data licensing operations, financial services partner transition, product decision rights, assessment flow protection, Pro subscription governance, consumer-facing change approval, product roadmap governance, Commercial Impact Check

14. wrenchli-COMPLIANCE.md — Copy compliance enforcement: 8-check COPY CHECK rule covering banned phrases, required terminology, length, voice, CTAs, SEO, privacy disclosures, and claim verification

15. wrenchli-CRISIS.md — Crisis Activation framework, incident response coordination, board and investor notification, media and regulatory response, financial crisis response, data breach legal response, executive departure protocol, agent authority suspension during active crisis

16. wrenchli-FUNDRAISING.md — Raise readiness criteria, VC targeting and outreach methodology, investor meeting preparation discipline, SAFE negotiation framework, data room contents and sequencing, term sheet evaluation criteria, pre-close legal and financial checklist, Fundraising Impact Check

## Execution Order

For any significant decision, run Strategy → Operations → CEO Check → Engineering Check → Accuracy Check → Security Check → Regulatory Impact Check → Brand/Marketing compliance.

Strategy determines what. Operations determines how. CEO and Engineering gate the execution. Accuracy Check gates next as a hard filter — unverified factual claims rejected here cannot proceed without founder override. Security Check gates after Accuracy — adversarial-actor exposure rejected here cannot proceed without founder override. Regulatory Impact Check gates after Security — legal/regulatory exposure rejected here cannot proceed without founder override. Brand and Marketing govern the output.

## Model

Current: claude-sonnet-4-6 (via ANTHROPIC_MODEL Supabase secret)

## Change Log

- 2026-04-14: Model upgraded from claude-sonnet-4-20250514 to claude-sonnet-4-6

- 2026-04-18: Added wrenchli-STRATEGY.md and wrenchli-OPERATIONS.md

- 2026-04-18: Added GEO Rules section to wrenchli-MARKETING.md

- 2026-04-18: Published llms.txt at site root for AI answer engine discovery

- 2026-04-18: Dual-track geography revision installed. STRATEGY.md updated to distinguish Marketplace DNA (local density, strict geographic gating) from Digital Product DNA (nationwide data flywheel, no geographic gating). OPERATIONS.md updated to accelerate Support Agent to Phase 2 and add Consumer Outcome Collection, Geographic Demand Heatmap, Outcome Data Quality Monitor, Second-chance Outcome Prompt, and AI Answer Engine Citation Monitor routines. wrenchli-MARKETING.md updated with Consumer Outcome Follow-up email sequence and Geographic honesty rule for consumer-facing copy.

- 2026-04-18: Created wrenchli-SECURITY.md as fifth skill file. Cybersecurity posture now established as core function. Security Check rule added to execution order as gating check after Engineering Check. References forward-declared roles: CISO Sloane Ashford, CTO Keegan Alaric, Cybersecurity Monitoring Agent Caleb Voss. References forward-declared skill files: ACCURACY.md (Round 3), REGULATORY.md (Round 2), OPERATIONS.md revision (Round 12), META_SKILLS.md (Round 17).

- 2026-04-18: Created wrenchli-REGULATORY.md as sixth skill file. Regulatory compliance posture established as first-class function. Regulatory Impact Check added to execution order between Security Check and Brand/Marketing compliance. References forward-declared roles: General Counsel Evelyn Marchetti, Regulatory Intelligence Agent Amara Oduya. References forward-declared skill files: ACCURACY.md (Round 3), DECISIONS.md (Round 4), LEGAL.md (Round 6), OPERATIONS.md revision (Round 12), META_SKILLS.md (Round 17).

- 2026-04-18: Created wrenchli-ACCURACY.md as seventh skill file. Anti-hallucination discipline established as first-class function with eight-layer framework and Fact Checker protocol. Accuracy Check added to execution order between Engineering Check and Security Check. References forward-declared roles: Chief Learning Officer Evren Matsuda, Verification and Accuracy Agent Imani Whitfield. References forward-declared skill files: DECISIONS.md (Round 4), OPERATIONS.md revision (Round 12), META_SKILLS.md (Round 17). Incorporates Fact Checker patterns from meta-skills framework.

- 2026-04-18: Created wrenchli-DECISIONS.md as eighth skill file. Decision Resolution Rubric established with five-role veto authority hierarchy (CISO, General Counsel, CHRO, CFO, CTO). Conflict classification and routing rules specified. Founder override protocol with documentation requirement. References forward-declared roles: Mira Sokolov (Change Management Agent), Rhett Holloway (Chief of Staff), and all five C-suite veto holders. References forward-declared skill files: GOVERNANCE.md (Round 5), OPERATIONS.md revision (Round 12), META_SKILLS.md (Round 17).

- 2026-04-18: Created wrenchli-GOVERNANCE.md as ninth skill file. Corporate governance, board operations, decision rights, stakeholder obligations, and ESG posture established. Stage-Appropriate Governance Framework with pre-seed/seed/Series A/Series B/growth progressions. References forward-declared skill files: LEGAL.md (Round 6), FINANCE.md (Round 7), CRISIS.md (Round 10), OPERATIONS.md revision (Round 12). Session 1 Round 5 of 5 complete — ready for end-of-Session-1 regression test.

- 2026-04-18: Created wrenchli-LEGAL.md as tenth skill file. Entity structure, IP protection, contract framework, dispute resolution, outside counsel discipline, legal records, litigation readiness, and Legal Impact Check established. Owned by Evelyn Marchetti (General Counsel). Coordinates with GOVERNANCE.md, REGULATORY.md, SECURITY.md, and DECISIONS.md. Session 2 Round 1 complete.

- 2026-04-18: Created wrenchli-FINANCE.md as eleventh skill file. Financial controls, cap table discipline, unit economics, budget approval, financial reporting, banking and cash management, outside counsel spend authorization, investor relations mechanics, and Financial Impact Check established. Owned by Darya Nazari (CFO). Coordinates with GOVERNANCE.md, LEGAL.md, and DECISIONS.md. Session 2 Round 2 complete.

- 2026-04-18: Created wrenchli-COMMERCIAL.md as thirteenth skill file. Unified commercial framework covering shop partner lifecycle, integration partner governance, affiliate relationships, data licensing operations, financial services partner transition protocol, product decision rights, assessment flow protection, Pro subscription governance, consumer-facing change approval, product roadmap governance, and the Commercial Impact Check. Owned by Rhett Holloway (Chief of Staff) for partnership operations and Gerrod Parchmon (Founder/CEO) for product authority. Coordinates with LEGAL.md, FINANCE.md, PEOPLE.md, SECURITY.md, REGULATORY.md, wrenchli-MARKETING.md, GOVERNANCE.md, and DECISIONS.md. Session 2 Round 4 complete.

- 2026-04-18: Reinstalled wrenchli-PEOPLE.md as twelfth skill file. Renumbered wrenchli-COMMERCIAL.md to thirteenth. Registry sequence 1-13 confirmed with no gaps.

- 2026-04-18: Registered wrenchli-COMPLIANCE.md as fourteenth skill file. Copy compliance enforcement layer — 8-check COPY CHECK rule covering banned phrases, required terminology, length, voice, CTAs, SEO, privacy disclosures, and claim verification. Pre-existing file, origin session unknown, contents validated and confirmed active. Coordinates with SKILL.md, wrenchli-MARKETING.md, and ACCURACY.md.

- 2026-04-18: Corrected registry filename references to match actual filenames on disk for legacy non-prefixed skill files.

- 2026-04-18: Created wrenchli-CRISIS.md as fifteenth skill file. Crisis Activation framework, incident response coordination, board and investor notification protocols, media and regulatory response posture, financial crisis response, data breach legal response playbook, executive departure protocol, and agent authority suspension during active crisis established. Forward-declared in wrenchli-GOVERNANCE.md. Owned by Gerrod Parchmon (Founder/CEO) with Rhett Holloway coordinating execution and Evelyn Marchetti leading legal response. Session 2 Round 5 complete.

- 2026-04-18: Created wrenchli-FUNDRAISING.md as sixteenth skill file. Raise readiness criteria, VC targeting and outreach methodology, investor meeting preparation discipline, SAFE negotiation framework, data room contents and sequencing, term sheet evaluation criteria, pre-close legal and financial checklist, and Fundraising Impact Check established. Owned by Darya Nazari (CFO) with Declan Morrissey executing VC intelligence and Evelyn Marchetti leading legal. Coordinates with FINANCE.md, LEGAL.md, GOVERNANCE.md, PEOPLE.md, COMMERCIAL.md, and DECISIONS.md. Session 2 Round 6 complete.

- 2026-04-18: Revised wrenchli-OPERATIONS.md (skill #2) to incorporate 16-skill institutional infrastructure. Updated three-tier escalation structure, agent roster, 16-step skill execution order, cross-skill coordination protocols, and financial and legal approval thresholds. Session 2 Round 7 complete — final round of Session 2.

- 2026-04-19: Round 13.0 prep — renamed MARKETING.md to wrenchli-MARKETING.md and ENGINEERING.md to wrenchli-ENGINEERING.md for naming-convention consistency. Updated cross-references. No content changes.

- 2026-04-19: Round 13a — Added three agents to wrenchli-PEOPLE.md: Sienna Kilmartin (CHRO, reports to founder), Noor Bergström (People Ops Agent, reports to Sienna), and Evren Matsuda (Chief Learning Officer, reports to Sienna). Updated Imani Whitfield's reporting line in wrenchli-ACCURACY.md from Darya Nazari to Evren Matsuda. Part of Round 13 agent roster reconciliation installing 32 missing internal agents across 8 skill files.

- 2026-04-19: Round 13b — Added four agents to wrenchli-OPERATIONS.md: Miles Traeger (COO, reports to founder), Fiona Brenner (Founder Triage Agent, reports to Rhett), Mira Sokolov (Change Management Agent, reports to Miles), and Tomás Rivera (Operations Coordinator, reports to Miles). Part of Round 13 agent roster reconciliation.

- 2026-04-19: Round 13c — Retired Amara Vex and installed Tobias Wren as CSO in wrenchli-STRATEGY.md. Added 5 strategy specialists: Ingrid Halvorsen (Market Signal Aggregation), Rafael Moreau (Category Boundary Monitor), Wells Kincaid (Defensive-Offensive Posture), Theo Ashworth (Competitive Intelligence), Saskia Lindqvist (Market Expansion Readiness) — all reporting to Tobias Wren. Any remaining Amara Vex references in other skill files reported for separate reconciliation. Part of Round 13 agent roster reconciliation.

- 2026-04-19: Round 13c.1 — Cleanup of residual Amara Vex references in roster tables. Updated wrenchli-OPERATIONS.md (lines 45 and 93) and wrenchli-PEOPLE.md (line 335) to reference Tobias Wren in place of the retired Amara Vex. Prior Round 13c change log entry preserved as historical record of the retirement/replacement.
2026-04-19 — Round 13d — Added four agents to wrenchli-MARKETING.md: Cassius Vance (CMO, reports to founder), Juno Blackwood (Marketing Agent, reports to Cassius), Atticus Fenwick (Content Production Agent, reports to Cassius), and Simone Delacroix (Partnership Opportunity Detection Agent, reports to Cassius). Part of Round 13 agent roster reconciliation.

- 2026-04-19: Round 13e-part-1 — Added three C-suite agents to wrenchli-COMMERCIAL.md: Nadia Petrov (CRO), Augustin Reyes (CPO), Helena Ostrowski (CCO). All three share authority over the unified commercial + product + customer governance file per Session 2 Round 9 consolidation. Part of Round 13 agent roster reconciliation. Specialist team for each C-suite agent installs in Round 13e-part-2.

- 2026-04-19: Round 13e-part-2 — Added ten specialist agents to wrenchli-COMMERCIAL.md. Under Nadia Petrov (CRO): Roman Vasquez (Sales/Partnerships), Bianca Torres (BD Monetization), Eamon Walsh (Dealership Discovery, inactive), Yuki Tanaka (Standby Partner Qualification). Under Augustin Reyes (CPO): Isla Kaufmann (Market Timing). Under Helena Ostrowski (CCO): Harper Quinn (Consumer Support), Idris Fontaine (Partner Support), Zaria Abernathy (Customer Success, Verified Score driver), Elias Thorne (Churn Signal — renamed from prior Kai Brennan placeholder to avoid collision with consumer-facing Kai Finance Specialist), Maren Laurent (Customer Insight). Part of Round 13 agent roster reconciliation.

- 2026-04-19: Round 13f — Added three agents to wrenchli-ENGINEERING.md: Keegan Alaric (CTO, reports to founder), Dex Calloway (QA Agent, reports to Keegan), Lorenzo Bianchi (Operational Monitoring Agent, reports to Keegan). Part of Round 13 agent roster reconciliation.

- 2026-04-19: Round 13g — Added Caleb Voss (Cybersecurity Monitoring Agent, reports to Sloane Ashford) to wrenchli-SECURITY.md. Final sub-round of Round 13 agent roster reconciliation. Full Round 13 scope: 32 agent additions across 8 skill files plus one retirement (Amara Vex) and one rename (Kai Brennan to Elias Thorne).

- 2026-04-19 — Round 13.1 — Heading-level normalization for seven pre-existing agent definitions. Promoted to ### Name — Role format: Imani Whitfield (wrenchli-ACCURACY.md, was '## Agent Responsibilities Under Accuracy Discipline'), Declan Morrissey (wrenchli-FUNDRAISING.md, was '## VC Intelligence Function — Declan Morrissey'). Inserted new ### heading anchors (no prior personal heading existed; metadata-only references): Rhett Holloway (wrenchli-OPERATIONS.md), Sloane Ashford (wrenchli-SECURITY.md), Evelyn Marchetti (wrenchli-LEGAL.md), Darya Nazari (wrenchli-FINANCE.md), Amara Oduya (wrenchli-REGULATORY.md). All seven now detectable by heading-based inventory scans.
