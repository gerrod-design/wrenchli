-- =============================================================
-- Mobility Brief 1 — Alternative Transportation Panel (2026-11-13)
--
-- Adds the per-shop mobility attributes the "While your car is
-- down" transportation panel renders (Brief 1 of the mobility
-- components build briefs, 2026-11-09; approved by Gerrod
-- 2026-11-13, both panel placements, neutral public-claims
-- posture):
--
--   offers_loaner          shop-reported loaner cars
--   offers_shuttle         shop-reported shuttle service
--   offers_pickup_delivery shop-reported pickup and delivery
--                          (created here; consumed by Brief 3,
--                          shop-arranged tow / flatbed pickup
--                          and delivery, a later gated build)
--   mobility_notes         the shop's own words (e.g. "Loaner
--                          with any repair over $500"), plain
--                          text, length-capped at 200 characters.
--
-- All four default to unset, so existing rows and reads are
-- untouched; an unset attribute renders nothing in the product,
-- never a "no" claim.
--
-- These are public-display attributes: active service_providers
-- rows are already world-readable under the table's existing RLS
-- policy, and the columns carry business facts, not personal
-- data. Writes stay admin-only under the existing policy —
-- Phase 1 shops have no account or self-edit path, so in V1 the
-- values are entered by Wrenchli ops from the recruiting /
-- partner-onboarding conversation (attested by the shop). No
-- policy change in this migration.
-- =============================================================

ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS offers_loaner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offers_shuttle boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offers_pickup_delivery boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mobility_notes text;

ALTER TABLE public.service_providers
  DROP CONSTRAINT IF EXISTS service_providers_mobility_notes_length;

ALTER TABLE public.service_providers
  ADD CONSTRAINT service_providers_mobility_notes_length
  CHECK (mobility_notes IS NULL OR char_length(mobility_notes) <= 200);

COMMENT ON COLUMN public.service_providers.offers_loaner IS
  'Shop-reported: this shop offers loaner cars. Entered by Wrenchli ops from the shop''s own statement (Mobility Brief 1, 2026-11-13).';
COMMENT ON COLUMN public.service_providers.offers_shuttle IS
  'Shop-reported: this shop offers shuttle service. Entered by Wrenchli ops from the shop''s own statement (Mobility Brief 1, 2026-11-13).';
COMMENT ON COLUMN public.service_providers.offers_pickup_delivery IS
  'Shop-reported: this shop offers pickup and delivery. Entered by Wrenchli ops from the shop''s own statement (Mobility Brief 1, 2026-11-13; consumed by Mobility Brief 3).';
COMMENT ON COLUMN public.service_providers.mobility_notes IS
  'Shop-stated mobility detail in the shop''s own words, plain text, max 200 characters (Mobility Brief 1, 2026-11-13).';
