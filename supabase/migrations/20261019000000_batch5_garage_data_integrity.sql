-- Batch 5 — Garage data integrity (R-50, R-57; R-51 lesson carried into schema).
-- Authority: wrenchli-garage-data-integrity-spec.md v1.1, approved as
-- recommended by Gerrod Oct 18, 2026 (Q1-Q5 settled per the spec's
-- recommendations).
--
-- Contents:
--   1. vehicle_mileage_readings — append-only, sourced odometer ledger.
--   2. vehicle_mileage_reading_disputes — disputes/dismissals as ledger facts.
--   3. Provenance gatekeeper: DB-layer rejection of unsourced writes to
--      vehicle facts (readings without a source; profile fields set without
--      a recorded provenance entry).
--   4. R-57: annual_mileage_estimate / driving_style / usage_type lose their
--      defaults; existing rows migrate to NULL (logged, not silently kept).
--   5. Dormant confidence defaults (vehicle_known_issues,
--      vehicle_value_history) drop to NULL defaults.
--   6. Vehicle identity as decoded, stamped fields (vin_decoded_*).
--   7. current_mileage / last_mileage_update retired (dropped) — the ledger
--      is the only stored mileage fact.
--   8. Backfill for the 6 production vehicles (founder + harness mirrors):
--      GLC300 three sourced readings; M850i one unsupported seeded reading;
--      Q7 zero readings (honest empty state, per spec SS8).

-- ---------------------------------------------------------------------------
-- 1. Readings ledger
-- ---------------------------------------------------------------------------

