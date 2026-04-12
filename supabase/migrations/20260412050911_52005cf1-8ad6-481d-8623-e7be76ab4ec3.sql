DROP POLICY IF EXISTS "shop_jobs_update" ON shop_jobs;

CREATE POLICY "shop_jobs_update_own" ON shop_jobs
  FOR UPDATE
  USING (
    shop_id = (
      SELECT shop_id FROM shop_accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id = (
      SELECT shop_id FROM shop_accounts WHERE user_id = auth.uid()
    )
  );