-- Shop inbound layer Phase 1 (Option B) — spec:
-- option-b-inbound-build-spec-2026-11-02.md (approved by Gerrod
-- Nov 2, 2026). New tables only; no changes to existing tables.
--
-- shop_booking_requests holds appointment requests from the public
-- /for-shops/talk page. Rows are created ONLY by the shop-booking-request
-- edge function under the service role, after validation. Status starts
-- at PENDING: an appointment becomes firm only when a human confirms it
-- manually (condition 3 of the approval). Nothing in this build sends an
-- email or places a call.
--
-- shop_talk_conversations logs every shop-assistant conversation
-- (condition 4: logged against the shop record, spot-checked weekly).
-- Written by the shop-talk edge function under the service role; when a
-- booking follows a conversation, booking_request_id and shop_name are
-- set on the conversation row by shop-booking-request.
--
-- Both tables are service-role only: RLS is enabled and forced, and no
-- policies are created for anon or authenticated roles, so the public
-- API can neither read nor write them. All access flows through the two
-- edge functions above.

-- ---------------------------------------------------------------------------
-- 1. table: shop_booking_requests
-- ---------------------------------------------------------------------------

create table if not exists public.shop_booking_requests (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  shop_name text not null,
  contact_phone text,
  contact_email text,
  constraint shop_booking_requests_contact_present
    check (contact_phone is not null or contact_email is not null),
  -- appointment window ids from _shared/shop-talk-config.ts
  -- (APPOINTMENT_WINDOWS); validated again in the edge function.
  preferred_windows text[] not null default '{}'::text[],
  notes text,
  conversation_id uuid,
  status text not null default 'PENDING' check (status in (
    'PENDING', 'CONFIRMED', 'DECLINED', 'COMPLETED'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shop_booking_requests_status_created
  on public.shop_booking_requests (status, created_at desc);

create index if not exists idx_shop_booking_requests_conversation
  on public.shop_booking_requests (conversation_id)
  where conversation_id is not null;

-- ---------------------------------------------------------------------------
-- 2. table: shop_talk_conversations
-- ---------------------------------------------------------------------------

create table if not exists public.shop_talk_conversations (
  id uuid primary key,
  -- set when a booking request names the shop (see header note)
  shop_name text,
  booking_request_id uuid references public.shop_booking_requests(id) on delete set null,
  -- full transcript as delivered to the visitor (post-guard):
  -- [{ "role": "user" | "assistant", "content": "..." }, ...]
  transcript jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shop_talk_conversations_created
  on public.shop_talk_conversations (created_at desc);

-- ---------------------------------------------------------------------------
-- 3. row level security (service-role only, deliberately no policies)
-- ---------------------------------------------------------------------------

alter table public.shop_booking_requests enable row level security;
alter table public.shop_booking_requests force row level security;
alter table public.shop_talk_conversations enable row level security;
alter table public.shop_talk_conversations force row level security;

-- ---------------------------------------------------------------------------
-- 4. updated_at maintenance (reuses the repo's existing trigger function)
-- ---------------------------------------------------------------------------

drop trigger if exists update_shop_booking_requests_updated_at on public.shop_booking_requests;
create trigger update_shop_booking_requests_updated_at
  before update on public.shop_booking_requests
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_shop_talk_conversations_updated_at on public.shop_talk_conversations;
create trigger update_shop_talk_conversations_updated_at
  before update on public.shop_talk_conversations
  for each row execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- ROLLBACK (down steps, commented out)
-- ---------------------------------------------------------------------------
-- drop trigger if exists update_shop_talk_conversations_updated_at on public.shop_talk_conversations;
-- drop trigger if exists update_shop_booking_requests_updated_at on public.shop_booking_requests;
-- drop table if exists public.shop_talk_conversations;
-- drop table if exists public.shop_booking_requests;
