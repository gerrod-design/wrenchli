-- Garage two-layer vehicle record: reported history + observed condition.
-- This migration is delivered for review only by the feature workflow; it is
-- not applied by the application build process.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.garage_vehicle_is_owned_by_current_user(p_vehicle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_vehicles v
    where v.id = p_vehicle_id
      and v.user_id = auth.uid()
  );
$$;

create or replace function public.set_vehicle_record_captured_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.captured_at := now();
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.prevent_vehicle_timeline_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Vehicle timeline events are append-only';
end;
$$;

create or replace function public.prevent_completed_baseline_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'completed' then
    raise exception 'A completed baseline is immutable';
  end if;

  if tg_op = 'UPDATE' then
    if new.vehicle_id is distinct from old.vehicle_id
       or new.owner_user_id is distinct from old.owner_user_id
       or new.vin is distinct from old.vin
       or new.odometer is distinct from old.odometer
       or new.started_at is distinct from old.started_at then
      raise exception 'Baseline capture facts cannot be changed; add a timeline correction instead';
    end if;
    if new.status <> 'completed' and new.status is distinct from old.status and new.status <> 'abandoned' then
      raise exception 'Invalid baseline status transition';
    end if;
    return new;
  end if;

  return old;
end;
$$;

create or replace function public.prevent_completed_baseline_child_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_baseline_id uuid;
  v_status text;
begin
  if tg_op = 'DELETE' then
    v_baseline_id := old.baseline_id;
    if v_baseline_id is null then
      return old;
    end if;

    select status into v_status
    from public.vehicle_baselines
    where id = v_baseline_id;

    if v_status = 'completed' then
      raise exception 'Records in a completed baseline are immutable; add a new baseline or timeline correction';
    end if;

    return old;
  end if;

  v_baseline_id := new.baseline_id;
  if v_baseline_id is null then
    return new;
  end if;

  select status into v_status
  from public.vehicle_baselines
  where id = v_baseline_id;

  if v_status = 'completed' then
    raise exception 'Records in a completed baseline are immutable; add a new baseline or timeline correction';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cited weak-point library (admin editable; no code deploy required)
-- ---------------------------------------------------------------------------

create table public.weak_point_checks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  make text not null,
  model text not null,
  generation text,
  year_start integer not null check (year_start between 1980 and 2100),
  year_end integer not null check (year_end between year_start and 2100),
  applicability_notes text,
  title text not null,
  instruction text not null,
  why_it_matters text not null,
  sense text not null check (sense in ('sight', 'sound', 'smell', 'feel')),
  citation_label text not null,
  citation_details text not null,
  citation_url text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(citation_label)) > 0 and length(btrim(citation_details)) > 0)
);

create index idx_weak_point_checks_vehicle
  on public.weak_point_checks (lower(make), lower(model), year_start, year_end)
  where is_active;

alter table public.weak_point_checks enable row level security;

