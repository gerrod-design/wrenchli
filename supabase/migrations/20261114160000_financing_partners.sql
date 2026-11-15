-- =============================================================
-- Repair Financing Partner Surface (2026-11-14)
--
-- Adds the financing partner registry (public.financing_partners),
-- the anonymous-token referral record (public.financing_referrals),
-- and the partner outcome record (public.financing_outcomes), per
-- the financing journey design of record
-- (financing-journey-design-2026-11-14.md).
--
-- Locked rules (workstream of record, Sept-Oct 2026 + 2026-11-14):
--  * Wrenchli is the referral / verification / outcome-reporting
--    layer. The partner is the lender of record. Wrenchli is never
--    the lender and makes no credit decision.
--  * 24% APR ceiling: a partner is presented as a qualifying option
--    only when its offered tier is a true 0% tier or <= 24% APR.
--    Enforcement lives in the presentation predicate
--    (list_public_financing_partners / simulation options), not in
--    page copy, so there is no second, weaker path.
--  * Partners pay for outcomes and never influence the assessment
--    or the answer. No paid placement: presentation order is the
--    registry's rank_order (ranking of record), nothing else.
--  * No PII crosses to a partner. The referral carries an opaque
--    token, an amount BAND (never the exact figure), and a repair
--    category. financing_referrals deliberately has NO customer
--    name / email / phone / address columns at all. owner_user_id
--    is Wrenchli-side only and is never selected by any
--    partner-facing function.
--  * Mock partners (is_mock) exist only for simulation. The public
--    presentation predicate excludes them at the data layer, even
--    when is_active = true. is_mock is set only by ops data entry
--    (service role / SQL); there is no public write path to the
--    registry at all (RLS: admin read, no anon/authenticated
--    policies; all reads go through the SECURITY DEFINER
--    functions below).
--  * Outcome source is derived server-side from the partner row
--    (mock partner -> 'simulation', real partner -> 'partner');
--    callers never assert their own source.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Table: public.financing_partners (the registry)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financing_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  partner_type text NOT NULL
    CHECK (partner_type IN ('credit_union','community_bank','large_bank','fintech','fund')),
  -- Terms: either a true 0% tier, or an APR at a stated precision.
  zero_percent_tier boolean NOT NULL DEFAULT false,
  apr_percent numeric(5,2),
  term_months int,
  min_amount_cents int,
  max_amount_cents int,
  -- Link-out target; '{token}' is replaced with the referral token.
  link_url_template text NOT NULL DEFAULT '',
  -- Presentation order = ranking of record (CDFI/CU, fund, then
  -- qualifying fintech tiers). Never sold, never partner-controlled.
  rank_order int NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT false,
  is_mock boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financing_partners_terms_present
    CHECK (zero_percent_tier OR apr_percent IS NOT NULL),
  CONSTRAINT financing_partners_apr_sane
    CHECK (apr_percent IS NULL OR (apr_percent >= 0 AND apr_percent <= 100)),
  CONSTRAINT financing_partners_amount_range
    CHECK (min_amount_cents IS NULL OR max_amount_cents IS NULL
           OR min_amount_cents <= max_amount_cents)
);

CREATE INDEX IF NOT EXISTS financing_partners_public_idx
  ON public.financing_partners (is_active, is_mock, rank_order);

ALTER TABLE public.financing_partners ENABLE ROW LEVEL SECURITY;

-- Admins may read the full registry (including mocks and inactive
-- rows). There is deliberately NO anon or general authenticated
-- policy and NO insert/update/delete policy for any client role:
-- registry writes are ops-only (service role / SQL), so no
-- public-facing code path can create a partner or flip is_mock.
DROP POLICY IF EXISTS "Admins can read financing partners" ON public.financing_partners;
CREATE POLICY "Admins can read financing partners"
  ON public.financing_partners FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------------
