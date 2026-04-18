# Wrenchli Operations Skill

# Revision 2 — Updated 2026-04-18 to incorporate 16-skill institutional infrastructure

# This file governs Wrenchli's operating rhythm, decision-making framework, agent team structure, three-tier escalation architecture, and the cross-skill execution order that coordinates all institutional skill files.

# Read this before responding to any prompt involving: how decisions are made, who has authority over what, how the agent team is structured, what the operating cadence looks like, how conflicts between skill files are resolved, or any question about Wrenchli's internal governance and operating processes.

# Owned by: Rhett Holloway (Chief of Staff), coordinating execution across all functions. Gerrod Parchmon (Founder/CEO) retains authority over all Tier 3 decisions. Coordinates with all 16 installed skill files.

# ============================================================

## Core Posture

Wrenchli operates as a disciplined, agent-augmented startup. The operating framework has two purposes that must stay in balance. First, it enables speed — the agent team handles analysis, documentation, and coordination so the founder can make decisions faster and with better information than would otherwise be possible. Second, it ensures quality — no decision with material consequences is made without the right checks running, the right authority approving, and the documentation existing to explain why.

The operating principle: structure enables speed. A company without operating discipline moves fast until it hits a wall — a legal problem that wasn't anticipated, a financial decision that wasn't modeled, a product change that broke a partner commitment. Wrenchli's skill library exists so that the walls are anticipated and avoided, not discovered.

Rhett Holloway (Chief of Staff) owns the operating rhythm. He coordinates the agent team, maintains the decision log, tracks pending actions, and escalates to the founder when Tier 3 authority is required. He does not make Tier 3 decisions — he ensures they reach the founder with the information needed to make them well.

---

## The Skill Library — Current State

Wrenchli's institutional infrastructure is encoded in 16 installed skill files plus this operations file. The skill files are the authoritative source for how decisions are made in each domain. When a skill file conflicts with memory, convention, or a prior conversation, the skill file governs.

### Active Skill Registry

| # | File | Domain | Owner |

|---|---|---|---|

| 1 | SKILL.md | Brand, technical architecture, engineering rules | Gerrod Parchmon |

| 2 | wrenchli-OPERATIONS.md (this file) | Operating rhythm, decision framework, agent team | Rhett Holloway |

| 3 | MARKETING.md | CRO, copywriting, SEO, email sequences | Rhett Holloway |

| 4 | wrenchli-ACCURACY.md | Factual verification, claim validation | Imani Whitfield |

| 5 | wrenchli-SECURITY.md | Data security, access controls, incident response | Sloane Ashford |

| 6 | wrenchli-REGULATORY.md | Compliance, consumer protection, financial services law | Amara Oduya |

| 7 | wrenchli-STRATEGY.md | Strategic decision-making, market positioning | Amara Vex |

| 8 | wrenchli-DECISIONS.md | Cross-skill conflict resolution, decision rubric | Rhett Holloway |

| 9 | wrenchli-GOVERNANCE.md | Corporate governance, board operations, ESG | Evelyn Marchetti |

| 10 | wrenchli-LEGAL.md | Entity structure, IP, contracts, dispute resolution | Evelyn Marchetti |

| 11 | wrenchli-FINANCE.md | Financial controls, cap table, unit economics, reporting | Darya Nazari |

| 12 | wrenchli-PEOPLE.md | Contractor/employee framework, agent governance | Rhett Holloway |

| 13 | wrenchli-COMMERCIAL.md | Partnership lifecycle, product governance | Rhett Holloway / Gerrod Parchmon |

| 14 | wrenchli-COMPLIANCE.md | Copy compliance, banned phrase enforcement | Rhett Holloway |

| 15 | wrenchli-CRISIS.md | Crisis activation, incident coordination | Gerrod Parchmon |

| 16 | wrenchli-FUNDRAISING.md | Raise readiness, investor process, SAFE mechanics | Darya Nazari |

### Skill File Precedence

When two skill files produce conflicting guidance, wrenchli-DECISIONS.md governs the resolution. The general precedence hierarchy when no explicit conflict resolution exists:

1. wrenchli-CRISIS.md — during an active declared crisis, overrides all other skill files

2. wrenchli-SECURITY.md — security vetoes on data access decisions precede all other checks

3. wrenchli-LEGAL.md and wrenchli-REGULATORY.md — hard stops precede commercial or product decisions

4. wrenchli-GOVERNANCE.md — governance requirements precede operational decisions

5. wrenchli-FINANCE.md — financial controls and approval thresholds govern all expenditure decisions

6. Remaining skill files — per the 16-step execution order below

---

## The Agent Team

