-- Decision 1 (2026-11-22): MCP identity layer + decision-point captures.
--
-- mcp_api_keys: free, instant, self-serve keys identifying the calling
-- agent/developer on the MCP surface. Only the SHA-256 hash and a
-- display prefix are stored; the plaintext key is shown once at
-- issuance (function mcp-keys) and never stored.
--
-- mcp_call_log: one row per answered MCP tool call: caller, tool,
-- input shape (vehicle class, repair or code), whether a figure was
-- served, and the served range where one was shown. This is the
-- agent-channel funnel and the rate-limit / enumeration-guard source.
-- It also preserves the shown-range facts a later referral needs to
-- open a decision-point capture without re-asking the driver.
--
-- decision_point_captures: the repair-versus-value decision record
-- (Moments That Matter map). One row per price check or assessment
-- that reaches a referral: the value snapshot shown (figure, source,
-- date), the repair range shown, the confirmed quote when one lands,
-- and the outcome (proceeded / declined / replacement / no decision).
-- Reporting bands are fixed in advance: under_25, 25_50, 50_100,
-- over_100 (repair range midpoint against value). Loan-equity state
-- is deliberately NOT a column here; it is reported separately from
-- Garage payoff data and never blended with these bands.
--
-- Storage-terms basis: whether a value figure itself may be stored
-- depends on the value source's terms (Decision 2's written question
-- to the provider is pending). The schema holds either answer: when
-- terms allow storage, value_figure_cents + value_source + value_as_of
-- + value_terms_basis are recorded; when they do not, those columns
-- stay null and only ratio_band is stored, never the figure.

CREATE TABLE public.mcp_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  developer_contact TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free_taste',
  is_active BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

ALTER TABLE public.mcp_api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage caller keys; issuance and lookup happen in
-- edge functions via the service role.
CREATE POLICY "Admins can manage mcp_api_keys"
  ON public.mcp_api_keys FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.mcp_call_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_id UUID REFERENCES public.mcp_api_keys (id),
  caller_kind TEXT NOT NULL CHECK (caller_kind IN ('keyed', 'keyless_transition')),
  tool TEXT NOT NULL,
  vehicle_class TEXT,
  repair_id TEXT,
  dtc_code TEXT,
  served_figure BOOLEAN,
  range_low_cents INTEGER,
  range_high_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mcp_call_log ENABLE ROW LEVEL SECURITY;

-- No direct access — only edge functions use this via service role.
CREATE POLICY "No public access to mcp_call_log"
  ON public.mcp_call_log FOR ALL
  USING (false);

CREATE INDEX idx_mcp_call_log_key_time ON public.mcp_call_log (key_id, created_at DESC);

CREATE TABLE public.decision_point_captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL CHECK (source IN ('mcp_price_check', 'mcp_assessment', 'web_assessment', 'web_quote_approval')),
  mcp_key_id UUID REFERENCES public.mcp_api_keys (id),
  assessment_session_id UUID,
  referral_package_id UUID,
  vehicle_year INTEGER,
  vehicle_make TEXT,
  vehicle_model TEXT,
  repair_id TEXT,
  range_low_cents INTEGER,
  range_high_cents INTEGER,
  value_figure_cents INTEGER,
  value_source TEXT,
  value_as_of DATE,
  value_terms_basis TEXT,
  ratio_band TEXT CHECK (ratio_band IN ('under_25', '25_50', '50_100', 'over_100')),
  confirmed_quote_cents INTEGER,
  outcome TEXT NOT NULL DEFAULT 'no_decision' CHECK (outcome IN ('proceeded', 'declined', 'replacement', 'no_decision'))
);

ALTER TABLE public.decision_point_captures ENABLE ROW LEVEL SECURITY;

-- No direct access — only edge functions use this via service role.
CREATE POLICY "No public access to decision_point_captures"
  ON public.decision_point_captures FOR ALL
  USING (false);

CREATE INDEX idx_decision_captures_repair_time ON public.decision_point_captures (repair_id, created_at DESC);
