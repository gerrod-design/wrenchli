
-- ============================================================
-- FIX 1: Flip damage-photos bucket to private
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'damage-photos';

-- ============================================================
-- FIX 2: Remove blanket anon SELECT policies on
--         diagnostic_sessions and vehicles
-- ============================================================

-- Remove the overly-permissive anon SELECT policies
DROP POLICY IF EXISTS "Anon can read own guest sessions" ON public.diagnostic_sessions;
DROP POLICY IF EXISTS "Anon can read own vehicles" ON public.vehicles;

-- INSERT policies stay — they already require anon_session_id IS NOT NULL
-- The frontend will pre-generate UUIDs so .select() after insert is not needed

-- ============================================================
-- FIX 3: Remove PII from public shops SELECT
-- ============================================================

-- Drop the public-facing policy that exposes email and phone
DROP POLICY IF EXISTS "Anyone can read active shops" ON public.shops;

-- Create a view that excludes PII fields
CREATE OR REPLACE VIEW public.shops_public AS
SELECT
  id, name, slug, owner_name,
  address_street, address_city, address_state, address_zip,
  bay_count, verified_status, is_pilot,
  created_at, updated_at
FROM public.shops
WHERE verified_status = 'active';

-- Grant read access on the view to anon and authenticated
GRANT SELECT ON public.shops_public TO anon;
GRANT SELECT ON public.shops_public TO authenticated;

-- Shop owners still have full access via existing "Shop owners can manage their shop" policy
-- Admins access via service_role
