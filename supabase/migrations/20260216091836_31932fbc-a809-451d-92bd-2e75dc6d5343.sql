
-- Allow admins to read rate limit data for analytics
CREATE POLICY "Admins can read rate limits"
  ON public.api_rate_limits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
