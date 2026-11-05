-- R-68 matcher telemetry: one row per repair-rate matcher outcome across
-- the assessment pipelines (diagnose, diagnose-vehicle, estimate-repair,
-- api-estimate-repair, agent-diagnose, diagnose-damage-photo, api-diagnose).
--
-- Design: written only by edge functions using the service role
-- (fire-and-forget; a failed insert must never fail an assessment — see
-- supabase/functions/_shared/rate-match-log.ts). The table exists so the
-- matcher miss rate is a counted fact rather than a sampling estimate, and
-- so the missed repair texts form the work list for growing the shared
-- rate table (repair-rates.ts). No client reads it: RLS is enabled with
-- no policies, so anon/authenticated roles get nothing and the service
-- role bypasses RLS as usual.

create table public.rate_match_log (
  id uuid primary key default gen_random_uuid(),
  pipeline text not null check (length(btrim(pipeline)) > 0),
  repair_text text not null default '',
  matched boolean not null,
  rate_entry_id text,
  created_at timestamptz not null default now()
);

alter table public.rate_match_log enable row level security;

create index idx_rate_match_log_created_at on public.rate_match_log (created_at);
create index idx_rate_match_log_pipeline_matched on public.rate_match_log (pipeline, matched);
