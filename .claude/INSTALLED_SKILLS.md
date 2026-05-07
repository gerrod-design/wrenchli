# Installed Skills Registry

# Last updated: 2026-05-06

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

17. wrenchli-SENSING.md — Situational awareness layer: founder time observation, external signal scanning, agent roster drift, capability/innovation gap detection, decision quality review. Parallel-track (NOT in execution order). Owned by Astrid Vellholm (Chief Sensing Officer). Signals only — no autonomous action authority.

18. wrenchli-CONSUMER_ADVISORS.md — Governs the five consumer-facing AI advisor personas (Mike, Sam, Jess, Kai, Priya), the architectural firewall between the consumer-advisor and internal-agent populations, sampling-based accuracy audit loop, and lifecycle discipline (activation, pause, retirement). Owned jointly by Augustin Reyes (CPO, advisor behavior) and Helena Ostrowski (CCO, advisor performance). Coordinates with ACCURACY.md, LEGAL.md, SECURITY.md, MARKETING.md, OPERATIONS.md.

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

## Round 13.2 (2026-04-20) — Stub Definition Population

Populated full governance definition blocks for 2 of 5 stub agent anchors installed in Round 13.1:
- Rhett Holloway (Chief of Staff) in wrenchli-OPERATIONS.md
- Darya Nazari (CFO) in wrenchli-FINANCE.md

Each now has all four required governance fields: Reports to, Authority tier, Domain, and Veto power or Constraints. Heading anchors and surrounding skill file content preserved unchanged.

## Round 13.2 (2026-04-19) — Stub Definition Completion

Round 13.2 — Completed five stub agent definitions installed as heading-only anchors in Round 13.1. Populated full governance definition blocks (Reports to, Authority tier, Domain, Capabilities, Veto or Constraints) for Rhett Holloway (wrenchli-OPERATIONS.md), Darya Nazari (wrenchli-FINANCE.md), Evelyn Marchetti (wrenchli-LEGAL.md), Sloane Ashford (wrenchli-SECURITY.md), Amara Oduya (wrenchli-REGULATORY.md). Content sourced from authoritative Agent Roster (Revision 3) and Session 2 conversation history. Brings all 41 formally defined internal agents to complete governance specification with all four required fields present.

## 2026-05-02 — Round 14.0 — Sensing Skill Installed

Created wrenchli-SENSING.md as seventeenth skill file. Situational awareness layer covering founder time observation, external signal scanning, agent roster drift detection, capability/innovation gap monitoring, and decision quality review. Owned by Astrid Vellholm (Chief Sensing Officer, Tier 1 — observation/classification/routing/recommendation only, no autonomous action authority). Five sub-agents installed: Iver Halstein, Solenne Marchetto, Tomek Brandeis, Yusra Eldridge, Calix Worthington.

**Parallel-track skill — NOT inserted into the eight-step execution order.** The Strategy → Operations → CEO → Engineering → Accuracy → Security → Regulatory → Brand chain is unchanged. Sensing runs on its own cadence and surfaces signals to the existing C-suite per the coordination map inside the skill file.

**Calibration mode (first 30 days, through 2026-06-01):** Daily morning brief, weekly synthesis, monthly capability audit, and monthly decision quality review are invoked manually by the founder. No automated triggers or scheduled workflows built yet — automation work deferred until after calibration.

No existing skill file was modified as part of this integration.

## 2026-05-02 — Round 14.1 — Sensing Cadence Revision

Updated wrenchli-SENSING.md cadence specification to Option C pattern — Sensing daily brief Tue-Fri, Sensing weekly synthesis Mon, both at 7am ET. Added Cadence Coordination Note documenting separation from existing morning-briefing-daily operations cron. Calibration mode unchanged. No other skill files modified.

## 2026-05-02 — Round 14.2 — Sensing Severity Bands Persisted

Persisted severity classification bands (HIGH/MED/LOW definitions plus founder-authorized-actions rule) into wrenchli-SENSING.md after first calibration cycle. No other skill files modified.

## 2026-05-02 — Round 14.4 — Consumer AI Functions Disabled (COPY CHECK)

Disabled three consumer-facing AI edge functions pending COPY CHECK remediation: chat (Mike orchestrator), analyze-car-audio, analyze-video-combined. Reason: Round 14.3 scan confirmed active runtime violations of banned vocabulary in wrenchli-COMPLIANCE.md (instruction-text and template-text leaks of "diagnose"/"diagnosis" reaching Claude context and consumer output). HTTP routes preserved so frontend continues to function; function bodies replaced with the standard maintenance message pointing users to the assessment flow at /agent-diagnosis. Re-enablement gated on prompt rewrites passing a post-rewrite COPY CHECK scan with zero instruction or template leaks. agent-diagnose, diagnose, diagnose-vehicle, and diagnose-damage-photo deliberately NOT disabled — they carry violations too but disabling them would take the core symptom assessment flow offline; they will be addressed via prompt rewrite. No frontend changes. No other edge functions modified.

