
-- Table for market value change notifications
CREATE TABLE public.market_value_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid NOT NULL REFERENCES public.user_vehicles(id) ON DELETE CASCADE,
  previous_value numeric NOT NULL,
  current_value numeric NOT NULL,
  change_percent numeric NOT NULL,
  change_direction text NOT NULL CHECK (change_direction IN ('increase', 'decrease')),
  summary text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_value_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view own market value alerts"
ON public.market_value_alerts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_vehicles
  WHERE user_vehicles.id = market_value_alerts.vehicle_id
  AND user_vehicles.user_id = auth.uid()
));

-- Users can update (mark as read) their own alerts
CREATE POLICY "Users can update own market value alerts"
ON public.market_value_alerts
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_vehicles
  WHERE user_vehicles.id = market_value_alerts.vehicle_id
  AND user_vehicles.user_id = auth.uid()
));

-- Service role / edge function inserts via service_role key, admins can manage
CREATE POLICY "Admins can manage all market value alerts"
ON public.market_value_alerts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookup
CREATE INDEX idx_market_value_alerts_vehicle ON public.market_value_alerts(vehicle_id);
CREATE INDEX idx_market_value_alerts_unread ON public.market_value_alerts(is_read) WHERE is_read = false;
