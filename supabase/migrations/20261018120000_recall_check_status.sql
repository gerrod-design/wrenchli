-- Batch 1.5 (R-51): persist per-vehicle recall-check outcomes so a failed
-- NHTSA lookup is a visible Garage state, never indistinguishable from
-- "this vehicle has no recalls".
CREATE TABLE IF NOT EXISTS public.vehicle_recall_checks (
  vehicle_id uuid PRIMARY KEY REFERENCES public.user_vehicles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('ok', 'failed')),
  checked_at timestamptz NOT NULL DEFAULT now(),
  campaigns_found integer,
  model_used text,
  note text,
  error text
);

ALTER TABLE public.vehicle_recall_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can read recall checks for their vehicles" ON public.vehicle_recall_checks;
CREATE POLICY "Owners can read recall checks for their vehicles"
  ON public.vehicle_recall_checks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_vehicles uv
      WHERE uv.id = vehicle_id AND uv.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.vehicle_recall_checks TO authenticated;
