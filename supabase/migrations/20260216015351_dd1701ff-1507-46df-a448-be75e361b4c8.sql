
-- Create proactive insights table
CREATE TABLE public.proactive_insights (
  id text PRIMARY KEY,
  vehicle_id uuid NOT NULL REFERENCES public.user_vehicles(id) ON DELETE CASCADE,
  type text NOT NULL,
  priority text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  action_items jsonb DEFAULT '[]'::jsonb,
  cost_to_ignore numeric,
  potential_savings numeric,
  urgency_timeframe text,
  market_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_dismissed boolean NOT NULL DEFAULT false,
  dismissed_at timestamptz,
  views_count integer NOT NULL DEFAULT 0,
  clicks_count integer NOT NULL DEFAULT 0
);

-- Create indexes
CREATE INDEX idx_proactive_insights_vehicle ON public.proactive_insights(vehicle_id);
CREATE INDEX idx_proactive_insights_priority ON public.proactive_insights(vehicle_id, priority, is_dismissed);
CREATE INDEX idx_proactive_insights_type ON public.proactive_insights(vehicle_id, type, is_dismissed);

-- Enable RLS
ALTER TABLE public.proactive_insights ENABLE ROW LEVEL SECURITY;

-- Users can view insights for their own vehicles
CREATE POLICY "Users can view own insights"
  ON public.proactive_insights FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_vehicles
    WHERE user_vehicles.id = proactive_insights.vehicle_id
    AND user_vehicles.user_id = auth.uid()
  ));

-- Users can insert insights for their own vehicles
CREATE POLICY "Users can insert own insights"
  ON public.proactive_insights FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_vehicles
    WHERE user_vehicles.id = proactive_insights.vehicle_id
    AND user_vehicles.user_id = auth.uid()
  ));

-- Users can update insights for their own vehicles
CREATE POLICY "Users can update own insights"
  ON public.proactive_insights FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_vehicles
    WHERE user_vehicles.id = proactive_insights.vehicle_id
    AND user_vehicles.user_id = auth.uid()
  ));

-- Users can delete insights for their own vehicles
CREATE POLICY "Users can delete own insights"
  ON public.proactive_insights FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_vehicles
    WHERE user_vehicles.id = proactive_insights.vehicle_id
    AND user_vehicles.user_id = auth.uid()
  ));

-- Admins can manage all insights
CREATE POLICY "Admins can manage all insights"
  ON public.proactive_insights FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_proactive_insights_updated_at
  BEFORE UPDATE ON public.proactive_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
