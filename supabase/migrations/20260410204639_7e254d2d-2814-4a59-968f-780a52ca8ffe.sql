-- Allow anonymous users to read back their own diagnostic sessions
-- Scoped to rows where user_id IS NULL (guest sessions only)
-- This mirrors the existing pattern on the vehicles table
CREATE POLICY "Anon can read guest sessions"
  ON public.diagnostic_sessions
  FOR SELECT
  TO anon
  USING (user_id IS NULL);
