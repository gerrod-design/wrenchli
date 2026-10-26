import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

// Proactive Events Phase 1 — the event checker.
//
// Evaluates events E1-E9 (spec: wrenchli-proactive-event-list-spec-2026-10-26.md)
// against records Wrenchli already holds and inserts rows into
// proactive_messages. It sends nothing and delivers nothing: delivery
// happens in the app, where the global rules (caps, quiet hours, priority,
// opt-out, cancellation-on-action) are applied at delivery time by
// src/lib/proactive/delivery.ts. The predicates below mirror the tested
// reference implementation in src/lib/proactive/events.ts.
//
// Internal-only, like check-maintenance (R-54): the legitimate callers are
// the fleet cron rhythm via the internal secret, or the service-role
// bearer. Inserts are idempotent via the unique index on
// (user_id, event_type, source_key) plus the existing-keys check.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

type Candidate = {
  userId: string;
  eventType: string;
  category: string;
  sourceTable: string;
  sourceId: string;
  sourceKey: string;
  vehicleId: string | null;
  payload: Record<string, unknown>;
  eligibleAt: string;
  initialState?: string;
};

function vehicleName(v: { year?: number | null; make?: string | null; model?: string | null }): string {
  return [v.year, v.make, v.model].filter(Boolean).join(" ").trim();
}

