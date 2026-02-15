
CREATE TABLE public.ad_click_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  click_type text NOT NULL, -- 'product', 'service', 'vehicle', 'browse_parts', 'trade_value'
  item_id text,
  item_title text,
  item_brand text,
  item_category text,
  item_price text,
  diagnosis_title text,
  diagnosis_code text,
  vehicle_year text,
  vehicle_make text,
  vehicle_model text,
  source text, -- 'local' or 'ai'
  placement text -- 'full', 'sidebar', 'footer'
);

ALTER TABLE public.ad_click_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert click events (anonymous tracking)
CREATE POLICY "Anon can insert ad clicks" ON public.ad_click_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can insert ad clicks" ON public.ad_click_events FOR INSERT TO authenticated WITH CHECK (true);

-- Only admins can read/manage
CREATE POLICY "Only admins can read ad clicks" ON public.ad_click_events FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete ad clicks" ON public.ad_click_events FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
