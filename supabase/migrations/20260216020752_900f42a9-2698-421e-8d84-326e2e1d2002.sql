
-- Remove overly permissive INSERT policy; edge function uses service_role which bypasses RLS
DROP POLICY "Service can insert recall alerts" ON public.recall_alerts;

-- Only authenticated users who own the vehicle can insert (or admins via the ALL policy)
CREATE POLICY "Users can insert own recall alerts"
  ON public.recall_alerts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_vehicles
    WHERE user_vehicles.id = recall_alerts.vehicle_id
      AND user_vehicles.user_id = auth.uid()
  ));
