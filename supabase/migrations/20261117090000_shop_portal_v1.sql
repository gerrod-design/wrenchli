-- Shop portal v1 (2026-11-17): the shop-account slice.
--
-- 1. Outcome-pipe status values (standing pre-launch item from the
--    Oct 21, 2026 shop design package, Section 5): the outcome
--    pipe's repair_status only allowed fixed / still_same / worse.
--    A customer who never showed up, or who declined the repair
--    after the shop's own evaluation, had no honest value and
--    risked being routed into a completion-shaped bucket. Add
--    no_show and declined_after_evaluation.
--
-- 2. Authenticated shop RPCs. The token-link RPC family
--    (respond_to_referral, submit_referral_outcome, ...) stays as
--    is for the Phase 1 pilot path. These new functions give a
--    signed-in shop user (linked to a service_providers record
--    through shop_accounts) the same lifecycle actions, keyed by
--    referral id instead of token, and they only ever return
--    Stage 1 package fields. Owner contact details are returned
--    by get_shop_job only after the shop has accepted.

-- ── 1. Outcome status values ─────────────────────────────────
ALTER TABLE public.outcome_reports
  DROP CONSTRAINT outcome_reports_repair_status_check;
ALTER TABLE public.outcome_reports
  ADD CONSTRAINT outcome_reports_repair_status_check
  CHECK (repair_status = ANY (ARRAY[
    'fixed', 'still_same', 'worse',
    'no_show', 'declined_after_evaluation'
  ]));

-- ── 2. Shop RPCs ─────────────────────────────────────────────

-- Resolve the caller's shop. Returns shop_id or NULL.
CREATE OR REPLACE FUNCTION public.my_shop_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT shop_id FROM public.shop_accounts WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Inbox: the caller's shop, its counts, and its repair referrals
-- with Stage 1 package fields only (never name, phone, email,
-- or VIN; those columns are not selected at all).
CREATE OR REPLACE FUNCTION public.get_shop_inbox()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_shop uuid := public.my_shop_id();
  v_result jsonb;
