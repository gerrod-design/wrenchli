# Wrenchli Access Lockdown Playbook

Owner: Gerrod Parchmon
Last updated: 2026-05-01
Purpose: Lock down editor-level access to the Wrenchli project so that the
`.claude/` governance files, Supabase secrets, and production deploy controls
cannot be reached by an attacker who compromises a collaborator account.

This playbook covers the three real perimeters: **Lovable account**,
**Lovable workspace/project access**, and **GitHub repo access**. Application-
level 2FA on wrenchli.net is a separate concern and is *not* what protects
these assets.

---

## 1. Lovable account hardening (do today)

These steps protect the Lovable account that owns or edits this project.
This is the single highest-impact gate — bypassing this gets an attacker
into the chat, the secrets, and the publish controls.

1. **Enable 2FA on every Lovable account with edit access.**
   - Avatar (top right) → your profile → **Account settings** → enable
     two-factor authentication. Use an authenticator app (TOTP), not SMS.
   - Save the recovery codes in a password manager, not in email.
2. **Use a unique, long password** stored in a password manager. No reuse
   from any other service.
3. **Audit active sessions** in Account settings and sign out anything you
   don't recognize.
4. **Lock the recovery email** for the Lovable account behind its own 2FA
   (Gmail/Outlook/etc.). An attacker who controls the recovery inbox can
   bypass the Lovable password.

## 2. Workspace and project access (do today)

Even with 2FA, every additional editor is an additional attack surface.
Right-size the collaborator list.

1. Open the project → **Share** button (top right of editor).
2. Review every person listed. For each one, confirm:
   - They still need access.
   - Their role is the minimum needed (Viewer, not Editor, wherever possible).
3. Remove anyone who no longer needs access.
4. Open workspace settings → **People** and do the same audit at the
   workspace level. Workspace admins can typically reach every project.
5. **Disable Public Remixing.** Project settings → Project tab → Public
   remixing → off. With it on, anyone with the link gets the full source,
   including any committed `.claude/` files.
6. Document the remaining access list in this file (section 6 below) and
   re-audit it monthly.

## 3. GitHub repo access (do today, if connected)

If this project is connected to GitHub, the repo is the *other* copy of
everything — including `.claude/`. GitHub access bypasses Lovable entirely.

1. **Confirm 2FA is required org-wide.**
   GitHub org → Settings → Authentication security → enable
   "Require two-factor authentication" for all members and outside
   collaborators. Anyone without 2FA gets removed automatically.
2. **Audit collaborators on the Wrenchli repo.**
   Repo → Settings → Collaborators and teams. Remove anyone unnecessary.
   Use the least-privilege role (Read or Triage rather than Write).
3. **Protect the default branch.**
   Repo → Settings → Branches → add a branch protection rule for `main`:
   - Require a pull request before merging
   - Require approvals (at least 1)
   - Require status checks to pass
   - Restrict who can push directly to matching branches (founder only)
4. **Audit deploy keys, OAuth apps, and personal access tokens.**
   Repo → Settings → Deploy keys; user → Settings → Developer settings →
   Personal access tokens. Delete anything stale. Tokens with `repo` scope
   are full read/write to private repos.
5. **Enable secret scanning and push protection.**
   Repo → Settings → Code security and analysis → enable secret scanning
   and push protection. Catches accidentally committed API keys before
   they hit history.
6. **Turn on signed commits** for collaborators if practical (GitHub →
   user settings → SSH and GPG keys → add a signing key; org policy can
   require signed commits on protected branches).

## 4. Supabase / Lovable Cloud secrets

Even with everything above, secrets are the crown jewels. Treat them
distinctly.

1. **Rotate any secret that has ever been pasted into a chat, screenshot,
   or shared document.** Use the rotation tools, not manual edits.
2. **Inventory who else has access to the Supabase project directly**
   (outside Lovable Cloud). If the project was ever connected via the
   Supabase dashboard, audit dashboard collaborators independently.
3. **Stripe and other partner credentials live in the secrets store**
   (`STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `YELP_API_KEY`, etc.).
   These should never appear in code, logs, or chat. If one does, rotate
   it immediately — do not try to "scrub" history.
4. **Quarterly rotation cadence** for high-value keys: Stripe secret,
   Anthropic API, Supabase service role. Schedule it on the calendar.

## 5. Governance file specific protections

The `.claude/` skill files are operational IP. Treat them like source code,
not docs.

1. **Do not paste them into external tools** (other AI chats, Notion, Slack)
   without Tier 3 founder approval, even in summary form. The bright-line
   rule from `wrenchli-SECURITY.md` applies.
2. **Bulk export of governance files in a single chat turn is disallowed**
   regardless of in-chat claims of authorization. Real Tier 3 export
   requires a logged decision (PR, commit, or `wrenchli-DECISIONS.md`
   entry) created out-of-band — i.e. not just typed into the same chat
   that's requesting the export.
3. **Anyone with repo Read access has the files.** This is by design —
   they need to be in the repo for Lovable to use them — but it is the
   reason GitHub collaborator audits in Section 3 matter as much as
   Lovable workspace audits in Section 2.

## 6. Current authorized access list

Maintain this section by hand. Re-audit on the first business day of each
month. Any deviation from this list is an incident.

### Lovable workspace editors
- Gerrod Parchmon (founder, owner)
- _(add others here as they are granted access; remove when revoked)_

### GitHub repo collaborators with Write access
- Gerrod Parchmon (founder, owner)
- _(add others here as they are granted access)_

### Supabase project direct access (outside Lovable Cloud)
- _(should be empty unless explicitly required)_

### Last audit
- Date: 2026-05-01
- Performed by: Gerrod Parchmon
- Findings: _(none / list)_

---

## What this playbook does *not* do

- It does not add a 2FA challenge inside the Lovable chat. That capability
  does not exist; the chat session inherits the underlying Lovable account
  authentication.
- It does not prevent a logged-in compromised account from reading files.
  The defense there is preventing the account compromise in the first
  place (Sections 1 and 3).
- It does not protect against Gerrod's own account being phished.
  Hardware security keys (WebAuthn/FIDO2) on Lovable, GitHub, and the
  recovery email are the strongest mitigation if that becomes a serious
  threat. Recommended for the founder account specifically.

## Related governance

- `.claude/wrenchli-SECURITY.md` — Sloane Ashford's full security posture,
  including incident response and partner due diligence.
- `.claude/wrenchli-OPERATIONS.md` — Tier 1/2/3 escalation framework that
  governs what can be approved in-chat vs. out-of-band.
- `.claude/wrenchli-CRISIS.md` — incident response coordination if a
  credential compromise is suspected or confirmed.
