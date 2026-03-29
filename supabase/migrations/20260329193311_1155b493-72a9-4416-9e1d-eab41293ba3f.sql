
-- Vehicle Known Issues table (B-ready schema for future AI enrichment)
CREATE TABLE public.vehicle_known_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text,
  year_start integer,
  year_end integer,
  description text NOT NULL,
  mileage_min integer,
  mileage_max integer,
  severity text NOT NULL DEFAULT 'medium',
  estimated_cost text,
  category text,
  source text NOT NULL DEFAULT 'manual',
  source_url text,
  confidence_score integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'approved',
  reviewed_by uuid,
  reviewed_at timestamptz,
  complaint_count integer,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by make/model
CREATE INDEX idx_vehicle_known_issues_make ON public.vehicle_known_issues (make);
CREATE INDEX idx_vehicle_known_issues_make_model ON public.vehicle_known_issues (make, model);
CREATE INDEX idx_vehicle_known_issues_status ON public.vehicle_known_issues (status);

-- Enable RLS
ALTER TABLE public.vehicle_known_issues ENABLE ROW LEVEL SECURITY;

-- Public can read approved issues (for InsightsTab and chat)
CREATE POLICY "Anyone can read approved issues"
  ON public.vehicle_known_issues FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Admins can manage all issues (CRUD for admin UI)
CREATE POLICY "Admins can manage all issues"
  ON public.vehicle_known_issues FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_vehicle_known_issues_updated_at
  BEFORE UPDATE ON public.vehicle_known_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