BEGIN
  IF v_shop IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_shop_account');
  END IF;

  SELECT jsonb_build_object(
    'ok', true,
    'shop', (SELECT jsonb_build_object(
               'id', sp.id, 'name', sp.name, 'city', sp.city,
               'state', sp.state, 'phone', sp.phone)
             FROM public.service_providers sp WHERE sp.id = v_shop),
    'counts', (SELECT jsonb_build_object(
               'received', count(*),
               'accepted', count(*) FILTER (WHERE sr.status IN ('accepted','outcome_reported','completed','not_completed')),
               'completed', count(*) FILTER (WHERE sr.status = 'completed'),
               'owner_confirmed', count(*) FILTER (WHERE sr.status = 'completed' AND sr.completion_confirmed_by = 'owner'))
             FROM public.shop_referrals sr
             WHERE sr.shop_id = v_shop AND sr.referral_kind = 'repair'),
    'referrals', COALESCE((SELECT jsonb_agg(item ORDER BY item.sent_at DESC)
             FROM (SELECT jsonb_build_object(
               'id', sr.id,
               'status', sr.status,
               'sent_at', sr.sent_at,
               'responded_at', sr.responded_at,
               'window_expires_at', sr.window_expires_at,
               'outcome_reported_at', sr.outcome_reported_at,
               'completion_confirmed_by', sr.completion_confirmed_by,
               'vehicle_year', rp.vehicle_year,
               'vehicle_make', rp.vehicle_make,
               'vehicle_model', rp.vehicle_model,
               'diagnosis_title', rp.diagnosis_title,
               'diagnosis_urgency', rp.diagnosis_urgency,
               'estimated_cost_low', rp.estimated_cost_low,
               'estimated_cost_high', rp.estimated_cost_high,
               'metro_area', rp.metro_area
             ) AS item, sr.sent_at AS sent_at
             FROM public.shop_referrals sr
             JOIN public.referral_packages rp ON rp.id = sr.package_id
             WHERE sr.shop_id = v_shop AND sr.referral_kind = 'repair'
             ) s), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Job view: one referral with the full Stage 1 package. Opening
-- it marks a 'sent' referral as viewed, mirroring the token
-- flow. Owner contact is included only once the shop has
-- accepted (status accepted or later in the lifecycle).
CREATE OR REPLACE FUNCTION public.get_shop_job(p_referral_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_shop uuid := public.my_shop_id();
  r public.shop_referrals%ROWTYPE;
  v_pkg public.referral_packages%ROWTYPE;
  v_accepted boolean;
BEGIN
  IF v_shop IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_shop_account');
  END IF;

  SELECT * INTO r FROM public.shop_referrals
  WHERE id = p_referral_id AND shop_id = v_shop;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF r.status = 'sent' THEN
    UPDATE public.shop_referrals
    SET status = 'viewed', viewed_at = now()
    WHERE id = r.id;
    r.status := 'viewed';
    r.viewed_at := now();
  END IF;

  SELECT * INTO v_pkg FROM public.referral_packages WHERE id = r.package_id;

  v_accepted := r.status IN ('accepted','outcome_reported','completed','not_completed');

  RETURN jsonb_build_object(
    'ok', true,
    'referral', jsonb_build_object(
      'id', r.id, 'status', r.status, 'sent_at', r.sent_at,
      'responded_at', r.responded_at,
      'window_expires_at', r.window_expires_at,
      'outcome_found', r.outcome_found, 'outcome_did', r.outcome_did,
      'outcome_cost', r.outcome_cost,
      'outcome_reported_at', r.outcome_reported_at,
      'completion_confirmed_by', r.completion_confirmed_by),
    'package', jsonb_build_object(
      'vehicle_year', v_pkg.vehicle_year,
      'vehicle_make', v_pkg.vehicle_make,
      'vehicle_model', v_pkg.vehicle_model,
      'vehicle_trim', v_pkg.vehicle_trim,
      'diagnosis_title', v_pkg.diagnosis_title,
      'diagnosis_urgency', v_pkg.diagnosis_urgency,
      'diagnosis_details', v_pkg.diagnosis_details,
      'chat_summary', v_pkg.chat_summary,
      'estimated_cost_low', v_pkg.estimated_cost_low,
      'estimated_cost_high', v_pkg.estimated_cost_high,
      'cost_estimate_details', v_pkg.cost_estimate_details,
      'metro_area', v_pkg.metro_area,
      'photo_urls', v_pkg.photo_urls,
      'customer_notes', v_pkg.customer_notes),
    'owner_contact', CASE WHEN v_accepted THEN jsonb_build_object(
      'name', v_pkg.customer_name,
      'phone', v_pkg.customer_phone,
      'email', v_pkg.customer_email) ELSE NULL END
  );
END;
$$;

-- Accept / decline, keyed by referral id for the caller's shop.
-- Mirrors respond_to_referral: a decline escalates the chain.
CREATE OR REPLACE FUNCTION public.respond_to_shop_referral(p_referral_id uuid, p_accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_shop uuid := public.my_shop_id();
  r public.shop_referrals%ROWTYPE;
  v_next uuid;
BEGIN
  IF v_shop IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_shop_account');
  END IF;

  SELECT * INTO r FROM public.shop_referrals
  WHERE id = p_referral_id AND shop_id = v_shop;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF r.status NOT IN ('sent','viewed') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_active_referral', 'status', r.status);
  END IF;

  IF p_accept THEN
    UPDATE public.shop_referrals
    SET status = 'accepted', responded_at = now()
    WHERE id = r.id;
    RETURN jsonb_build_object('ok', true, 'status', 'accepted');
  ELSE
    UPDATE public.shop_referrals
    SET status = 'declined', responded_at = now()
    WHERE id = r.id;
    v_next := public.escalate_shop_referral(r.id);
    RETURN jsonb_build_object('ok', true, 'status', 'declined', 'escalated', v_next IS NOT NULL);
  END IF;
END;
$$;

-- Outcome report from the portal. Mirrors
-- submit_referral_outcome's window and validation, and also
-- writes the outcome pipe (outcome_reports) with the
-- repair_status vocabulary, including no_show and
-- declined_after_evaluation. For those two, found / did / cost
-- are optional: nothing was found or done.
CREATE OR REPLACE FUNCTION public.submit_shop_outcome(
  p_referral_id uuid,
  p_found text,
  p_did text,
  p_cost numeric,
  p_repair_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_shop uuid := public.my_shop_id();
  r public.shop_referrals%ROWTYPE;
  v_pkg public.referral_packages%ROWTYPE;
  v_no_work boolean;
BEGIN
  IF v_shop IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_shop_account');
  END IF;

  IF p_repair_status NOT IN ('fixed','still_same','worse','no_show','declined_after_evaluation') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_repair_status');
  END IF;
  v_no_work := p_repair_status IN ('no_show','declined_after_evaluation');

  SELECT * INTO r FROM public.shop_referrals
  WHERE id = p_referral_id AND shop_id = v_shop;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF r.status <> 'accepted' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_accepted_referral', 'status', r.status);
  END IF;

  SELECT * INTO v_pkg FROM public.referral_packages WHERE id = r.package_id;
  IF now() > v_pkg.created_at + interval '30 days' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'outcome_window_closed');
  END IF;

  IF NOT v_no_work THEN
    IF p_found IS NULL OR btrim(p_found) = '' OR p_did IS NULL OR btrim(p_did) = '' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'missing_outcome_fields');
    END IF;
    IF p_cost IS NULL OR p_cost < 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'invalid_cost');
    END IF;
  ELSIF p_cost IS NOT NULL AND p_cost < 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_cost');
  END IF;

  UPDATE public.shop_referrals
  SET outcome_found = NULLIF(btrim(COALESCE(p_found, '')), ''),
      outcome_did = NULLIF(btrim(COALESCE(p_did, '')), ''),
      outcome_cost = p_cost,
      outcome_reported_at = now(),
      outcome_reported_by = 'shop',
      status = 'outcome_reported'
  WHERE id = r.id;

  INSERT INTO public.outcome_reports (
    session_id, repair_status, invoice_amount_cents,
    shop_ref, notes, collection_channel, user_id,
    unclear_charges, verified_job
  ) VALUES (
    v_pkg.session_id,
    p_repair_status,
    CASE WHEN p_cost IS NULL THEN NULL ELSE round(p_cost * 100)::integer END,
    v_shop::text,
    NULLIF(btrim(concat_ws(' ', COALESCE(p_found, ''), COALESCE(p_did, ''))), ''),
    'in_product',
    r.owner_user_id,
    false,
    false
  );

  RETURN jsonb_build_object('ok', true, 'status', 'outcome_reported');
END;
$$;

-- The credential for these functions is the signed-in session:
-- authenticated role only, never anonymous.
REVOKE EXECUTE ON FUNCTION public.my_shop_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_shop_inbox() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_shop_job(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.respond_to_shop_referral(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_shop_outcome(uuid, text, text, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_shop_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_shop_inbox() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_shop_job(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.respond_to_shop_referral(uuid, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_shop_outcome(uuid, text, text, numeric, text) TO authenticated, service_role;
