-- Garage defect fixes: weak-point model matching + parent cascade deletes.
--
-- DEFECT-1: the baseline-completion RPC (and the frontend matcher in
-- src/lib/garageRecord.ts) compared model strings that disagree across
-- sources: NHTSA's VIN decoder returns "GLC-Class" while the weak-point
-- library keys "GLC", so the X253 check was never required for a vehicle
-- added by VIN. Both sides now go through public.garage_normalize_model,
-- which also preserves the existing Silverado " 1500" strip.
--
-- DEFECT-2 (D7): the append-only / completed-baseline guard triggers raised
-- on EVERY delete/update, including referential cascade deletes driven by
-- removing the parent vehicle or the owner account, so a consumer could not
-- delete a vehicle with history or delete their account (P0001, HTTP 500).
-- The guards now allow a mutation only when it is a side effect of a parent
-- cascade (the parent vehicle row or the owner auth.users row is already
-- gone inside the same statement). Direct mutation of a live vehicle's
-- timeline events, and direct deletion of a completed baseline whose
-- vehicle still exists, still fail closed.

-- NHTSA returns model names like "GLC-Class" while the weak-point library keys models as "GLC";
-- normalize both sides identically here (also preserves the Silverado "1500" trailing-strip).
create or replace function public.garage_normalize_model(p_model text)
returns text
language sql
immutable
as $$
  select regexp_replace(
           regexp_replace(lower(btrim(coalesce(p_model, ''))), '-class$', ''),
           ' 1500$', '');
$$;

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
    and public.garage_normalize_model(w.model) = public.garage_normalize_model(v_vehicle.model)
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

-- CHANGE 1: public.prevent_vehicle_timeline_mutation()
-- Append-only trigger, but allows rows to pass through unchanged when the
-- mutation is actually a side-effect of a parent cascade (vehicle deleted,
-- or owner account deleted), rather than a genuine attempt to mutate history.
create or replace function public.prevent_vehicle_timeline_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    -- Allow delete only if it is a consequence of the parent vehicle or
    -- owner account row already being gone (cascade), not a direct delete.
    if not exists (select 1 from public.user_vehicles where id = old.vehicle_id)
       or not exists (select 1 from auth.users where id = old.owner_user_id) then
      return old;
    end if;

    raise exception 'Vehicle timeline events are append-only';
  end if;

  if tg_op = 'UPDATE' then
    -- Allow only the referential SET NULL performed by FK cascades when the
    -- parent vehicle or owner account has been removed, and only for the
    -- baseline_id / condition_check_id / created_by columns transitioning
    -- to null. All other columns must be unchanged.
    if (
          not exists (select 1 from public.user_vehicles where id = old.vehicle_id)
          or not exists (select 1 from auth.users where id = old.owner_user_id)
        )
       and (new.baseline_id is not distinct from old.baseline_id or new.baseline_id is null)
       and (new.condition_check_id is not distinct from old.condition_check_id or new.condition_check_id is null)
       and (new.created_by is not distinct from old.created_by or new.created_by is null)
       and new.id is not distinct from old.id
       and new.vehicle_id is not distinct from old.vehicle_id
       and new.owner_user_id is not distinct from old.owner_user_id
       and new.vin is not distinct from old.vin
       and new.layer is not distinct from old.layer
       and new.category is not distinct from old.category
       and new.title is not distinct from old.title
       and new.detail is not distinct from old.detail
       and new.source_type is not distinct from old.source_type
       and new.source_name is not distinct from old.source_name
       and new.occurred_at is not distinct from old.occurred_at
       and new.captured_at is not distinct from old.captured_at
       and new.odometer is not distinct from old.odometer
       and new.media is not distinct from old.media
       and new.weak_point_check_id is not distinct from old.weak_point_check_id
       and new.created_at is not distinct from old.created_at
    then
      return new;
    end if;

    raise exception 'Vehicle timeline events are append-only';
  end if;

  raise exception 'Vehicle timeline events are append-only';
end;
$$;

-- CHANGE 2: public.prevent_completed_baseline_mutation()
create or replace function public.prevent_completed_baseline_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow deletion of a baseline row when it is a consequence of the
  -- parent vehicle or owner account already being gone (cascade), even if
  -- the baseline was completed.
  if tg_op = 'DELETE' then
    if not exists (select 1 from public.user_vehicles where id = old.vehicle_id)
       or not exists (select 1 from auth.users where id = old.owner_user_id) then
      return old;
    end if;
  end if;

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

-- CHANGE 3: public.prevent_completed_baseline_child_mutation()
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
    -- Allow deletion when it is a consequence of the parent vehicle or
    -- owner account already being gone (cascade), regardless of whether
    -- the referenced baseline is still marked completed.
    if not exists (select 1 from public.user_vehicles where id = old.vehicle_id)
       or not exists (select 1 from auth.users where id = old.owner_user_id) then
      return old;
    end if;

    v_baseline_id := old.baseline_id;
    if v_baseline_id is null then
      return old;
    end if;

    select status into v_status from public.vehicle_baselines where id = v_baseline_id;
    if v_status = 'completed' then
      raise exception 'Records in a completed baseline are immutable; add a new baseline or timeline correction';
    end if;

    return old;
  end if;

  v_baseline_id := new.baseline_id;
  if v_baseline_id is null then
    return new;
  end if;

  select status into v_status from public.vehicle_baselines where id = v_baseline_id;
  if v_status = 'completed' then
    raise exception 'Records in a completed baseline are immutable; add a new baseline or timeline correction';
  end if;

  return new;
end;
$$;
