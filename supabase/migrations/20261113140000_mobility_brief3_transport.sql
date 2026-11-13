-- =============================================================
-- Mobility Brief 3 — Tow / Flatbed Pickup and Delivery,
-- Option A: shop-arranged transport (2026-11-13)
--
-- Adds the transport request thread to the shipped referral
-- lifecycle: the owner can ask for pickup and delivery of a car
-- that can't be driven; the shop arranges the tow or flatbed
-- itself; Wrenchli carries the request and the status and is
-- never a party to the transport.
--
-- Locked decisions (Mobility Brief 3, approved by Gerrod
-- 2026-11-13):
--  * Option A only. The SHOP contracts with its tow operator;
--    the consumer's transport arrangement is with the shop.
--    Wrenchli is the referral channel and is not a party to
--    transport. (Option B, platform-coordinated tow, is
--    documented-only and is NOT built here.)
--  * The request lives on the PACKAGE (transport_requested /
--    transport_note on referral_packages) so every hop of the
--    chain sees it; escalation copies chain context by
--    construction. process_referral_escalations() is NOT
--    modified.
--  * The status thread lives on the referral row
--    (transport_status: requested -> arranged -> picked_up ->
--    delivered, plus unable). The shop manages it after
--    acceptance through the token RPC set_referral_transport.
--  * Cost display: NO generic tow prices anywhere. The only
--    figures are the shop's own stated charge for this job
--    (transport_charge_stated at accept time, labeled as the
--    shop's) and the itemized outcome_transport_cost, kept
--    SEPARATE from outcome_cost so the confirmed record keeps
--    quoted-vs-confirmed data decomposable for the variance
--    readout.
--  * Stopping the chain cancels the transport request with it
--    (stop_referral_chain clears the package flag).
-- =============================================================

-- -------------------------------------------------------------
-- 1. Columns
-- -------------------------------------------------------------
ALTER TABLE public.referral_packages
  ADD COLUMN IF NOT EXISTS transport_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS transport_note text NULL;

ALTER TABLE public.shop_referrals
  ADD COLUMN IF NOT EXISTS transport_status text NULL,
  ADD COLUMN IF NOT EXISTS transport_charge_stated numeric NULL,
  ADD COLUMN IF NOT EXISTS outcome_transport_cost numeric NULL;

ALTER TABLE public.shop_referrals
  DROP CONSTRAINT IF EXISTS shop_referrals_transport_status_check;

ALTER TABLE public.shop_referrals
  ADD CONSTRAINT shop_referrals_transport_status_check
  CHECK (transport_status IS NULL OR transport_status IN
    ('requested','arranged','picked_up','delivered','unable'));

COMMENT ON COLUMN public.referral_packages.transport_requested IS
  'Owner asked for pickup and delivery of a car that can''t be driven (Mobility Brief 3, Option A, 2026-11-13). Lives on the package so every hop of the chain sees it.';
COMMENT ON COLUMN public.referral_packages.transport_note IS
  'Owner''s note for the shop about the pickup (where the car sits, access notes). Owner-authored; shown to the addressed shop in its token view.';
COMMENT ON COLUMN public.shop_referrals.transport_status IS
  'Shop-managed transport thread for this hop: requested -> arranged -> picked_up -> delivered, plus unable (Mobility Brief 3, Option A). Set via set_referral_transport after acceptance; initialized to ''requested'' on insert when the package requests transport.';
COMMENT ON COLUMN public.shop_referrals.transport_charge_stated IS
  'The shop''s own stated pickup/delivery charge for this specific job, stated at accept time. First-party actual, labeled as the shop''s charge wherever shown. Never a generic tow price.';
COMMENT ON COLUMN public.shop_referrals.outcome_transport_cost IS
  'Pickup/delivery cost from the shop''s outcome report, itemized SEPARATELY from outcome_cost so repair-price variance data stays decomposable (Mobility Brief 3).';

-- -------------------------------------------------------------
-- 2. Initialize the status thread on insert. A hop created for a
--    package that requests transport starts at 'requested' —
--    including hops created by escalate_shop_referral, which is
--    why this is a trigger rather than a change to the
--    escalation engine (the engine is deliberately untouched).
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.init_referral_transport_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.transport_status IS NULL AND EXISTS (
    SELECT 1 FROM public.referral_packages rp
    WHERE rp.id = NEW.package_id AND rp.transport_requested = true
  ) THEN
    NEW.transport_status := 'requested';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shop_referrals_init_transport_status ON public.shop_referrals;
CREATE TRIGGER shop_referrals_init_transport_status
  BEFORE INSERT ON public.shop_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.init_referral_transport_status();

-- -------------------------------------------------------------
-- 3. Package lookup by token: the Phase 1 body (explicit column
--    list; the owner's customer_name / customer_email /
--    customer_phone are still never selected) plus the transport
--    fields: the request on the package, the status thread on
--    the active referral, and the addressed shop's own
--    offers_pickup_delivery attribute (the shop's public,
--    world-readable business attribute) so its token view can
--    render the transport controls honestly.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_referral_package_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
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
          'offers_pickup_delivery', sp.offers_pickup_delivery
        )
        FROM public.shop_referrals sr
        JOIN public.service_providers sp ON sp.id = sr.shop_id
        WHERE sr.package_id = rp.id
          AND sr.status IN ('sent','viewed','accepted','outcome_reported')
        ORDER BY sr.created_at DESC
        LIMIT 1
      ) AS shop
    FROM public.referral_packages rp
    WHERE rp.token = p_token
      AND rp.expires_at > now()
    LIMIT 1
  ) t;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_package_by_token(text) TO anon, authenticated;

