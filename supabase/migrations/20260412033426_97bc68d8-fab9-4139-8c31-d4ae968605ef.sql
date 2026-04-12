-- ============================================
-- FIX 1: symptom_reports cross-session leak
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Symptom reports via session" ON public.symptom_reports;

-- Authenticated users: full access to their own sessions only
CREATE POLICY "Authenticated symptom reports via own session"
ON public.symptom_reports
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM diagnostic_sessions s
    WHERE s.id = symptom_reports.session_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM diagnostic_sessions s
    WHERE s.id = symptom_reports.session_id
      AND s.user_id = auth.uid()
  )
);

-- Anonymous users: INSERT only, scoped to anonymous sessions
CREATE POLICY "Anon can insert symptom reports"
ON public.symptom_reports
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM diagnostic_sessions s
    WHERE s.id = symptom_reports.session_id
      AND s.user_id IS NULL
      AND s.anon_session_id IS NOT NULL
  )
);

-- ============================================
-- FIX 2: repair_recommendations cross-session leak
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Recommendations via session" ON public.repair_recommendations;

-- Authenticated users: full access to their own sessions only
CREATE POLICY "Authenticated recommendations via own session"
ON public.repair_recommendations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM diagnostic_sessions s
    WHERE s.id = repair_recommendations.session_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM diagnostic_sessions s
    WHERE s.id = repair_recommendations.session_id
      AND s.user_id = auth.uid()
  )
);

-- Anonymous users: INSERT only, scoped to anonymous sessions
CREATE POLICY "Anon can insert repair recommendations"
ON public.repair_recommendations
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM diagnostic_sessions s
    WHERE s.id = repair_recommendations.session_id
      AND s.user_id IS NULL
      AND s.anon_session_id IS NOT NULL
  )
);