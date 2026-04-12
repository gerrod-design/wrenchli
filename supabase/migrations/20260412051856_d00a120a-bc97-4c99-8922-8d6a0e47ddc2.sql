ALTER TABLE referral_packages ADD COLUMN user_id uuid;

DROP POLICY IF EXISTS "referral_packages_insert" ON referral_packages;

CREATE POLICY "referral_packages_insert_own" ON referral_packages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);