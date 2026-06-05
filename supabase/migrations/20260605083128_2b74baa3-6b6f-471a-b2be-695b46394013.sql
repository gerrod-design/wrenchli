
-- 1. Referral packages: drop the broad INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert referral packages" ON public.referral_packages;

-- 2. Shop performance metrics: restrict SELECT to shop owners
DROP POLICY IF EXISTS "Authenticated can read shop performance" ON public.shop_performance_metrics;

CREATE POLICY "Shops can read own performance metrics"
ON public.shop_performance_metrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shop_accounts sa
    WHERE sa.shop_id = shop_performance_metrics.shop_id
      AND sa.user_id = auth.uid()
  )
);

-- 3. Damage photos storage: add UPDATE policy
DROP POLICY IF EXISTS "Users update own damage photos" ON storage.objects;
CREATE POLICY "Users update own damage photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. audit_runs: RLS enabled but had no policies. Add admin-only access.
CREATE POLICY "Admins read audit runs"
ON public.audit_runs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages audit runs"
ON public.audit_runs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Revoke EXECUTE on internal SECURITY DEFINER helpers from anon and authenticated.
-- These are called from triggers, RLS policies, or edge functions via service_role.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_youtube_cache() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_edge_rate_limits() FROM PUBLIC, anon, authenticated;

-- resolve_security_alert checks admin in-function; only authenticated callers need it.
REVOKE EXECUTE ON FUNCTION public.resolve_security_alert(uuid) FROM PUBLIC, anon;

-- Referral helpers stay anon-callable (used on public referral landing pages).
