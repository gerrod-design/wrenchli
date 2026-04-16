
CREATE TABLE public.audit_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  overall_score INTEGER,
  critical_count INTEGER,
  agent_results JSONB,
  generated_prompts JSONB,
  status TEXT NOT NULL DEFAULT 'pending_review'
);

ALTER TABLE public.audit_runs ENABLE ROW LEVEL SECURITY;

-- No public policies — only service role can read/write
