-- =============================================================
-- Referral Lifecycle Phase 1 (2026-11-09)
--
-- Adds the per-shop referral record (public.shop_referrals), the
-- sequential-escalation engine, the end-of-next-business-day
-- acceptance window, token-scoped shop actions, owner confirmation /
-- dispute, and the founder response-time report.
--
-- Locked decisions (build brief 2026-11-09):
--  * Sequential routing only: one shop at a time from the owner's
--    ordered preference list (up to 3); escalation on decline or on
--    window expiry. No simultaneous multi-send.
--  * Acceptance window: end of the NEXT business day (Mon-Fri) after
--    the send, America/Detroit local time.
--  * The shop's outcome report is evidence; the OWNER's confirmation
--    is the counting trigger. 7 days unconfirmed -> founder flag;
--    14 days unconfirmed and undisputed -> counts as
--    'owner-unconfirmed'; the owner may dispute within 30 days of
--    the outcome report and a dispute un-counts a completion.
--  * Privacy: the package token RPC never selects the owner's
--    customer_name / customer_email / customer_phone columns.
--  * Stop the chain (Decision 3, follow-up): the owner can stop a
--    chain at any time via stop_referral_chain(); the active hop
--    becomes 'cancelled' and a cancelled chain NEVER escalates
--    (escalation follows decline or window expiry only).
--  * Hop notification (Decision 3, follow-up): Phase 1 has no push
--    or email surface. The owner-visible record of every hop is the
--    per-hop chain history rendered by OwnerReferralStatus in the
--    Garage (every hop's shop, outcome, and time, read from
--    shop_referrals itself). referral_events is admin-only and is
--    NOT an owner surface, so it is deliberately not used for this.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Table: public.shop_referrals
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.referral_packages(id),
  shop_id uuid NOT NULL REFERENCES public.service_providers(id),
  owner_user_id uuid NOT NULL,
  chain_id uuid NOT NULL,
  shop_chain jsonb NOT NULL,
  preference_order int NOT NULL,
  escalated_from uuid NULL REFERENCES public.shop_referrals(id),
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent','viewed','accepted','declined','expired','outcome_reported','completed','not_completed','cancelled')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  viewed_at timestamptz,
  responded_at timestamptz,
  window_expires_at timestamptz,
  outcome_found text,
  outcome_did text,
  outcome_cost numeric,
  outcome_reported_at timestamptz,
  outcome_reported_by text,
  completion_confirmed_by text NULL
    CHECK (completion_confirmed_by IN ('owner','owner-unconfirmed')),
  completion_confirmed_at timestamptz,
  founder_flagged boolean NOT NULL DEFAULT false,
  disputed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_referrals_package_id_idx
  ON public.shop_referrals (package_id);
CREATE INDEX IF NOT EXISTS shop_referrals_shop_id_idx
  ON public.shop_referrals (shop_id);
CREATE INDEX IF NOT EXISTS shop_referrals_owner_user_id_idx
  ON public.shop_referrals (owner_user_id);
CREATE INDEX IF NOT EXISTS shop_referrals_chain_id_idx
  ON public.shop_referrals (chain_id);
CREATE INDEX IF NOT EXISTS shop_referrals_status_window_idx
  ON public.shop_referrals (status, window_expires_at);
CREATE INDEX IF NOT EXISTS shop_referrals_outcome_reported_idx
  ON public.shop_referrals (outcome_reported_at)
  WHERE outcome_reported_at IS NOT NULL;

ALTER TABLE public.shop_referrals ENABLE ROW LEVEL SECURITY;

-- Owner can read and create their own referrals. There is deliberately
-- NO anon policy (all shop-side access goes through the SECURITY
-- DEFINER token RPCs below) and NO direct UPDATE policy (owner writes
-- go through confirm_referral_completion / dispute_referral_completion
-- / stop_referral_chain).
DROP POLICY IF EXISTS "Owners can read their shop referrals" ON public.shop_referrals;
CREATE POLICY "Owners can read their shop referrals"
  ON public.shop_referrals FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owners can create their shop referrals" ON public.shop_referrals;
CREATE POLICY "Owners can create their shop referrals"
  ON public.shop_referrals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

