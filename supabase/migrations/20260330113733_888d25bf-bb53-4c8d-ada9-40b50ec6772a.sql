
CREATE TABLE public.shop_interest_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shop_id TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  shop_address TEXT,
  shop_type TEXT DEFAULT 'independent',
  zip_code TEXT,
  vehicle_year TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  user_email TEXT,
  source TEXT DEFAULT 'find_shops'
);

ALTER TABLE public.shop_interest_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert shop interest events"
  ON public.shop_interest_events FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert shop interest events"
  ON public.shop_interest_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only admins can read shop interest events"
  ON public.shop_interest_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete shop interest events"
  ON public.shop_interest_events FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
