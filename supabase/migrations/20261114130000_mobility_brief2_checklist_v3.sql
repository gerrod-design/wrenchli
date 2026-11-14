-- =============================================================
-- Mobility Brief 2 — Checklist v3 swap (2026-11-14)
--
-- Carries the APPROVED v3 checklist (Gerrod, 2026-11-14) into
-- the Brief 2 data layer. The v1 build filed per-system
-- findings only; v3 adds per-item results (carried inside the
-- existing findings jsonb — no change there), the
-- vehicle-specific known-issues block (section 3 of the
-- draft), and the pre-assessment comparison block (section 6),
-- whose sealing is enforced HERE, in the token RPC, mirroring
-- the visit-minimum discipline of the Brief 2 migration:
--
--  * The known-issues checks for the exact car are generated
--    per job before the visit (desk work: NHTSA recalls + the
--    sourced pattern library) and stored on the chain's
--    inspection_details row (new known_issues column). They are
--    job-pack data — no consumer contact data — so the token
--    RPC serves them with the pre-accept-safe inspection
--    context. The inspector's marks are written back to the
--    same column by the filing RPCs below.
--  * The comparison block is a two-stage filing. The general +
--    known-issues findings are filed FIRST through
--    file_inspection_findings, which stages them in
--    inspection_findings_staging. Only when a staging row
--    exists for the ACTIVE hop does get_referral_package_by_
--    token serve `pre_assessment` — and it serves each
--    suspected cause's name and identifier ONLY, never its
--    likelihood. Before staging, the causes do not exist in
--    the token view at all.
--  * submit_inspection_report gains the verdicts: when the
--    package's pre-assessment named suspected causes, the
--    final filing must carry one verdict (confirmed / not
--    found / could_not_check) plus an evidence note per cause,
--    and a staging row must exist (verdicts cannot be filed
--    blind-bypassed). The server attaches each cause's
--    likelihood AS ISSUED to the stored verdicts at filing
--    time — likelihoods join the record only after verdicts
--    are in (whole-car rule 12), which is what the trust
--    record (draft section 6.3) lines up later.
--  * The seal closes the package's own back door: the base
--    view has always served referral_packages.diagnosis_
--    details wholesale, and that is where the pre-assessment
--    leaves its possible_causes (names AND probabilities). For
--    an inspection hop, the view now serves diagnosis_details
--    with possible_causes REMOVED until the findings are
--    filed, with the sealed causes (name + id only) once they
--    are, and whole again only once the report is filed.
--    Repair referrals are untouched — shops have always seen
--    the full assessment, and still do.
--
-- Counting and privacy discipline are UNCHANGED: no counter,
-- no escalation function, and no RLS policy is touched; the
-- visit minimum is served exactly as before; email is never
-- served in any state.
-- =============================================================

-- -------------------------------------------------------------
-- 1. inspection_details: the known-issues block for the chain.
--    Written by ops / the job-pack builder under the owner's
--    existing INSERT policy (the send screen) or service-side;
--    marks are written by the filing RPCs. Same table, same
--    RLS — no new policy, no provider-facing read except the
--    token RPC's explicit column list.
-- -------------------------------------------------------------
ALTER TABLE public.inspection_details
  ADD COLUMN IF NOT EXISTS known_issues jsonb NULL;

COMMENT ON COLUMN public.inspection_details.known_issues IS
  'Checklist v3, section 3: the vehicle-specific known-issues block for this chain — directed checks (recalls + sourced pattern failures for the exact vehicle) generated per job before the visit. Each element is a check object {id, kind, title, pattern, source, whereToLook, evidenceSigns, canCannot}; after filing, each also carries the inspector''s mark (evidence_found | no_evidence_found | could_not_check) and evidenceNote. No consumer contact data.';

-- -------------------------------------------------------------
-- 2. inspection_findings_staging: the stage-1 filing (general
--    checklist + known-issues marks) that unseals the
--    comparison block. One row per referral hop. Written and
--    read ONLY through the SECURITY DEFINER token RPCs below —
--    RLS is enabled with NO policies, so no client role can
--    touch it directly. The row is the seal's key: its
--    existence for the active hop is the only thing that lets
--    the token view serve the suspected causes.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inspection_findings_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL UNIQUE REFERENCES public.shop_referrals(id),
  chain_id uuid NOT NULL,
  checklist_version text NOT NULL,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  filed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inspection_findings_staging_chain_id_idx
  ON public.inspection_findings_staging (chain_id);

