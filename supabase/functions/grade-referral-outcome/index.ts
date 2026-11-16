// supabase/functions/grade-referral-outcome/index.ts
// ============================================================
// WRENCHLI — Edge Function: Grade Referral Outcome (Brief 4)
//
// Grades a shop's reported referral outcome (shop_referrals.
// outcome_found) against the session's predicted causes, using
// the single-source MATCH rubric in _shared/accuracy-match.ts,
// and writes the grade to diagnostic_accuracy with
// source = 'shop_referral'. Shop grades are never pooled with
// consumer self-report grades.
//
// Invocation:
//  - At the Phase 1 owner-confirmation counting moment: the
//    owner UI calls this with { referral_id } right after
//    confirm_referral_completion succeeds (and on Garage load
//    for already-counted referrals, which covers completions
//    counted by the 14-day owner-unconfirmed fallback inside
//    process_referral_escalations). Caller must be the
//    referral's owner (JWT) or an internal caller.
//  - Backfill sweep: { sweep: true } with the INTERNAL_SECRET
//    header grades every counted repair referral that lacks a
//    grade, so a missed invocation is recoverable. Idempotent:
//    one grade per (session, source), and one grade per
//    referral for snapshot-linked packages (the referral id is
//    stamped into the grade's explanation marker).
//
// All counting/grading decisions live in
// _shared/shop-referral-accuracy.ts; this file is the I/O
// adapter (auth, row loading, insert).
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { scoreDiagnosisMatch } from "../_shared/accuracy-match.ts";
import {
  gradeReferralOutcome,
  type PackageRow,
  type ReferralRow,
  type SessionPrediction,
} from "../_shared/shop-referral-accuracy.ts";

const REFERRAL_SELECT =
  "id, package_id, status, referral_kind, outcome_found, completion_confirmed_by, disputed_at";
const PACKAGE_SELECT =
  "id, session_id, diagnosis_title, diagnosis_urgency, diagnosis_details, vehicle_year, vehicle_make, vehicle_model";
const SWEEP_LIMIT = 200;

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

