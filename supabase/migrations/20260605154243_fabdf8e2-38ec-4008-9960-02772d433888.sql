
-- 1. shops: explicit admin SELECT (owner already covered by existing FOR ALL policy)
CREATE POLICY "Admins can read shops"
  ON public.shops
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. referral_packages: allow users to read their own packages
CREATE POLICY "Users can read own referral packages"
  ON public.referral_packages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. edge_rate_limits: explicit service-role-only SELECT
CREATE POLICY "Service role can read edge rate limits"
  ON public.edge_rate_limits
  FOR SELECT
  TO service_role
  USING (true);

-- 4. Revoke EXECUTE on SECURITY DEFINER functions that should not be user-callable.
-- Trigger functions (called only by Postgres triggers):
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_shop_id_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_vehicle() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_shop() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_possible_cause() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_diagnostic_accuracy() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_accuracy_metrics() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_pro_subscription_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_diagnosis_record_ownership() FROM PUBLIC, anon, authenticated;

-- Admin/service-only maintenance helpers:
REVOKE EXECUTE ON FUNCTION public.resolve_security_alert(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_youtube_cache() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_edge_rate_limits() FROM PUBLIC, anon, authenticated;

-- Grant back to service_role / admin paths where needed
GRANT EXECUTE ON FUNCTION public.resolve_security_alert(uuid) TO authenticated;  -- gated internally by has_role check
GRANT EXECUTE ON FUNCTION public.cleanup_youtube_cache() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_edge_rate_limits() TO service_role;
