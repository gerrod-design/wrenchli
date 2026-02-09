-- Add financing interest column to quote_requests
ALTER TABLE public.quote_requests 
ADD COLUMN financing_interested boolean NOT NULL DEFAULT false;