## 2026-05-02 — Round 14.5 — Chat Function Re-enabled (COPY CHECK Compliant)

Chat edge function (Mike orchestrator) re-enabled after Round 14.4 disablement. Replaced maintenance stub with v2 system prompt (staged at /mnt/documents/chat-mike-prompt-v2.md, COPY CHECK scan PASS — 7 matches, all instructional anti-references or legacy URL paths, zero verbatim consumer-output leaks). Tool parameter names renamed for Claude-facing context only: diagnose_vehicle → assess_symptoms, diagnose_damage_photo → assess_damage_photo, diagnosis_title → assessment_title, diagnosis_code → assessment_code. DB column names diagnosis_title and diagnosis_code unchanged — function-to-DB write boundary in executeTool() maps assessment_* back to diagnosis_* before calling downstream estimate-repair endpoint, preserving existing schema and frontend reads/writes. /developers page public API documentation COPY CHECK violation logged as separate workstream (deferred to "This Month" backlog). Live test: input "My 2018 Honda Civic is making a grinding noise when I brake near intersections" — function returned real Mike response (not stub), zero banned vocabulary in customer-facing output, conversation correctly opened with name-gathering question per FLOW step 2 before invoking assess_symptoms (expected behavior — tool call deferred until vehicle + symptom context collected across turns). Result: PASSED. analyze-car-audio and analyze-video-combined remain stubbed pending separate prompt rewrites. No frontend changes. No other edge functions or skill files modified.

## 2026-05-02 — Round 14.6 — analyze-car-audio Re-enabled (COPY CHECK Compliant)

analyze-car-audio edge function re-enabled after Round 14.4 disablement. Replaced maintenance stub with v2 system prompt (staged at /mnt/documents/analyze-car-audio-prompt-v2.md, COPY CHECK scan PASS — 6 matches, all on the negative-constraint instruction line listing banned vocabulary verbatim for the model to avoid; zero consumer-output leaks). Mike persona reframed from "master automotive diagnostician" (legacy v1) to "knowledgeable vehicle advisor" to align with brand/legal discipline in wrenchli-COMPLIANCE.md and the "knowledgeable neighbor" tone in mem://core. Function continues to use Lovable AI Gateway with google/gemini-2.5-flash (no Anthropic dependency, no tool definitions); gateway endpoint corrected from legacy api.anthropic.com URL to ai.gateway.lovable.dev. Frontend unchanged — /analyze-car-audio route name and free-form text response shape preserved. Live test: stand-in transcript "Loud rhythmic clicking from the front-right wheel area, faster when the car accelerates, disappears when braking. Vehicle: 2018 Honda Civic." Response: real Mike output (CV joint / wheel bearing assessment, schedule-soon urgency, professional-recommended, ended with follow-up question about vibrations). Length: 3 sentences plus closing question. Banned-vocabulary scan: 0 matches. Result: PASSED. analyze-video-combined remains stubbed pending Round 14.7. No frontend changes. No other edge functions or skill files modified.

## 2026-05-02 — Round 14.6.1 — Native Audio Analysis Exception Documented

Documented native audio analysis exception in wrenchli-ENGINEERING.md. Round 14.6 deploy of analyze-car-audio on google/gemini-2.5-flash is now compliant with updated governance rather than being a regression against the prior all-Claude rule. Exception scoped to waveform-level audio analysis only, with sunset condition tied to Anthropic shipping native audio input support. Reviewed quarterly. analyze-car-audio (live) and analyze-video-combined (pending Round 14.7) are the only functions currently covered. No edge function or other skill file modified.

## 2026-05-02 — Round 14.7 — analyze-video-combined Re-enabled (COPY CHECK Compliant)

