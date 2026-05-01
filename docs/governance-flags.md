# Governance Flags — Cleanup Tracker

Append-only log of issues found in `.claude/` skill files, governance docs, and process. Do not auto-fix. Each item routes to the named owner for human resolution.

| Date | File / Area | Issue | Severity | Owner | Status |
|---|---|---|---|---|---|
| 2026-05-01 | `.claude/wrenchli-FINANCE.md` | File ends mid-sentence at line 576: `*Know what every dollar costs. Know what eve` — Closing Principle was truncated during install. Original wording is unknown to the AI; only founder/CFO can restore the intended sentence. | Medium (governance integrity, not runtime) | Gerrod Parchmon (restore text) + Darya Nazari (confirm intended wording) | Open |

## Recommended follow-ups (separate sessions only)

1. **Integrity sweep.** Run a one-time check across all 16 `.claude/wrenchli-*.md` files for: missing trailing newline, sentence fragments at EOF, unbalanced code fences, orphan `---` separators. Produce a report. Do NOT auto-edit.
2. **CI check.** Add a lightweight workflow that fails when any `.claude/wrenchli-*.md` file ends with an incomplete sentence (heuristic: no terminal `.`, `!`, `?`, or `*` on the final non-empty line).

Per the Core memory rule **"Fixes & audits never in the same step,"** these follow-ups must each be approved as standalone tasks.
