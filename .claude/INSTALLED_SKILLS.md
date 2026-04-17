# Wrenchli — Installed Claude Skills & Rules

This file tracks all Claude skills and rules installed in the .claude/ directory of this codebase. Update this file whenever a new skill is added, removed, or modified.

## Installed Skills (Standalone Files)

| Skill | File | Purpose | Install Date |
|---|---|---|---|
| Brand Guideline Skill | .claude/SKILL.md | Brand identity, language rules, technical architecture, codebase memory | — |
| Marketing Skill | .claude/MARKETING.md | CRO, copywriting, SEO, email sequences, blog content calendar | — |
| Copy Compliance Skill | .claude/wrenchli-COMPLIANCE.md | Automated brand/language/voice/CTA audit on all user-facing copy before publish | April 17, 2026 |

## Embedded Rules (Inside SKILL.md and MARKETING.md)

These rules live inside the skill files above and apply automatically:

### In SKILL.md
- Context7 Rule — prepend "use context7" on all code-involving prompts
- CEO Evaluation Rule — evaluate features >3 prompts against YC CEO lens
- Engineering Manager Rule — evaluate architectural changes against risk/rollback/dependency framework
- RLS Change Rule — verify guest assessment flow after any RLS change
- RLS Regression Test Rule — verify anonymous read, session results, auth isolation after RLS changes
- Security Scan Rule — run security scan after every deployment

### In MARKETING.md
- CRO Evaluation Rule — evaluate conversion-critical pages against CRO framework

## Pending Install

- Taskmaster — scheduled this week
- Browser Use — scheduled this month
- SEO Audit Skill — scheduled this month
- Auto Researcher — at 500 sessions/month
- Collaborative Writing — at 500 sessions/month
- Superpowers TDD — when first shop partner signs
- Billionaire VC Setup — before investor conversations

## Update Log

- April 17, 2026 — Added Copy Compliance Skill (.claude/wrenchli-COMPLIANCE.md)
- April 10, 2026 — Added RLS Change Rule, RLS Regression Test Rule, and Security Scan Rule to SKILL.md
- April 10, 2026 — Baseline: SKILL.md, MARKETING.md, and embedded rules installed

## Notes

When adding a new skill, follow this sequence:
1. Create the skill file in .claude/
2. Add an entry to the "Installed Skills" table above
3. Add a line to the Update Log
4. Do not commit or deploy until the skill is verified working via a self-test
