# Installed Skills Registry

# Last updated: 2026-04-18

## Active Skills (execution order)

1. wrenchli-STRATEGY.md — Strategic analysis, market evaluation, expansion decisions

2. wrenchli-OPERATIONS.md — Agentic automation, MCP integrations, routines, QA

3. wrenchli-SKILL.md — Brand, voice, technical decisions, codebase memory

4. wrenchli-MARKETING.md — CRO, copywriting, SEO, email sequences

5. wrenchli-SECURITY.md — Cybersecurity posture, threat modeling, incident response, partner security due diligence, audit cadence

6. wrenchli-REGULATORY.md — Regulatory monitoring, multi-jurisdiction compliance, expansion discipline, regulatory authority interaction

7. wrenchli-ACCURACY.md — Anti-hallucination discipline, source citation, Fact Checker protocol, verification across agents

8. wrenchli-DECISIONS.md — Decision Resolution Rubric, veto hierarchy, conflict routing, founder override protocol

9. wrenchli-GOVERNANCE.md — Corporate governance, board operations, decision rights, fiduciary duties, D&O, ESG posture

10. wrenchli-LEGAL.md — Entity structure, IP protection, contract framework, dispute resolution, outside counsel, legal records, litigation readiness

11. wrenchli-FINANCE.md — Financial controls, cap table discipline, unit economics, budget approval, financial reporting, banking and cash management, outside counsel spend authorization, investor relations, Financial Impact Check

12. wrenchli-COMMERCIAL.md — Shop partner lifecycle, integration partner governance, affiliate relationships, data licensing operations, financial services partner transition, product decision rights, assessment flow protection, Pro subscription governance, consumer-facing change approval, product roadmap governance, Commercial Impact Check

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

- 2026-04-18: Dual-track geography revision installed. STRATEGY.md updated to distinguish Marketplace DNA (local density, strict geographic gating) from Digital Product DNA (nationwide data flywheel, no geographic gating). OPERATIONS.md updated to accelerate Support Agent to Phase 2 and add Consumer Outcome Collection, Geographic Demand Heatmap, Outcome Data Quality Monitor, Second-chance Outcome Prompt, and AI Answer Engine Citation Monitor routines. MARKETING.md updated with Consumer Outcome Follow-up email sequence and Geographic honesty rule for consumer-facing copy.

- 2026-04-18: Created wrenchli-SECURITY.md as fifth skill file. Cybersecurity posture now established as core function. Security Check rule added to execution order as gating check after Engineering Check. References forward-declared roles: CISO Sloane Ashford, CTO Keegan Alaric, Cybersecurity Monitoring Agent Caleb Voss. References forward-declared skill files: ACCURACY.md (Round 3), REGULATORY.md (Round 2), OPERATIONS.md revision (Round 12), META_SKILLS.md (Round 17).

- 2026-04-18: Created wrenchli-REGULATORY.md as sixth skill file. Regulatory compliance posture established as first-class function. Regulatory Impact Check added to execution order between Security Check and Brand/Marketing compliance. References forward-declared roles: General Counsel Evelyn Marchetti, Regulatory Intelligence Agent Amara Oduya. References forward-declared skill files: ACCURACY.md (Round 3), DECISIONS.md (Round 4), LEGAL.md (Round 6), OPERATIONS.md revision (Round 12), META_SKILLS.md (Round 17).

- 2026-04-18: Created wrenchli-ACCURACY.md as seventh skill file. Anti-hallucination discipline established as first-class function with eight-layer framework and Fact Checker protocol. Accuracy Check added to execution order between Engineering Check and Security Check. References forward-declared roles: Chief Learning Officer Evren Matsuda, Verification and Accuracy Agent Imani Whitfield. References forward-declared skill files: DECISIONS.md (Round 4), OPERATIONS.md revision (Round 12), META_SKILLS.md (Round 17). Incorporates Fact Checker patterns from meta-skills framework.

- 2026-04-18: Created wrenchli-DECISIONS.md as eighth skill file. Decision Resolution Rubric established with five-role veto authority hierarchy (CISO, General Counsel, CHRO, CFO, CTO). Conflict classification and routing rules specified. Founder override protocol with documentation requirement. References forward-declared roles: Mira Sokolov (Change Management Agent), Rhett Holloway (Chief of Staff), and all five C-suite veto holders. References forward-declared skill files: GOVERNANCE.md (Round 5), OPERATIONS.md revision (Round 12), META_SKILLS.md (Round 17).

- 2026-04-18: Created wrenchli-GOVERNANCE.md as ninth skill file. Corporate governance, board operations, decision rights, stakeholder obligations, and ESG posture established. Stage-Appropriate Governance Framework with pre-seed/seed/Series A/Series B/growth progressions. References forward-declared skill files: LEGAL.md (Round 6), FINANCE.md (Round 7), CRISIS.md (Round 10), OPERATIONS.md revision (Round 12). Session 1 Round 5 of 5 complete — ready for end-of-Session-1 regression test.

- 2026-04-18: Created wrenchli-LEGAL.md as tenth skill file. Entity structure, IP protection, contract framework, dispute resolution, outside counsel discipline, legal records, litigation readiness, and Legal Impact Check established. Owned by Evelyn Marchetti (General Counsel). Coordinates with GOVERNANCE.md, REGULATORY.md, SECURITY.md, and DECISIONS.md. Session 2 Round 1 complete.

- 2026-04-18: Created wrenchli-FINANCE.md as eleventh skill file. Financial controls, cap table discipline, unit economics, budget approval, financial reporting, banking and cash management, outside counsel spend authorization, investor relations mechanics, and Financial Impact Check established. Owned by Darya Nazari (CFO). Coordinates with GOVERNANCE.md, LEGAL.md, and DECISIONS.md. Session 2 Round 2 complete.

- 2026-04-18: Created wrenchli-COMMERCIAL.md as thirteenth skill file. Unified commercial framework covering shop partner lifecycle, integration partner governance, affiliate relationships, data licensing operations, financial services partner transition protocol, product decision rights, assessment flow protection, Pro subscription governance, consumer-facing change approval, product roadmap governance, and the Commercial Impact Check. Owned by Rhett Holloway (Chief of Staff) for partnership operations and Gerrod Parchmon (Founder/CEO) for product authority. Coordinates with LEGAL.md, FINANCE.md, PEOPLE.md, SECURITY.md, REGULATORY.md, MARKETING.md, GOVERNANCE.md, and DECISIONS.md. Session 2 Round 4 complete.