analyze-video-combined edge function re-enabled after Round 14.4 disablement. Replaced maintenance stub with v2 system prompt (staged at /mnt/documents/analyze-video-combined-prompt-v2.md, COPY CHECK PASS). Mike persona reframed from "master automotive diagnostician" (legacy v1) to "knowledgeable vehicle advisor". Highest-risk template heading "Combined Diagnosis:" remediated to "Combined Assessment:" — verified absent in live test output. Function operates under the documented Native Audio Analysis Exception (Round 14.6.1, wrenchli-ENGINEERING.md): Lovable AI Gateway with google/gemini-2.5-flash, multi-modal image+audio input. Gateway endpoint set to ai.gateway.lovable.dev/v1/chat/completions (legacy api.anthropic.com URL not present in restored scaffold). Frontend unchanged. Live test: stand-in input — 4 frames (oil pan gasket staining + fresh driveway drip) + audio (light idle with rhythmic tapping in sync with RPM) + 2015 Toyota Camry, 120,000 miles. Response: real Mike output with full four-part structure (What I SEE, What I HEAR, Combined Assessment, Urgency Level + Next Step), conversational tone preserved, identified oil pan gasket leak correlated with tapping sound suggesting low oil level, urgent recommendation. Banned-vocabulary scan: 0 matches. "Combined Diagnosis:" heading: not present. "Combined Assessment:" heading: present. Result: PASSED.

## 2026-05-02 — Wave 1 Closeout Summary

Wave 1 complete (Rounds 14.4 through 14.7, plus 14.6.1 governance update). All three consumer-facing AI surfaces previously stubbed for COPY CHECK violations are now live with compliant prompts: chat (Mike orchestrator + specialist routing, Anthropic Claude), analyze-car-audio (Gemini per documented native audio exception), analyze-video-combined (Gemini per documented native audio exception). Eleven additional Anthropic-calling edge functions have COPY CHECK violations in their hardcoded prompts but ship more constrained outputs (structured tool responses) and remain operational while awaiting Wave 2 and Wave 3 rewrites. Wave 2 scope: agent-diagnose, diagnose, diagnose-vehicle, diagnose-damage-photo. Wave 3 scope: recommend-products, estimate-repair, api-estimate-repair, generate-recommendation. report-diagnostic-outcome and audit-wrenchli-site flagged as review-needed.

## 2026-05-02 — Round 14.8 — TASKS.md Updated for Wave 1 Closeout and Wave 2/3 Planning