ALTER TABLE public.inspection_findings_staging ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.inspection_findings_staging IS
  'Checklist v3, section 6: stage-1 inspection findings (general checklist + known-issues marks) filed through file_inspection_findings. A row for the active hop unseals the pre-assessment comparison block in get_referral_package_by_token. Access only via the token RPCs; no client policies by design.';

-- -------------------------------------------------------------
-- 3. inspection_reports: when the stage-1 findings were filed
--    (copied from the staging row at final filing), and the
--    comparison verdicts with likelihoods attached as issued.
-- -------------------------------------------------------------
ALTER TABLE public.inspection_reports
  ADD COLUMN IF NOT EXISTS findings_filed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS comparison_verdicts jsonb NULL;

COMMENT ON COLUMN public.inspection_reports.findings_filed_at IS
  'Checklist v3, section 6.2: when the general + known-issues findings were filed (the moment the comparison block unsealed). Equals filed_at when the report was filed in a single step with no comparison block.';
COMMENT ON COLUMN public.inspection_reports.comparison_verdicts IS
  'Checklist v3, section 6.2: one entry per suspected cause — {causeId, name, verdict, evidenceNote, basis, likelihood}. The likelihood is the pre-assessment''s figure AS ISSUED, attached by submit_inspection_report at filing time, after the verdicts were filed. NULL when the job had no pre-assessment causes.';

