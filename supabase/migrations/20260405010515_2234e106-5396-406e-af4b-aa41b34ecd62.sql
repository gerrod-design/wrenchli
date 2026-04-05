ALTER TABLE public.ad_click_events
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.diagnostic_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS part_name text,
  ADD COLUMN IF NOT EXISTS destination text;

CREATE INDEX IF NOT EXISTS idx_ad_click_events_session ON public.ad_click_events(session_id);