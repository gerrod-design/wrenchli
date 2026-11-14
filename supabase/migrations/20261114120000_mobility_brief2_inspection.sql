-- =============================================================
-- Mobility Brief 2 — Mobile Vehicle Inspection (2026-11-14)
--
-- Adds the mobile-inspection flow to the shipped referral
-- lifecycle: a new provider kind (mobile_inspector), a referral
-- kind (inspection) counted separately from repairs forever, the
-- chain-scoped inspection details record that carries the bounded
-- privacy exception, and the structured inspection report filed
-- through a new token RPC against Wrenchli's versioned checklist.
--
-- Locked decisions (Mobility Brief 2, approved by Gerrod
-- 2026-11-13):
--  * Pricing (a): the consumer pays the inspector's own agreed
--    per-inspection fee. The fee lives on the provider record
--    (inspection_fee), is agreed in writing at signing, entered
--    by ops, is display-only, nullable, and shown only when set.
--    No "typical inspection cost" figure exists anywhere.
--  * Privacy exception, exactly as approved: the visit minimum
--    is exactly three items — the consumer's FIRST name, the
--    consumer's PHONE number, and the vehicle's precise LOCATION
--    for the visit. The three items are stored ONLY in
--    inspection_details (outside referral_packages' customer
--    fields), are served ONLY by get_referral_package_by_token
--    for an ACCEPTED inspection referral, never before
--    acceptance, never for repair referrals, never on any other
--    surface or export. Email is never revealed to anyone in any
--    state. revealed_at is stamped on the first post-accept
--    serve. The send screen carries the plain-language
--    disclosure before the owner can send.
--  * Onsite-eligible list: approved 2026-11-13 as drafted
--    (11 job types; no raising the vehicle, consumable-class
--    work, no fluid capture beyond a drain pan). It ships as
--    configuration consumed by the report form
--    (src/config/inspection.ts), not as schema.
--  * Counting separation is absolute: inspection completions
--    never touch the repair completion counters, the free-five,
--    or the $50 founding-rate counting. Those are defined on
--    referral_kind = 'repair' only.
--  * process_referral_escalations() is NOT modified. The
--    processor is kind-agnostic by construction (it keys off
--    status and timestamps only), and the brief requires the
--    inspection completion shape to mirror Decision 1 exactly:
--    report is evidence, owner confirmation is the trigger, the
--    7/14/30-day founder-flag / owner-unconfirmed / dispute
--    mechanics are shared. escalate_shop_referral() IS replaced
--    for one mechanical reason only: a new hop must inherit the
--    chain's referral_kind, and the Phase 1 body inserts the next
--    hop without it (it would silently default an escalated
--    inspection hop to 'repair' and corrupt the counting
--    separation).
-- =============================================================

-- -------------------------------------------------------------
-- 1. service_providers: provider kind, service area, agreed fee.
--    The address wrinkle is resolved here, in the migration, per
--    the brief's recommendation: address becomes nullable under
--    a kind check — a shop must still carry an address; a mobile
--    inspector may omit it, and service_area_label carries the
--    display text ("Mobile — serves Detroit metro").
-- -------------------------------------------------------------
ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS provider_kind text NOT NULL DEFAULT 'shop',
  ADD COLUMN IF NOT EXISTS service_radius_miles int NULL,
  ADD COLUMN IF NOT EXISTS service_area_label text NULL,
  ADD COLUMN IF NOT EXISTS inspection_fee numeric NULL;

ALTER TABLE public.service_providers
  DROP CONSTRAINT IF EXISTS service_providers_provider_kind_check;
ALTER TABLE public.service_providers
  ADD CONSTRAINT service_providers_provider_kind_check
  CHECK (provider_kind IN ('shop','mobile_inspector'));

ALTER TABLE public.service_providers
  DROP CONSTRAINT IF EXISTS service_providers_service_radius_check;
ALTER TABLE public.service_providers
  ADD CONSTRAINT service_providers_service_radius_check
  CHECK (service_radius_miles IS NULL OR service_radius_miles >= 0);

