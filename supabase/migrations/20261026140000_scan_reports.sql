-- Scan report import (Path 2): structured storage for owner-imported scan
-- tool reports (e.g. Innova RepairSolutions2 PDF exports).
--
-- Design: the PDF itself lives in the private garage-vehicle-media bucket
-- (storage_path below). This table is the single source of truth for the
-- parsed codes (parsed_payload jsonb); the vehicle_timeline_events row
-- created at filing time records the filing on the car's record and links
-- back here via timeline_event_id. A report row is created by the
-- parse-scan-report edge function in an UNFILED state (vehicle_id null):
-- filing to a vehicle happens only after the owner confirms the match in
-- the app. There is no code path that files a report silently.
--
-- Provenance: a scan report is document-sourced data. The timeline entry
-- that references it uses source_type 'document' and names the tool.

create table public.scan_reports (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid references public.user_vehicles(id) on delete cascade,
  timeline_event_id uuid references public.vehicle_timeline_events(id) on delete set null,
  source_tool text not null default 'Unknown scan tool'
    check (length(btrim(source_tool)) > 0),
  report_id text,
  scanned_at timestamptz,
  odometer integer check (odometer is null or odometer >= 0),
  vin_fragment text,
  vehicle_label text,
  storage_bucket text not null default 'garage-vehicle-media',
  storage_path text not null,
  original_filename text,
  parse_status text not null check (parse_status in ('parsed', 'partial', 'unparsed')),
  parsed_payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(parsed_payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create index idx_scan_reports_owner_time
  on public.scan_reports (owner_user_id, created_at desc);
create index idx_scan_reports_vehicle_time
  on public.scan_reports (vehicle_id, scanned_at desc)
  where vehicle_id is not null;

alter table public.scan_reports enable row level security;
alter table public.scan_reports force row level security;

create policy "Owners can view their scan reports"
  on public.scan_reports for select
  using (
    auth.uid() = owner_user_id
    and (vehicle_id is null or public.garage_vehicle_is_owned_by_current_user(vehicle_id))
  );

create policy "Owners can create their scan reports"
  on public.scan_reports for insert
  with check (
    auth.uid() = owner_user_id
    and (vehicle_id is null or public.garage_vehicle_is_owned_by_current_user(vehicle_id))
  );

-- Filing is an UPDATE that sets vehicle_id / timeline_event_id after the
-- owner confirms the match. The policy still requires the target vehicle
-- (when set) to belong to the caller.
create policy "Owners can update their scan reports"
  on public.scan_reports for update
  using (auth.uid() = owner_user_id)
  with check (
    auth.uid() = owner_user_id
    and (vehicle_id is null or public.garage_vehicle_is_owned_by_current_user(vehicle_id))
  );

create policy "Owners can remove their scan report metadata"
  on public.scan_reports for delete
  using (auth.uid() = owner_user_id);

create trigger update_scan_reports_updated_at
  before update on public.scan_reports
  for each row execute function public.update_updated_at_column();
