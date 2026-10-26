-- Proactive Events Phase 1 (Aiden speaks first) — spec:
-- wrenchli-proactive-event-list-spec-2026-10-26.md (approved by Gerrod
-- Oct 26, 2026); build brief: wrenchli-proactive-events-build-brief-2026-10-26.md.
-- New tables only; no changes to existing tables.
--
-- proactive_messages is a queue: the check-proactive-events edge function
-- inserts pending rows idempotently, the app reads at most one row at a time
-- through the delivery rules (caps / quiet hours / priority / opt-out /
-- cancellation-on-action), and rows end as shown, dismissed, cancelled, or
-- expired. A row in state 'suppressed' is internal bookkeeping only (the
-- E8 failed-check observation marker) and is never delivered.
--
-- proactive_preferences holds the per-user opt-out state: a master switch,
-- per-category toggles (assessment follow-ups incl. E1/E4/E6, repair
-- updates E2, post-repair check-ins E7, service prompts E5/E9), and the
-- separate recall safety toggle (E3/E8), which defaults on.

-- ---------------------------------------------------------------------------
-- 1. table: proactive_messages
-- ---------------------------------------------------------------------------

create table if not exists public.proactive_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('E1','E2','E3','E4','E5','E6','E7','E8','E9')),
  category text not null check (category in (
    'assessment_followups', 'repair_updates', 'post_repair_checkins',
    'service_prompts', 'recalls'
  )),
  -- the record the message is about; source_key is the idempotency key:
  -- the same event for the same record never queues twice.
  source_table text not null,
  source_id text not null,
  source_key text not null,
  vehicle_id uuid references public.user_vehicles(id) on delete set null,
  -- structured facts the app composes the message and reason from
  -- (src/lib/proactive/copy.ts is the single home of the message strings).
  payload jsonb not null default '{}'::jsonb,
  state text not null default 'pending' check (state in (
    'pending', 'shown', 'dismissed', 'cancelled', 'expired', 'suppressed'
  )),
  eligible_at timestamptz not null default now(),
  shown_at timestamptz,
  dismissed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_proactive_messages_user_event_source
  on public.proactive_messages (user_id, event_type, source_key);

create index if not exists idx_proactive_messages_delivery
  on public.proactive_messages (user_id, state, eligible_at);

create index if not exists idx_proactive_messages_shown
  on public.proactive_messages (user_id, shown_at desc)
  where shown_at is not null;

create index if not exists idx_proactive_messages_vehicle
  on public.proactive_messages (vehicle_id)
  where vehicle_id is not null;

-- ---------------------------------------------------------------------------
-- 2. table: proactive_preferences
-- ---------------------------------------------------------------------------

create table if not exists public.proactive_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  master_enabled boolean not null default true,
  assessment_followups boolean not null default true,
  repair_updates boolean not null default true,
  post_repair_checkins boolean not null default true,
  service_prompts boolean not null default true,
  recall_alerts_enabled boolean not null default true,
  -- last timezone the app reported for this user; delivery uses the
  -- client-reported zone first and falls back to this stored value.
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. row level security (owner-scoped, following the repo's patterns)
-- ---------------------------------------------------------------------------

alter table public.proactive_messages enable row level security;
alter table public.proactive_messages force row level security;
alter table public.proactive_preferences enable row level security;
alter table public.proactive_preferences force row level security;

drop policy if exists proactive_messages_select_own on public.proactive_messages;
create policy proactive_messages_select_own
  on public.proactive_messages
  for select
  to authenticated
  using (user_id = auth.uid());

-- the app only ever moves its own rows between states; inserts come from
-- the checker under the service role.
drop policy if exists proactive_messages_update_own on public.proactive_messages;
create policy proactive_messages_update_own
  on public.proactive_messages
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists proactive_preferences_select_own on public.proactive_preferences;
create policy proactive_preferences_select_own
  on public.proactive_preferences
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists proactive_preferences_insert_own on public.proactive_preferences;
create policy proactive_preferences_insert_own
  on public.proactive_preferences
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists proactive_preferences_update_own on public.proactive_preferences;
create policy proactive_preferences_update_own
  on public.proactive_preferences
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, update on public.proactive_messages to authenticated;
grant select, insert, update on public.proactive_preferences to authenticated;

-- ---------------------------------------------------------------------------
-- 4. updated_at maintenance (reuses the repo's existing trigger function)
-- ---------------------------------------------------------------------------

drop trigger if exists update_proactive_messages_updated_at on public.proactive_messages;
create trigger update_proactive_messages_updated_at
  before update on public.proactive_messages
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_proactive_preferences_updated_at on public.proactive_preferences;
create trigger update_proactive_preferences_updated_at
  before update on public.proactive_preferences
  for each row execute function public.update_updated_at_column();

-- Scheduling note: the check-proactive-events edge function is invoked the
-- same way as check-maintenance (internal secret / service-role bearer, on
-- the fleet cron rhythm). Like check-maintenance, no cron row is created
-- inside a migration.

-- ---------------------------------------------------------------------------
-- ROLLBACK (down steps, commented out)
-- ---------------------------------------------------------------------------
-- drop trigger if exists update_proactive_preferences_updated_at on public.proactive_preferences;
-- drop trigger if exists update_proactive_messages_updated_at on public.proactive_messages;
-- drop table if exists public.proactive_preferences;
-- drop table if exists public.proactive_messages;