-- -------------------------------------------------------------
-- 4. NEW token RPC: the shop manages the transport thread after
--    acceptance (status and/or its stated charge). Guards, in
--    order: the package must request transport; the referral
--    must be the accepted hop; the shop must have told Wrenchli
--    it offers pickup and delivery (service_providers.
--    offers_pickup_delivery) — a referral to a shop without the
--    attribute can never carry a transport status.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_referral_transport(
  p_token text,
  p_status text,
  p_charge_stated numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.referral_packages%ROWTYPE;
  v_active public.shop_referrals%ROWTYPE;
  v_latest_status text;
  v_offers boolean;
BEGIN
  SELECT * INTO v_pkg
  FROM public.referral_packages
  WHERE token = p_token AND expires_at > now()
  LIMIT 1;
  IF v_pkg.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_or_expired_token');
  END IF;

  IF NOT v_pkg.transport_requested THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'transport_not_requested');
  END IF;

  SELECT * INTO v_active
  FROM public.shop_referrals
  WHERE package_id = v_pkg.id
    AND status IN ('sent','viewed','accepted','outcome_reported')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_active.id IS NULL THEN
    SELECT status INTO v_latest_status
    FROM public.shop_referrals
    WHERE package_id = v_pkg.id
    ORDER BY created_at DESC
    LIMIT 1;
    RETURN jsonb_build_object('ok', false, 'reason', 'no_active_referral', 'status', v_latest_status);
  END IF;

  IF v_active.status IN ('sent','viewed') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'referral_not_accepted', 'status', v_active.status);
  END IF;
  IF v_active.status = 'outcome_reported' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'transport_closed', 'status', v_active.status);
  END IF;

  SELECT offers_pickup_delivery INTO v_offers
  FROM public.service_providers
  WHERE id = v_active.shop_id;
  IF NOT COALESCE(v_offers, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'pickup_delivery_not_offered');
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('requested','arranged','picked_up','delivered','unable') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_transport_status');
  END IF;
  IF p_charge_stated IS NOT NULL AND p_charge_stated < 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_charge');
  END IF;
  IF p_status IS NULL AND p_charge_stated IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'nothing_to_update');
  END IF;

  UPDATE public.shop_referrals
  SET transport_status = COALESCE(p_status, transport_status),
      transport_charge_stated = COALESCE(p_charge_stated, transport_charge_stated)
  WHERE id = v_active.id
  RETURNING * INTO v_active;

  RETURN jsonb_build_object(
    'ok', true,
    'transport_status', v_active.transport_status,
    'transport_charge_stated', v_active.transport_charge_stated
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_referral_transport(text, text, numeric) TO anon, authenticated;

-- -------------------------------------------------------------
-- 5. Outcome report: gains the itemized transport cost. The
--    signature changes (new optional parameter), so the Phase 1
--    four-argument version is dropped first; existing callers
--    pass named arguments and keep working. outcome_cost keeps
--    meaning exactly what it meant in Phase 1 — the repair cost
--    only, never blended with transport.
-- -------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_referral_outcome(text, text, text, numeric);

CREATE OR REPLACE FUNCTION public.submit_referral_outcome(
  p_token text,
  p_found text,
  p_did text,
  p_cost numeric,
  p_transport_cost numeric DEFAULT NULL
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

  -- Outcome window (Phase 1, unchanged): the form stays open
  -- until the outcome is recorded or 30 days pass from the
  -- package's created_at.
  IF now() > v_pkg.created_at + interval '30 days' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'outcome_window_closed');
  END IF;

  IF p_found IS NULL OR btrim(p_found) = '' OR p_did IS NULL OR btrim(p_did) = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_outcome_fields');
  END IF;
  IF p_cost IS NOT NULL AND p_cost < 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_cost');
  END IF;
  IF p_transport_cost IS NOT NULL AND p_transport_cost < 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_transport_cost');
  END IF;

  SELECT * INTO v_active
  FROM public.shop_referrals
  WHERE package_id = v_pkg.id AND status = 'accepted'
  ORDER BY created_at DESC
  LIMIT 1;
  IF v_active.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_accepted_referral');
  END IF;

  UPDATE public.shop_referrals
  SET outcome_found = p_found,
      outcome_did = p_did,
      outcome_cost = p_cost,
      outcome_transport_cost = p_transport_cost,
      outcome_reported_at = now(),
      outcome_reported_by = 'shop',
      status = 'outcome_reported'
  WHERE id = v_active.id;

  RETURN jsonb_build_object('ok', true, 'status', 'outcome_reported');
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_referral_outcome(text, text, text, numeric, numeric) TO anon, authenticated;

-- -------------------------------------------------------------
-- 6. NEW owner RPC: add the transport request after the send
--    (the Garage path — immobility is sometimes discovered at
--    drop-off time, after the shop has accepted). Authenticated
--    owner only, in the Phase 1 owner-RPC pattern. Idempotent:
--    a package that already requests transport answers ok.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_referral_transport(
  p_referral_id uuid,
  p_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid := auth.uid();
  r public.shop_referrals%ROWTYPE;
  v_current public.shop_referrals%ROWTYPE;
  v_latest_status text;
BEGIN
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  SELECT * INTO r
  FROM public.shop_referrals
  WHERE id = p_referral_id AND owner_user_id = v_owner;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found_or_not_owner');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.referral_packages
    WHERE id = r.package_id AND transport_requested = true
  ) THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'transport_requested', true);
  END IF;

  -- The chain's current hop: the one the request will ride on.
  SELECT * INTO v_current
  FROM public.shop_referrals
  WHERE chain_id = r.chain_id AND status IN ('sent','viewed','accepted')
  ORDER BY created_at DESC
  LIMIT 1;
  IF v_current.id IS NULL THEN
    SELECT status INTO v_latest_status
    FROM public.shop_referrals
    WHERE chain_id = r.chain_id
    ORDER BY created_at DESC
    LIMIT 1;
    RETURN jsonb_build_object('ok', false, 'reason', 'no_active_referral', 'status', v_latest_status);
  END IF;

  UPDATE public.referral_packages
  SET transport_requested = true,
      transport_note = NULLIF(btrim(COALESCE(p_note, '')), '')
  WHERE id = r.package_id;

  IF v_current.transport_status IS NULL THEN
    UPDATE public.shop_referrals
    SET transport_status = 'requested'
    WHERE id = v_current.id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'transport_requested', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_referral_transport(uuid, text) TO authenticated;

