# Visitor Analytics Build — BUILD REPORT

**Branch:** `feat/visitor-analytics` in this clone (`~/workspace/tmp/analytics-build/repo`)
**Base verified before work:** `git rev-parse HEAD^{tree}` = `5a1f1e33341928282b27ed52c65c748f855b5926` (the shipped Oct 27 production tree). Working tree of `~/workspace/wrenchli-repo` was not touched. Nothing was pushed, deployed, or created in any external account. No production data was contacted.
**Spec:** `~/workspace/your_files/wrenchli-visitor-analytics-spec-2026-10-30.md`

## IMPORTANT FINDING — the production CSP would have blocked Plausible

`vercel.json` carries a Content-Security-Policy. Before this change it allowed scripts only from `'self'`, `'unsafe-inline'`, `'unsafe-eval'`, `https://*.supabase.co`, and `https://js.stripe.com`, and its `connect-src` did not include `plausible.io`. The Plausible tag would have been **blocked in production** even though it works in local testing. The fix is surgical: `https://plausible.io` was added to `script-src` (the script itself) and to `connect-src` (the event POSTs) — nothing else in the policy changed (verified by parsed-JSON diff against a pristine copy of the file). File evidence: `vercel.json` (one-line diff).

## Spec item 1 — Plausible tag, exactly once, everywhere

- `index.html`: the current standard Plausible snippet in `<head>`:
  `<script defer data-domain="wrenchli.net" src="https://plausible.io/js/script.js"></script>` plus the official queue stub (`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`), so events fired before the script loads are queued, never lost. A comment in the file states the tag stays inert until the `wrenchli.net` Plausible account is activated separately.
- Placement reasoning: the tag lives **only** in `index.html`. `scripts/prerender.mjs` builds every prerendered page from the built `dist/index.html`, so shell + all 17 prerendered routes inherit it; SPA routes hydrate from the same shell. Nothing injects it per-page (no Helmet), which is what prevents the known double-fire trap on prerendered pages.
- Single-fire proof (see Verification): script tag count = 1 and stub count = 1 in `dist/index.html` and in every prerendered route's HTML, and again over HTTP from a local serve, including the SPA route `/garage`.

## Spec item 2 — the seven funnel events

All forwarding goes through one layer in `src/lib/analytics.ts`:

- `trackPlausibleEvent(name, props?)` — no-ops when `window.plausible` is absent, never throws.
- A property **allowlist** (`vehicle_make`, `source_page`, `placement`, `guide`) is enforced inside the layer: `sanitizePlausibleProps` copies only allowlisted keys, string values only, truncated to 120 chars. Symptom text, free text, names, emails, and VINs **cannot** reach Plausible even if a future call site passes them — this is proven by a unit test that passes a deliberately dirty props object and asserts only `vehicle_make` survives.
- `trackEvent` gained optional `plausible_event` / `plausible_props` fields. They are destructured out **before** the stored row is built, so the `analytics_events` schema and insert payload are byte-for-byte unchanged (unknown keys would be rejected by PostgREST), then forwarded after the row is queued. Call sites therefore fire the home-built log and Plausible from the same product moment, as the spec requires.

Call sites (each fires from its existing product moment):

| Event | Product moment | File |
|---|---|---|
| `garage_signup` | AuthGateModal signup success branch (account created) — deliberately not `AuthContext.signUp`, which also serves DeveloperBilling/AdminLogin and would overcount | `src/components/AuthGateModal.tsx` |
| `assessment_started` | DiagnosticWizard mount (ref-guarded, once per mount) | `src/components/diagnostic-wizard/DiagnosticWizard.tsx` |
| `assessment_completed` | The existing effect where the diagnosis is set and funnel step 4 "results_shown" is logged; props `{vehicle_make}` only | same |
| `handoff_sent` | ShareWithShopButton, after the referral package insert succeeds and the share link exists; props `{vehicle_make}` only (never the token, diagnosis text, or VIN) | `src/components/ShareWithShopButton.tsx` |
| `shop_page_cta_click` | ForShops "Join the free pilot" CTA click; props `{placement: "for_shops_pilot"}` | `src/pages/ForShops.tsx` |
| `diy_guide_open` | DIYTutorialDetail once a guide has loaded, once per slug; props `{guide: slug}` (the public URL slug, not content) | `src/pages/DIYTutorialDetail.tsx` |
| `video_play` | HowItWorksVideo, first transition to playing per mount; props `{placement: "how_it_works"}` | `src/components/HowItWorksVideo.tsx` |

Two judgment calls the gate should know about:

1. **handoff_sent moment.** The funnel spec orders the events signup → assessment → handoff. There is also an automatic lib-level handoff (`createAssessmentHandoff`) that fires on *every* wizard completion. Wiring `handoff_sent` there would fire it at the same moment as `assessment_completed` for every completed assessment and collapse the funnel's last two steps into one. The wired moment — the owner deliberately creating a package to share with a shop — is the send the funnel intends to measure. If the gate prefers the automatic moment, it is a one-line move.
2. **video_play observability limit.** The site's other videos are cross-origin YouTube iframes without the JS API enabled, so an actual in-iframe play is not observable from page code. HowItWorksVideo is the only true in-product play moment (it also renders on ForCarOwners; the event measures walkthrough plays wherever it mounts). No event was invented for the YouTube embeds.

Every named event had a real product moment in the code; none had to be invented or reported missing.

## Spec item 3 — home-built page_view coverage fixed

Audit result: `trackEvent` with `event_type: "page_view"` was called from exactly one product page (`FinancingOptions`, action `financing_options_viewed`), plus a performance row (action `page_load`) — so most routes recorded no page view at all, confirming the spec's suspicion.

Fix: new `src/components/PageViewTracker.tsx`, mounted once in `AppLayout` (`src/App.tsx`) beside `ScrollToTop` — the layout shared by the browser app and the SSR entry (effects do not run during prerender, so nothing is double-counted server-side). It fires `trackEvent({event_type: "page_view", category: "navigation", action: "page_view"})` on the landing route and on every distinct pathname+search change (hash-only changes do not refire; navigating to the same route does not refire). The stored row shape and the `analytics_events` schema are unchanged, and the two pre-existing call sites were left untouched.

## Spec item 4 — privacy line

`src/pages/Privacy.tsx`, Section 7, immediately after the existing "does not sell your personal information" sentence:

> "We use cookieless visitor analytics to count visits and understand how people use Wrenchli. It does not track you across other websites, and we do not sell or share visitor data."

## Verification — what was actually run

Baselines were captured fresh in this clone before edits (pristine tree):

- **vitest baseline:** 476 passed, 2 failed — exactly `useTextToSpeech > falls back to browser TTS when Azure fails` and `useVoiceChatOrchestrator > speak calls Azure TTS when voice is enabled`.
- **tsc baseline:** exactly 50 errors (`npx tsc -p tsconfig.app.json --noEmit`).

After the change:

- **Production build:** `npm run build` (client + SSR + prerender) succeeded; all 17 routes prerendered; sitemap generated (18 URLs). The only warnings are the pre-existing ScrollToTop `useLayoutEffect` SSR notices.
- **Single-fire, file level:** `grep` counts over `dist/` — script tag = 1 and queue stub = 1 in `dist/index.html` and in each of the 17 prerendered route HTML files (about, blog index + 4 posts, developers, faq, for-dealers, for-shops, for-shops/onboarding, partners/journey, privacy, shops, subprocessors, warranty-guide).
- **Single-fire, served:** `vite preview` over `dist/`; fetched `/`, `/for-shops`, `/faq`, `/privacy` (prerendered) and `/garage` (SPA fallback): each response contains exactly 1 script tag, 1 stub, 1 `data-domain="wrenchli.net"`.
- **Event firing:** 20 new tests, all passing, in 5 files. Each wired event is exercised from its real component with `trackPlausibleEvent` spied (and the analytics layer itself is tested against a stubbed `window.plausible`):
  - `src/lib/__tests__/analytics-plausible.test.ts` (7) — all seven names forward once; allowlist passes; dirty props (symptom text, email, VIN, name, diagnosis) are stripped; no-op and never-throws without the script; `trackEvent` forwards once and keeps `plausible_*` out of the stored row.
  - `src/components/__tests__/plausible-call-sites.test.tsx` (5) — `garage_signup` fires once on real signup through the modal and **not** on sign-in; `handoff_sent` fires once on package creation with only `{vehicle_make}` (assertions confirm no VIN, no share token, no diagnosis text in the call); `video_play` fires once on first play and not again after stop/replay.
  - `src/components/diagnostic-wizard/__tests__/DiagnosticWizard.plausible.test.tsx` (2) — `assessment_started` once on mount; `assessment_completed` once when results show, with only `{vehicle_make}`; symptom text asserted absent.
  - `src/pages/__tests__/plausible-pages.test.tsx` (2) — `shop_page_cta_click` once on CTA click; `diy_guide_open` once after a guide loads, with `{guide: slug}`.
  - `src/components/__tests__/PageViewTracker.test.tsx` (4) — one page_view on landing, one per route change (including query changes), no refire on same-route navigation, standard row shape.