create policy "Weak-point checks are readable"
  on public.weak_point_checks for select
  using (is_active = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert weak-point checks"
  on public.weak_point_checks for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update weak-point checks"
  on public.weak_point_checks for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete weak-point checks"
  on public.weak_point_checks for delete
  using (public.has_role(auth.uid(), 'admin'));

create trigger update_weak_point_checks_updated_at
  before update on public.weak_point_checks
  for each row execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Append-only two-layer timeline
-- ---------------------------------------------------------------------------

create table public.vehicle_timeline_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.user_vehicles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  vin text,
  layer text not null check (layer in ('reported', 'observed')),
  category text not null check (category in (
    'title', 'odometer', 'recall', 'damage', 'service', 'condition_check',
    'document', 'shop_visit', 'baseline'
  )),
  title text not null check (length(btrim(title)) > 0),
  detail text,
  source_type text not null check (source_type in ('owner', 'technician', 'shop', 'document', 'system')),
  source_name text not null check (length(btrim(source_name)) > 0),
  occurred_at timestamptz not null default now(),
  captured_at timestamptz not null default now(),
  odometer integer check (odometer is null or odometer >= 0),
  media jsonb not null default '[]'::jsonb check (jsonb_typeof(media) = 'array'),
  baseline_id uuid,
  condition_check_id uuid,
  weak_point_check_id uuid references public.weak_point_checks(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_vehicle_timeline_vehicle_layer_time
  on public.vehicle_timeline_events (vehicle_id, layer, occurred_at desc);
create index idx_vehicle_timeline_vehicle_category
  on public.vehicle_timeline_events (vehicle_id, category, occurred_at desc);
create index idx_vehicle_timeline_vin
  on public.vehicle_timeline_events (vin)
  where vin is not null;

alter table public.vehicle_timeline_events enable row level security;

create policy "Owners can view their vehicle timeline"
  on public.vehicle_timeline_events for select
  using (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create policy "Owners can append to their vehicle timeline"
  on public.vehicle_timeline_events for insert
  with check (
    auth.uid() = owner_user_id
    and auth.uid() = created_by
    and public.garage_vehicle_is_owned_by_current_user(vehicle_id)
    and length(btrim(source_name)) > 0
  );

-- Deliberately no owner UPDATE or DELETE policy. The trigger below also blocks
-- privileged application paths from rewriting the record.
create trigger set_vehicle_timeline_captured_at
  before insert on public.vehicle_timeline_events
  for each row execute function public.set_vehicle_record_captured_at();

create trigger prevent_vehicle_timeline_update
  before update on public.vehicle_timeline_events
  for each row execute function public.prevent_vehicle_timeline_mutation();

create trigger prevent_vehicle_timeline_delete
  before delete on public.vehicle_timeline_events
  for each row execute function public.prevent_vehicle_timeline_mutation();

-- ---------------------------------------------------------------------------
-- Baselines and their answers
-- ---------------------------------------------------------------------------

create table public.vehicle_baselines (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.user_vehicles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  vin text,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  odometer integer check (odometer is null or odometer >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'completed' and completed_at is not null)
    or status <> 'completed'
  )
);

create index idx_vehicle_baselines_vehicle_time
  on public.vehicle_baselines (vehicle_id, started_at desc);

alter table public.vehicle_baselines enable row level security;

create policy "Owners can view their baselines"
  on public.vehicle_baselines for select
  using (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create policy "Owners can start baselines"
  on public.vehicle_baselines for insert
  with check (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create policy "Owners can advance their open baselines"
  on public.vehicle_baselines for update
  using (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id))
  with check (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create trigger update_vehicle_baselines_updated_at
  before update on public.vehicle_baselines
  for each row execute function public.update_updated_at_column();

create trigger prevent_completed_baseline_mutation
  before update or delete on public.vehicle_baselines
  for each row execute function public.prevent_completed_baseline_mutation();

alter table public.vehicle_timeline_events
  add constraint vehicle_timeline_events_baseline_id_fkey
  foreign key (baseline_id) references public.vehicle_baselines(id) on delete set null;

create table public.vehicle_baseline_responses (
  id uuid primary key default gen_random_uuid(),
  baseline_id uuid not null references public.vehicle_baselines(id) on delete cascade,
  vehicle_id uuid not null references public.user_vehicles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  weak_point_check_id uuid references public.weak_point_checks(id) on delete set null,
  check_key text not null,
  check_label text not null,
  response text not null check (response in ('ok', 'issue', 'skipped')),
  skip_reason text,
  note text,
  media jsonb not null default '[]'::jsonb check (jsonb_typeof(media) = 'array'),
  source_type text not null default 'owner' check (source_type in ('owner', 'technician', 'shop', 'document', 'system')),
  source_name text not null check (length(btrim(source_name)) > 0),
  responded_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (baseline_id, check_key),
  check (
    (response = 'skipped' and length(btrim(coalesce(skip_reason, ''))) > 0)
    or response <> 'skipped'
  )
);

create index idx_vehicle_baseline_responses_baseline
  on public.vehicle_baseline_responses (baseline_id, responded_at);

alter table public.vehicle_baseline_responses enable row level security;

create policy "Owners can view baseline responses"
  on public.vehicle_baseline_responses for select
  using (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create policy "Owners can save baseline responses"
  on public.vehicle_baseline_responses for insert
  with check (
    auth.uid() = owner_user_id
    and public.garage_vehicle_is_owned_by_current_user(vehicle_id)
    and length(btrim(source_name)) > 0
  );

create policy "Owners can revise open baseline responses"
  on public.vehicle_baseline_responses for update
  using (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id))
  with check (
    auth.uid() = owner_user_id
    and public.garage_vehicle_is_owned_by_current_user(vehicle_id)
    and length(btrim(source_name)) > 0
  );

create trigger update_vehicle_baseline_responses_updated_at
  before update on public.vehicle_baseline_responses
  for each row execute function public.update_updated_at_column();

create trigger prevent_completed_baseline_response_mutation
  before insert or update or delete on public.vehicle_baseline_responses
  for each row execute function public.prevent_completed_baseline_child_mutation();

-- ---------------------------------------------------------------------------
-- Current and baseline-specific condition checks
-- ---------------------------------------------------------------------------

create table public.vehicle_condition_checks (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.user_vehicles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  baseline_id uuid references public.vehicle_baselines(id) on delete cascade,
  weak_point_check_id uuid references public.weak_point_checks(id) on delete set null,
  check_key text not null,
  label text not null,
  category text not null default 'condition_check',
  sense text check (sense is null or sense in ('sight', 'sound', 'smell', 'feel')),
  status text not null default 'not_checked' check (status in ('not_checked', 'checked_ok', 'checked_issue')),
  last_checked_at timestamptz,
  last_source_type text check (last_source_type is null or last_source_type in ('owner', 'technician', 'shop', 'document', 'system')),
  last_source_name text,
  evidence_media jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_media) = 'array'),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    status = 'not_checked'
    or (last_checked_at is not null and length(btrim(coalesce(last_source_name, ''))) > 0)
  )
);

create unique index idx_vehicle_condition_checks_current_key
  on public.vehicle_condition_checks (vehicle_id, check_key)
  where baseline_id is null;

create unique index idx_vehicle_condition_checks_baseline_key
  on public.vehicle_condition_checks (baseline_id, check_key)
  where baseline_id is not null;

create index idx_vehicle_condition_checks_vehicle_status
  on public.vehicle_condition_checks (vehicle_id, status, last_checked_at desc);

alter table public.vehicle_condition_checks enable row level security;

create policy "Owners can view condition checks"
  on public.vehicle_condition_checks for select
  using (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create policy "Owners can create condition checks"
  on public.vehicle_condition_checks for insert
  with check (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create policy "Owners can update open condition checks"
  on public.vehicle_condition_checks for update
  using (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id))
  with check (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create trigger update_vehicle_condition_checks_updated_at
  before update on public.vehicle_condition_checks
  for each row execute function public.update_updated_at_column();

create trigger prevent_completed_baseline_check_mutation
  before insert or update or delete on public.vehicle_condition_checks
  for each row execute function public.prevent_completed_baseline_child_mutation();

alter table public.vehicle_timeline_events
  add constraint vehicle_timeline_events_condition_check_id_fkey
  foreign key (condition_check_id) references public.vehicle_condition_checks(id) on delete set null;

create or replace function public.log_vehicle_condition_check_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'not_checked' then
    return new;
  end if;

  -- A timeline event records a status change, carrying its evidence. On
  -- UPDATE, log only when the status or the evidence media actually
  -- changed. A note-only edit updates the check itself; it is not a
  -- status change and must not write a duplicate event (GATE-A1).
  if tg_op = 'UPDATE'
     and old.status is not distinct from new.status
     and old.evidence_media is not distinct from new.evidence_media then
    return new;
  end if;

  insert into public.vehicle_timeline_events (
    vehicle_id, owner_user_id, vin, layer, category, title, detail,
    source_type, source_name, occurred_at, odometer, media, baseline_id,
    condition_check_id, weak_point_check_id, created_by
  )
  select
    new.vehicle_id,
    new.owner_user_id,
    v.vin,
    'observed',
    case when new.baseline_id is null then 'condition_check' else 'baseline' end,
    new.label || case new.status
      when 'checked_ok' then ' — recorded as OK'
      when 'checked_issue' then ' — issue recorded'
      else ' — not yet checked'
    end,
    new.note,
    coalesce(new.last_source_type, 'owner'),
    new.last_source_name,
    coalesce(new.last_checked_at, now()),
    b.odometer,
    new.evidence_media,
    new.baseline_id,
    new.id,
    new.weak_point_check_id,
    auth.uid()
  from public.user_vehicles v
  left join public.vehicle_baselines b on b.id = new.baseline_id
  where v.id = new.vehicle_id;

  return new;
end;
$$;

create trigger log_vehicle_condition_check_change
  after insert or update of status, note, evidence_media on public.vehicle_condition_checks
  for each row execute function public.log_vehicle_condition_check_change();

-- ---------------------------------------------------------------------------
-- Documents and share-permission fields (share UI intentionally not included)
-- ---------------------------------------------------------------------------

create table public.vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.user_vehicles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  timeline_event_id uuid references public.vehicle_timeline_events(id) on delete set null,
  storage_bucket text not null default 'garage-vehicle-media',
  storage_path text not null,
  original_filename text not null,
  content_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  document_kind text not null default 'vehicle_document',
  layer text not null check (layer in ('reported', 'observed')),
  source_name text not null check (length(btrim(source_name)) > 0),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create index idx_vehicle_documents_vehicle_time
  on public.vehicle_documents (vehicle_id, created_at desc);

alter table public.vehicle_documents enable row level security;

create policy "Owners can view their vehicle documents"
  on public.vehicle_documents for select
  using (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create policy "Owners can add vehicle documents"
  on public.vehicle_documents for insert
  with check (
    auth.uid() = owner_user_id
    and auth.uid() = uploaded_by
    and public.garage_vehicle_is_owned_by_current_user(vehicle_id)
    and length(btrim(source_name)) > 0
  );

create policy "Owners can remove their vehicle document metadata"
  on public.vehicle_documents for delete
  using (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create table public.vehicle_share_permissions (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.user_vehicles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  grantee_user_id uuid references auth.users(id) on delete cascade,
  grantee_email text,
  expires_at timestamptz,
  include_reported_history boolean not null default true,
  include_observed_condition boolean not null default true,
  include_baselines boolean not null default true,
  redact_vin boolean not null default true,
  redact_odometer boolean not null default false,
  redact_documents boolean not null default true,
  redact_source_names boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'active', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (grantee_user_id is not null or length(btrim(coalesce(grantee_email, ''))) > 0)
);

create index idx_vehicle_share_permissions_vehicle
  on public.vehicle_share_permissions (vehicle_id, status, expires_at);

alter table public.vehicle_share_permissions enable row level security;

-- Owner-only management records for a future sharing surface. No grantee read
-- policy is created in this phase, so a permission row alone grants no access.
create policy "Owners can view share permission fields"
  on public.vehicle_share_permissions for select
  using (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create policy "Owners can create share permission fields"
  on public.vehicle_share_permissions for insert
  with check (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create policy "Owners can update share permission fields"
  on public.vehicle_share_permissions for update
  using (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id))
  with check (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create policy "Owners can delete share permission fields"
  on public.vehicle_share_permissions for delete
  using (auth.uid() = owner_user_id and public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create trigger update_vehicle_share_permissions_updated_at
  before update on public.vehicle_share_permissions
  for each row execute function public.update_updated_at_column();

-- Private Garage media. Paths are <owner-user-id>/<vehicle-id>/<filename>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'garage-vehicle-media',
  'garage-vehicle-media',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Owners can read their Garage media"
  on storage.objects for select
  using (
    bucket_id = 'garage-vehicle-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can upload their Garage media"
  on storage.objects for insert
  with check (
    bucket_id = 'garage-vehicle-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can replace their Garage media"
  on storage.objects for update
  using (
    bucket_id = 'garage-vehicle-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'garage-vehicle-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can remove their Garage media"
  on storage.objects for delete
  using (
    bucket_id = 'garage-vehicle-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Canonical baseline completion API
-- ---------------------------------------------------------------------------

create or replace function public.complete_vehicle_baseline(
  p_baseline_id uuid,
  p_source_name text
)
returns public.vehicle_baselines
language plpgsql
security definer
set search_path = public
as $$
declare
  v_baseline public.vehicle_baselines%rowtype;
  v_vehicle public.user_vehicles%rowtype;
  v_missing integer;
begin
  if length(btrim(coalesce(p_source_name, ''))) = 0 then
    raise exception 'A source name is required';
  end if;

  select * into v_baseline
  from public.vehicle_baselines
  where id = p_baseline_id
  for update;

  if not found or v_baseline.owner_user_id <> auth.uid() then
    raise exception 'Baseline not found for this owner';
  end if;

  if v_baseline.status = 'completed' then
    return v_baseline;
  end if;

  if v_baseline.status <> 'in_progress' then
    raise exception 'Only an in-progress baseline can be completed';
  end if;

  select * into v_vehicle
  from public.user_vehicles
  where id = v_baseline.vehicle_id;

  select count(*) into v_missing
  from (
    values
      ('odometer_photo'),
      ('walkaround_front'),
      ('walkaround_driver_side'),
      ('walkaround_rear'),
      ('walkaround_passenger_side'),
      ('sound_audio_system'),
      ('sound_engine_idle'),
      ('smell_cabin'),
      ('sight_dash_and_panel_fit'),
      ('feel_idle_and_pedal')
  ) as core(check_key)
  where not exists (
    select 1
    from public.vehicle_baseline_responses r
    where r.baseline_id = p_baseline_id
      and r.check_key = core.check_key
      and (
        r.response in ('ok', 'issue')
        or (r.response = 'skipped' and length(btrim(coalesce(r.skip_reason, ''))) > 0)
      )
  );

  if v_missing > 0 then
    raise exception 'Every core baseline check must be answered OK, issue, or skipped with a reason before completion';
  end if;

  select count(*) into v_missing
  from public.weak_point_checks w
  where w.is_active
    and lower(w.make) = lower(v_vehicle.make)
    and regexp_replace(lower(w.model), ' 1500$', '') = regexp_replace(lower(v_vehicle.model), ' 1500$', '')
    and v_vehicle.year between w.year_start and w.year_end
    and not exists (
      select 1
      from public.vehicle_baseline_responses r
      where r.baseline_id = p_baseline_id
        and r.weak_point_check_id = w.id
        and (
          r.response in ('ok', 'issue')
          or (r.response = 'skipped' and length(btrim(coalesce(r.skip_reason, ''))) > 0)
        )
    );

  if v_missing > 0 then
    raise exception 'Every model-specific check must be answered OK, issue, or skipped with a reason before completion';
  end if;

  update public.vehicle_baselines
  set status = 'completed', completed_at = now()
  where id = p_baseline_id
  returning * into v_baseline;

  insert into public.vehicle_timeline_events (
    vehicle_id, owner_user_id, vin, layer, category, title, detail,
    source_type, source_name, occurred_at, odometer, baseline_id, created_by
  ) values (
    v_baseline.vehicle_id,
    v_baseline.owner_user_id,
    v_baseline.vin,
    'observed',
    'baseline',
    'Purchase-day baseline saved',
    'This baseline is a dated capture. Later corrections and re-checks are separate timeline events.',
    'owner',
    btrim(p_source_name),
    now(),
    v_baseline.odometer,
    v_baseline.id,
    auth.uid()
  );

  return v_baseline;
end;
$$;

revoke all on function public.complete_vehicle_baseline(uuid, text) from public;
grant execute on function public.complete_vehicle_baseline(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed weak-point checks
-- ---------------------------------------------------------------------------

insert into public.weak_point_checks (
  slug, make, model, generation, year_start, year_end, applicability_notes,
  title, instruction, why_it_matters, sense, citation_label, citation_details,
  citation_url, sort_order
) values
(
  'mercedes-benz-glc-x253-rear-wheel-wells',
  'Mercedes-Benz', 'GLC', 'X253', 2016, 2022,
  'Check both sides. The amplifier/module area may only be partly visible without moving trim; do not pull trim or components apart.',
  'Rear wheel wells — dampness and corrosion',
  'Open the rear cargo area and look and feel around both rear wheel-well areas and the amplifier/module area for damp trim, standing moisture, corrosion, or a musty smell. Take a photo of anything you find.',
  'Water in this rear area can reach electrical modules before there is an obvious cabin symptom.',
  'feel',
  'Documented X253 rear water-intrusion pattern',
  'Owner-community reports and the 2017 GLC300 amplifier-corrosion case document rear water intrusion reaching the amplifier/module area. This check records visible or tactile evidence only.',
  null,
  10
),
(
  'toyota-rav4-xa50-roof-rail-headliner',
  'Toyota', 'RAV4', 'XA50', 2019, 2021,
  'For vehicles with roof rails. Look at the headliner edges near both front pillars and feel for dampness.',
  'Roof rails and front headliner edges',
  'Look along both front headliner edges for water staining, rippling, or discoloration, then gently feel the edge for dampness. Photograph any stain or damp area.',
  'Roof-rail water entry can remain hidden until it reaches trim, wiring, or safety-system components.',
  'sight',
  'RAV4World documented owner pattern: Roof rail leaks',
  'RAV4World owner reports describe roof-rail leaks, headliner staining, and Toyota service material for replacement rail clips and seals.',
  'https://www.rav4world.com/threads/roof-rail-leaks.333535/?sortby=newest',
  20
),
(
  'honda-cr-v-rw-15t-oil-fuel-smell',
  'Honda', 'CR-V', 'RW', 2017, 2019,
  'Applies to the 1.5L turbocharged engine. Let the engine cool first. If the vehicle has a different engine, skip with that reason.',
  'Engine oil level and fuel smell',
  'With the engine off and cool, remove the oil dipstick, look at whether the oil is above the full mark, and smell the oil on the dipstick for a strong fuel odor. Photograph the dipstick level if it appears high.',
  'Fuel mixing with engine oil can raise the level and reduce the oil''s ability to protect moving parts.',
  'smell',
  'Honda service bulletins and warranty extension reported by WardsAuto',
  'WardsAuto reported Honda service bulletins and a warranty extension for 2017–2018 CR-V 1.5L vehicles after owners reported oil levels above full and gasoline odor; later reporting carried the affected early production pattern into 2019 factory-updated vehicles.',
  'http://www.wardsauto.com/news/archive-wards-honda-extends-warranty-to-address-1-5l-gas-oil-dilution-problem/793295/',
  30
),
(
  'ford-f-150-p552-ac-drain-front-carpet',
  'Ford', 'F-150', 'P552', 2018, 2020,
  'Use after air conditioning has run. Check the right front footwell described in Ford TSB 20-2170.',
  'Right front carpet after A/C use',
  'After running the air conditioning, press the right front carpet with your hand and note whether it feels damp. Smell for a persistent musty odor and photograph any visible moisture.',
  'Water entering the footwell can soak carpet and padding before the source is obvious from the driver seat.',
  'feel',
  'Ford Technical Service Bulletin 20-2170',
  'Ford TSB 20-2170 covers water leaking on the right front floor during or after A/C use on certain 2018–2020 F-150 vehicles and includes inspecting the carpet for dampness and odor.',
  null,
  40
),
(
  'chevrolet-silverado-1500-t1xx-rear-window',
  'Chevrolet', 'Silverado 1500', 'T1XX', 2019, 2020,
  'For vehicles with a rear sliding window. Do not force the window or remove trim.',
  'Rear sliding window and rear cab trim',
  'Look behind the rear seat area for water staining or damp trim below the rear sliding window, feel the rear carpet edge for moisture, and photograph any staining or corrosion.',
  'A rear-window leak can wet the rear cab and nearby electrical components while the front of the cab stays dry.',
  'feel',
  'GM Technical Service Bulletin 18-NA-383',
  'GM TSB 18-NA-383, first issued January 3, 2019 and later revised, addresses water found in the rear interior of the cab at the rear sliding window on covered Silverado and Sierra trucks.',
  null,
  50
),
(
  'mazda-cx-30-dm-spare-tire-well',
  'Mazda', 'CX-30', 'DM', 2020, 2024,
  'Lift only the cargo floor cover. Do not remove trim or components.',
  'Spare tire well and rear cargo floor',
  'Lift the rear cargo floor cover, look in the spare tire well for water or staining, feel the lowest area for dampness, and note any rear odor. Photograph anything you find.',
  'Roof-seam water entry can collect out of sight in the spare tire well and reach rear electrical components.',
  'sight',
  'Mazda Service Alert SA-035/21 and superseding bulletin material',
  'Mazda Service Alert SA-035/21 (issued May 19, 2021) and its superseding bulletin for 2020-2024 CX-30 describe roof-seam water leaks that can leave water in the spare tire well and cause rear electrical or audio symptoms.',
  'https://carandproblems.com/api/nhtsa-doc?url=https%3A%2F%2Fstatic.nhtsa.gov%2Fodi%2Ftsbs%2F2023%2FMC-10244585-0001.pdf',
  60
)
on conflict (slug) do update set
  make = excluded.make,
  model = excluded.model,
  generation = excluded.generation,
  year_start = excluded.year_start,
  year_end = excluded.year_end,
  applicability_notes = excluded.applicability_notes,
  title = excluded.title,
  instruction = excluded.instruction,
  why_it_matters = excluded.why_it_matters,
  sense = excluded.sense,
  citation_label = excluded.citation_label,
  citation_details = excluded.citation_details,
  citation_url = excluded.citation_url,
  sort_order = excluded.sort_order,
  updated_at = now();
