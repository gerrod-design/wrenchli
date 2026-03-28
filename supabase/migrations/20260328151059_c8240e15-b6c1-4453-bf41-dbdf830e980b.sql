
CREATE TABLE public.referral_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  
  -- Vehicle info
  vehicle_year TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_trim TEXT,
  vin TEXT,
  
  -- Diagnosis info
  diagnosis_title TEXT NOT NULL,
  diagnosis_code TEXT,
  diagnosis_urgency TEXT,
  diagnosis_details JSONB DEFAULT '{}',
  diy_feasibility TEXT,
  
  -- Cost estimate
  estimated_cost_low NUMERIC,
  estimated_cost_high NUMERIC,
  cost_estimate_details JSONB DEFAULT '{}',
  metro_area TEXT,
  zip_code TEXT,
  
  -- Media
  photo_urls TEXT[] DEFAULT '{}',
  audio_clip_url TEXT,
  video_frame_urls TEXT[] DEFAULT '{}',
  
  -- Chat context
  chat_summary TEXT,
  
  -- Customer info
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_notes TEXT,
  
  -- Tracking
  view_count INTEGER NOT NULL DEFAULT 0,
  pdf_download_count INTEGER NOT NULL DEFAULT 0,
  quote_request_id UUID REFERENCES public.quote_requests(id)
);

-- Public read by token (no auth required for shops)
ALTER TABLE public.referral_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view referral packages by token"
  ON public.referral_packages
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert referral packages"
  ON public.referral_packages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update view counts"
  ON public.referral_packages
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
