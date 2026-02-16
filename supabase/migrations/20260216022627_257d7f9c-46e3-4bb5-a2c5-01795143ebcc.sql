
CREATE TABLE public.maintenance_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid NOT NULL REFERENCES public.user_vehicles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  service_label text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('overdue', 'urgent', 'soon')),
  due_mileage integer NOT NULL,
  current_mileage integer NOT NULL,
  miles_until_due integer NOT NULL,
  estimated_cost_low numeric,
  estimated_cost_high numeric,
  summary text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own maintenance alerts"
ON public.maintenance_alerts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_vehicles
  WHERE user_vehicles.id = maintenance_alerts.vehicle_id
  AND user_vehicles.user_id = auth.uid()
));

CREATE POLICY "Users can update own maintenance alerts"
ON public.maintenance_alerts FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_vehicles
  WHERE user_vehicles.id = maintenance_alerts.vehicle_id
  AND user_vehicles.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all maintenance alerts"
ON public.maintenance_alerts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_maintenance_alerts_vehicle ON public.maintenance_alerts(vehicle_id);
CREATE INDEX idx_maintenance_alerts_unread ON public.maintenance_alerts(is_read) WHERE is_read = false;