ALTER TABLE public.service_providers
  DROP CONSTRAINT IF EXISTS service_providers_inspection_fee_check;
ALTER TABLE public.service_providers
  ADD CONSTRAINT service_providers_inspection_fee_check
  CHECK (inspection_fee IS NULL OR inspection_fee >= 0);

ALTER TABLE public.service_providers
  ALTER COLUMN address DROP NOT NULL;

ALTER TABLE public.service_providers
  DROP CONSTRAINT IF EXISTS service_providers_address_by_kind;
ALTER TABLE public.service_providers
  ADD CONSTRAINT service_providers_address_by_kind
  CHECK (provider_kind = 'mobile_inspector' OR address IS NOT NULL);

COMMENT ON COLUMN public.service_providers.provider_kind IS
  'Provider kind: shop | mobile_inspector. The referral picker filters by kind per flow (Mobility Brief 2, 2026-11-13).';
COMMENT ON COLUMN public.service_providers.service_radius_miles IS
  'Mobile inspectors only: how far the inspector travels for a visit, in miles. Display data, entered by ops (Mobility Brief 2).';
COMMENT ON COLUMN public.service_providers.service_area_label IS
  'Mobile inspectors only: display text for the area served (e.g. "Mobile — serves Detroit metro"). Carries the display role the street address carries for a shop (Mobility Brief 2).';
COMMENT ON COLUMN public.service_providers.inspection_fee IS
  'Mobile inspectors only: the inspector''s own agreed per-inspection fee (consumer pays the inspector; agreed in writing at signing, entered by ops). Display-only, nullable, shown only when set. Never a "typical" figure (Mobility Brief 2, pricing decision (a), 2026-11-13).';

-- -------------------------------------------------------------
-- 2. shop_referrals: referral kind. Counting keys off this
--    column wherever behavior differs (counting only).
-- -------------------------------------------------------------
ALTER TABLE public.shop_referrals
  ADD COLUMN IF NOT EXISTS referral_kind text NOT NULL DEFAULT 'repair';

ALTER TABLE public.shop_referrals
  DROP CONSTRAINT IF EXISTS shop_referrals_referral_kind_check;
ALTER TABLE public.shop_referrals
  ADD CONSTRAINT shop_referrals_referral_kind_check
  CHECK (referral_kind IN ('repair','inspection'));

CREATE INDEX IF NOT EXISTS shop_referrals_kind_idx
  ON public.shop_referrals (referral_kind);

COMMENT ON COLUMN public.shop_referrals.referral_kind IS
  'Referral kind: repair | inspection. Inspection completions are counted separately and never increment the founding-rate free-five or the $50-per-completed-repair counter, which are defined on repairs only (Mobility Brief 2, 2026-11-13).';

-- -------------------------------------------------------------
-- 3. inspection_details: one row per inspection chain, keyed by
--    chain_id. This table is the ONLY home of the visit minimum.
--    The two contact items live here — not in
--    referral_packages' customer_name / customer_phone columns —
--    so no code path that reads a package can ever surface them.
--    RLS: the owner may read and create their own chain's row;
--    there is NO anon policy and NO update policy. Provider-side
--    reads happen exclusively through the SECURITY DEFINER token
--    RPC in section 6, which selects the minimum only for an
--    accepted inspection referral.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inspection_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id uuid NOT NULL UNIQUE,
  package_id uuid NOT NULL REFERENCES public.referral_packages(id),
  owner_user_id uuid NOT NULL,
  -- The visit minimum (served post-accept only, section 6):
  vehicle_location_text text NOT NULL,
  consumer_first_name text NOT NULL,
  consumer_phone text NOT NULL,
  -- Pre-accept-safe request context:
  location_descriptor text NULL,
  location_zip text NULL,
  preferred_windows text NULL,
  revealed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inspection_details_package_id_idx
  ON public.inspection_details (package_id);
CREATE INDEX IF NOT EXISTS inspection_details_owner_user_id_idx
  ON public.inspection_details (owner_user_id);

