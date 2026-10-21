# Migration reconciliation notes — 2026-10-21 (Batch 9, Item 3a)

Repo-side reconciliation for the three migration files deferred after the
2026-10-13 migration-history repair ("mark all 83"). No production DDL was
run for this reconciliation; production was inspected read-only
(Supabase Management API, 2026-10-21).

## Counterpart check (all files)

- Repo migration files: 89. Live `supabase_migrations.schema_migrations`
  rows: 89. Repo-only versions: none. Live-only versions: none. Duplicate
  versions: none. Every file has a history row and every row has a file.

## The three deferred files

### 20260404143649_62b6cc9c-….sql — diagnostic workflow schema (502 lines)

Declares 11 tables (vehicles, diagnostic_sessions, diagnoses,
diagnostic_accuracy, possible_causes, symptom_reports,
repair_recommendations, repair_history, outcome_reports,
outcome_reminders, accuracy_metrics), 6 enums, triggers, RLS.
Live check: all 11 tables exist; `vehicles` columns match the declared
order (later migrations appended columns such as decoded_specs,
anon_session_id). History row present.
**Disposition: applied and consistent. Leave as-is.**

### 20260409103936_311e9c59-….sql — security tables, first version

Creates `security_audit_log` (details jsonb, created_at) and
`security_alerts` (acknowledged/acknowledged_at), with indexes
idx_security_audit_log_checked_at and idx_security_audit_log_check_name.
Live check: `security_audit_log` matches this shape exactly (details is
jsonb; created_at present; both indexes present). History row present.
**Disposition: this is the shape production carries for
security_audit_log. Leave as-is.**

### 20260409110446_98b0ed2d-….sql — security tables, drop-and-rebuild

Drops both security tables CASCADE and recreates them with a different
shape (details as text, resolved/resolved_at instead of acknowledged,
index idx_security_log_date).
Live check: **this file never ran as written.** Its DROP CASCADE would
have erased the 20260409103936 shape of security_audit_log (jsonb
details, created_at, and its indexes) — all of which survive in
production. Its own idx_security_log_date also exists live, alongside
the earlier indexes. Live `security_alerts` matches NEITHER this file
nor 20260409103936: it carries agent_id, category, and message columns
that no migration in this repo declares, so the live table was shaped
outside the migration history (Lovable-era direct schema work). History
row present (marked applied 2026-10-13 without the SQL running).
**Disposition: leave the SQL untouched (never edit a marked-applied
migration), superseded by this note. Do not "fix" production to match
this file, and do not run this file anywhere.**

## Standing warning (replay drift)

A from-scratch environment built by replaying this repo's migrations in
order will produce `security_audit_log` / `security_alerts` in the
20260409110446 shape, which diverges from production. Production itself
needs no change. Backup restores are unaffected: the restore path uses
logical dumps of production, not migration replay. Whoever next
provisions a scratch environment from migrations must reconcile these
two tables against production by hand until a future migration captures
the live shape.