-- -------------------------------------------------------------
-- 4. The suspected-cause derivation, shared by the token view
--    and the filing RPC so the two can never drift. Reads the
--    package's diagnosis_details — the record the
--    pre-assessment leaves on the referral package: its
--    possible_causes carry a plain name and a probability; a
--    cause keeps its own issued id when present and otherwise
--    takes its position ("cause-1", "cause-2", …). Pure
--    function over its argument; no table access.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.inspection_suspected_causes(p_details jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_strip_nulls(jsonb_build_object(
        'id', CASE
          WHEN COALESCE(btrim(elem->>'id'), '') <> '' THEN elem->>'id'
          ELSE 'cause-' || ord::text
        END,
        'name', btrim(elem->>'name'),
        'likelihood', CASE
          WHEN jsonb_typeof(elem->'probability') = 'number' THEN elem->'probability'
          WHEN jsonb_typeof(elem->'likelihood') = 'number' THEN elem->'likelihood'
        END
      )) ORDER BY ord
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(p_details->'possible_causes') = 'array'
        THEN p_details->'possible_causes'
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS t(elem, ord)
  WHERE COALESCE(btrim(elem->>'name'), '') <> '';
$$;

REVOKE ALL ON FUNCTION public.inspection_suspected_causes(jsonb) FROM PUBLIC;

-- -------------------------------------------------------------
-- 5. Package lookup by token: the Brief 2 body, extended for
--    checklist v3. Changes, and only these:
--    * `inspection` gains known_issues (the chain's block,
--      marks included once filed) and findings_filed (whether
--      stage-1 findings exist for the active hop).
--    * New `pre_assessment` key: NULL in every state except an
--      inspection whose stage-1 findings are filed for the
--      active hop. When served it carries the run id, the run
--      timestamp, and the suspected causes as {id, name} —
--      likelihoods are stripped by construction (the build
--      object names exactly two keys per cause).
--    * `inspection_report` gains findings_filed_at and
--      comparison_verdicts (the filed record; likelihoods are
--      present here because verdicts are already in — rule 12).
--    * diagnosis_details is served through the seal described
--      in the header: for an inspection hop, possible_causes is
--      removed pre-filing, replaced by the sealed causes once
--      findings are filed, and restored whole once the report
--      is filed. Every other package keeps the Brief 2 shape.
--    The visit minimum, the repair shape, and every other
--    field are byte-for-byte the Brief 2 body.
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
  IF (v_active).id IS NOT NULL
     AND (v_active).referral_kind = 'inspection'
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
      -- Checklist v3 seal: for an inspection hop, the
      -- pre-assessment's possible_causes leave this view until
      -- the comparison is complete — removed before the
      -- findings are filed, sealed (name + id only) after,
      -- whole once the report is filed. All other packages
      -- (every repair referral) get the column as stored.
      CASE
        WHEN (v_active).id IS NOT NULL
             AND (v_active).referral_kind = 'inspection' THEN
          CASE
            WHEN EXISTS (
              SELECT 1 FROM public.inspection_reports ir
              WHERE ir.referral_id = (v_active).id
            ) THEN rp.diagnosis_details
            WHEN EXISTS (
              SELECT 1 FROM public.inspection_findings_staging st
              WHERE st.referral_id = (v_active).id
            ) THEN jsonb_set(
              rp.diagnosis_details,
              '{possible_causes}',
              (
                SELECT COALESCE(
                  jsonb_agg(
                    jsonb_build_object('id', c->>'id', 'name', c->>'name')
                    ORDER BY ord
                  ),
                  '[]'::jsonb
                )
                FROM jsonb_array_elements(
                  public.inspection_suspected_causes(rp.diagnosis_details)
                ) WITH ORDINALITY AS ct(c, ord)
              )
            )
            ELSE rp.diagnosis_details - 'possible_causes'
          END
        ELSE rp.diagnosis_details
      END AS diagnosis_details,
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
      -- Checklist v3 adds the chain's known-issues block (job
      -- pack data, no contact items) and findings_filed.
      (
        SELECT jsonb_build_object(
          'location_zip', COALESCE(idt.location_zip, rp.zip_code),
          'location_descriptor', idt.location_descriptor,
          'preferred_windows', idt.preferred_windows,
          'known_issues', idt.known_issues,
          'findings_filed', EXISTS (
            SELECT 1 FROM public.inspection_findings_staging st
            WHERE st.referral_id = sr.id
          )
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
      -- exists in inspection_reports). Checklist v3 adds the
      -- stage-1 timestamp and the comparison verdicts.
      (
        SELECT to_jsonb(rep)
        FROM (
          SELECT
            ir.id, ir.referral_id, ir.checklist_version,
            ir.findings, ir.summary, ir.safe_to_drive,
            ir.recommended_next_step, ir.photo_urls,
            ir.onsite_eligible, ir.onsite_performed,
            ir.onsite_did, ir.onsite_cost, ir.filed_at,
            ir.findings_filed_at, ir.comparison_verdicts
          FROM public.inspection_reports ir
          JOIN public.shop_referrals sr ON sr.id = ir.referral_id
          WHERE sr.package_id = rp.id
          ORDER BY ir.filed_at DESC
          LIMIT 1
        ) rep
      ) AS inspection_report,
      -- Checklist v3, section 6: the pre-assessment comparison
      -- block, SEALED until the stage-1 findings are filed for
      -- the active inspection hop. Served causes carry name and
      -- identifier ONLY — likelihood is never selected here.
      (
        SELECT jsonb_build_object(
          'run_id', COALESCE(
            NULLIF(rp.diagnosis_details->>'pre_assessment_run_id', ''),
            NULLIF(rp.diagnosis_details->>'diagnosis_id', ''),
            rp.id::text
          ),
          'run_at', COALESCE(
            NULLIF(rp.diagnosis_details->>'pre_assessment_run_at', ''),
            rp.created_at::text
          ),
          'causes', (
            SELECT COALESCE(
              jsonb_agg(
                jsonb_build_object('id', c->>'id', 'name', c->>'name')
                ORDER BY ord
              ),
              '[]'::jsonb
            )
            FROM jsonb_array_elements(
              public.inspection_suspected_causes(rp.diagnosis_details)
            ) WITH ORDINALITY AS ct(c, ord)
          )
        )
        WHERE (v_active).id IS NOT NULL
          AND (v_active).referral_kind = 'inspection'
          AND EXISTS (
            SELECT 1 FROM public.inspection_findings_staging st
            WHERE st.referral_id = (v_active).id
          )
      ) AS pre_assessment
    FROM public.referral_packages rp
    WHERE rp.id = v_package_id
    LIMIT 1
  ) t;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_package_by_token(text) TO anon, authenticated;