-- -------------------------------------------------------------
-- 2. Acceptance window: end of the NEXT business day
--    (Mon-Fri) after p_from, America/Detroit local time.
--    Sent Mon -> Tue 23:59:59 ET; Fri/Sat/Sun -> Mon 23:59:59 ET.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.referral_window_expiry(p_from timestamptz)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_local_date date := (p_from AT TIME ZONE 'America/Detroit')::date;
  v_dow int := extract(dow FROM (p_from AT TIME ZONE 'America/Detroit'))::int;
  v_add int;
BEGIN
  -- Days to add to reach the next business day strictly after the
  -- local send date: Fri(5) -> +3 (Mon), Sat(6) -> +2 (Mon),
  -- Sun(0) -> +1 (Mon), Mon-Thu -> +1 (Tue-Fri).
  v_add := CASE v_dow WHEN 5 THEN 3 WHEN 6 THEN 2 ELSE 1 END;
  RETURN (((v_local_date + v_add)::timestamp + time '23:59:59')
          AT TIME ZONE 'America/Detroit');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_referral_window_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.window_expires_at IS NULL THEN
    NEW.window_expires_at := public.referral_window_expiry(NEW.sent_at);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shop_referrals_set_window_expiry ON public.shop_referrals;
CREATE TRIGGER shop_referrals_set_window_expiry
  BEFORE INSERT ON public.shop_referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_referral_window_expiry();

CREATE OR REPLACE FUNCTION public.touch_shop_referral_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shop_referrals_touch_updated_at ON public.shop_referrals;
CREATE TRIGGER shop_referrals_touch_updated_at
  BEFORE UPDATE ON public.shop_referrals
  FOR EACH ROW EXECUTE FUNCTION public.touch_shop_referral_updated_at();

-- -------------------------------------------------------------
-- 3. Escalation: create the next hop in the owner's chain.
--    Idempotent per source row (an existing escalated_from child
--    is returned instead of inserting a duplicate).
--
--    INVARIANT (Decision 3): escalation follows DECLINE or window
--    EXPIRY only. A hop the owner cancelled (status 'cancelled')
--    must never escalate: this function refuses a cancelled source
--    row, process_referral_escalations only expires 'sent'/'viewed'
--    rows, and respond_to_referral only acts on 'sent'/'viewed'
--    rows, so a cancelled hop surfaces there as no_active_referral.
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

  -- A cancelled chain never escalates (see the invariant above).
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
      preference_order, escalated_from, status
    ) VALUES (
      r.package_id, v_next_shop, r.owner_user_id, r.chain_id, r.shop_chain,
      r.preference_order + 1, r.id, 'sent'
    )
    RETURNING id INTO v_new_id;
    RETURN v_new_id;
  END IF;

  RETURN NULL;
END;
$$;

