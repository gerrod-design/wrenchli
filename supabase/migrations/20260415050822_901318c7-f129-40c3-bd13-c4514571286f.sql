ALTER TABLE public.diagnostic_sessions
  ADD COLUMN shop_share_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN shop_share_consented_at timestamp with time zone;