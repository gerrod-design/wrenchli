# BUILD REPORT — Fix F1: Bundle String Leak (branch `fix/bundle-string-leak`)

Date: 2026-10-31. Job class: S (standard build to a written spec).
Clone: `~/workspace/tmp/rea-fix1-build/repo`, cloned from `~/workspace/tmp/agentic-ship/repo`.
Base verified before work: `git rev-parse HEAD^{tree}` = `5a1f1e33341928282b27ed52c65c748f855b5926` — matches the shipped Oct 27 production tree exactly.
Commit: `c50a505` on `fix/bundle-string-leak` (local only — nothing pushed, deployed, or sent to production).

---

## 1. Investigation

### 1a. Where the string lives and how it ships

- The audit's phrase exists in exactly **one file** in the repo:
  `docs/wrenchli-daily-digest-spec-v1.md`, **line 88**:
  > …generates the "What matters most today" synthesis via the existing Lovable AI Gateway (model: `google/gemini-2.5-flash`, capped at 3 lines).
  A repo-wide grep for `existing Lovable AI Gateway` returns that single hit. The "What matters most today" feature name also appears at line 34 of the same document.
- It ships because `src/pages/AdminDigestSpec.tsx:4` imports the **entire 15,041-byte internal spec document** into the client:
  `import specMarkdown from "../../docs/wrenchli-daily-digest-spec-v1.md?raw";`
  and renders it as markdown. This is the **only `?raw` import in `src/`** — the leak is confined to this one document.
- Route: `/admin/digest-spec`, registered at `src/App.tsx:82` behind `ProtectedRoute`, with the component statically imported at `src/App.tsx:41` — so the text sits in the main JS chunk (pre-fix local build reproduced the production chunk name `index-iMbgv1E6.js`). Route gating is irrelevant to the leak: bundle chunks are public static assets whoever can or cannot view the page.

### 1b. The truth question — does anything actually call a Lovable AI gateway?

**No. Nothing in the codebase calls a Lovable AI gateway, and the feature in the leaked text was never built.**

Evidence:
- Zero occurrences in `supabase/functions/` (and the whole repo) of `ai.gateway.lovable.dev`, any `LOVABLE_*` env reference, any `chat/completions` call, or any `google/gemini*` model ID.
- The complete set of outbound AI hosts in `supabase/functions/` is `api.anthropic.com` (18 references; models `claude-sonnet-4-6` / `claude-sonnet-5`) and `generativelanguage.googleapis.com` (2 references; the **native** Gemini API, models `gemini-3.6-flash` / `gemini-3.8-flash`).
- `supabase/functions/analyze-car-audio/index.ts:3-7` documents the history directly: it uses the native Gemini API *because* "the OpenAI-compatible gateway endpoint silently drops Gemini's `inlineData` audio parts" — i.e., a gateway was abandoned in favor of a direct call; the live code calls Google directly.
- The digest itself does not exist as running code. The document is a Phase 1 **spec** dated 2026-04-25, status "pending founder review." None of its implementation artifacts exist: no `digest-contrib-*` edge functions (none in `supabase/functions/`), no `public.daily_digest_history` table in any migration, no N8N `daily-digest-orchestrator` workflow (N8N appears elsewhere in the repo only for unrelated webhook plumbing — `trigger-n8n-workflow`, `drain-webhook-queue`). The spec's own closing note (final paragraph) states: "No code, schema, workflow, or secret has been created as part of this prompt."
- The "What matters most today" synthesis is therefore **dead spec text**: not invoked from the client, not run by any cron, not implemented in any function.

### 1c. Stop condition

**Not triggered.** Because no live function routes through a Lovable gateway, there was nothing to leave unrerouted; parts 2 and 3 proceeded in full. The audit's open question is answered: the migrated backend calls Anthropic and Google directly, and the Lovable reference is a stale planning detail in an unbuilt spec, not a live routing fact. (This also means the RISK-04-adjacent worry — production quietly depending on the retired Lovable platform — is not supported by the code. The separate question of who can still *log in* to the retired Lovable project is outside this repo and outside this fix.)

---

## 2. The fix (Part 2) — exact diff summary

One content file changed: `docs/wrenchli-daily-digest-spec-v1.md` (9 lines touched, all in the implementation/monitoring narrative, §4 and §7, plus one line in §6). The page, the route, and the document's substantive content are unchanged; no behavior changed anywhere.

Removed / generalized:
| Location | Before (specifics) | After |
|---|---|---|
| §4 Orchestration line | "N8N workflow `daily-digest-orchestrator`, scheduled via N8N cron" | "scheduled orchestration workflow" |
| §4 step 1 | "N8N main workflow starts" | "The orchestration workflow starts" |
| §4 step 2 | "a dedicated Supabase Edge Function (e.g., `digest-contrib-augustin`, `digest-contrib-keegan`)" | "a dedicated per-agent edge function" |
| §4 step 3 | "via the existing Lovable AI Gateway (model: `google/gemini-2.5-flash`, capped at 3 lines)" | "via an AI model call (capped at 3 lines)" |
| §4 step 5 | "Insert row into `public.daily_digest_history`" | "Insert a row into the digest history table" |
| §4 step 6 | "via Resend (`RESEND_API_KEY` already configured) to `gerrod@wrenchli.net`" | "via the configured email provider to the founder" |
| §6 (Tobias) | "needs N8N workflow" | "needs orchestration plumbing" |
| §7 send failure | "if Resend returns non-2xx … `sent` row to `daily_digest_history` … (`send-alert-email` + SMS escalation path)" | "if the email provider returns non-2xx … `sent` row to the digest history table … (existing alert escalation path)" |
| §7 per-contributor | "if a contribution Edge Function throws" | "if a contribution function throws" |

