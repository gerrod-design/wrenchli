-- =============================================================================
-- Migration: Link assessment handoffs to Garage vehicles
-- R-70 Tier 2
--
-- Context:
--   public.assessment_handoffs (Phase 1) carries an immutable `snapshot`
--   of a completed assessment (vehicle, symptoms, assessment). Phase 2
--   (Garage) needs to associate a handoff row with a specific vehicle in
--   public.user_vehicles so that an assessment's history can be surfaced
--   on that vehicle's record.
--
--   This link is NOT part of the frozen snapshot. It is stamped in one of
--   two ways:
--     1. At handoff creation time, when the wizard is launched directly
--        from a Garage vehicle card (the edge function sets
--        user_vehicle_id immediately).
--     2. Later, by the "claim" step in the assessment-handoff edge
--        function, when a user retroactively attaches a completed
--        assessment to a vehicle in their Garage.
--
--   Because ownership/link columns were deliberately left updatable in
--   Phase 1 (only `snapshot` is frozen by the immutability trigger), no
--   changes to that trigger or to RLS policies are needed here. Writes to
--   this table continue to happen only via the service role inside edge
--   functions.
--
--   Deleting a vehicle from the Garage must never delete the owner's
--   assessment history, so the foreign key uses ON DELETE SET NULL.
-- =============================================================================

alter table public.assessment_handoffs
  add column if not exists user_vehicle_id uuid null
    references public.user_vehicles(id) on delete set null;

create index if not exists idx_assessment_handoffs_user_vehicle_id
  on public.assessment_handoffs (user_vehicle_id)
  where user_vehicle_id is not null;

-- =============================================================================
-- ROLLBACK (manual, if ever needed)
-- =============================================================================
-- drop index if exists public.idx_assessment_handoffs_user_vehicle_id;
-- alter table public.assessment_handoffs drop column if exists user_vehicle_id;