ALTER TABLE public.inspection_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can read their inspection details" ON public.inspection_details;
CREATE POLICY "Owners can read their inspection details"
  ON public.inspection_details FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owners can create their inspection details" ON public.inspection_details;
CREATE POLICY "Owners can create their inspection details"
  ON public.inspection_details FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

COMMENT ON TABLE public.inspection_details IS
  'One row per inspection chain. Holds the bounded privacy exception (consumer first name, phone, precise vehicle location) served only by the token RPC after acceptance; revealed_at stamps the first post-accept serve (Mobility Brief 2, 2026-11-13).';

-- -------------------------------------------------------------
-- 4. inspection_reports: the structured report the inspector
--    files, one row per completed inspection referral. Filed
--    exclusively through submit_inspection_report (section 7);
--    there is no direct insert policy. The report contains NO
--    consumer contact data by construction — no column can hold
--    it. Findings are per-system results against the versioned
--    checklist named by checklist_version.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inspection_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL UNIQUE REFERENCES public.shop_referrals(id),
  chain_id uuid NOT NULL,
  checklist_version text NOT NULL,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text NOT NULL,
  safe_to_drive boolean NOT NULL,
  recommended_next_step text NULL,
  photo_urls text[] NOT NULL DEFAULT '{}',
  onsite_eligible boolean NOT NULL DEFAULT false,
  onsite_performed boolean NOT NULL DEFAULT false,
  onsite_did text NULL,
  onsite_cost numeric NULL
    CHECK (onsite_cost IS NULL OR onsite_cost >= 0),
  filed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inspection_reports_chain_id_idx
  ON public.inspection_reports (chain_id);

ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;

-- The owner of the underlying referral may read the report (it is
-- their Garage vehicle record). Provider access is through the
-- token RPC only, exactly as with the package itself.
DROP POLICY IF EXISTS "Owners can read inspection reports for their referrals" ON public.inspection_reports;
CREATE POLICY "Owners can read inspection reports for their referrals"
  ON public.inspection_reports FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shop_referrals sr
    WHERE sr.id = inspection_reports.referral_id
      AND sr.owner_user_id = auth.uid()
  ));

COMMENT ON TABLE public.inspection_reports IS
  'Structured inspection report filed by the inspector through submit_inspection_report, against the versioned Wrenchli checklist stamped in checklist_version. The source document for the Garage observed-condition record (Mobility Brief 2, 2026-11-13).';

