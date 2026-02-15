
-- Create analytics events table
CREATE TABLE public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  category text NOT NULL,
  action text NOT NULL,
  label text,
  value numeric,
  user_id text,
  session_id text NOT NULL,
  user_agent text,
  page_url text NOT NULL,
  page_title text,
  referrer text,
  ad_placement text,
  ad_position integer,
  ad_source text,
  item_id text,
  item_title text,
  item_brand text,
  item_category text,
  item_price text,
  item_url text,
  vehicle_year text,
  vehicle_make text,
  vehicle_model text,
  repair_diagnosis text,
  repair_cost_estimate numeric,
  zip_code text,
  city text,
  state text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

-- Create indexes for performance
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_category ON public.analytics_events(category);
CREATE INDEX idx_analytics_events_timestamp ON public.analytics_events(timestamp);
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to insert events
CREATE POLICY "Anon can insert analytics events"
ON public.analytics_events FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Authenticated can insert analytics events"
ON public.analytics_events FOR INSERT TO authenticated
WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Only admins can read analytics events"
ON public.analytics_events FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete analytics
CREATE POLICY "Only admins can delete analytics events"
ON public.analytics_events FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