-- -------------------------------------------------------------
-- 6. NEW token RPC: stage-1 filing. The inspector files the
--    general checklist findings and the known-issues marks;
--    the staging row this writes is what unseals the
--    comparison block in the token view above. Same discipline
--    as submit_inspection_report: live token, 30-day window
--    from the package's created_at, the ACCEPTED inspection
--    hop only, and no filing once the final report exists.
--    Re-filing stage 1 replaces the staged findings (the
--    inspector may correct his own findings before the final
--    report; the final report is the record of record).
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.file_inspection_findings(
  p_token text,
  p_checklist_version text,
  p_findings jsonb,
  p_known_issues jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.referral_packages%ROWTYPE;
  v_active public.shop_referrals%ROWTYPE;
BEGIN
  SELECT * INTO v_pkg
  FROM public.referral_packages
  WHERE token = p_token AND expires_at > now()
  LIMIT 1;
  IF v_pkg.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_or_expired_token');
  END IF;

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

  -- Known-issues completeness (whole-car rule 11): when the
  -- block carries checks, every check must carry a mark and an
  -- evidence note or reason.
  IF p_known_issues IS NOT NULL THEN
    IF jsonb_typeof(p_known_issues) <> 'array' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'known_issues_incomplete');
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_known_issues) e
      WHERE COALESCE(e->>'mark', '') NOT IN
              ('evidence_found', 'no_evidence_found', 'could_not_check')
         OR COALESCE(btrim(e->>'evidenceNote'), '') = ''
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'known_issues_incomplete');
    END IF;
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

  INSERT INTO public.inspection_findings_staging (
    referral_id, chain_id, checklist_version, findings, filed_at
  ) VALUES (
    v_active.id, v_active.chain_id, p_checklist_version, p_findings, now()
  )
  ON CONFLICT (referral_id) DO UPDATE
    SET checklist_version = EXCLUDED.checklist_version,
        findings = EXCLUDED.findings,
        filed_at = EXCLUDED.filed_at;

  -- The marks ride back onto the chain's block, so the filed
  -- record (and any later view of the job pack) shows them.
  IF p_known_issues IS NOT NULL THEN
    UPDATE public.inspection_details
    SET known_issues = p_known_issues, updated_at = now()
    WHERE chain_id = v_active.chain_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', 'findings_filed');
END;
$$;

GRANT EXECUTE ON FUNCTION public.file_inspection_findings(text, text, jsonb, jsonb) TO anon, authenticated;