-- -------------------------------------------------------------
-- 5. Escalation: the Phase 1 body, with ONE mechanical change —
--    the next hop inherits the chain's referral_kind. Without
--    this, an escalated inspection hop would default to 'repair'
--    and an inspection completion could be counted as a repair.
--    Every other line is the shipped Phase 1 logic, including
--    the cancelled-chain invariant.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.escalate_shop_referral(p_referral_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.shop_referrals%ROWTYPE;
  v_existing uuid;
  v_next_shop uuid;
  v_new_id uuid;
BEGIN
  SELECT * INTO r FROM public.shop_referrals WHERE id = p_referral_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- A cancelled chain never escalates (Phase 1 invariant).
  IF r.status = 'cancelled' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_existing
  FROM public.shop_referrals
  WHERE escalated_from = p_referral_id
  LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  IF r.preference_order < jsonb_array_length(r.shop_chain) THEN
    -- shop_chain is a 0-indexed jsonb array; the element at index
    -- preference_order is the next shop after this row's shop.
    v_next_shop := (r.shop_chain ->> r.preference_order)::uuid;
    INSERT INTO public.shop_referrals (
      package_id, shop_id, owner_user_id, chain_id, shop_chain,
      preference_order, escalated_from, status, referral_kind
    ) VALUES (
      r.package_id, v_next_shop, r.owner_user_id, r.chain_id, r.shop_chain,
      r.preference_order + 1, r.id, 'sent', r.referral_kind
    )
    RETURNING id INTO v_new_id;
    RETURN v_new_id;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.escalate_shop_referral(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.escalate_shop_referral(uuid) TO authenticated;

-- -------------------------------------------------------------
-- 6. Package lookup by token: the Brief 3 body (explicit column
--    list; the owner's customer_name / customer_email /
--    customer_phone are still never selected), extended for
--    inspections.
--
--    SENTINEL DISCIPLINE — what this RPC serves, by state:
--    * Repair referral (any state): the Phase 1 + Brief 3 field
--      set, plus referral_kind on the active hop. The
--      `inspection` and `visit_minimum` keys are NULL. The three
--      minimum items do not exist in the result.
--    * Inspection referral, pre-accept (active hop 'sent' or
--      'viewed'): `inspection` carries ONLY location_zip,
--      location_descriptor, preferred_windows, and the addressed
--      inspector's own fee (public provider data). The three
--      minimum items do not exist in the result.
--    * Inspection referral, post-accept (active hop 'accepted'
--      or 'outcome_reported'): the same `inspection` object, plus
--      `visit_minimum` carrying EXACTLY the three items —
--      consumer_first_name, consumer_phone,
--      vehicle_location_text — read from inspection_details for
--      the active hop's chain. revealed_at is stamped on this
--      first post-accept serve. Email is not stored in
--      inspection_details and is never served.
--    * A filed inspection report is served as
--      `inspection_report` (checklist fields only; the report
--      holds no contact data).
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_referral_package_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package_id uuid;
  v_active public.shop_referrals%ROWTYPE;
  result jsonb;
BEGIN
  SELECT id INTO v_package_id
  FROM public.referral_packages
  WHERE token = p_token AND expires_at > now()
  LIMIT 1;
  IF v_package_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_active
  FROM public.shop_referrals
  WHERE package_id = v_package_id
    AND status IN ('sent','viewed','accepted','outcome_reported')
  ORDER BY created_at DESC
  LIMIT 1;

  -- First post-accept serve of an inspection: stamp revealed_at.
  -- The stamp condition matches the serve condition for
  -- visit_minimum below exactly (same active hop, same statuses,
  -- inspection kind only).
  IF v_active.id IS NOT NULL
     AND v_active.referral_kind = 'inspection'
     AND v_active.status IN ('accepted','outcome_reported') THEN
    UPDATE public.inspection_details
    SET revealed_at = now(), updated_at = now()
    WHERE chain_id = v_active.chain_id AND revealed_at IS NULL;
  END IF;

  SELECT to_jsonb(t) INTO result
  FROM (
    SELECT
      rp.id,
      rp.token,
      rp.user_id,
      rp.created_at,
      rp.expires_at,
      rp.vehicle_year,
      rp.vehicle_make,
      rp.vehicle_model,
      rp.vehicle_trim,
      rp.vin,
      rp.diagnosis_title,
      rp.diagnosis_code,
      rp.diagnosis_urgency,
      rp.diagnosis_details,
      rp.diy_feasibility,
      rp.estimated_cost_low,
      rp.estimated_cost_high,
      rp.cost_estimate_details,
      rp.metro_area,
      rp.zip_code,
      rp.photo_urls,
      rp.audio_clip_url,
      rp.video_frame_urls,
      rp.chat_summary,
      rp.customer_notes,
      rp.transport_requested,
      rp.transport_note,
      rp.quote_request_id,
      rp.view_count,
      rp.pdf_download_count,
      (
        SELECT count(*)::int
        FROM public.shop_referrals sr
        WHERE sr.package_id = rp.id
      ) AS referral_count,
      (
        SELECT to_jsonb(ar)
        FROM (
          SELECT
            sr.id, sr.shop_id, sr.status, sr.preference_order,
            sr.referral_kind,
            sr.sent_at, sr.viewed_at, sr.responded_at,
            sr.window_expires_at,
            sr.outcome_found, sr.outcome_did, sr.outcome_cost,
            sr.outcome_transport_cost,
            sr.outcome_reported_at, sr.outcome_reported_by,
            sr.completion_confirmed_by, sr.completion_confirmed_at,
            sr.founder_flagged, sr.disputed_at,
            sr.transport_status, sr.transport_charge_stated
          FROM public.shop_referrals sr
          WHERE sr.package_id = rp.id
            AND sr.status IN ('sent','viewed','accepted','outcome_reported')
          ORDER BY sr.created_at DESC
          LIMIT 1
        ) ar
      ) AS active_referral,
      (
        SELECT jsonb_build_object(
          'id', sp.id,
          'name', sp.name,
          'offers_pickup_delivery', sp.offers_pickup_delivery,
          'provider_kind', sp.provider_kind,
          'service_area_label', sp.service_area_label,
          'service_radius_miles', sp.service_radius_miles,
          'inspection_fee', sp.inspection_fee
        )
        FROM public.shop_referrals sr
        JOIN public.service_providers sp ON sp.id = sr.shop_id
        WHERE sr.package_id = rp.id
          AND sr.status IN ('sent','viewed','accepted','outcome_reported')
        ORDER BY sr.created_at DESC
        LIMIT 1
      ) AS shop,
      -- Inspection request context: pre-accept-safe fields ONLY.
      -- Present only when the active hop is an inspection.
      (
        SELECT jsonb_build_object(
          'location_zip', COALESCE(idt.location_zip, rp.zip_code),
          'location_descriptor', idt.location_descriptor,
          'preferred_windows', idt.preferred_windows
        )
        FROM public.shop_referrals sr
        LEFT JOIN public.inspection_details idt
          ON idt.chain_id = sr.chain_id
        WHERE sr.package_id = rp.id
          AND sr.referral_kind = 'inspection'
          AND sr.status IN ('sent','viewed','accepted','outcome_reported')
        ORDER BY sr.created_at DESC
        LIMIT 1
      ) AS inspection,
      -- The visit minimum: EXACTLY three items, served ONLY for
      -- an accepted inspection referral. NULL in every other
      -- state and for every repair referral.
      (
        SELECT jsonb_build_object(
          'consumer_first_name', idt.consumer_first_name,
          'consumer_phone', idt.consumer_phone,
          'vehicle_location_text', idt.vehicle_location_text,
          'revealed_at', idt.revealed_at
        )
        FROM public.shop_referrals sr
        JOIN public.inspection_details idt
          ON idt.chain_id = sr.chain_id
        WHERE sr.package_id = rp.id
          AND sr.referral_kind = 'inspection'
          AND sr.status IN ('accepted','outcome_reported')
        ORDER BY sr.created_at DESC
        LIMIT 1
      ) AS visit_minimum,
      -- The filed inspection report, when one exists for this
      -- package (explicit checklist columns; no contact data
      -- exists in inspection_reports).
      (
        SELECT to_jsonb(rep)
        FROM (
          SELECT
            ir.id, ir.referral_id, ir.checklist_version,
            ir.findings, ir.summary, ir.safe_to_drive,
            ir.recommended_next_step, ir.photo_urls,
            ir.onsite_eligible, ir.onsite_performed,
            ir.onsite_did, ir.onsite_cost, ir.filed_at
          FROM public.inspection_reports ir
          JOIN public.shop_referrals sr ON sr.id = ir.referral_id
          WHERE sr.package_id = rp.id
          ORDER BY ir.filed_at DESC
          LIMIT 1
        ) rep
      ) AS inspection_report
    FROM public.referral_packages rp
    WHERE rp.id = v_package_id
    LIMIT 1
  ) t;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_package_by_token(text) TO anon, authenticated;

-- -------------------------------------------------------------
-- 7. NEW token RPC: the inspector files the structured report.
--    Mirrors submit_referral_outcome's discipline: token must be
--    live, the 30-day window measured from the package's
--    created_at applies, required fields are validated, and the
--    referral must be the ACCEPTED inspection hop. Filing moves
--    the hop to 'outcome_reported' — from there the shared
--    Decision 1 mechanics (owner confirmation as the counting
--    trigger, 7-day founder flag, 14-day owner-unconfirmed
--    fallback, 30-day dispute) apply unchanged, counted as an
--    inspection by referral_kind.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_inspection_report(
  p_token text,
  p_checklist_version text,
  p_findings jsonb,
  p_summary text,
  p_safe_to_drive boolean,
  p_recommended_next_step text,
  p_photo_urls text[],
  p_onsite_eligible boolean,
  p_onsite_performed boolean,
  p_onsite_did text,
  p_onsite_cost numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.referral_packages%ROWTYPE;
  v_active public.shop_referrals%ROWTYPE;
  v_report_id uuid;
BEGIN
  SELECT * INTO v_pkg
  FROM public.referral_packages
  WHERE token = p_token AND expires_at > now()
  LIMIT 1;
  IF v_pkg.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_or_expired_token');
  END IF;

  -- Report window: same discipline as the outcome window —
  -- 30 days from the package's created_at.
  IF now() > v_pkg.created_at + interval '30 days' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'outcome_window_closed');
  END IF;

  IF p_checklist_version IS NULL OR btrim(p_checklist_version) = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_checklist_version');
  END IF;
  IF p_findings IS NULL OR jsonb_typeof(p_findings) <> 'array'
     OR jsonb_array_length(p_findings) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_findings');
  END IF;
  IF p_summary IS NULL OR btrim(p_summary) = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_summary');
  END IF;
  IF p_safe_to_drive IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_safe_to_drive');
  END IF;
  IF p_onsite_cost IS NOT NULL AND p_onsite_cost < 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_onsite_cost');
  END IF;
  IF COALESCE(p_onsite_performed, false) AND NOT COALESCE(p_onsite_eligible, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'onsite_performed_requires_eligible');
  END IF;

  SELECT * INTO v_active
  FROM public.shop_referrals
  WHERE package_id = v_pkg.id AND status = 'accepted'
  ORDER BY created_at DESC
  LIMIT 1;
  IF v_active.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_accepted_referral');
  END IF;
  IF v_active.referral_kind <> 'inspection' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_an_inspection_referral');
  END IF;
  IF EXISTS (SELECT 1 FROM public.inspection_reports WHERE referral_id = v_active.id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'report_already_filed');
  END IF;

  INSERT INTO public.inspection_reports (
    referral_id, chain_id, checklist_version, findings, summary,
    safe_to_drive, recommended_next_step, photo_urls,
    onsite_eligible, onsite_performed, onsite_did, onsite_cost
  ) VALUES (
    v_active.id, v_active.chain_id, p_checklist_version, p_findings,
    p_summary, p_safe_to_drive, p_recommended_next_step,
    COALESCE(p_photo_urls, '{}'),
    COALESCE(p_onsite_eligible, false), COALESCE(p_onsite_performed, false),
    p_onsite_did, p_onsite_cost
  )
  RETURNING id INTO v_report_id;

  UPDATE public.shop_referrals
  SET outcome_reported_at = now(),
      outcome_reported_by = 'inspector',
      status = 'outcome_reported'
  WHERE id = v_active.id;

  RETURN jsonb_build_object('ok', true, 'status', 'outcome_reported', 'report_id', v_report_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_inspection_report(text, text, jsonb, text, boolean, text, text[], boolean, boolean, text, numeric) TO anon, authenticated;

-- -------------------------------------------------------------
-- 8. Founder response-time report: gains the kind segment.
--    Per-shop rows are segmented by referral_kind (a provider's
--    repair rows and inspection rows are separate lines), and
--    the return gains by_kind totals including completion
--    counts per kind, so inspection completions are visible
--    separately and can never be summed into the repair counts
--    by accident. The all-kinds `overall` block is unchanged
--    from Phase 1 (it measures response behavior, not
--    completions).
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.referral_response_report()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shops jsonb;
  v_overall jsonb;
  v_by_kind jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin access required' USING errcode = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(s) ORDER BY s.shop_name, s.referral_kind), '[]'::jsonb)
  INTO v_shops
  FROM (
    SELECT
      sr.shop_id AS shop_id,
      sp.name AS shop_name,
      sr.referral_kind AS referral_kind,
      count(*)::int AS sends,
      count(sr.responded_at)::int AS responses,
      count(*) FILTER (WHERE sr.status = 'completed')::int AS completions,
      round(
        (percentile_cont(0.5) WITHIN GROUP (
          ORDER BY extract(epoch FROM (sr.responded_at - sr.sent_at)) / 60.0
        ) FILTER (WHERE sr.responded_at IS NOT NULL))::numeric,
        2
      ) AS median_response_minutes,
      CASE WHEN count(*) > 0 THEN
        round(
          (count(*) FILTER (
            WHERE sr.responded_at IS NOT NULL
              AND sr.window_expires_at IS NOT NULL
              AND sr.responded_at <= sr.window_expires_at
          ))::numeric / count(*)::numeric,
          4
        )
      END AS responded_within_window_share,
      CASE WHEN count(*) > 0 THEN
        round(
          (count(*) FILTER (WHERE sr.responded_at IS NULL))::numeric / count(*)::numeric,
          4
        )
      END AS never_responded_share
    FROM public.shop_referrals sr
    JOIN public.service_providers sp ON sp.id = sr.shop_id
    GROUP BY sr.shop_id, sp.name, sr.referral_kind
  ) s;

  SELECT to_jsonb(o) INTO v_overall
  FROM (
    SELECT
      count(*)::int AS sends,
      count(sr.responded_at)::int AS responses,
      round(
        (percentile_cont(0.5) WITHIN GROUP (
          ORDER BY extract(epoch FROM (sr.responded_at - sr.sent_at)) / 60.0
        ) FILTER (WHERE sr.responded_at IS NOT NULL))::numeric,
        2
      ) AS median_response_minutes,
      CASE WHEN count(*) > 0 THEN
        round(
          (count(*) FILTER (
            WHERE sr.responded_at IS NOT NULL
              AND sr.window_expires_at IS NOT NULL
              AND sr.responded_at <= sr.window_expires_at
          ))::numeric / count(*)::numeric,
          4
        )
      END AS responded_within_window_share,
      CASE WHEN count(*) > 0 THEN
        round(
          (count(*) FILTER (WHERE sr.responded_at IS NULL))::numeric / count(*)::numeric,
          4
        )
      END AS never_responded_share
    FROM public.shop_referrals sr
  ) o;

  SELECT COALESCE(jsonb_object_agg(k.referral_kind, k.stats), '{}'::jsonb)
  INTO v_by_kind
  FROM (
    SELECT
      sr.referral_kind AS referral_kind,
      jsonb_build_object(
        'sends', count(*)::int,
        'responses', count(sr.responded_at)::int,
        'completions', (count(*) FILTER (WHERE sr.status = 'completed'))::int,
        'median_response_minutes', round(
          (percentile_cont(0.5) WITHIN GROUP (
            ORDER BY extract(epoch FROM (sr.responded_at - sr.sent_at)) / 60.0
          ) FILTER (WHERE sr.responded_at IS NOT NULL))::numeric,
          2
        ),
        'responded_within_window_share', CASE WHEN count(*) > 0 THEN
          round(
            (count(*) FILTER (
              WHERE sr.responded_at IS NOT NULL
                AND sr.window_expires_at IS NOT NULL
                AND sr.responded_at <= sr.window_expires_at
            ))::numeric / count(*)::numeric,
            4
          )
        END,
        'never_responded_share', CASE WHEN count(*) > 0 THEN
          round(
            (count(*) FILTER (WHERE sr.responded_at IS NULL))::numeric / count(*)::numeric,
            4
          )
        END
      ) AS stats
    FROM public.shop_referrals sr
    GROUP BY sr.referral_kind
  ) k;

  RETURN jsonb_build_object('shops', v_shops, 'overall', v_overall, 'by_kind', v_by_kind);
END;
$$;

REVOKE ALL ON FUNCTION public.referral_response_report() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.referral_response_report() TO authenticated;