TASKS.md updated to reflect Wave 1 closeout and the structure of Wave 2, Wave 3, and broader architectural alignment work. Existing audit-copy errors item reframed as static-page workstream separate from runtime AI prompt rewrites. Wave 2 planning task added under This Week (parallel-deploy strategy, traffic routing, validation, rollback, ordering decision). Wave 3, /developers page COPY CHECK fix, and quarterly architectural alignment audit (ideally automated via Sensing's Tomek Brandeis) added under This Month. No edge function or other skill file modified.

## 2026-05-06 — wrenchli-CONSUMER_ADVISORS.md Installed

Registered wrenchli-CONSUMER_ADVISORS.md as eighteenth skill file. Governs the five consumer-facing AI advisor personas (Mike, Sam, Jess, Kai, Priya) embedded in the Wrenchli product at wrenchli.net. Establishes the architectural firewall between the consumer-advisor population and the internal agent network (twelve C-suite agents and twenty-nine specialists), the sampling-based accuracy audit loop coordinated with Imani Whitfield (Fact Checker Protocol), and the lifecycle discipline for activation, pause, and retirement of consumer-facing agents. Owned jointly by Augustin Reyes (CPO, advisor behavior — prompts, routing, persona definition) and Helena Ostrowski (CCO, advisor performance — consumer experience quality, feedback loops, lifecycle status). Coordinates with wrenchli-ACCURACY.md, wrenchli-LEGAL.md, wrenchli-SECURITY.md, wrenchli-MARKETING.md, and wrenchli-OPERATIONS.md. Parallel-track skill — NOT inserted into the eight-step execution order; consumer-advisor governance runs alongside internal governance. No edge function or other skill file modified. Note: this registration is independent of the in-flight PocketOS-class security remediation (Batch 1, Task 1.1 still pending founder report).

## 2026-05-06 — Round 14 — Consumer Advisor Operations Patch Applied

Applied six surgical edits to wrenchli-OPERATIONS.md per the operations patch: (1) added "Consumer-advisor coordination" note after the 16-step execution order (16 steps unchanged); (2) appended a separate Consumer Advisor Roster sub-table below the internal C-suite roster, listing Mike/Sam/Jess/Kai/Priya with wrenchli-CONSUMER_ADVISORS.md as governing skill file and Augustin Reyes + Helena Ostrowski as joint owners; (3) added a sixth Agent Authority Principles bullet establishing the architectural firewall at the operating-skill level; (4) appended a sentence to the Agent Governance paragraph cross-referencing wrenchli-CONSUMER_ADVISORS.md as the operative file for consumer-advisor lifecycle and the Sample Audit Pipeline. Three-tier escalation architecture, the 16-step order numbering, the five hard-veto roles, and the Decision Resolution Rubric were not modified.

## 2026-05-06 — Round 14.1 — Consumer Advisor Lifecycle Finalization (Kai & Priya)

Closed out the pending disposition for Kai (Finance Specialist) and Priya (Prevention Coach) under the lifecycle protocol in wrenchli-CONSUMER_ADVISORS.md. Both personas remain on the consumer-advisor roster as Paused, with documented reactivation triggers.

**Kai — Finance Specialist.** Status: Paused. Reactivation trigger: completion of the six financial-services gates in SKILL.md. Founder estimate places financing capability within 6 months, well inside the 12-month persona-reuse window. Brand investment in the persona is preserved.

**Priya — Prevention Coach.** Status: Paused — under investigation. Reactivation trigger: completion of a documented persona review by Augustin Reyes and Helena Ostrowski covering original removal rationale, current product capability, scope-overlap with Mike, and refreshed prompt alignment. Review completion target: 90 days from this entry (target 2026-08-04). If review does not complete within 90 days, default action flips to retirement.

**New governance rule added** to wrenchli-CONSUMER_ADVISORS.md under "Lifecycle Discipline for Consumer Advisors": Maximum Pause Duration. Concrete external triggers have no maximum but require quarterly review of validity. Investigation triggers have a 90-day maximum, extendable once by founder approval. Undefined triggers are not permitted.

**Concurrent updates applied this round:**
- wrenchli-CONSUMER_ADVISORS.md "Lifecycle Status — Current State" table updated with finalized Kai and Priya entries.
- wrenchli-COMMERCIAL.md Part Two "explicitly deferred features" — Kai and Priya entries replaced with paused-with-trigger language and cross-reference to wrenchli-CONSUMER_ADVISORS.md.
- memory.md "Removed Features — Do Not Rebuild" — Kai and Priya entries replaced with paused-with-trigger language and cross-reference to wrenchli-CONSUMER_ADVISORS.md.

**Concurrent updates NOT applied (gaps to flag):**
- Wrenchli Agent Package (HTML and PDF): no Agent Package artifact exists in the project repo. Roster column update from "(product)" placeholder to "wrenchli-CONSUMER_ADVISORS.md" and Status column addition for rows 1–5 deferred until the Agent Package is sourced or recreated. Founder owns this gap.
- Standalone decision log: no standalone decision log file exists in the project. The Round 14.1 decision log entry is recorded inline below in lieu of a separate file.

**Decision log entry (Round 14.1):**
- decision_date: 2026-05-06
- conflict_classification: n/a — scheduled lifecycle disposition, no conflict
- agents_involved: Augustin Reyes, Helena Ostrowski, Rhett Holloway, Gerrod Parchmon
- decision_description: Finalize lifecycle disposition for Kai and Priya following installation of wrenchli-CONSUMER_ADVISORS.md in Round 14.
- recommendations_produced: Three options surfaced — formal retirement, paused with reactivation trigger, or split disposition. Founder selected paused-with-trigger for both with different trigger types (concrete external trigger for Kai, investigation trigger for Priya).
- resolution_path: Tier 3 founder decision; Augustin and Helena execute lifecycle documentation; Rhett records and coordinates concurrent file updates.
- decision_maker: Gerrod Parchmon
- decision: Both personas remain Paused on the consumer-advisor roster. Kai reactivation gated on six financial-services gates per SKILL.md. Priya reactivation gated on documented persona review with 90-day target; default action flips to retirement if review not complete within 90 days. New governance rule added to wrenchli-CONSUMER_ADVISORS.md establishing maximum pause durations.
- reasoning: Kai pause is structurally honest given documented trigger and near-term financing roadmap; retirement would waste persona investment within the 12-month reuse window. Priya pause preserves brand investment per founder priority while the missing removal rationale is reconstructed; 90-day forcing function prevents indefinite drift.
- dissenting_views: None at the agent layer.
- success_criteria: Kai — reactivation when six gates close, with operational continuity (no Kai references during pause, no consumer-facing financing language). Priya — review completion within 90 days resulting in either documented reactivation or clean retirement.
- review_date: 30/60/90-day Priya progress checks (2026-06-05, 2026-07-06, 2026-08-04). Kai reviewed at next monthly roadmap review and at six-gate close.

**Founder check-in cadence:**
- Kai status reviewed at next monthly roadmap review and at the financial-services six-gate close.
- Priya status reviewed at the 30-day, 60-day, and 90-day marks. At 90 days, the review either reactivates Priya, requests one 90-day extension, or executes default retirement under wrenchli-PEOPLE.md.

**No changes to:** the architectural firewall, the Sample Audit Pipeline behavior, the three-tier authority architecture, the 16-step execution order, the five hard-veto roles, or the Decision Resolution Rubric. Round 14.1 is a closeout, not a structural change.
