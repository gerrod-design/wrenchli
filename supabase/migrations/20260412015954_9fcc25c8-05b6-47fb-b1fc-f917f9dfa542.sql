
-- Add anon_session_id to vehicles table
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS anon_session_id text;

-- ============================================================
-- VEHICLES: Tighten anon policies to require anon_session_id
-- ============================================================

DROP POLICY IF EXISTS "Anon can insert vehicles" ON public.vehicles;
CREATE POLICY "Anon can insert vehicles"
  ON public.vehicles FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND anon_session_id IS NOT NULL);

DROP POLICY IF EXISTS "Anon can read vehicles with null user" ON public.vehicles;
CREATE POLICY "Anon can read own vehicles"
  ON public.vehicles FOR SELECT
  TO anon
  USING (user_id IS NULL AND anon_session_id IS NOT NULL);

-- ============================================================
-- DIAGNOSTIC_SESSIONS: Tighten anon policies to require anon_session_id
-- ============================================================

DROP POLICY IF EXISTS "Anon can read guest sessions" ON public.diagnostic_sessions;
CREATE POLICY "Anon can read own guest sessions"
  ON public.diagnostic_sessions FOR SELECT
  TO anon
  USING (user_id IS NULL AND anon_session_id IS NOT NULL);

DROP POLICY IF EXISTS "Anon can create sessions" ON public.diagnostic_sessions;
CREATE POLICY "Anon can create sessions"
  ON public.diagnostic_sessions FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND anon_session_id IS NOT NULL);