-- -------------------------------------------------------------
-- 7. Stop the chain (Phase 1 section 7b body, unchanged except
--    the Brief 3 addition): stopping the chain also cancels the
--    transport request with it — the package flag is cleared so
--    no surface keeps presenting a live pickup request for a
--    dead chain. The owner's transport_note text is kept as the
--    historical record of what was asked.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stop_referral_chain(p_referral_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid := auth.uid();
  r public.shop_referrals%ROWTYPE;
  v_active public.shop_referrals%ROWTYPE;
  v_latest_status text;
BEGIN
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  SELECT * INTO r
  FROM public.shop_referrals
  WHERE id = p_referral_id AND owner_user_id = v_owner;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found_or_not_owner');
  END IF;

  -- The chain's active hop: the newest 'sent'/'viewed' row in the
  -- same chain (normally the given referral itself, but the owner
  -- may pass any hop of the chain, e.g. an earlier declined one).
  SELECT * INTO v_active
  FROM public.shop_referrals
  WHERE chain_id = r.chain_id AND status IN ('sent','viewed')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_active.id IS NULL THEN
    -- Nothing to stop: the chain already ended (accepted, declined
    -- out, expired out, completed, or already cancelled).
    SELECT status INTO v_latest_status
    FROM public.shop_referrals
    WHERE chain_id = r.chain_id
    ORDER BY created_at DESC
    LIMIT 1;
    RETURN jsonb_build_object('ok', false, 'reason', 'no_active_referral', 'status', v_latest_status);
  END IF;

  UPDATE public.shop_referrals
  SET status = 'cancelled'
  WHERE id = v_active.id;

  -- Brief 3: the transport request is cancelled with the chain.
  UPDATE public.referral_packages
  SET transport_requested = false
  WHERE id = r.package_id AND transport_requested = true;

  RETURN jsonb_build_object('ok', true, 'status', 'cancelled', 'referral_id', v_active.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.stop_referral_chain(uuid) TO authenticated;
