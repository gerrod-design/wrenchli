-- Drop the weak UPDATE policy on shop_accounts
DROP POLICY IF EXISTS "shops_update_own" ON shop_accounts;

-- Recreate with WITH CHECK locking both clauses to the authenticated user
CREATE POLICY "shops_update_own" ON shop_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);