async function findExistingGrade(
  supabase: SupabaseClient,
  referral: ReferralRow,
  pkg: PackageRow,
): Promise<boolean> {
  if (pkg.session_id) {
    const { data } = await supabase
      .from("diagnostic_accuracy")
      .select("id")
      .eq("session_id", pkg.session_id)
      .eq("source", "shop_referral")
      .limit(1);
    return (data?.length ?? 0) > 0;
  }
  // Snapshot-linked grades carry the referral id in the marker.
  const { data } = await supabase
    .from("diagnostic_accuracy")
    .select("id")
    .eq("source", "shop_referral")
    .ilike("match_explanation", `%referral=${referral.id}%`)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function loadSessionPrediction(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<SessionPrediction | null> {
  const { data, error } = await supabase
    .from("diagnostic_sessions")
    // Same one-line select as report-diagnostic-outcome: a
    // multiline string silently resolves the embeds to null.
    .select("id, diagnoses(confidence, urgency, explanation), possible_causes:diagnoses(possible_causes(name, probability, sort_order))")
    .eq("id", sessionId)
    .single();
  if (error || !data) return null;

  const causesEmbed = Array.isArray(data.possible_causes)
    ? data.possible_causes[0]
    : data.possible_causes;
  const allCauses = [...(causesEmbed?.possible_causes ?? [])].sort(
    // deno-lint-ignore no-explicit-any
    (a: any, b: any) => a.sort_order - b.sort_order,
  );
  const diagnosis = Array.isArray(data.diagnoses) ? data.diagnoses[0] : data.diagnoses;
  return {
    // deno-lint-ignore no-explicit-any
    causes: allCauses.map((c: any) => c.name),
    confidence: diagnosis?.confidence ?? null,
    urgency: diagnosis?.urgency ?? null,
    explanation: diagnosis?.explanation ?? null,
  };
}

async function gradeOne(
  supabase: SupabaseClient,
  referral: ReferralRow,
): Promise<{ status: string; determinable?: boolean; linkage?: string }> {
  const { data: pkg, error: pkgError } = await supabase
    .from("referral_packages")
    .select(PACKAGE_SELECT)
    .eq("id", referral.package_id)
    .single();
  if (pkgError || !pkg) return { status: "package_not_found" };

  if (await findExistingGrade(supabase, referral, pkg as PackageRow)) {
    return { status: "already_graded" };
  }

  const sessionPrediction = pkg.session_id
    ? await loadSessionPrediction(supabase, pkg.session_id)
    : null;

  const result = await gradeReferralOutcome(
    { referral, pkg: pkg as PackageRow, sessionPrediction },
    { scoreMatch: (input) => scoreDiagnosisMatch(input) },
  );

  if (result.kind === "not_counted") {
    return { status: `not_counted:${result.reason}` };
  }

  const { error: insertError } = await supabase
    .from("diagnostic_accuracy")
    .insert(result.insert);
  if (insertError) {
    // A concurrent grade won the (session_id, source) unique
    // constraint: that is the idempotency guard doing its job.
    if ((insertError as { code?: string }).code === "23505") {
      return { status: "already_graded" };
    }
    throw insertError;
  }

  return {
    status: "graded",
    determinable: result.determinable,
    linkage: result.linkage,
  };
}

serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = (await req.json().catch(() => ({}))) as {
      referral_id?: string;
      sweep?: boolean;
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const internalSecret = Deno.env.get("INTERNAL_SECRET");
    const isInternal =
      !!internalSecret && req.headers.get("x-internal-secret") === internalSecret;

    // ── Backfill sweep (internal only) ─────────────────────
    if (body.sweep === true) {
      if (!isInternal) return json({ error: "Unauthorized" }, 401);

      const { data: referrals, error } = await supabase
        .from("shop_referrals")
        .select(REFERRAL_SELECT)
        .eq("status", "completed")
        .not("completion_confirmed_by", "is", null)
        .is("disputed_at", null)
        .eq("referral_kind", "repair")
        .order("completion_confirmed_at", { ascending: true })
        .limit(SWEEP_LIMIT);
      if (error) throw error;

      const summary = {
        examined: referrals?.length ?? 0,
        graded: 0,
        already_graded: 0,
        could_not_determine: 0,
        not_counted: 0,
        errors: 0,
      };
      for (const referral of (referrals ?? []) as ReferralRow[]) {
        try {
          const r = await gradeOne(supabase, referral);
          if (r.status === "graded") {
            summary.graded += 1;
            if (r.determinable === false) summary.could_not_determine += 1;
          } else if (r.status === "already_graded") summary.already_graded += 1;
          else summary.not_counted += 1;
        } catch (e) {
          console.error("grade-referral-outcome sweep item failed:", e);
          summary.errors += 1;
        }
      }
      return json({ success: true, sweep: summary });
    }

    // ── Single grade ───────────────────────────────────────
    if (!body.referral_id) {
      return json({ error: "Missing referral_id" }, 400);
    }

    const { data: referral, error: refError } = await supabase
      .from("shop_referrals")
      .select(`${REFERRAL_SELECT}, owner_user_id`)
      .eq("id", body.referral_id)
      .single();
    if (refError || !referral) {
      return json({ ok: false, reason: "referral_not_found" }, 404);
    }

    if (!isInternal) {
      // The caller must be the referral's owner (same getUser
      // pattern as create-checkout / check-subscription).
      const authClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      );
      const token = (req.headers.get("Authorization") ?? "").replace(
        "Bearer ",
        "",
      );
      const { data: userData } = await authClient.auth.getUser(token);
      if (!userData?.user || userData.user.id !== referral.owner_user_id) {
        return json({ error: "Unauthorized" }, 401);
      }
    }

    const result = await gradeOne(supabase, referral as ReferralRow);
    return json({ ok: true, referral_id: body.referral_id, ...result });
  } catch (error) {
    console.error("grade-referral-outcome error:", error);
    return json(
      { error: (error as Error).message ?? "Unexpected error" },
      500,
    );
  }
});
