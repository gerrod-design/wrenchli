## Goal

Convert `user-uploads://Wrenchli_Agent_Package_Source_Revision_4.md` into two artifacts in `/mnt/documents/`:

- `Wrenchli_Agent_Package_Rev4.html` — self-contained, web-viewable
- `Wrenchli_Agent_Package_Rev4.pdf` — print-rendered from the same HTML

Both match wrenchli.net brand (no Plus Jakarta Sans — using site tokens per your decision).

## Visual system (locked to wrenchli.net)

Pulled from `src/index.css` and existing dark-theme overrides:

- Background: `#0F1117` (dark) with warm cream `#F8F8F6` for inset cards
- Primary accent: Wrenchli orange `#E07B39`
- Secondary accent: deep blue `hsl(212 52% 25%)`
- Typography: **Poppins** 600/700/800 for headings, **Inter** 400/500/600 for body, **DM Sans** for stats — same stack used across the app
- No symmetric 3-col grids on desktop (per Core memory)

## Layout structure

Mirrors the Rev 3 organization implied by the source:

1. **Cover** — full-bleed dark hero, orange rule, title, confidential tag, stat table as a 2-column key/value strip
2. **Section blocks** — left orange tick + section number, large Poppins H2, body in Inter, generous vertical rhythm
3. **Agent grid** — card-per-agent (name, role, tier badge, reporting line, governing skill file). Asymmetric 2-col on desktop, single col on mobile
4. **Skill-file blocks** — compact rows: filename (mono), domain, operative rule
5. **Governance / execution-order** — numbered vertical rail with orange step pips
6. **Footer** — revision, date, maintainer, confidential mark

## Build approach (single Python script)

`/tmp/build_agent_package.py`:

1. Read the source markdown
2. Parse with `markdown-it-py` (preserves tables, lists, headings)
3. Post-process tokens to wrap agent rosters and skill listings into branded card sections (detected by section heading patterns like "Agent Roster", "Skill Files", "Execution Order")
4. Inject into an HTML template with inline CSS (Google Fonts via `<link>`, fallback system stack for offline PDF)
5. Write `Wrenchli_Agent_Package_Rev4.html` to `/mnt/documents/`
6. Render PDF via Playwright/Chromium print at A4, 18mm margins, `print-color-adjust: exact` so the dark theme survives
7. Write `Wrenchli_Agent_Package_Rev4.pdf` to `/mnt/documents/`

## QA pass (Augustin)

Mandatory before delivery:

1. `pdftoppm -jpeg -r 150 Wrenchli_Agent_Package_Rev4.pdf /tmp/qa/page`
2. `code--view` every page image (not just page 1)
3. Check: clipped text, broken tables, agent cards splitting awkwardly across page breaks, font fallback to Times (= Google Fonts didn't embed), orange rendering as muted brown (color profile issue), confidential footer overlap
4. Open the HTML in headless and screenshot at 1280px and 375px to confirm responsive layout
5. Fix → re-render → re-inspect until clean
6. Report findings inline in chat with "issues found / fixes applied" or "clean pass, nothing flagged"

## Deliverables

Two `<lov-artifact>` tags at the end:

```
<lov-artifact path="Wrenchli_Agent_Package_Rev4.html" mime_type="text/html"></lov-artifact>
<lov-artifact path="Wrenchli_Agent_Package_Rev4.pdf" mime_type="application/pdf"></lov-artifact>
```

Plus a 3-line QA summary from Augustin.

## Out of scope

- Editing the markdown source content (verbatim conversion only)
- Updating any in-repo files (`src/`, `.claude/`, `public/`) — this is a `/mnt/documents/` artifact job, no app code touched
- Resuming PocketOS Batch 1 Task 1.1 — still awaiting your A/B/C decision on the backup posture report
