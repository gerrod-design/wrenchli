
CREATE TABLE public.youtube_search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash text NOT NULL,
  search_query text NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE UNIQUE INDEX idx_youtube_cache_query_hash ON public.youtube_search_cache (query_hash);
CREATE INDEX idx_youtube_cache_expires ON public.youtube_search_cache (expires_at);

ALTER TABLE public.youtube_search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read youtube cache"
  ON public.youtube_search_cache FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can manage youtube cache"
  ON public.youtube_search_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