-- -------------------------------------------------------------
-- 7. submit_inspection_report: the Brief 2 body, extended for
--    checklist v3. The signature gains two trailing arguments
--    (old 11-arg form dropped): p_known_issues (final marks,
--    same completeness rule as stage 1) and
--    p_comparison_verdicts (one verdict + evidence note per
--    suspected cause). When the package's pre-assessment named
--    causes, verdicts are REQUIRED and a stage-1 staging row
--    must exist — the seal cannot be bypassed by filing
--    verdicts blind. The stored verdicts gain each cause's
--    likelihood as issued, attached here, after the verdicts.
--    Every Brief 2 validation, the counting path, and the
--    outcome_reported hop transition are unchanged.
-- -------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_inspection_report(
  text, text, jsonb, text, boolean, text, text[], boolean, boolean, text, numeric
);

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
  p_onsite_cost numeric,
  p_known_issues jsonb DEFAULT NULL,
  p_comparison_verdicts jsonb DEFAULT NULL
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
  v_causes jsonb;
  v_stored_verdicts jsonb;
  v_findings_filed_at timestamptz;
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

  -- Known-issues completeness (whole-car rule 11), as stage 1.
  IF p_known_issues IS NOT NULL THEN
    IF jsonb_typeof(p_known_issues) <> 'array' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'known_issues_incomplete');
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_known_issues) e
      WHERE COALESCE(e->>'mark', '') NOT IN
              ('evidence_found', 'no_evidence_found', 'could_not_check')
         OR COALESCE(btrim(e->>'evidenceNote'), '') = ''
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'known_issues_incomplete');
    END IF;
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

  -- Comparison completeness (whole-car rule 12): the verdicts
  -- are judged against the causes the SERVER derives from the
  -- package — never against anything the caller claims.
  v_causes := public.inspection_suspected_causes(v_pkg.diagnosis_details);
  IF jsonb_array_length(v_causes) > 0 THEN
    IF p_comparison_verdicts IS NULL
       OR jsonb_typeof(p_comparison_verdicts) <> 'array'
       OR jsonb_array_length(p_comparison_verdicts) = 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'comparison_required');
    END IF;
    SELECT filed_at INTO v_findings_filed_at
    FROM public.inspection_findings_staging
    WHERE referral_id = v_active.id;
    IF v_findings_filed_at IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'comparison_requires_findings_first');
    END IF;
    IF jsonb_array_length(p_comparison_verdicts) <> jsonb_array_length(v_causes)
       OR EXISTS (
         SELECT 1 FROM jsonb_array_elements(v_causes) c
         WHERE (
           SELECT count(*) FROM jsonb_array_elements(p_comparison_verdicts) v
           WHERE v->>'causeId' = c->>'id'
         ) <> 1
       )
       OR EXISTS (
         SELECT 1 FROM jsonb_array_elements(p_comparison_verdicts) v
         WHERE COALESCE(v->>'verdict', '') NOT IN
                 ('confirmed', 'not_found', 'could_not_check')
            OR COALESCE(btrim(v->>'evidenceNote'), '') = ''
            OR NOT EXISTS (
              SELECT 1 FROM jsonb_array_elements(v_causes) c
              WHERE c->>'id' = v->>'causeId'
            )
       ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'comparison_incomplete');
    END IF;

    -- Attach each cause's likelihood AS ISSUED. This is the
    -- first moment a likelihood joins the inspection record:
    -- after the verdicts, never before (rule 12).
    SELECT COALESCE(
      jsonb_agg(
        jsonb_strip_nulls(
          v || jsonb_build_object(
            'likelihood', (
              SELECT c->'likelihood'
              FROM jsonb_array_elements(v_causes) c
              WHERE c->>'id' = v->>'causeId'
            )
          )
        ) ORDER BY ord
      ),
      '[]'::jsonb
    ) INTO v_stored_verdicts
    FROM jsonb_array_elements(p_comparison_verdicts) WITH ORDINALITY AS t(v, ord);
  ELSE
    IF p_comparison_verdicts IS NOT NULL
       AND jsonb_typeof(p_comparison_verdicts) = 'array'
       AND jsonb_array_length(p_comparison_verdicts) > 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'comparison_not_applicable');
    END IF;
    SELECT filed_at INTO v_findings_filed_at
    FROM public.inspection_findings_staging
    WHERE referral_id = v_active.id;
  END IF;

  INSERT INTO public.inspection_reports (
    referral_id, chain_id, checklist_version, findings, summary,
    safe_to_drive, recommended_next_step, photo_urls,
    onsite_eligible, onsite_performed, onsite_did, onsite_cost,
    findings_filed_at, comparison_verdicts
  ) VALUES (
    v_active.id, v_active.chain_id, p_checklist_version, p_findings,
    p_summary, p_safe_to_drive, p_recommended_next_step,
    COALESCE(p_photo_urls, '{}'),
    COALESCE(p_onsite_eligible, false), COALESCE(p_onsite_performed, false),
    p_onsite_did, p_onsite_cost,
    COALESCE(v_findings_filed_at, now()), v_stored_verdicts
  )
  RETURNING id INTO v_report_id;

  IF p_known_issues IS NOT NULL THEN
    UPDATE public.inspection_details
    SET known_issues = p_known_issues, updated_at = now()
    WHERE chain_id = v_active.chain_id;
  END IF;

  UPDATE public.shop_referrals
  SET outcome_reported_at = now(),
      outcome_reported_by = 'inspector',
      status = 'outcome_reported'
  WHERE id = v_active.id;

  RETURN jsonb_build_object('ok', true, 'status', 'outcome_reported', 'report_id', v_report_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_inspection_report(text, text, jsonb, text, boolean, text, text[], boolean, boolean, text, numeric, jsonb, jsonb) TO anon, authenticated;
