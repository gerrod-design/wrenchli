# Environment Registry

This is the single source of truth for which backend is production.
If any config, code, or doc points somewhere else, that is a bug — fix it
here first, then propagate.

## Canonical Production

- **Name:** wrenchli-prod
- **Supabase project ref:** `aunrktvltmyrxtdygykt`
- **URL:** `https://aunrktvltmyrxtdygykt.supabase.co`
- **Status:** LIVE — all production traffic, since the Oct 11, 2026 cutover.
- **Deploys to this project via:** `.github/workflows/deploy-production.yml`
  only, triggered by push to `main`. No other path (manual CLI push, Lovable
  deploy, etc.) should ever target this project outside that workflow.

## Legacy (Retired)

- **Name:** Lovable Cloud backend
- **Supabase project ref:** `etytcjxqqjzpalehqoib`
- **Status:** RETIRED — do not deploy, do not migrate, do not read/write.
  Production traffic no longer touches it. Treat any reference to this ref
  in `.env`, CI, docs, or code as a regression.

## The Rule

> There is exactly one production backend: `aunrktvltmyrxtdygykt`.
> Any configuration, secret, workflow, or script that points anywhere else
> (including the legacy ref above, or a developer's personal project) is a
> bug, not a variant. Fix it at the source, not by adding a second path.

## How to Verify Which Project a Running Deployment Uses

1. **Local/dev `.env`:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PROJECT_ID`
   must read `aunrktvltmyrxtdygykt`. If they don't, the app is talking to
   the wrong backend regardless of what's deployed server-side.
2. **CLI link state:** after `supabase link`, check
   `supabase/.temp/project-ref` — it must contain `aunrktvltmyrxtdygykt`.
3. **GitHub Actions:** the `deploy-production.yml` run logs the linked
   project ref in the "Link project" step output — confirm it matches.
4. **Dashboard:** Supabase Dashboard → Project Settings → General →
   "Reference ID" must read `aunrktvltmyrxtdygykt`.
5. **Live probe:** `curl https://aunrktvltmyrxtdygykt.supabase.co/functions/v1/<fn>`
   with the anon key should succeed. Hitting the legacy host should fail
   (DNS/404/unauthorized) — if it still answers, it hasn't actually been
   retired and this doc is out of date.
6. **Repo-wide grep:** `grep -R "etytcjxqqjzpalehqoib" .` should return
   nothing outside this file, the deploy workflow (whose guard step names
   the ref in order to reject it), and git history. The deploy workflow
   enforces this automatically on every push to `main`.