-- 2. The ceiling predicate (single source of truth)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.financing_partner_qualifies(
  p_zero_percent_tier boolean,
  p_apr_percent numeric
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(p_zero_percent_tier, false)
      OR (p_apr_percent IS NOT NULL AND p_apr_percent <= 24.00)
$$;

-- -------------------------------------------------------------
-- 3. Public presentation: the ONLY public read of the registry.
--    Returns active, non-mock, ceiling-qualifying partners whose
--    amount range covers the estimate (when an amount is given),
--    in ranking-of-record order. Mock rows are excluded here at
--    the data layer even when active.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_public_financing_partners(
  p_amount_cents int DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  partner_type text,
  zero_percent_tier boolean,
  apr_percent numeric,
  term_months int,
  min_amount_cents int,
  max_amount_cents int,
  rank_order int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fp.id, fp.name, fp.partner_type, fp.zero_percent_tier,
         fp.apr_percent, fp.term_months, fp.min_amount_cents,
         fp.max_amount_cents, fp.rank_order
  FROM public.financing_partners fp
  WHERE fp.is_active
    AND NOT fp.is_mock
    AND public.financing_partner_qualifies(fp.zero_percent_tier, fp.apr_percent)
    AND (p_amount_cents IS NULL
         OR ((fp.min_amount_cents IS NULL OR p_amount_cents >= fp.min_amount_cents)
             AND (fp.max_amount_cents IS NULL OR p_amount_cents <= fp.max_amount_cents)))
  ORDER BY fp.rank_order, fp.name
$$;

GRANT EXECUTE ON FUNCTION public.list_public_financing_partners(int) TO anon, authenticated;

-- -------------------------------------------------------------
-- 4. Simulation presentation (admin only): the same ceiling
--    predicate applied to MOCK partners, split into qualifying
--    options and excluded rows WITH the exclusion reason, so the
--    filter is shown, never silent. Real partners never appear
--    here; mocks never appear in the public function above.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_simulation_financing_options(
  p_amount_cents int DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  partner_type text,
  zero_percent_tier boolean,
  apr_percent numeric,
  term_months int,
  rank_order int,
  qualifies boolean,
  exclusion_reason text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'simulation options are admin-only';
  END IF;
  RETURN QUERY
  SELECT fp.id, fp.name, fp.partner_type, fp.zero_percent_tier,
         fp.apr_percent, fp.term_months, fp.rank_order,
         public.financing_partner_qualifies(fp.zero_percent_tier, fp.apr_percent) AS qualifies,
         CASE
           WHEN public.financing_partner_qualifies(fp.zero_percent_tier, fp.apr_percent) THEN NULL
           ELSE format('excluded: %s%% APR exceeds the 24%% APR ceiling', fp.apr_percent)
         END AS exclusion_reason
  FROM public.financing_partners fp
  WHERE fp.is_mock
    AND fp.is_active
    AND (p_amount_cents IS NULL
         OR ((fp.min_amount_cents IS NULL OR p_amount_cents >= fp.min_amount_cents)
             AND (fp.max_amount_cents IS NULL OR p_amount_cents <= fp.max_amount_cents)))
  ORDER BY fp.rank_order, fp.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_simulation_financing_options(int) TO authenticated;

-- -------------------------------------------------------------
-- 5. Table: public.financing_referrals
--    One row per link-out. The token is the only join key a
--    partner ever sees. Amount is stored as a BAND only.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financing_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  partner_id uuid NOT NULL REFERENCES public.financing_partners(id),
  -- Wrenchli-side only; never selected by partner-facing code.
  owner_user_id uuid NULL,
  amount_band text NOT NULL
    CHECK (amount_band IN ('under_250','250_500','500_1000','1000_2000','2000_plus')),
  repair_category text,
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent','applied','approved','declined','funded','repair_completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financing_referrals_partner_idx
  ON public.financing_referrals (partner_id);
CREATE INDEX IF NOT EXISTS financing_referrals_token_idx
  ON public.financing_referrals (token);

ALTER TABLE public.financing_referrals ENABLE ROW LEVEL SECURITY;

-- Owners may read their own referrals (their estimate holding
-- state). No anon policy; no direct insert/update policy for any
-- client role: writes go through the functions below.
DROP POLICY IF EXISTS "Owners can read their financing referrals" ON public.financing_referrals;
CREATE POLICY "Owners can read their financing referrals"
  ON public.financing_referrals FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);

-- Amount banding (server-side, single source of truth). The exact
-- estimate amount is used only to compute the band and is not
-- stored on the referral.
CREATE OR REPLACE FUNCTION public.financing_amount_band(p_amount_cents int)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_amount_cents IS NULL OR p_amount_cents < 25000 THEN 'under_250'
    WHEN p_amount_cents < 50000 THEN '250_500'
    WHEN p_amount_cents < 100000 THEN '500_1000'
    WHEN p_amount_cents < 200000 THEN '1000_2000'
    ELSE '2000_plus'
  END
$$;

-- -------------------------------------------------------------
-- 6. Create a referral (the link-out).
--    Real partner: must be active, non-mock, ceiling-qualifying.
--    Mock partner: simulation only (p_simulation = true) and
--    admin-only, so a mock referral can never be minted from a
--    public code path. Returns the token and the partner URL
--    with the token substituted. The partner-facing payload is
--    exactly { token, amount_band, repair_category }.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_financing_referral(
  p_partner_id uuid,
  p_amount_cents int,
  p_repair_category text DEFAULT NULL,
  p_simulation boolean DEFAULT false
)
RETURNS TABLE (token text, partner_url text, amount_band text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner public.financing_partners%ROWTYPE;
  v_band text := public.financing_amount_band(p_amount_cents);
  v_token text;
BEGIN
  SELECT * INTO v_partner FROM public.financing_partners WHERE id = p_partner_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'financing partner not found';
  END IF;
  IF NOT v_partner.is_active THEN
    RAISE EXCEPTION 'financing partner is not active';
  END IF;
  IF v_partner.is_mock THEN
    IF NOT p_simulation THEN
      RAISE EXCEPTION 'mock partners can only be exercised in simulation';
    END IF;
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'simulation referrals are admin-only';
    END IF;
  ELSE
    IF p_simulation THEN
      RAISE EXCEPTION 'a real partner referral cannot be labeled simulation';
    END IF;
    IF NOT public.financing_partner_qualifies(v_partner.zero_percent_tier, v_partner.apr_percent) THEN
      RAISE EXCEPTION 'partner does not meet the 24%% APR ceiling for presentation';
    END IF;
  END IF;

  INSERT INTO public.financing_referrals (partner_id, owner_user_id, amount_band, repair_category)
  VALUES (p_partner_id, auth.uid(), v_band, p_repair_category)
  RETURNING financing_referrals.token INTO v_token;

  RETURN QUERY SELECT
    v_token,
    replace(v_partner.link_url_template, '{token}', v_token),
    v_band;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_financing_referral(uuid, int, text, boolean)
  TO anon, authenticated;

-- -------------------------------------------------------------
-- 7. Table: public.financing_outcomes
--    One row per outcome reported against a referral token.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financing_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.financing_referrals(id) ON DELETE CASCADE,
  token text NOT NULL,
  kind text NOT NULL
    CHECK (kind IN ('applied','approved','declined','funded','repair_completed')),
  source text NOT NULL DEFAULT 'partner'
    CHECK (source IN ('partner','simulation')),
  reported_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financing_outcomes_referral_idx
  ON public.financing_outcomes (referral_id);
CREATE INDEX IF NOT EXISTS financing_outcomes_token_idx
  ON public.financing_outcomes (token);

ALTER TABLE public.financing_outcomes ENABLE ROW LEVEL SECURITY;

-- No client policies at all: outcomes are written only through
-- report_financing_outcome and read only through the admin
-- report function below.

-- -------------------------------------------------------------
-- 8. Report an outcome (the partner interface, stubbed).
--    Keyed by token alone, so outcome reporting never needs the
--    customer's identity in either direction. Source is derived
--    from the partner row, never asserted by the caller. A real
--    partner integration adds per-partner authentication at
--    signing time; in this pass the harness is the only caller
--    for mocks, and mock outcomes require an admin caller.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_financing_outcome(
  p_token text,
  p_kind text
)
RETURNS TABLE (outcome_id uuid, source text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral public.financing_referrals%ROWTYPE;
  v_is_mock boolean;
  v_source text;
  v_id uuid;
BEGIN
  IF p_kind NOT IN ('applied','approved','declined','funded','repair_completed') THEN
    RAISE EXCEPTION 'unknown financing outcome kind: %', p_kind;
  END IF;
  SELECT * INTO v_referral FROM public.financing_referrals WHERE token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'financing referral token not found';
  END IF;
  SELECT is_mock INTO v_is_mock FROM public.financing_partners WHERE id = v_referral.partner_id;
  v_source := CASE WHEN v_is_mock THEN 'simulation' ELSE 'partner' END;
  IF v_is_mock AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'mock outcomes are admin-only (simulation harness)';
  END IF;

  INSERT INTO public.financing_outcomes (referral_id, token, kind, source)
  VALUES (v_referral.id, p_token, p_kind, v_source)
  RETURNING id INTO v_id;

  UPDATE public.financing_referrals
  SET status = p_kind, updated_at = now()
  WHERE id = v_referral.id;

  RETURN QUERY SELECT v_id, v_source;
END;
$$;

GRANT EXECUTE ON FUNCTION public.report_financing_outcome(text, text) TO anon, authenticated;

-- -------------------------------------------------------------
-- 9. Admin outcome report: counts by partner and kind, with
--    mock partners always broken out separately from real
--    partners (separate sections in the view layer; here the
--    is_mock flag rides every row so counts can never blend).
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.financing_outcome_report()
RETURNS TABLE (
  partner_id uuid,
  partner_name text,
  partner_type text,
  is_mock boolean,
  referrals_sent bigint,
  applied bigint,
  approved bigint,
  declined bigint,
  funded bigint,
  repair_completed bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'financing outcome report is admin-only';
  END IF;
  RETURN QUERY
  SELECT
    fp.id, fp.name, fp.partner_type, fp.is_mock,
    (SELECT count(*) FROM public.financing_referrals fr WHERE fr.partner_id = fp.id),
    (SELECT count(*) FROM public.financing_outcomes fo
       JOIN public.financing_referrals fr2 ON fr2.id = fo.referral_id
       WHERE fr2.partner_id = fp.id AND fo.kind = 'applied'),
    (SELECT count(*) FROM public.financing_outcomes fo
       JOIN public.financing_referrals fr2 ON fr2.id = fo.referral_id
       WHERE fr2.partner_id = fp.id AND fo.kind = 'approved'),
    (SELECT count(*) FROM public.financing_outcomes fo
       JOIN public.financing_referrals fr2 ON fr2.id = fo.referral_id
       WHERE fr2.partner_id = fp.id AND fo.kind = 'declined'),
    (SELECT count(*) FROM public.financing_outcomes fo
       JOIN public.financing_referrals fr2 ON fr2.id = fo.referral_id
       WHERE fr2.partner_id = fp.id AND fo.kind = 'funded'),
    (SELECT count(*) FROM public.financing_outcomes fo
       JOIN public.financing_referrals fr2 ON fr2.id = fo.referral_id
       WHERE fr2.partner_id = fp.id AND fo.kind = 'repair_completed')
  FROM public.financing_partners fp
  ORDER BY fp.is_mock, fp.rank_order, fp.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.financing_outcome_report() TO authenticated;
