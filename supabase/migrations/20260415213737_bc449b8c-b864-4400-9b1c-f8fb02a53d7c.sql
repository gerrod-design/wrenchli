
CREATE TABLE public.recall_email_captures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  vehicle_year text,
  vehicle_make text,
  vehicle_model text,
  session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.recall_email_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert recall email captures"
  ON public.recall_email_captures FOR INSERT
  TO anon WITH CHECK (true);

CREATE POLICY "Authenticated can insert recall email captures"
  ON public.recall_email_captures FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Admins full access recall_email_captures"
  ON public.recall_email_captures FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_recall_email_captures_email ON public.recall_email_captures (email);
