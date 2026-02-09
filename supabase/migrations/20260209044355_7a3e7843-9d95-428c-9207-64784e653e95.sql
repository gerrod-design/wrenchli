
-- Create shop_recommendations table
CREATE TABLE public.shop_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name TEXT NOT NULL,
  shop_location TEXT NOT NULL,
  specializations TEXT[] DEFAULT '{}',
  recommendation_reason TEXT,
  recommender_name TEXT,
  recommender_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_recommendations ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a recommendation (no auth required)
CREATE POLICY "Anon can submit shop recommendation"
ON public.shop_recommendations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated can submit shop recommendation"
ON public.shop_recommendations
FOR INSERT
WITH CHECK (true);

-- Only admins can read recommendations
CREATE POLICY "Only admins can read shop recommendations"
ON public.shop_recommendations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Only admins can update shop recommendations"
ON public.shop_recommendations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Only admins can delete shop recommendations"
ON public.shop_recommendations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
