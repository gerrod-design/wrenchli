-- Shop recommendations wiring — nomination campaign + recruiting intake.
--
-- Adds columns to public.shop_recommendations:
--   processed_at    TIMESTAMPTZ — recruiting-intake marker; set when a
--                   recommendation has been processed into the shop
--                   recruiting queue.
--   intake_batch    TEXT — batch reference when the recommendation is
--                   included in a Gerrod-approved recruiting batch.
--   email_consent   BOOLEAN NOT NULL DEFAULT false — the recommender
--                   opted in to email about their shop joining Wrenchli
--                   and occasional Wrenchli updates.
--   email_consent_at TIMESTAMPTZ — when that email consent was given.
--   share_identity  BOOLEAN NOT NULL DEFAULT false — the recommender
--                   opted in to be named to the shop as the customer who
--                   recommended them. Without this, recommenders are
--                   never named to shops.
--   joined_at       TIMESTAMPTZ — when the recommended shop joined
--                   Wrenchli.
--   joined_shop_id  UUID (plain, no FK) — the shop record created when
--                   the recommended shop joined.
--
-- No RLS changes: existing policies stand; recruiting intake uses
-- service-level access.

ALTER TABLE public.shop_recommendations
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS intake_batch TEXT,
  ADD COLUMN IF NOT EXISTS email_consent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS share_identity BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS joined_shop_id UUID;
