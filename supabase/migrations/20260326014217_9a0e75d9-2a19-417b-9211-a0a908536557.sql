
CREATE TABLE public.diy_tutorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL DEFAULT 'beginner',
  estimated_time_minutes integer NOT NULL DEFAULT 30,
  estimated_savings_cents integer DEFAULT 0,
  video_url text,
  video_source text DEFAULT 'youtube',
  thumbnail_url text,
  category text NOT NULL DEFAULT 'maintenance',
  vehicle_types text[] DEFAULT '{}'::text[],
  parts_needed jsonb DEFAULT '[]'::jsonb,
  tools_needed jsonb DEFAULT '[]'::jsonb,
  instructions jsonb DEFAULT '[]'::jsonb,
  safety_warnings text[] DEFAULT '{}'::text[],
  seo_keywords text[] DEFAULT '{}'::text[],
  is_published boolean NOT NULL DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diy_tutorials ENABLE ROW LEVEL SECURITY;

-- Everyone can read published tutorials
CREATE POLICY "Anyone can read published tutorials"
  ON public.diy_tutorials FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Admins can manage all tutorials
CREATE POLICY "Admins can manage all tutorials"
  ON public.diy_tutorials FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_diy_tutorials_updated_at
  BEFORE UPDATE ON public.diy_tutorials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
