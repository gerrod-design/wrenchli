-- Drop the weak anonymous INSERT policies
DROP POLICY IF EXISTS "Anon can insert diagnoses" ON diagnosis_records;
DROP POLICY IF EXISTS "Auth can insert diagnoses" ON diagnosis_records;

-- Single policy: anon must have null customer_id, authenticated must own it
CREATE POLICY "insert_diagnosis_records" ON diagnosis_records
  FOR INSERT
  WITH CHECK (
    (auth.role() = 'anon' AND customer_id IS NULL)
    OR
    (auth.role() = 'authenticated' AND (customer_id IS NULL OR auth.uid() = customer_id))
  );