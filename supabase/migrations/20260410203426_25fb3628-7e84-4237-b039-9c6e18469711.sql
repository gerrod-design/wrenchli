
-- =============================================================
-- 1. REFERRAL PACKAGES: Replace open SELECT with RPC-based access
-- =============================================================

-- Create a security definer function to fetch a referral package by token
CREATE OR REPLACE FUNCTION public.get_referral_package_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT to_jsonb(rp.*) INTO result
  FROM public.referral_packages rp
  WHERE rp.token = p_token
    AND rp.expires_at > now()
  LIMIT 1;

  RETURN result;
END;
$$;

-- Create a function to increment view count by token
CREATE OR REPLACE FUNCTION public.increment_referral_view(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.referral_packages
  SET view_count = view_count + 1
  WHERE token = p_token AND expires_at > now();
END;
$$;

-- Create a function to increment PDF download count by token
CREATE OR REPLACE FUNCTION public.increment_referral_download(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.referral_packages
  SET pdf_download_count = pdf_download_count + 1
  WHERE token = p_token AND expires_at > now();
END;
$$;

-- Drop the overly permissive SELECT and UPDATE policies
DROP POLICY IF EXISTS "Anyone can view referral packages by token" ON public.referral_packages;
DROP POLICY IF EXISTS "Anyone can update view counts" ON public.referral_packages;

-- Add admin-only SELECT policy (RPC functions bypass RLS via SECURITY DEFINER)
CREATE POLICY "Admins can read referral packages"
  ON public.referral_packages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin-only UPDATE policy
CREATE POLICY "Admins can update referral packages"
  ON public.referral_packages FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================
-- 2. USER_ROLES: Add WITH CHECK to UPDATE policy
-- =============================================================

DROP POLICY IF EXISTS "Only admins can update user_roles" ON public.user_roles;
CREATE POLICY "Only admins can update user_roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_id = auth.uid());

-- =============================================================
-- 3. ACCURACY_METRICS: Restrict to authenticated users
-- =============================================================

DROP POLICY IF EXISTS "Anyone can read accuracy metrics" ON public.accuracy_metrics;
CREATE POLICY "Authenticated can read accuracy metrics"
  ON public.accuracy_metrics FOR SELECT TO authenticated
  USING (true);

-- =============================================================
-- 4. SHOP_PERFORMANCE_METRICS: Restrict to authenticated users
-- =============================================================

DROP POLICY IF EXISTS "Anyone can read shop performance" ON public.shop_performance_metrics;
CREATE POLICY "Authenticated can read shop performance"
  ON public.shop_performance_metrics FOR SELECT TO authenticated
  USING (true);