-- Internal helper: not callable directly by API roles. The SECURITY
-- DEFINER RPCs below call it with the function owner's privileges.
REVOKE ALL ON FUNCTION public.escalate_shop_referral(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.escalate_shop_referral(uuid) TO authenticated;

-- -------------------------------------------------------------
-- 4. Escalation / fallback processor. Idempotent; safe to call
--    on every package-page or Garage access, and on a schedule.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_referral_escalations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  -- (a) Acceptance window expired with no response: expire + escalate.
  -- Only 'sent'/'viewed' rows can expire, so a hop the owner cancelled
  -- ('cancelled') is never expired or escalated by this processor.
  FOR r IN
    SELECT id FROM public.shop_referrals
    WHERE status IN ('sent','viewed')
      AND window_expires_at IS NOT NULL
      AND window_expires_at < now()
    ORDER BY created_at
  LOOP
    UPDATE public.shop_referrals
    SET status = 'expired'
    WHERE id = r.id AND status IN ('sent','viewed');
    IF FOUND THEN
      PERFORM public.escalate_shop_referral(r.id);
    END IF;
  END LOOP;

  -- (b1) Outcome reported 7+ days ago, still unconfirmed and
  -- undisputed: flag for a founder confirmation attempt.
  UPDATE public.shop_referrals
  SET founder_flagged = true
  WHERE status = 'outcome_reported'
    AND outcome_reported_at IS NOT NULL
    AND outcome_reported_at <= now() - interval '7 days'
    AND founder_flagged = false
    AND completion_confirmed_at IS NULL
    AND disputed_at IS NULL;

  -- (b2) Outcome reported 14+ days ago and never disputed: the
  -- completion counts on the shop's report alone.
  UPDATE public.shop_referrals
  SET status = 'completed',
      completion_confirmed_by = 'owner-unconfirmed',
      completion_confirmed_at = now()
  WHERE status = 'outcome_reported'
    AND outcome_reported_at IS NOT NULL
    AND outcome_reported_at <= now() - interval '14 days'
    AND disputed_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_referral_escalations() TO anon, authenticated;

-- Schedule the processor every 15 minutes when pg_cron is available.
-- Absent pg_cron (or any cron error) is skipped silently: the on-access
-- calls from the package page and the Garage keep the engine correct.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'referral-escalations-15min';
    PERFORM cron.schedule(
      'referral-escalations-15min',
      '*/15 * * * *',
      'SELECT public.process_referral_escalations();'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- -------------------------------------------------------------
-- 5. Package lookup by token. Replaces the 2026-04-10 version,
--    which returned to_jsonb(rp.*) including the owner's
--    customer_name / customer_email / customer_phone. The returned
--    jsonb is now built from an explicit column list that EXCLUDES
--    those three columns (they are never selected).
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
            sr.outcome_reported_at, sr.outcome_reported_by,
            sr.completion_confirmed_by, sr.completion_confirmed_at,
            sr.founder_flagged, sr.disputed_at
          FROM public.shop_referrals sr
          WHERE sr.package_id = rp.id
            AND sr.status IN ('sent','viewed','accepted','outcome_reported')
          ORDER BY sr.created_at DESC
          LIMIT 1
        ) ar
      ) AS active_referral,
      (
        SELECT jsonb_build_object('id', sp.id, 'name', sp.name)
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

-- -------------------------------------------------------------
-- 6. Token-scoped shop actions
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_referral_viewed(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package_id uuid;
BEGIN
  SELECT id INTO v_package_id
  FROM public.referral_packages
  WHERE token = p_token AND expires_at > now()
  LIMIT 1;
  IF v_package_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.shop_referrals
  SET status = 'viewed', viewed_at = now()
  WHERE id = (
    SELECT id FROM public.shop_referrals
    WHERE package_id = v_package_id AND status = 'sent'
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_referral_viewed(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.respond_to_referral(p_token text, p_accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package_id uuid;
  v_active public.shop_referrals%ROWTYPE;
  v_current_status text;
  v_next uuid;
BEGIN
  SELECT id INTO v_package_id
  FROM public.referral_packages
  WHERE token = p_token AND expires_at > now()
  LIMIT 1;
  IF v_package_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_or_expired_token', 'status', NULL);
  END IF;

  SELECT * INTO v_active
  FROM public.shop_referrals
  WHERE package_id = v_package_id AND status IN ('sent','viewed')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_active.id IS NULL THEN
    -- No 'sent'/'viewed' hop exists. This is also the answer for a
    -- hop the owner cancelled: a cancelled referral is not active,
    -- so the shop gets no_active_referral with status 'cancelled'.
    SELECT status INTO v_current_status
    FROM public.shop_referrals
    WHERE package_id = v_package_id
    ORDER BY created_at DESC
    LIMIT 1;
    RETURN jsonb_build_object('ok', false, 'reason', 'no_active_referral', 'status', v_current_status);
  END IF;

  IF p_accept THEN
    UPDATE public.shop_referrals
    SET status = 'accepted', responded_at = now()
    WHERE id = v_active.id;
    RETURN jsonb_build_object('ok', true, 'status', 'accepted');
  ELSE
    UPDATE public.shop_referrals
    SET status = 'declined', responded_at = now()
    WHERE id = v_active.id;
    v_next := public.escalate_shop_referral(v_active.id);
    RETURN jsonb_build_object('ok', true, 'status', 'declined', 'escalated', v_next IS NOT NULL);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_to_referral(text, boolean) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_referral_outcome(
  p_token text,
  p_found text,
  p_did text,
  p_cost numeric
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

  -- Outcome window (build-brief decision 9): the form stays open
  -- until the outcome is recorded or 30 days pass. The 30 days are
  -- measured from the package's created_at, which is the send-chain
  -- start for the pilot flow (the package row is created in the same
  -- action as the first shop_referrals hop).
  IF now() > v_pkg.created_at + interval '30 days' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'outcome_window_closed');
  END IF;

  IF p_found IS NULL OR btrim(p_found) = '' OR p_did IS NULL OR btrim(p_did) = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_outcome_fields');
  END IF;
  IF p_cost IS NOT NULL AND p_cost < 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_cost');
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
      outcome_reported_at = now(),
      outcome_reported_by = 'shop',
      status = 'outcome_reported'
  WHERE id = v_active.id;

  RETURN jsonb_build_object('ok', true, 'status', 'outcome_reported');
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_referral_outcome(text, text, text, numeric) TO anon, authenticated;

-- -------------------------------------------------------------
-- 7. Owner confirmation / dispute (authenticated, owner only).
--    Confirmation is the counting trigger for a completion.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_referral_completion(p_referral_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid := auth.uid();
  r public.shop_referrals%ROWTYPE;
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

  IF r.status = 'completed' THEN
    -- Already counted (owner-confirmed earlier, or the 14-day
    -- owner-unconfirmed fallback fired). Idempotent no-op.
    RETURN jsonb_build_object('ok', true, 'already', true, 'status', 'completed');
  END IF;

  IF r.status <> 'outcome_reported' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_status', 'status', r.status);
  END IF;

  UPDATE public.shop_referrals
  SET status = 'completed',
      completion_confirmed_by = 'owner',
      completion_confirmed_at = now()
  WHERE id = r.id;

  RETURN jsonb_build_object('ok', true, 'status', 'completed');
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_referral_completion(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.dispute_referral_completion(p_referral_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid := auth.uid();
  r public.shop_referrals%ROWTYPE;
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

  IF r.outcome_reported_at IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_outcome_report');
  END IF;
  IF now() > r.outcome_reported_at + interval '30 days' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'dispute_window_closed');
  END IF;

  -- A dispute un-counts a completion: a 'completed' row returns to
  -- 'outcome_reported' with the completion fields cleared. Setting
  -- disputed_at also blocks the 14-day owner-unconfirmed fallback.
  UPDATE public.shop_referrals
  SET status = CASE WHEN status = 'completed' THEN 'outcome_reported' ELSE status END,
      completion_confirmed_by = CASE WHEN status = 'completed' THEN NULL ELSE completion_confirmed_by END,
      completion_confirmed_at = CASE WHEN status = 'completed' THEN NULL ELSE completion_confirmed_at END,
      disputed_at = now()
  WHERE id = r.id;

  RETURN jsonb_build_object('ok', true, 'status', 'outcome_reported', 'disputed', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.dispute_referral_completion(uuid) TO authenticated;

-- -------------------------------------------------------------
-- 7b. Stop the chain (Decision 3: "the owner ... can stop the
--     chain at any time"). Authenticated owner only. Acts on the
--     CHAIN of the given referral: whichever hop of that chain is
--     currently active ('sent' or 'viewed') is cancelled in place
--     (responded_at stays null — the shop never responded). Once
--     cancelled, the chain can never escalate (see the invariant
--     on escalate_shop_referral in section 3).
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

  RETURN jsonb_build_object('ok', true, 'status', 'cancelled', 'referral_id', v_active.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.stop_referral_chain(uuid) TO authenticated;

-- -------------------------------------------------------------
-- 8. Founder response-time report (build-brief decision 5).
--    Restricted with the repo's existing admin gate,
--    has_role(auth.uid(), 'admin') (see the referral_packages
--    admin policies in the 2026-04-10 migration).
--    Shares are fractions of sends: *_within_window_share counts
--    rows responded at or before window_expires_at; the median is
--    over responded rows only, in minutes.
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
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin access required' USING errcode = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(s) ORDER BY s.shop_name), '[]'::jsonb)
  INTO v_shops
  FROM (
    SELECT
      sr.shop_id AS shop_id,
      sp.name AS shop_name,
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
    JOIN public.service_providers sp ON sp.id = sr.shop_id
    GROUP BY sr.shop_id, sp.name
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

  RETURN jsonb_build_object('shops', v_shops, 'overall', v_overall);
END;
$$;

REVOKE ALL ON FUNCTION public.referral_response_report() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.referral_response_report() TO authenticated;
