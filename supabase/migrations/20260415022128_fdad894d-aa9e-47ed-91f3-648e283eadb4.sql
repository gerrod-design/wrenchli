-- 1. SHOPS TABLE: The existing "Shop owners can manage their shop" ALL policy
--    already allows owner SELECT. No additional SELECT policy needed for non-owners
--    per the request ("Do not allow consumers to read other shops' records").
--    The warning is about non-owners not being able to read — which is the desired behavior.
--    No changes needed to the shops table.

-- 2. ACCURACY_METRICS TABLE: Remove the overly permissive SELECT policy
--    and keep only admin + service_role access.
DROP POLICY IF EXISTS "Authenticated can read accuracy metrics" ON public.accuracy_metrics;