Verified after edit: the document contains zero residual matches for `lovable`, `gateway`, `gemini`, `resend`, `n8n`, `digest-contrib`, `daily-digest-orchestrator`, `send-alert-email`, `RESEND_API_KEY` (case-insensitive grep).

**Scoping judgment, flagged for the gate:** §5 (schema) and the §6 data-source lines still name internal tables (e.g. `daily_digest_history`, `diagnostic_sessions`) — that content *is* the spec's substantive data design, not routing/plumbing, so I left it under the brief's "minimally" instruction. Whether the whole internal spec should ship to the browser at all is the route/page question the brief explicitly reserved (F2), and it is not decided by this fix. The page itself renders the redacted text: the post-fix bundle contains the spec with "via an AI model call" in place of the gateway sentence (verified by grep on the built chunk).

---

## 3. Pre-ship bundle scan (Part 3)

- New file: `scripts/check-bundle-leaks.mjs`; wired in `package.json` as `"check:bundle": "node scripts/check-bundle-leaks.mjs"`.
- Behavior: scans `dist/assets/**/*.js` case-insensitively for the deny-list — `lovable`, `ai gateway`, `google/gemini`, `gemini-2.5`, `internal_secret`, `service_role` — prints each matched term, occurrence count, and file; exits 1 on any match, 0 on clean, 2 if the build output is missing.
- **Tuning:** no term had to be demoted. `internal_secret` and `service_role` produced **zero** matches even in the pre-fix bundle (no false positives from the Supabase client library), and the /developers GPT-referral copy matched nothing on the list, so the deny-list stands as specified and the warn-list is empty (the script documents the bar for adding a warn term).

### Demonstration — before (pre-fix source, full production build)

```
LEAK: "lovable" found 1x in dist/assets/index-iMbgv1E6.js
LEAK: "ai gateway" found 1x in dist/assets/index-iMbgv1E6.js
LEAK: "google/gemini" found 1x in dist/assets/index-iMbgv1E6.js
LEAK: "gemini-2.5" found 1x in dist/assets/index-iMbgv1E6.js

check-bundle-leaks: FAIL — 4 deny-list match(es) in the built bundle. Remove the internal text from the source before shipping.
(exit 1)
```

### Demonstration — after (post-fix source, full production build)

```
check-bundle-leaks: PASS — scanned 5 bundle file(s), 6 deny terms, 0 matches.
(exit 0)
```

---

## 4. Verification against baselines

All runs on this clone, post-fix tree, Node v24.22.1.

- **Production build** (`npm run build` = vite build + SSR build + prerender): exit 0, both pre-fix and post-fix; prerender completed (17 routes + sitemap, 18 URLs). The pre-fix build reproduced the production chunk hash (`index-iMbgv1E6.js`), confirming the clone builds the shipped artifact.
- **check:bundle**: FAIL pre-fix (above), PASS post-fix (above).
- **Vitest** (`npm test`): **476 passed, 2 failed** — identical to baseline. The 2 failures are exactly the known Azure-TTS pair:
  `useTextToSpeech > falls back to browser TTS when Azure fails` and
  `useVoiceChatOrchestrator > speak calls Azure TTS when voice is enabled`.
- **TypeScript** (`npx tsc -p tsconfig.app.json --noEmit`): **50 errors** post-fix. I captured the full error output on the pristine tree before editing (also 50) and diffed the complete sorted error lines pre vs post: **the sets are byte-identical** — the change adds no errors and removes none.

## 5. Scope surprises

1. The leak was bigger than one string in one sense and smaller in another: it is not an annotation in a component — an **entire 15 KB internal spec document** (org structure, per-agent trigger definitions, schema, monitoring design) is inlined into the public bundle through the `?raw` import. F1 redacted the plumbing specifics per the brief; the document's presence in the bundle at all is the F2 route decision.
2. The leaked gateway reference describes a **feature that was never built** — there was no live Lovable dependency to protect or reroute. The audit's truth question resolves in the company's favor on code evidence.
3. The pre-fix scan showed **no false positives** for `internal_secret` / `service_role` from library code, contrary to the anticipated tuning risk; the deny-list ships exactly as the brief specified.
4. Nothing else in `src/` uses a `?raw` import, and repo-wide greps find no other copy of the gateway/model text (source or docs), so this single document was the whole leak surface for this string class.

## 6. Files changed

- `docs/wrenchli-daily-digest-spec-v1.md` — redactions per §2 above.
- `scripts/check-bundle-leaks.mjs` — new pre-ship bundle scan.
- `package.json` — adds the `check:bundle` script.
- `BUILD-REPORT.md` — this report.

Committed locally on `fix/bundle-string-leak` (fix commit `c50a505`). Not pushed, not deployed; production untouched; `~/workspace/wrenchli-repo` untouched.
