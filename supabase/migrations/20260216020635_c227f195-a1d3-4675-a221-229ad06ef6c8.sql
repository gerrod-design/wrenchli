
-- Table to store recall alerts per user vehicle
CREATE TABLE public.recall_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.user_vehicles(id) ON DELETE CASCADE,
  campaign_number text NOT NULL,
  component text NOT NULL,
  summary text NOT NULL,
  consequence text,
  remedy text,
  priority text NOT NULL DEFAULT 'high',
  is_read boolean NOT NULL DEFAULT false,
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id, campaign_number)
);

ALTER TABLE public.recall_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recall alerts"
  ON public.recall_alerts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_vehicles
    WHERE user_vehicles.id = recall_alerts.vehicle_id
      AND user_vehicles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own recall alerts"
  ON public.recall_alerts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_vehicles
    WHERE user_vehicles.id = recall_alerts.vehicle_id
      AND user_vehicles.user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage all recall alerts"
  ON public.recall_alerts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow edge function (service role) to insert
CREATE POLICY "Service can insert recall alerts"
  ON public.recall_alerts FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_recall_alerts_vehicle ON public.recall_alerts(vehicle_id);
CREATE INDEX idx_recall_alerts_unread ON public.recall_alerts(vehicle_id, is_read) WHERE NOT is_read;
