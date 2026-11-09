-- Minimal prerequisite objects stubbed for scratch replay of the
-- Referral Phase 1 migration in tests. Mirrors the real base schema
-- only where that migration touches it:
--   auth.users / auth.uid() (Supabase platform objects)
--   public.app_role + public.has_role(uuid, app_role) (from migration 20260209012230)
--   public.quote_requests (id only; referral_packages FK target)
--   public.referral_packages (from migration 20260328151059, plus the
--     user_id column the token RPC selects)
--   public.service_providers (from migration 20260330122852, id + name
--     only — the only columns the Phase 1 migration reads)
-- Platform objects only, no production schema is redefined here.

create schema auth;

-- Supabase platform roles (exist on every Supabase project)
create role authenticated nologin;
create role anon nologin;
create role service_role nologin;

create table auth.users (id uuid primary key);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;

create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.quote_requests (
  id uuid primary key default gen_random_uuid()
);

create table public.referral_packages (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  user_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  vehicle_year text,
  vehicle_make text,
  vehicle_model text,
  vehicle_trim text,
  vin text,
  diagnosis_title text not null,
  diagnosis_code text,
  diagnosis_urgency text,
  diagnosis_details jsonb default '{}',
  diy_feasibility text,
  estimated_cost_low numeric,
  estimated_cost_high numeric,
  cost_estimate_details jsonb default '{}',
  metro_area text,
  zip_code text,
  photo_urls text[] default '{}',
  audio_clip_url text,
  video_frame_urls text[] default '{}',
  chat_summary text,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_notes text,
  quote_request_id uuid references public.quote_requests(id),
  view_count integer not null default 0,
  pdf_download_count integer not null default 0
);
alter table public.referral_packages enable row level security;

create table public.service_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null
);
alter table public.service_providers enable row level security;
