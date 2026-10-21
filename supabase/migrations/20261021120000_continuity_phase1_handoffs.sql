-- Continuity Phase 1 — assessment handoffs (spec: wrenchli-continuity-spec.md
-- v1.1, approved by Gerrod Oct 21, 2026; Q1 signed-out handoff lifetime = 7 days).
-- An assessment snapshot is an immutable record of exactly what the user was
-- shown. It is read only by its owner (signed-in) or by the chat edge function
-- against a hashed device token (signed-out). Chat content never enters this
-- table's readers' circle beyond the owner and the chat function.

-- ---------------------------------------------------------------------------
-- 1. table: assessment_handoffs
-- ---------------------------------------------------------------------------

create table if not exists public.assessment_handoffs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  token_hash text unique,
  snapshot jsonb not null,
  source_assessment_id text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint assessment_handoffs_owner_or_token check (
    owner_user_id is not null or token_hash is not null
  )
);

create index if not exists idx_assessment_handoffs_owner_user_id
  on public.assessment_handoffs (owner_user_id);

create index if not exists idx_assessment_handoffs_expires_at_token
  on public.assessment_handoffs (expires_at)
  where token_hash is not null;

-- ---------------------------------------------------------------------------
-- 2. table: handoff_purge_log
-- ---------------------------------------------------------------------------

create table if not exists public.handoff_purge_log (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  deleted_count integer not null
);

-- ---------------------------------------------------------------------------
-- 3. row level security
-- ---------------------------------------------------------------------------

alter table public.assessment_handoffs enable row level security;
alter table public.assessment_handoffs force row level security;

alter table public.handoff_purge_log enable row level security;
alter table public.handoff_purge_log force row level security;

drop policy if exists handoffs_select_own on public.assessment_handoffs;
create policy handoffs_select_own
  on public.assessment_handoffs
  for select
  to authenticated
  using (owner_user_id = auth.uid());

-- lets the purge job delete expired token rows under RLS; deleting
-- already-expired rows early is harmless.
drop policy if exists handoffs_delete_expired on public.assessment_handoffs;
create policy handoffs_delete_expired
  on public.assessment_handoffs
  for delete
  using (
    token_hash is not null
    and expires_at is not null
    and expires_at < now()
  );

-- no insert/update policies: writes happen only through the service role
-- in edge functions.

-- handoff_purge_log: no policies at all.

-- ---------------------------------------------------------------------------
-- 4. immutability trigger on assessment_handoffs
-- ---------------------------------------------------------------------------
-- only the snapshot payload is frozen; ownership/expiry columns stay
-- updatable for the Phase 2 claim flow.

create or replace function public.guard_assessment_snapshot_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.snapshot is distinct from old.snapshot then
    raise exception 'assessment snapshot is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assessment_handoffs_snapshot_immutable
  on public.assessment_handoffs;

create trigger trg_assessment_handoffs_snapshot_immutable
  before update on public.assessment_handoffs
  for each row
  execute function public.guard_assessment_snapshot_immutable();

-- ---------------------------------------------------------------------------
-- 5. purge function
-- ---------------------------------------------------------------------------

create or replace function public.purge_expired_assessment_handoffs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_rows integer;
begin
  delete from public.assessment_handoffs
  where token_hash is not null
    and expires_at is not null
    and expires_at < now();

  get diagnostics deleted_rows = row_count;

  insert into public.handoff_purge_log (deleted_count)
  values (deleted_rows);

  return deleted_rows;
end;
$$;

revoke execute on function public.purge_expired_assessment_handoffs() from public;
grant execute on function public.purge_expired_assessment_handoffs() to service_role;

-- ---------------------------------------------------------------------------
-- 6. daily schedule via pg_cron
-- ---------------------------------------------------------------------------
-- guarded: if the cron schema/job table is unavailable, raise a notice and
-- continue — this migration must not fail.

do $$
begin
  perform cron.unschedule(job.jobid)
  from cron.job as job
  where job.jobname = 'purge-expired-assessment-handoffs';

  perform cron.schedule(
    'purge-expired-assessment-handoffs',
    '17 3 * * *',
    $cron$select public.purge_expired_assessment_handoffs()$cron$
  );
exception
  when others then
    raise notice 'pg_cron unavailable or schedule failed: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- ROLLBACK (down steps, commented out)
-- ---------------------------------------------------------------------------
-- do $$
-- begin
--   perform cron.unschedule(job.jobid)
--   from cron.job as job
--   where job.jobname = 'purge-expired-assessment-handoffs';
-- exception
--   when others then
--     raise notice 'pg_cron unavailable or unschedule failed: %', sqlerrm;
-- end;
-- $$;
--
-- drop trigger if exists trg_assessment_handoffs_snapshot_immutable
--   on public.assessment_handoffs;
-- drop function if exists public.guard_assessment_snapshot_immutable();
--
-- drop function if exists public.purge_expired_assessment_handoffs();
--
-- drop table if exists public.handoff_purge_log;
-- drop table if exists public.assessment_handoffs;