function seasonForDate(now: Date): { season: "fall" | "spring"; year: number } | null {
  const y = now.getUTCFullYear();
  const t = now.getTime();
  if (t >= Date.UTC(y, 8, 15) && t <= Date.UTC(y, 10, 30, 23, 59, 59)) return { season: "fall", year: y };
  if (t >= Date.UTC(y, 3, 15) && t <= Date.UTC(y, 5, 15, 23, 59, 59)) return { season: "spring", year: y };
  return null;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.ADMIN);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      { status: 429, headers: { ...securityHeaders, ...getRateLimitHeaders(RATE_LIMITS.ADMIN.maxRequests, rateResult.remaining, rateResult.resetTime), "Content-Type": "application/json" } },
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const internalSecret = Deno.env.get("INTERNAL_SECRET");
    const callerSecret = req.headers.get("x-internal-secret");
    const authHeader = req.headers.get("Authorization");
    const isInternal = Boolean(
      (internalSecret && callerSecret === internalSecret) ||
      (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`),
    );
    if (!isInternal) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const queued: Record<string, number> = {};
    let failures = 0;
    const candidates: Candidate[] = [];

    const existingKeysFor = async (userIds: string[], eventTypes: string[]): Promise<Map<string, Set<string>>> => {
      const byUser = new Map<string, Set<string>>();
      if (userIds.length === 0) return byUser;
      const { data } = await supabase
        .from("proactive_messages")
        .select("user_id, event_type, source_key")
        .in("user_id", userIds)
        .in("event_type", eventTypes);
      for (const r of (data ?? []) as { user_id: string; event_type: string; source_key: string }[]) {
        if (!byUser.has(r.user_id)) byUser.set(r.user_id, new Set());
        byUser.get(r.user_id)!.add(`${r.event_type}:${r.source_key}`);
      }
      return byUser;
    };

    // ---------------------------------------------------------------------
    // E1 / E6 / E4 — diagnostic_sessions and their diagnoses
    // ---------------------------------------------------------------------
    try {
      const { data: sessions } = await supabase
        .from("diagnostic_sessions")
        .select("id, user_id, vehicle_id, status, created_at, updated_at")
        .not("user_id", "is", null)
        .in("status", ["complete", "intake", "diagnosing", "abandoned"])
        .gte("updated_at", new Date(now.getTime() - 90 * DAY).toISOString())
        .limit(500);
      const sessionRows = (sessions ?? []) as {
        id: string; user_id: string; vehicle_id: string | null;
        status: string; created_at: string; updated_at: string;
      }[];

      if (sessionRows.length > 0) {
        const sessionIds = sessionRows.map((s) => s.id);
        const userIds = [...new Set(sessionRows.map((s) => s.user_id))];
        const existing = await existingKeysFor(userIds, ["E1", "E4", "E6"]);

        const [{ data: diagnoses }, { data: handoffs }, { data: outcomes }, { data: repairs }, { data: plans }, { data: symptoms }] =
          await Promise.all([
            supabase.from("diagnoses").select("id, session_id, urgency, created_at").in("session_id", sessionIds),
            supabase.from("assessment_handoffs").select("source_assessment_id").in("source_assessment_id", sessionIds),
            supabase.from("outcome_reports").select("session_id").in("session_id", sessionIds),
            supabase.from("repair_history").select("session_id").in("session_id", sessionIds),
            supabase.from("journey_plans").select("assessment_id").in("assessment_id", sessionIds),
            supabase.from("symptom_reports").select("session_id").in("session_id", sessionIds),
          ]);
        const diagBySession = new Map<string, { id: string; urgency: string | null; created_at: string }>();
        for (const d of (diagnoses ?? []) as { id: string; session_id: string; urgency: string | null; created_at: string }[]) {
          diagBySession.set(d.session_id, d);
        }
        const diagnosisIds = [...diagBySession.values()].map((d) => d.id);
        const topCauseByDiagnosis = new Map<string, { name: string; costLow: number | null; costHigh: number | null }>();
        if (diagnosisIds.length > 0) {
          const { data: causes } = await supabase
            .from("possible_causes")
            .select("diagnosis_id, name, estimated_cost_low, estimated_cost_high, probability, sort_order")
            .in("diagnosis_id", diagnosisIds)
            .order("probability", { ascending: false, nullsFirst: false })
            .order("sort_order", { ascending: true });
          for (const c of (causes ?? []) as { diagnosis_id: string; name: string; estimated_cost_low: number | null; estimated_cost_high: number | null }[]) {
            if (!topCauseByDiagnosis.has(c.diagnosis_id)) {
              topCauseByDiagnosis.set(c.diagnosis_id, { name: c.name, costLow: c.estimated_cost_low, costHigh: c.estimated_cost_high });
            }
          }
        }
        const actedSessions = new Set<string>();
        for (const h of (handoffs ?? []) as { source_assessment_id: string }[]) actedSessions.add(h.source_assessment_id);
        for (const o of (outcomes ?? []) as { session_id: string }[]) actedSessions.add(o.session_id);
        for (const r of (repairs ?? []) as { session_id: string }[]) actedSessions.add(r.session_id);
        for (const p of (plans ?? []) as { assessment_id: string }[]) actedSessions.add(p.assessment_id);
        const contentSessions = new Set((symptoms ?? []).map((s: { session_id: string }) => s.session_id));

        const vehicleIds = [...new Set(sessionRows.map((s) => s.vehicle_id).filter(Boolean))] as string[];
        const vehicleNames = new Map<string, string>();
        if (vehicleIds.length > 0) {
          const { data: vs } = await supabase.from("vehicles").select("id, year, make, model").in("id", vehicleIds);
          for (const v of (vs ?? []) as { id: string; year: number; make: string; model: string }[]) {
            vehicleNames.set(v.id, vehicleName(v));
          }
        }

        for (const s of sessionRows) {
          const keys = existing.get(s.user_id) ?? new Set<string>();
          const diag = diagBySession.get(s.id);
          const cause = diag ? topCauseByDiagnosis.get(diag.id) : undefined;
          const name = s.vehicle_id ? vehicleNames.get(s.vehicle_id) ?? null : null;
          const actedOn = actedSessions.has(s.id);

          // E1 (mirrors evaluateE1)
          if (s.status === "complete" && diag && cause && name && !actedOn) {
            const completedAt = diag.created_at;
            const age = now.getTime() - new Date(completedAt).getTime();
            const safety = diag.urgency === "immediate";
            const payload = { vehicleName: name, completedAt, likelyCause: cause.name, safety };
            const base = {
              userId: s.user_id, eventType: "E1", category: "assessment_followups",
              sourceTable: "diagnostic_sessions", sourceId: s.id, vehicleId: null, payload,
            };
            if (safety) {
              const firstKey = `session:${s.id}:safety`;
              if (!keys.has(`E1:${firstKey}`) && age >= 24 * HOUR) {
                candidates.push({ ...base, sourceKey: firstKey, eligibleAt: new Date(new Date(completedAt).getTime() + 24 * HOUR).toISOString() });
              } else if (keys.has(`E1:${firstKey}`) && !keys.has(`E1:${firstKey}:refire`) && age >= 72 * HOUR) {
                candidates.push({ ...base, sourceKey: `${firstKey}:refire`, eligibleAt: new Date(new Date(completedAt).getTime() + 72 * HOUR).toISOString() });
              }
            } else if (!keys.has(`E1:session:${s.id}`) && age >= 48 * HOUR) {
              candidates.push({ ...base, sourceKey: `session:${s.id}`, eligibleAt: new Date(new Date(completedAt).getTime() + 48 * HOUR).toISOString() });
            }

            // E4 (mirrors evaluateE4): the estimate is the top cause's range,
            // viewed when the completed assessment was presented.
            if (cause.costLow != null && cause.costHigh != null && age >= 7 * DAY) {
              const sourceKey = `diagnosis:${diag.id}`;
              if (!keys.has(`E4:${sourceKey}`)) {
                candidates.push({
                  userId: s.user_id, eventType: "E4", category: "assessment_followups",
                  sourceTable: "diagnoses", sourceId: diag.id, sourceKey, vehicleId: null,
                  payload: { vehicleName: name, item: cause.name, costLow: cause.costLow, costHigh: cause.costHigh },
                  eligibleAt: new Date(new Date(completedAt).getTime() + 7 * DAY).toISOString(),
                });
              }
            }
          }

          // E6 (mirrors evaluateE6)
          if (s.status !== "complete" && !actedOn) {
            const hasContent = contentSessions.has(s.id) || s.status === "abandoned";
            if (hasContent && now.getTime() - new Date(s.updated_at).getTime() >= 24 * HOUR) {
              const sourceKey = `session:${s.id}`;
              if (!keys.has(`E6:${sourceKey}`)) {
                candidates.push({
                  userId: s.user_id, eventType: "E6", category: "assessment_followups",
                  sourceTable: "diagnostic_sessions", sourceId: s.id, sourceKey, vehicleId: null,
                  payload: { vehicleName: name },
                  eligibleAt: new Date(new Date(s.updated_at).getTime() + 24 * HOUR).toISOString(),
                });
              }
            }
          }
        }
      }
    } catch (err) {
      failures++;
      console.error("check-proactive-events: E1/E4/E6 section failed:", err);
    }

    // ---------------------------------------------------------------------
    // Garage vehicles (shared by E2/E3/E5/E7/E8/E9)
    // ---------------------------------------------------------------------
    const { data: garageVehicles } = await supabase
      .from("user_vehicles")
      .select("id, user_id, year, make, model, is_primary, created_at")
      .eq("is_active", true);
    const gvRows = (garageVehicles ?? []) as {
      id: string; user_id: string; year: number; make: string; model: string;
      is_primary: boolean; created_at: string;
    }[];
    const gvById = new Map(gvRows.map((v) => [v.id, v]));
    const gvName = (id: string) => {
      const v = gvById.get(id);
      return v ? vehicleName(v) : null;
    };

    // ---------------------------------------------------------------------
    // E2 / E7 — repair records (maintenance_records + repair_history)
    // ---------------------------------------------------------------------
    try {
      const userIds = [...new Set(gvRows.map((v) => v.user_id))];
      const existing = await existingKeysFor(userIds, ["E2", "E7"]);

      const since14d = new Date(now.getTime() - 14 * DAY).toISOString();
      const [{ data: recentMaint }, { data: recentRepairs }] = await Promise.all([
        supabase.from("maintenance_records")
          .select("id, vehicle_id, cost, created_at, service_date, service_type, description")
          .gte("created_at", since14d),
        supabase.from("repair_history")
          .select("id, vehicle_id, session_id, cost_actual, created_at, repair_date, description")
          .gte("created_at", since14d),
      ]);

      for (const r of (recentMaint ?? []) as { id: string; vehicle_id: string; cost: number | null; created_at: string }[]) {
        const v = gvById.get(r.vehicle_id);
        if (!v) continue;
        const keys = existing.get(v.user_id) ?? new Set<string>();
        const sourceKey = `veh:${r.vehicle_id}:repair:${r.created_at.slice(0, 13)}`;
        if (keys.has(`E2:${sourceKey}`)) continue;
        if (now.getTime() - new Date(r.created_at).getTime() > 14 * DAY) continue;
        candidates.push({
          userId: v.user_id, eventType: "E2", category: "repair_updates",
          sourceTable: "maintenance_records", sourceId: r.id, sourceKey, vehicleId: r.vehicle_id,
          payload: { vehicleName: vehicleName(v), kind: "repair_completed", hasFinalCost: r.cost != null },
          eligibleAt: r.created_at,
        });
      }
      for (const r of (recentRepairs ?? []) as { id: string; vehicle_id: string | null; session_id: string | null; cost_actual: number | null; created_at: string }[]) {
        let userId: string | null = null;
        let name: string | null = null;
        let vehicleId: string | null = r.vehicle_id;
        if (r.vehicle_id && gvById.has(r.vehicle_id)) {
          userId = gvById.get(r.vehicle_id)!.user_id;
          name = gvName(r.vehicle_id);
        } else if (r.session_id) {
          const { data: sess } = await supabase.from("diagnostic_sessions").select("user_id").eq("id", r.session_id).maybeSingle();
          userId = (sess as { user_id: string | null } | null)?.user_id ?? null;
        }
        if (!userId || !name) continue; // cannot attribute or name it honestly
        const keys = existing.get(userId) ?? new Set<string>();
        const sourceKey = `veh:${vehicleId ?? "none"}:repair:${r.created_at.slice(0, 13)}`;
        if (keys.has(`E2:${sourceKey}`)) continue;
        candidates.push({
          userId, eventType: "E2", category: "repair_updates",
          sourceTable: "repair_history", sourceId: r.id, sourceKey, vehicleId,
          payload: { vehicleName: name, kind: "repair_completed", hasFinalCost: r.cost_actual != null },
          eligibleAt: r.created_at,
        });
      }

      // E2 package_created — a handoff package was created from an assessment.
      const { data: handoffs } = await supabase
        .from("assessment_handoffs")
        .select("id, owner_user_id, user_vehicle_id, created_at")
        .not("owner_user_id", "is", null)
        .gte("created_at", since14d);
      for (const h of (handoffs ?? []) as { id: string; owner_user_id: string; user_vehicle_id: string | null; created_at: string }[]) {
        if (!h.user_vehicle_id) continue; // unnamed packages are skipped, see report
        const name = gvName(h.user_vehicle_id);
        if (!name) continue;
        const keys = existing.get(h.owner_user_id) ?? new Set<string>();
        const sourceKey = `handoff:${h.id}`;
        if (keys.has(`E2:${sourceKey}`)) continue;
        candidates.push({
          userId: h.owner_user_id, eventType: "E2", category: "repair_updates",
          sourceTable: "assessment_handoffs", sourceId: h.id, sourceKey, vehicleId: h.user_vehicle_id,
          payload: { vehicleName: name, kind: "package_created", hasFinalCost: false },
          eligibleAt: h.created_at,
        });
      }

      // E7 (mirrors evaluateE7)
      const windowStart = new Date(now.getTime() - 60 * DAY).toISOString().slice(0, 10);
      const windowEnd = new Date(now.getTime() - 10 * DAY).toISOString().slice(0, 10);
      const [{ data: doneMaint }, { data: doneRepairs }] = await Promise.all([
        supabase.from("maintenance_records")
          .select("id, vehicle_id, service_date, service_type, description")
          .gte("service_date", windowStart).lte("service_date", windowEnd),
        supabase.from("repair_history")
          .select("id, vehicle_id, session_id, repair_date, description")
          .gte("repair_date", windowStart).lte("repair_date", windowEnd),
      ]);
      for (const r of (doneMaint ?? []) as { id: string; vehicle_id: string; service_date: string; service_type: string; description: string | null }[]) {
        const v = gvById.get(r.vehicle_id);
        if (!v) continue;
        const keys = existing.get(v.user_id) ?? new Set<string>();
        const sourceKey = `repair:maintenance_records:${r.id}`;
        if (keys.has(`E7:${sourceKey}`)) continue;
        candidates.push({
          userId: v.user_id, eventType: "E7", category: "post_repair_checkins",
          sourceTable: "maintenance_records", sourceId: r.id, sourceKey, vehicleId: r.vehicle_id,
          payload: { vehicleName: vehicleName(v), repairLabel: r.description || r.service_type },
          eligibleAt: new Date(new Date(`${r.service_date}T12:00:00Z`).getTime() + 10 * DAY).toISOString(),
        });
      }
      for (const r of (doneRepairs ?? []) as { id: string; vehicle_id: string | null; session_id: string | null; repair_date: string; description: string | null }[]) {
        if (!r.vehicle_id || !gvById.has(r.vehicle_id)) continue;
        const v = gvById.get(r.vehicle_id)!;
        let outcomeAlreadyReported = false;
        if (r.session_id) {
          const { data: oc } = await supabase.from("outcome_reports").select("id").eq("session_id", r.session_id).limit(1);
          outcomeAlreadyReported = (oc ?? []).length > 0;
        }
        if (outcomeAlreadyReported) continue;
        const keys = existing.get(v.user_id) ?? new Set<string>();
        const sourceKey = `repair:repair_history:${r.id}`;
        if (keys.has(`E7:${sourceKey}`)) continue;
        candidates.push({
          userId: v.user_id, eventType: "E7", category: "post_repair_checkins",
          sourceTable: "repair_history", sourceId: r.id, sourceKey, vehicleId: r.vehicle_id,
          payload: { vehicleName: vehicleName(v), repairLabel: r.description || "repair" },
          eligibleAt: new Date(new Date(`${r.repair_date}T12:00:00Z`).getTime() + 10 * DAY).toISOString(),
        });
      }
    } catch (err) {
      failures++;
      console.error("check-proactive-events: E2/E7 section failed:", err);
    }

    // ---------------------------------------------------------------------
    // E3 — new recall campaigns (recall_alerts, last 30 days)
    // ---------------------------------------------------------------------
    try {
      const { data: alerts } = await supabase
        .from("recall_alerts")
        .select("id, vehicle_id, campaign_number, component, summary, created_at")
        .gte("created_at", new Date(now.getTime() - 30 * DAY).toISOString());
      const byVehicle = new Map<string, { campaignNumber: string; title: string; foundAt: string }[]>();
      for (const a of (alerts ?? []) as { vehicle_id: string; campaign_number: string | null; component: string | null; summary: string | null; created_at: string }[]) {
        if (!gvById.has(a.vehicle_id)) continue;
        if (!byVehicle.has(a.vehicle_id)) byVehicle.set(a.vehicle_id, []);
        byVehicle.get(a.vehicle_id)!.push({
          campaignNumber: a.campaign_number ?? a.id,
          title: a.component || a.summary || "Safety recall",
          foundAt: a.created_at,
        });
      }
      const userIds = [...new Set([...byVehicle.keys()].map((id) => gvById.get(id)!.user_id))];
      const existing = await existingKeysFor(userIds, ["E3"]);
      for (const [vehicleId, campaigns] of byVehicle) {
        const v = gvById.get(vehicleId)!;
        const keys = existing.get(v.user_id) ?? new Set<string>();
        const byDay = new Map<string, typeof campaigns>();
        for (const c of campaigns) {
          const day = c.foundAt.slice(0, 10);
          if (!byDay.has(day)) byDay.set(day, []);
          byDay.get(day)!.push(c);
        }
        for (const [, dayCampaigns] of byDay) {
          const numbers = dayCampaigns.map((c) => c.campaignNumber).sort();
          const sourceKey = `veh:${vehicleId}:campaigns:${numbers.join(".")}`;
          if (keys.has(`E3:${sourceKey}`)) continue;
          const sorted = [...dayCampaigns].sort((a, b) => a.foundAt.localeCompare(b.foundAt));
          candidates.push({
            userId: v.user_id, eventType: "E3", category: "recalls",
            sourceTable: "recall_alerts", sourceId: vehicleId, sourceKey, vehicleId,
            payload: { vehicleName: vehicleName(v), campaignCount: dayCampaigns.length, firstCampaignTitle: sorted[0].title },
            eligibleAt: sorted[sorted.length - 1].foundAt,
          });
        }
      }
    } catch (err) {
      failures++;
      console.error("check-proactive-events: E3 section failed:", err);
    }

    // ---------------------------------------------------------------------
    // E8 — recall status corrected (vehicle_recall_checks)
    // ---------------------------------------------------------------------
    try {
      const { data: checks } = await supabase
        .from("vehicle_recall_checks")
        .select("vehicle_id, status, checked_at, campaigns_found");
      const checkRows = (checks ?? []) as { vehicle_id: string; status: string; checked_at: string; campaigns_found: number | null }[];
      const userIds = [...new Set(checkRows.map((c) => gvById.get(c.vehicle_id)?.user_id).filter(Boolean))] as string[];
      const existing = await existingKeysFor(userIds, ["E8"]);
      for (const c of checkRows) {
        const v = gvById.get(c.vehicle_id);
        if (!v) continue;
        const keys = existing.get(v.user_id) ?? new Set<string>();
        if (c.status === "failed") {
          const sourceKey = `veh:${c.vehicle_id}:failed-observed`;
          if (!keys.has(`E8:${sourceKey}`)) {
            candidates.push({
              userId: v.user_id, eventType: "E8", category: "recalls",
              sourceTable: "vehicle_recall_checks", sourceId: c.vehicle_id, sourceKey,
              vehicleId: c.vehicle_id, payload: { vehicleName: vehicleName(v) },
              eligibleAt: c.checked_at, initialState: "suppressed",
            });
          }
        } else if (c.status === "ok" && (c.campaigns_found ?? 0) === 0) {
          if (!keys.has(`E8:veh:${c.vehicle_id}:failed-observed`)) continue;
          const sourceKey = `veh:${c.vehicle_id}:corrected:${c.checked_at.slice(0, 10)}`;
          if (keys.has(`E8:${sourceKey}`)) continue;
          candidates.push({
            userId: v.user_id, eventType: "E8", category: "recalls",
            sourceTable: "vehicle_recall_checks", sourceId: c.vehicle_id, sourceKey,
            vehicleId: c.vehicle_id, payload: { vehicleName: vehicleName(v) },
            eligibleAt: c.checked_at,
          });
        }
      }
    } catch (err) {
      failures++;
      console.error("check-proactive-events: E8 section failed:", err);
    }

    // ---------------------------------------------------------------------
    // E5 seasonal / E5 mileage / E9 — Garage-derived prompts
    // ---------------------------------------------------------------------
    try {
      const userIds = [...new Set(gvRows.map((v) => v.user_id))];
      const existing = await existingKeysFor(userIds, ["E5", "E9"]);

      // Latest sourced reading per vehicle (check-maintenance derivation:
      // greatest reading_date, ties to Observed, current rows only).
      const { data: readingRows } = await supabase
        .from("vehicle_mileage_readings")
        .select("vehicle_id, odometer_miles, reading_date, layer, created_at")
        .eq("status", "current");
      const latestReading = new Map<string, { miles: number; date: string }>();
      const readingsByVehicle = new Map<string, { odometer_miles: number; reading_date: string; layer: string; created_at: string }[]>();
      for (const r of (readingRows ?? []) as { vehicle_id: string; odometer_miles: number; reading_date: string; layer: string; created_at: string }[]) {
        if (!readingsByVehicle.has(r.vehicle_id)) readingsByVehicle.set(r.vehicle_id, []);
        readingsByVehicle.get(r.vehicle_id)!.push(r);
      }
      for (const [vid, rows] of readingsByVehicle) {
        rows.sort((a, b) => {
          if (a.reading_date !== b.reading_date) return b.reading_date.localeCompare(a.reading_date);
          if (a.layer !== b.layer) return a.layer === "observed" ? -1 : 1;
          return b.created_at.localeCompare(a.created_at);
        });
        latestReading.set(vid, { miles: Number(rows[0].odometer_miles), date: rows[0].reading_date });
      }

      // E9 (mirrors evaluateE9)
      for (const v of gvRows) {
        const keys = existing.get(v.user_id) ?? new Set<string>();
        const reading = latestReading.get(v.id) ?? null;
        if (reading) {
          if (now.getTime() - new Date(`${reading.date}T12:00:00Z`).getTime() <= 180 * DAY) continue;
          const bucket = Math.floor(now.getTime() / (180 * DAY));
          const sourceKey = `veh:${v.id}:stale:${bucket}`;
          if (keys.has(`E9:${sourceKey}`)) continue;
          candidates.push({
            userId: v.user_id, eventType: "E9", category: "service_prompts",
            sourceTable: "vehicle_mileage_readings", sourceId: v.id, sourceKey, vehicleId: v.id,
            payload: { vehicleName: vehicleName(v), lastReadingMiles: reading.miles, lastReadingDate: reading.date },
            eligibleAt: nowIso,
          });
        } else {
          const vAge = now.getTime() - new Date(v.created_at).getTime();
          if (vAge <= 30 * DAY) continue;
          const bucket = Math.floor(vAge / (180 * DAY));
          const sourceKey = `veh:${v.id}:noreading:${bucket}`;
          if (keys.has(`E9:${sourceKey}`)) continue;
          candidates.push({
            userId: v.user_id, eventType: "E9", category: "service_prompts",
            sourceTable: "user_vehicles", sourceId: v.id, sourceKey, vehicleId: v.id,
            payload: { vehicleName: vehicleName(v), lastReadingMiles: null, lastReadingDate: null },
            eligibleAt: nowIso,
          });
        }
      }

      // E5 seasonal (mirrors evaluateE5Seasonal) — one per user per season,
      // batched onto the user's primary (or first) vehicle.
      const season = seasonForDate(now);
      if (season) {
        const byUser = new Map<string, typeof gvRows>();
        for (const v of gvRows) {
          if (!byUser.has(v.user_id)) byUser.set(v.user_id, []);
          byUser.get(v.user_id)!.push(v);
        }
        for (const [userId, vehicles] of byUser) {
          const keys = existing.get(userId) ?? new Set<string>();
          const sourceKey = `user:${userId}:season:${season.season}:${season.year}`;
          if (keys.has(`E5:${sourceKey}`)) continue;
          const primary = [...vehicles].sort((a, b) =>
            a.is_primary === b.is_primary ? a.created_at.localeCompare(b.created_at) : a.is_primary ? -1 : 1)[0];
          let lastCheckedAt: string | null = null;
          const { data: svc } = await supabase
            .from("maintenance_records")
            .select("service_date, service_type, description")
            .eq("vehicle_id", primary.id)
            .order("service_date", { ascending: false });
          for (const r of (svc ?? []) as { service_date: string; service_type: string; description: string | null }[]) {
            const text = `${r.service_type} ${r.description ?? ""}`.toLowerCase();
            const hit = season.season === "fall"
              ? text.includes("battery")
              : text.includes("air conditioning") || text.includes("a/c") || text.includes("ac service");
            if (hit) { lastCheckedAt = r.service_date; break; }
          }
          if (!lastCheckedAt) {
            const { data: events } = await supabase
              .from("vehicle_timeline_events")
              .select("occurred_at, title, detail")
              .eq("vehicle_id", primary.id)
              .eq("category", "service")
              .order("occurred_at", { ascending: false });
            for (const ev of (events ?? []) as { occurred_at: string; title: string; detail: string | null }[]) {
              const text = `${ev.title} ${ev.detail ?? ""}`.toLowerCase();
              const hit = season.season === "fall"
                ? text.includes("battery")
                : text.includes("air conditioning") || text.includes("a/c");
              if (hit) { lastCheckedAt = ev.occurred_at.slice(0, 10); break; }
            }
          }
          candidates.push({
            userId, eventType: "E5", category: "service_prompts",
            sourceTable: "user_vehicles", sourceId: primary.id, sourceKey, vehicleId: primary.id,
            payload: { subType: "seasonal", vehicleName: vehicleName(primary), season: season.season, lastCheckedAt },
            eligibleAt: nowIso,
          });
        }
      }

      // E5 mileage (mirrors evaluateE5Mileage) — fresh maintenance_alerts,
      // which check-maintenance already computed from sourced baselines only.
      const { data: dueAlerts } = await supabase
        .from("maintenance_alerts")
        .select("id, vehicle_id, service_type, service_label, miles_until_due, created_at")
        .gte("created_at", new Date(now.getTime() - 7 * DAY).toISOString());
      for (const a of (dueAlerts ?? []) as { id: string; vehicle_id: string; service_type: string; service_label: string; miles_until_due: number; created_at: string }[]) {
        const v = gvById.get(a.vehicle_id);
        if (!v) continue;
        const keys = existing.get(v.user_id) ?? new Set<string>();
        const sourceKey = `malert:${a.id}`;
        if (keys.has(`E5:${sourceKey}`)) continue;
        const reading = latestReading.get(a.vehicle_id);
        if (!reading) continue; // never prompt from an unsourced basis
        const { data: done } = await supabase
          .from("maintenance_records").select("id")
          .eq("vehicle_id", a.vehicle_id).eq("service_type", a.service_type)
          .gte("created_at", a.created_at).limit(1);
        if ((done ?? []).length > 0) continue;
        const { data: dismissed } = await supabase
          .from("proactive_messages").select("id, payload, dismissed_at")
          .eq("user_id", v.user_id).eq("event_type", "E5").eq("state", "dismissed")
          .eq("vehicle_id", a.vehicle_id)
          .gte("dismissed_at", new Date(now.getTime() - 90 * DAY).toISOString());
        const dismissedSameService = (dismissed ?? []).some(
          (d: { payload: Record<string, unknown> }) => d.payload?.subType === "mileage" && d.payload?.serviceLabel === a.service_label,
        );
        if (dismissedSameService) continue;
        candidates.push({
          userId: v.user_id, eventType: "E5", category: "service_prompts",
          sourceTable: "maintenance_alerts", sourceId: a.id, sourceKey, vehicleId: a.vehicle_id,
          payload: {
            subType: "mileage", vehicleName: vehicleName(v), serviceLabel: a.service_label,
            readingMiles: reading.miles, readingDate: reading.date, overdue: a.miles_until_due < 0,
          },
          eligibleAt: a.created_at,
        });
      }
    } catch (err) {
      failures++;
      console.error("check-proactive-events: E5/E9 section failed:", err);
    }

    // ---------------------------------------------------------------------
    // Insert (idempotent)
    // ---------------------------------------------------------------------
    let inserted = 0;
    if (candidates.length > 0) {
      const rows = candidates.map((c) => ({
        user_id: c.userId,
        event_type: c.eventType,
        category: c.category,
        source_table: c.sourceTable,
        source_id: c.sourceId,
        source_key: c.sourceKey,
        vehicle_id: c.vehicleId,
        payload: c.payload,
        state: c.initialState ?? "pending",
        eligible_at: c.eligibleAt,
      }));
      const { data, error } = await supabase
        .from("proactive_messages")
        .upsert(rows, { onConflict: "user_id,event_type,source_key", ignoreDuplicates: true })
        .select("id, event_type");
      if (error) throw error;
      inserted = (data ?? []).length;
      for (const r of (data ?? []) as { event_type: string }[]) {
        queued[r.event_type] = (queued[r.event_type] ?? 0) + 1;
      }
    }

    const runFailed = failures > 0;
    return new Response(
      JSON.stringify({
        message: `Proactive event check complete: ${candidates.length} candidates, ${inserted} new queue rows` +
          (runFailed ? `, ${failures} section failures` : ""),
        candidates: candidates.length, inserted, queuedByEvent: queued, failures,
        checkedAt: nowIso,
      }),
      { status: runFailed ? 502 : 200, headers: { ...securityHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in check-proactive-events:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  }
});