- **Full vitest:** 496 passed, 2 failed — the same two Azure-TTS failures as baseline, nothing else. (476 baseline + 20 new = 496.)
- **Full tsc:** error set **identical** to baseline — same 50 errors with positions normalized, diff empty. No new errors, none removed.

## Observed, out of scope (flagged, not changed)

`public/prerender/` holds legacy standalone static HTML files (about.html, blog.html, etc.) that Vite copies into `dist/prerender/`. They are not React routes, not part of the 17 prerendered routes or the sitemap, and they do not carry the Plausible tag. They exist unchanged in the base tree. If those files are still served anywhere, they are invisible to analytics; retiring or tagging them is a separate decision.

## Spec item 5 — activation remainder (founder actions, NOT done here)

1. Create the Plausible account and add the site `wrenchli.net` (Plausible's own onboarding). Until then the tag is inert and the queue stub drops events harmlessly. Confirm the exact plan tier and price at enable time — the spec deliberately does not fix a tier from memory (entry tier is roughly $9–19/mo at public list).
2. Google Search Console: verify `wrenchli.net` under the founder's Google account (the tag-based verification option works with the site as built) and confirm the sitemap (`https://www.wrenchli.net/sitemap.xml`, generated at build) is picked up.
3. No DNS change is needed for Plausible cloud.
4. At ship/activation time, per the spec's own verification standard: make one real visit and confirm it appears in the Plausible dashboard, then walk the real funnel once and confirm each of the seven events fires once. That check can only run against the live account, so it belongs to the ship step, not this build.

## Change surface

11 files modified (`index.html`, `vercel.json`, `src/lib/analytics.ts`, `src/App.tsx`, `src/components/AuthGateModal.tsx`, `src/components/ShareWithShopButton.tsx`, `src/components/HowItWorksVideo.tsx`, `src/components/diagnostic-wizard/DiagnosticWizard.tsx`, `src/pages/ForShops.tsx`, `src/pages/DIYTutorialDetail.tsx`, `src/pages/Privacy.tsx`), 6 files added (`src/components/PageViewTracker.tsx` + 5 test files). Committed locally on `feat/visitor-analytics`. **Not pushed, not deployed.**

## REBASE — onto the F1 ship (2026-10-31)

This build was rebased onto the shipped F1 tree so it is ready for a gated ship decision.

- **New base:** production main `00b7152`, tree `2f7c5eae6683f0a22ab385982a97ef488c462341` (identical tree held locally as `df13858` in the F1 clone). The original build was based on tree `5a1f1e33` (commit `41e3dcf`). Rebase performed in a fresh clone (`~/workspace/tmp/analytics-ship/repo`) by cherry-picking the original analytics commit `06c90c5`; result is on branch `feat/visitor-analytics-rebased`.
- **Conflicts: exactly one, as expected.** `BUILD-REPORT.md` (add/add — both the F1 ship and this build added a report at that path). Resolved by keeping the F1 `BUILD-REPORT.md` byte-identical (sha256 `d2e71461a5cd8f4bf1a65774e4c11d4f09c115d378052cf01d7f80d26d39ebd6`) and saving this build's report at `ANALYTICS-BUILD-REPORT.md` (this file; its content above this section is byte-identical to the original build's `BUILD-REPORT.md`). No other file conflicted; all 17 other files applied cleanly, and the rebased commit's diffstat matches the original commit (18 files, 846 insertions, 11 deletions).
- **Verification on the rebased tree (fresh `npm ci`, Node v24.22.1):**
  - Production build (`npm run build`, client + SSR + prerender): exit 0; all 17 routes prerendered; sitemap generated (18 URLs). Only warnings are the pre-existing ScrollToTop `useLayoutEffect` SSR notices.
  - Single-fire: Plausible script tag count = 1 and queue stub count = 1 in `dist/index.html` and in each of the 17 prerendered route HTML files. (The legacy `public/prerender/` copies in `dist/prerender/` still carry no tag, unchanged from the base tree — the out-of-scope observation recorded above.)
  - F1 leak scan (`npm run check:bundle`): PASS — 5 bundle files scanned, 6 deny terms, 0 matches.
  - Full vitest: **496 passed, 2 failed** — the failures are exactly the known Azure-TTS pair (`useTextToSpeech > falls back to browser TTS when Azure fails`; `useVoiceChatOrchestrator > speak calls Azure TTS when voice is enabled`), identical to baseline.
  - Full tsc (`npx tsc -p tsconfig.app.json --noEmit`): 50 errors; the sorted error set (positions normalized) is **identical** to the set produced on the F1 base tree — diff empty. No new errors, none removed.

**Not pushed, not deployed.** Activation remainder (founder actions in Spec item 5 above) is unchanged.