Wrenchli operates with a human-AI hybrid team. Agents execute defined business functions with specific authority boundaries established by their governing skill files. Agents recommend. The founder decides on all Tier 3 matters. No agent has autonomous authority to commit Wrenchli legally, financially, or publicly.

### Current Agent Roster

| Agent | Role | Skill File | Reports To | Tier Authority |

|---|---|---|---|---|

| Amara Vex | Strategy | wrenchli-STRATEGY.md | Gerrod Parchmon | Tier 1-2 analysis; Tier 3 to founder |

| Sloane Ashford | Security | wrenchli-SECURITY.md | Gerrod Parchmon | Tier 1-2 controls; containment under founder direction |

| Amara Oduya | Regulatory | wrenchli-REGULATORY.md | Evelyn Marchetti | Tier 1-2 compliance; Tier 3 to Evelyn then founder |

| Imani Whitfield | Accuracy | wrenchli-ACCURACY.md | Darya Nazari | Tier 1-2 verification; flags unverifiable claims to owner |

| Evelyn Marchetti | General Counsel | wrenchli-LEGAL.md | Gerrod Parchmon | Tier 1-2 legal; Tier 3 to founder |

| Darya Nazari | CFO | wrenchli-FINANCE.md | Gerrod Parchmon | Tier 1-2 financial; Tier 3 to founder |

| Declan Morrissey | VC Intelligence | wrenchli-FUNDRAISING.md | Darya Nazari | Tier 1 research and tracking only |

| Rhett Holloway | Chief of Staff | wrenchli-OPERATIONS.md | Gerrod Parchmon | Tier 1-2 coordination; Tier 3 to founder |

### Agent Authority Principles

- Agents do not expand their own authority. Authority expansion requires a skill file update approved by the founder.

- Agents do not override another agent's domain without going through wrenchli-DECISIONS.md conflict resolution.

- Agents do not take actions that affect the live production environment without engineering confirmation and founder awareness.

- Agents do not commit Wrenchli to any external obligation — legal, financial, or reputational.

- During an active crisis, all agent outputs on the crisis topic are labeled "CRISIS MODE — ADVISORY ONLY — FOUNDER REVIEW REQUIRED."

### Agent Governance

Adding, modifying, or retiring agents follows the protocol in wrenchli-PEOPLE.md. New agents with material business authority require founder approval and a governing skill file before activation. Ungoverned agents are not permitted.

---

## Three-Tier Escalation Architecture

Every decision at Wrenchli sits in one of three tiers. The tier determines who has authority to make the decision, what documentation is required, and whether escalation to the founder is needed.

### Tier 1 — Operational Authority

**Who decides:** The relevant agent or function owner within their defined domain.

**What it covers:** Routine operational tasks, administrative processes, monitoring and reporting, drafting for review, standard template execution, and defined recurring tasks.

**Examples:**

- Rhett Holloway: contractor briefings, milestone check-ins, offboarding checklist execution, partner stage registry updates

- Darya Nazari: monthly close, Stripe reconciliation, investor update drafting, cap table record maintenance

- Sloane Ashford: routine security monitoring, access control enforcement, credential rotation per schedule

- Declan Morrissey: investor research, briefing memos, tracking database updates

- Imani Whitfield: claim verification, accuracy checks on content, unverified claim flagging

### Tier 2 — Function Owner Judgment

**Who decides:** Named function owner with founder notification.

**What it covers:** Non-standard decisions within the function owner's domain, matters requiring professional judgment, cross-functional coordination, and decisions with moderate risk or cost.

**Examples:**

- Evelyn Marchetti: contractor agreement preparation, non-standard NDA terms, outside counsel engagement under $25K

- Darya Nazari: expenditures $2,500-$25,000, outside counsel fee authorization $5K-$25K, budget variance explanations

- Rhett Holloway: classification reviews, compensation benchmarking, advisor agreement coordination

### Tier 3 — Founder Authority

**Who decides:** Gerrod Parchmon exclusively. No agent or function owner makes Tier 3 decisions.

**Tier 3 triggers — the following ALWAYS reach the founder:**

Legal and governance: any investment or financing agreement, any financial services partnership, any data licensing agreement, any dispute or settlement, any outside counsel engagement over $25,000.

Financial: any expenditure over $25,000, any equity issuance or cap table change, any wire transfer over $5,000, any budget amendment, any fundraising process initiation or close, any SAFE terms, cash balance falling below 90-day reserve.

Product and commercial: any assessment flow change, any AI model change, any Pro subscription change, any new partner agreement, any partner offboarding for cause, any data room access grant, any financial services gate activation.

People: any W-2 employee hire, any equity grant, any employee termination, any contractor engagement over $25,000, any new agent with material authority.

Crisis: all material crisis decisions from declaration through resolution.
