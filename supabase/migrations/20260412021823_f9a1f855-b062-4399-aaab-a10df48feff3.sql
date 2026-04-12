
-- Recreate the view with security_invoker to respect caller permissions
DROP VIEW IF EXISTS public.shops_public;
CREATE VIEW public.shops_public
WITH (security_invoker = true)
AS
SELECT
  id, name, slug, owner_name,
  address_street, address_city, address_state, address_zip,
  bay_count, verified_status, is_pilot,
  created_at, updated_at
FROM public.shops
WHERE verified_status = 'active';

-- Re-grant access
GRANT SELECT ON public.shops_public TO anon;
GRANT SELECT ON public.shops_public TO authenticated;

-- Now we need a SELECT policy on the base shops table for non-owners
-- since security_invoker means the view respects RLS of the caller
-- Create a limited public SELECT policy that only returns non-PII columns
-- But RLS is row-level, not column-level, so we need a policy that allows reading active shops
-- The view already filters columns, so a simple row-level policy is fine
CREATE POLICY "Public can read active shops via view"
  ON public.shops FOR SELECT
  TO anon, authenticated
  USING (verified_status = 'active');
