
-- ============================================================
-- FIX 1: outcome_reports — scope null-user_id rows by session
-- ============================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can manage their own outcome reports" ON public.outcome_reports;

-- Authenticated users can read/write their own reports
CREATE POLICY "Authed users manage own outcome reports"
  ON public.outcome_reports FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Guest reports (user_id IS NULL) are scoped by anon_session_id on the linked diagnostic_session.
-- Guests can only INSERT (not read/update/delete) and only for sessions they own.
CREATE POLICY "Guests can insert outcome for own session"
  ON public.outcome_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    AND session_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.diagnostic_sessions ds
      WHERE ds.id = session_id
        AND ds.user_id IS NULL
    )
  );

-- ============================================================
-- FIX 2: damage-photos storage — path-based ownership scoping
-- ============================================================

-- Remove the wide-open policies
DROP POLICY IF EXISTS "Anyone can upload damage photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for damage photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own damage photos" ON storage.objects;

-- Upload: file path must start with the user's UID folder
CREATE POLICY "Users upload own damage photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'damage-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: users can only read files in their own folder
CREATE POLICY "Users read own damage photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'damage-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: users can only delete files in their own folder
CREATE POLICY "Users delete own damage photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'damage-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role retains full access via default Supabase behavior (no policy needed)
