-- Minimal prerequisite objects stubbed for scratch replay of the Garage
-- migration in tests. Mirrors the real base schema only where the Garage
-- migration touches it:
--   auth.users / auth.uid() (Supabase platform objects)
--   storage.buckets / storage.objects / storage.foldername() (Supabase platform objects)
--   public.user_vehicles (from migration 20260216001206, columns as defined there)
--   public.app_role + public.has_role(uuid, app_role) (from migration 20260209012230)
--   public.update_updated_at_column() (from migration 20260209061151)
-- Same stub set the Phase A gate harness used to replay the migration on
-- PGlite; platform objects only, no production schema is redefined here.

create schema auth;
create schema storage;

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

create table storage.buckets (
  id text primary key,
  name text not null,
  owner uuid,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  metadata jsonb,
  path_tokens text[]
);
alter table storage.objects enable row level security;

create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select (string_to_array(name, '/'))[1:cardinality(string_to_array(name, '/')) - 1]
$$;

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

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.user_vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null,
  make text not null,
  model text not null,
  trim text,
  vin text,
  current_mileage integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_vehicles enable row level security;