create table public.vehicle_mileage_readings (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.user_vehicles(id) on delete cascade,
  owner_user_id uuid not null,
  odometer_value numeric not null check (odometer_value >= 0),
  unit text not null check (unit in ('mi', 'km')),
  odometer_miles numeric not null,
  reading_date date not null,
  source text not null check (source in ('owner_reported', 'dashboard_photo', 'shop_document', 'purchase_document')),
  source_detail text,
  layer text not null check (layer in ('reported', 'observed')),
  status text not null default 'current' check (status in ('current', 'superseded', 'disputed')),
  superseded_by uuid references public.vehicle_mileage_readings(id),
  unsupported boolean not null default false,
  outlier_confirmed boolean not null default false,
  evidence_media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_mileage_readings_vehicle_date
  on public.vehicle_mileage_readings(vehicle_id, reading_date desc, created_at desc);

alter table public.vehicle_mileage_readings enable row level security;

create policy "Owners can view own vehicle readings"
  on public.vehicle_mileage_readings for select
  using (public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create policy "Owners can insert own vehicle readings"
  on public.vehicle_mileage_readings for insert
  with check (
    public.garage_vehicle_is_owned_by_current_user(vehicle_id)
    and owner_user_id = auth.uid()
  );

-- Updates are limited to status / superseded_by transitions; the append-only
-- guard trigger below enforces that at the row level. No DELETE policy:
-- readings cannot be deleted through the API.
create policy "Owners can update own vehicle reading status"
  on public.vehicle_mileage_readings for update
  using (public.garage_vehicle_is_owned_by_current_user(vehicle_id))
  with check (public.garage_vehicle_is_owned_by_current_user(vehicle_id));

-- ---------------------------------------------------------------------------
-- 2. Dispute facts (append-only)
-- ---------------------------------------------------------------------------

create table public.vehicle_mileage_reading_disputes (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.user_vehicles(id) on delete cascade,
  reading_id uuid references public.vehicle_mileage_readings(id),
  kind text not null check (kind in ('dispute', 'dispute_dismissal', 'discrepancy_dismissal')),
  raised_by uuid not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index idx_mileage_disputes_vehicle
  on public.vehicle_mileage_reading_disputes(vehicle_id, created_at desc);

alter table public.vehicle_mileage_reading_disputes enable row level security;

create policy "Owners can view own vehicle reading disputes"
  on public.vehicle_mileage_reading_disputes for select
  using (public.garage_vehicle_is_owned_by_current_user(vehicle_id));

create policy "Owners can insert own vehicle reading disputes"
  on public.vehicle_mileage_reading_disputes for insert
  with check (
    public.garage_vehicle_is_owned_by_current_user(vehicle_id)
    and raised_by = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 3. Gatekeeper + integrity triggers
-- ---------------------------------------------------------------------------

-- Normalization: odometer_miles is derived once, at write, from the entered
-- value + unit, so no downstream consumer ever interprets a raw number in
-- the wrong unit.
create or replace function public.normalize_mileage_reading()
returns trigger
language plpgsql
as $$
begin
  new.odometer_miles := case
    when new.unit = 'km' then round((new.odometer_value * 0.621371192)::numeric, 2)
    else new.odometer_value
  end;
  return new;
end;
$$;

-- Trigger-name prefixes encode the intended firing order (Postgres fires
-- same-timing triggers alphabetically): 10 normalize -> 20 gatekeep -> 30 guard.
create trigger t10_normalize_mileage_reading
  before insert on public.vehicle_mileage_readings
  for each row execute function public.normalize_mileage_reading();

-- Provenance gatekeeper (insert path): a reading without a real source is
-- rejected at the database layer, not by app convention. Document-sourced
-- readings must name the document (shop + RO / invoice) they came from, and
-- the recorded owner must own the vehicle.
create or replace function public.gatekeep_mileage_reading_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.source is null or btrim(new.source) = '' then
    raise exception 'Mileage readings require a source (provenance gatekeeper)';
  end if;
  if new.source in ('shop_document', 'purchase_document')
     and (new.source_detail is null or btrim(new.source_detail) = '') then
    raise exception 'Document-sourced mileage readings require source_detail naming the document (provenance gatekeeper)';
  end if;
  if not exists (
    select 1 from public.user_vehicles v
    where v.id = new.vehicle_id and v.user_id = new.owner_user_id
  ) then
    raise exception 'Mileage reading owner does not own the vehicle';
  end if;
  return new;
end;
$$;

create trigger t20_gatekeep_mileage_reading_insert
  before insert on public.vehicle_mileage_readings
  for each row execute function public.gatekeep_mileage_reading_insert();

-- Append-only guard: the stored facts of a reading never change after
-- insert. Only status transitions and the superseded_by link may move.
-- Security definer so the parent-existence check is not subject to the
-- invoking role's RLS visibility.
create or replace function public.guard_mileage_reading_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    -- A delete arriving through the FK cascade (fired by the RI trigger,
    -- so trigger depth > 1) is the parent vehicle's own deletion — allow
    -- it. A direct delete at depth 1 is refused while the vehicle exists.
    if pg_trigger_depth() > 1 then
      return old;
    end if;
    if exists (select 1 from public.user_vehicles v where v.id = old.vehicle_id) then
      raise exception 'Mileage readings are append-only and cannot be deleted';
    end if;
    return old;
  end if;

  if new.vehicle_id is distinct from old.vehicle_id
     or new.owner_user_id is distinct from old.owner_user_id
     or new.odometer_value is distinct from old.odometer_value
     or new.unit is distinct from old.unit
     or new.odometer_miles is distinct from old.odometer_miles
     or new.reading_date is distinct from old.reading_date
     or new.source is distinct from old.source
     or new.source_detail is distinct from old.source_detail
     or new.layer is distinct from old.layer
     or new.unsupported is distinct from old.unsupported
     or new.outlier_confirmed is distinct from old.outlier_confirmed
     or new.evidence_media is distinct from old.evidence_media
     or new.created_at is distinct from old.created_at then
    raise exception 'Mileage reading facts are immutable; add a correction reading instead';
  end if;
  return new;
end;
$$;

create trigger t30_guard_mileage_reading_mutation
  before update or delete on public.vehicle_mileage_readings
  for each row execute function public.guard_mileage_reading_mutation();

-- Profile provenance: user_vehicles gains a provenance record for the three
-- R-57 profile fields. The gatekeeper trigger below rejects any write that
-- sets one of those fields to a value without a matching source entry.
alter table public.user_vehicles
  add column if not exists profile_provenance jsonb not null default '{}'::jsonb;

create or replace function public.gatekeep_profile_provenance_insert()
returns trigger
language plpgsql
as $$
declare
  field text;
  new_j jsonb := to_jsonb(new);
begin
  foreach field in array array['annual_mileage_estimate', 'driving_style', 'usage_type'] loop
    if (new_j ->> field) is not null
       and coalesce(new.profile_provenance -> field ->> 'source', '') = '' then
      raise exception 'Profile field % requires a recorded source in profile_provenance (provenance gatekeeper)', field;
    end if;
  end loop;
  return new;
end;
$$;

create or replace function public.gatekeep_profile_provenance_update()
returns trigger
language plpgsql
as $$
declare
  field text;
  new_j jsonb := to_jsonb(new);
  old_j jsonb := to_jsonb(old);
begin
  foreach field in array array['annual_mileage_estimate', 'driving_style', 'usage_type'] loop
    if (new_j ->> field) is distinct from (old_j ->> field)
       and (new_j ->> field) is not null
       and coalesce(new.profile_provenance -> field ->> 'source', '') = '' then
      raise exception 'Profile field % requires a recorded source in profile_provenance (provenance gatekeeper)', field;
    end if;
  end loop;
  return new;
end;
$$;

create trigger gatekeep_profile_provenance_insert
  before insert on public.user_vehicles
  for each row execute function public.gatekeep_profile_provenance_insert();

create trigger gatekeep_profile_provenance_update
  before update of annual_mileage_estimate, driving_style, usage_type, profile_provenance on public.user_vehicles
  for each row execute function public.gatekeep_profile_provenance_update();

-- ---------------------------------------------------------------------------
-- 4. R-57 — defaults stop posing as facts
-- ---------------------------------------------------------------------------

alter table public.user_vehicles
  alter column annual_mileage_estimate drop default,
  alter column driving_style drop default,
  alter column usage_type drop default;

-- Logged migration record (the change is a decision with an authority, not
-- a silent edit).
create table public.garage_data_migrations (
  id uuid primary key default gen_random_uuid(),
  migration text not null,
  action text not null,
  vehicle_id uuid,
  detail text,
  applied_at timestamptz not null default now()
);

alter table public.garage_data_migrations enable row level security;

insert into public.garage_data_migrations (migration, action, vehicle_id, detail)
select
  '20261019000000_batch5_garage_data_integrity',
  'r57_profile_fields_nulled',
  id,
  'annual_mileage_estimate/driving_style/usage_type held schema defaults (12000/normal/commuter) indistinguishable from owner facts; set to NULL per spec SS4 (R-57). Authority: data-integrity spec v1.1.'
from public.user_vehicles;

update public.user_vehicles
set annual_mileage_estimate = null,
    driving_style = null,
    usage_type = null,
    profile_provenance = '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 5. Dormant confidence defaults drop to NULL
-- ---------------------------------------------------------------------------

alter table public.vehicle_known_issues
  alter column confidence_score drop not null,
  alter column confidence_score set default null,
  alter column status drop not null,
  alter column status set default null;

alter table public.vehicle_value_history
  alter column confidence_score set default null,
  alter column source set default null;

-- ---------------------------------------------------------------------------
-- 6. Vehicle identity as decoded, stamped fields (R-51 lesson)
-- ---------------------------------------------------------------------------

alter table public.user_vehicles
  add column if not exists vin_decoded_line text,
  add column if not exists vin_decoded_trim text,
  add column if not exists vin_decoded_series text,
  add column if not exists vin_decoded_year integer,
  add column if not exists vin_decoded_make text,
  add column if not exists vin_decoded_body text,
  add column if not exists vin_decoded_drivetrain text,
  add column if not exists vin_decode_provider text,
  add column if not exists vin_decoded_at timestamptz,
  add column if not exists vin_trim_known_gap boolean not null default false;

-- Identity backfill from NHTSA vPIC decodes of the three production VINs
-- (provider values stored verbatim, as decoded, Oct 18 2026).
update public.user_vehicles set
  vin_decoded_line = 'GLC-Class',
  vin_decoded_trim = 'GLC300 Base-4M',
  vin_decoded_series = null,
  vin_decoded_year = 2016,
  vin_decoded_make = 'MERCEDES-BENZ',
  vin_decoded_body = 'Sport Utility Vehicle [SUV]/Multipurpose Vehicle [MPV]',
  vin_decoded_drivetrain = null,
  vin_decode_provider = 'vPIC (NHTSA)',
  vin_decoded_at = now(),
  vin_trim_known_gap = false
where vin = 'WDC0G4KB3GF052161';

update public.user_vehicles set
  vin_decoded_line = 'Q7',
  vin_decoded_trim = 'quattro Premium Plus',
  vin_decoded_series = null,
  vin_decoded_year = 2020,
  vin_decoded_make = 'AUDI',
  vin_decoded_body = 'Sport Utility Vehicle [SUV]/Multipurpose Vehicle [MPV]',
  vin_decoded_drivetrain = 'AWD/All-Wheel Drive',
  vin_decode_provider = 'vPIC (NHTSA)',
  vin_decoded_at = now(),
  vin_trim_known_gap = false
where vin = 'WA1LXAF79LD004459';

update public.user_vehicles set
  vin_decoded_line = 'M850i',
  vin_decoded_trim = 'xDrive GC',
  vin_decoded_series = '8-Series',
  vin_decoded_year = 2022,
  vin_decoded_make = 'BMW',
  vin_decoded_body = 'Sedan/Saloon',
  vin_decoded_drivetrain = 'AWD/All-Wheel Drive',
  vin_decode_provider = 'vPIC (NHTSA)',
  vin_decoded_at = now(),
  vin_trim_known_gap = false
where vin = 'WBAGV8C0XNCH32006';

-- ---------------------------------------------------------------------------
-- 7. Backfill readings (spec SS6/SS8) — founder + harness mirrors
-- ---------------------------------------------------------------------------

-- GLC300 (both accounts): the documented three-source chain.
insert into public.vehicle_mileage_readings
  (vehicle_id, owner_user_id, odometer_value, unit, odometer_miles, reading_date, source, source_detail, layer)
select id, user_id, 132042, 'mi', 132042, date '2026-08-15', 'purchase_document',
       'Greater Detroit Auto Auction invoice (purchase, AS-IS)', 'reported'
from public.user_vehicles where vin = 'WDC0G4KB3GF052161';

insert into public.vehicle_mileage_readings
  (vehicle_id, owner_user_id, odometer_value, unit, odometer_miles, reading_date, source, source_detail, layer)
select id, user_id, 132141, 'mi', 132141, date '2026-08-23', 'shop_document',
       'Firestone Complete Auto Care inspection 2026-08-23', 'observed'
from public.user_vehicles where vin = 'WDC0G4KB3GF052161';

insert into public.vehicle_mileage_readings
  (vehicle_id, owner_user_id, odometer_value, unit, odometer_miles, reading_date, source, source_detail, layer)
select id, user_id, 134163, 'mi', 134163, date '2026-10-13', 'shop_document',
       'Steve''s European Automotive DVI, RO #94154, 2026-10-13', 'observed'
from public.user_vehicles where vin = 'WDC0G4KB3GF052161';

-- M850i (both accounts): the repeated seeded baseline collapses to a single
-- reading stamped unsupported — preserved, never silently upgraded (R-50).
insert into public.vehicle_mileage_readings
  (vehicle_id, owner_user_id, odometer_value, unit, odometer_miles, reading_date, source, source_detail, layer, unsupported)
select id, user_id, 27930, 'mi', 27930, date '2026-10-17', 'owner_reported',
       'Seeded value — no source (R-50)', 'reported', true
from public.user_vehicles where vin = 'WBAGV8C0XNCH32006';

insert into public.garage_data_migrations (migration, action, vehicle_id, detail)
select '20261019000000_batch5_garage_data_integrity', 'm850i_seeded_baseline_stamped_unsupported', id,
       'Seeded current_mileage 27930 carried into the ledger as one unsupported reading dated 2026-10-17 (the date it entered the record); superseded only when a true reading arrives (spec SS6).'
from public.user_vehicles where vin = 'WBAGV8C0XNCH32006';

-- Q7 (both accounts): zero readings by design — no source exists for the
-- seeded 61840, so the ledger stays empty and the Garage shows the honest
-- "No reading on record yet" state (spec SS8).
insert into public.garage_data_migrations (migration, action, vehicle_id, detail)
select '20261019000000_batch5_garage_data_integrity', 'q7_no_reading_backfilled', id,
       'Seeded current_mileage 61840 has no source of any kind; no reading backfilled. Display becomes "No reading on record yet" until a sourced reading arrives (spec SS6/SS8).'
from public.user_vehicles where vin = 'WA1LXAF79LD004459';

-- ---------------------------------------------------------------------------
-- 8. Retire the bare mileage attributes
-- ---------------------------------------------------------------------------

alter table public.user_vehicles
  drop column if exists current_mileage,
  drop column if exists last_mileage_update;
