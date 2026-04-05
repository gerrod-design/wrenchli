CREATE POLICY "Anon can read vehicles with null user"
  ON public.vehicles
  FOR SELECT
  TO anon
  USING (user_id IS NULL);