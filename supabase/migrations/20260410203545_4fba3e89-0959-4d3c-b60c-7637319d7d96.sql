
-- =============================================================
-- 1. DIAGNOSTIC_SESSIONS: Remove anon access, scope to owner
-- =============================================================

DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.diagnostic_sessions;

-- Authenticated users can read their own sessions
CREATE POLICY "Users can read own sessions"
  ON public.diagnostic_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert sessions for themselves
CREATE POLICY "Users can insert own sessions"
  ON public.diagnostic_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON public.diagnostic_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Anon users can insert sessions (guest diagnostic wizard)
CREATE POLICY "Anon can create sessions"
  ON public.diagnostic_sessions FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- =============================================================
-- 2. DIAGNOSES: Remove anon access, scope to owner
-- =============================================================

DROP POLICY IF EXISTS "Diagnoses via session" ON public.diagnoses;

CREATE POLICY "Diagnoses via authenticated session"
  ON public.diagnoses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM diagnostic_sessions s
    WHERE s.id = diagnoses.session_id
      AND s.user_id = auth.uid()
  ));

-- =============================================================
-- 3. POSSIBLE_CAUSES: Remove anon access, scope to owner
-- =============================================================

DROP POLICY IF EXISTS "Possible causes via session" ON public.possible_causes;

CREATE POLICY "Possible causes via authenticated session"
  ON public.possible_causes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM diagnoses d
    JOIN diagnostic_sessions s ON s.id = d.session_id
    WHERE d.id = possible_causes.diagnosis_id
      AND s.user_id = auth.uid()
  ));
