import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

// R-51/R-54/R-58 (Batch 1.5):
// - Recall lookup is resolved server-side from the vehicle's own VIN decode
//   (vPIC), never from the client-supplied/display model string. vPIC's model
//   taxonomy ("GLC-Class") differs from the NHTSA recall taxonomy ("GLC300");
//   forwarding the display model verbatim silently failed for whole classes
//   of vehicles.
// - Candidate model strings are derived ONLY from this vehicle's decode
//   (trim token, model, series + normalized variants). A sibling trim's name
//   is never a candidate, so another trim's recalls can never be accepted
//   as this vehicle's.
// - NHTSA answers "no campaigns for this make/model/year" with HTTP 400 and
//   an empty body shape — the same response it gives an unrecognized model.
//   If every candidate fails at the vehicle's year, the primary candidates
//   are validated against adjacent model years: a string NHTSA recognizes
//   for a neighbouring year means this vehicle genuinely has zero campaigns
//   on file (status ok, 0 found). A string recognized nowhere is a failed
//   check, persisted to vehicle_recall_checks and surfaced in the Garage UI
//   as "recall status unavailable" — never as a silent zero.
// - Writes are idempotent: campaigns already on file are skipped (existing
//   rows — including their read state — are never rewritten), and the
//   recall_found webhook is enqueued only for genuinely new campaigns.
// - Callers are authenticated (R-54): a user JWT that owns the vehicle, or
//   the internal secret (pg_cron fleet runs via wrenchli_cron_call), or the
//   service-role bearer. The public anon key alone can no longer write rows
//   or trigger runs.

const NHTSA_RECALLS_URL = "https://api.nhtsa.gov/recalls/recallsByVehicle";
const VPIC_DECODE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues";
const FETCH_TIMEOUT_MS = 12000;

// Trim tokens that are drivetrain/marketing words, never model names.
const TRIM_TOKEN_STOPLIST = new Set([
  "quattro", "xdrive", "4matic", "awd", "4wd", "fwd", "rwd", "base",
  "premium", "plus", "sport", "edition", "series", "luxury", "touring",
]);

interface VehicleRow {
  id: string;
  user_id: string;
  vin: string | null;
  make: string;
  model: string;
  year: number;
  trim: string | null;
}

interface VpicDecode {
  Make?: string;
  Model?: string;
  Trim?: string;
  Series?: string;
}

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isInternalCaller(req: Request): boolean {
  const internalSecret = Deno.env.get("INTERNAL_SECRET");
  const callerSecret = req.headers.get("x-internal-secret");
  if (internalSecret && callerSecret === internalSecret) return true;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");
  if (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`) return true;
  return false;
}

async function getCallerUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  // The anon key and service-role key are not user credentials.
  if (token === Deno.env.get("SUPABASE_ANON_KEY")) return null;
  if (token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await authClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  // The anon JWT carries role=anon and no user id; belt-and-braces check.
  if ((data.claims as Record<string, unknown>).role !== "authenticated") return null;
  return data.claims.sub as string;
}

async function decodeVin(vin: string): Promise<VpicDecode | null> {
  try {
    const res = await fetchWithTimeout(`${VPIC_DECODE_URL}/${encodeURIComponent(vin)}?format=json`);
    if (!res.ok) return null;
    const data = await res.json();
    const row = data?.Results?.[0];
    if (!row) return null;
    return {
      Make: row.Make || undefined,
      Model: row.Model || undefined,
      Trim: row.Trim || undefined,
      Series: row.Series || undefined,
    };
  } catch {
    return null;
  }
}

function buildCandidates(vehicle: VehicleRow, decode: VpicDecode | null): string[] {
  const candidates: string[] = [];
  const push = (value: string | null | undefined) => {
    if (!value) return;
    const cleaned = value.trim().replace(/\s+/g, " ");
    if (cleaned.length >= 2 && !candidates.includes(cleaned)) candidates.push(cleaned);
  };

  // Most specific first: the trim-level model token from this vehicle's own
  // decode (e.g. "GLC300" out of Trim "GLC300 Base-4M").
  const trimRaw = decode?.Trim || vehicle.trim || "";
  const trimToken = trimRaw.split(/[\s/-]+/).filter(Boolean)[0] || "";
  if (trimToken.length >= 3 && !TRIM_TOKEN_STOPLIST.has(trimToken.toLowerCase())) {
    push(trimToken);
  }

  push(decode?.Model);
  push(vehicle.model);
  push(decode?.Series);
  push(vehicle.trim ? vehicle.trim.split(/[\s]+/).slice(0, 2).join(" ") : null);

  // Normalized variants of everything above: hyphen<->space and class/series
  // suffix stripping ("GLC-Class" -> "GLC Class" -> "GLC").
  for (const candidate of [...candidates]) {
    push(candidate.replace(/-/g, " "));
    push(candidate.replace(/-(Class|Series)$/i, ""));
    push(candidate.replace(/\s+(Class|Series)$/i, ""));
  }
  return candidates;
}

interface NhtsaRecall {
  NHTSACampaignNumber?: string;
  Component?: string;
  Summary?: string;
  Consequence?: string;
  Remedy?: string;
}

async function queryNhtsa(make: string, model: string, year: number): Promise<NhtsaRecall[] | null> {
  const url = `${NHTSA_RECALLS_URL}?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = await res.json();
  return (data?.results || []) as NhtsaRecall[];
}

type ResolveOutcome =
  | { ok: true; modelUsed: string; recalls: NhtsaRecall[]; validatedZero: boolean }
  | { ok: false };

async function resolveRecalls(make: string, candidates: string[], year: number): Promise<ResolveOutcome> {
  for (const candidate of candidates) {
    const recalls = await queryNhtsa(make, candidate, year);
    if (recalls !== null) {
      return { ok: true, modelUsed: candidate, recalls, validatedZero: false };
    }
  }
  // No candidate produced a valid response at this year. Distinguish
  // "valid model, zero campaigns this year" from "model string NHTSA does
  // not know": NHTSA indexes campaigns per model year (a multi-year
  // campaign is returned under every year it covers), so if a candidate is
  // recognized for an adjacent year, zero-at-this-year is the truthful read.
  for (const candidate of candidates) {
    for (const dy of [-1, 1, -2, 2]) {
      const probe = await queryNhtsa(make, candidate, year + dy);
      if (probe !== null) {
        return { ok: true, modelUsed: candidate, recalls: [], validatedZero: true };
      }
    }
  }
  return { ok: false };
}

async function runCheckForVehicle(
  supabase: ReturnType<typeof createClient>,
  vehicle: VehicleRow,
): Promise<{ vehicle_id: string; status: "ok" | "failed"; recalls_found: number; new_recalls: number; model_used: string | null }> {
  const decode = vehicle.vin ? await decodeVin(vehicle.vin) : null;
  const make = decode?.Make || vehicle.make;
  const candidates = buildCandidates(vehicle, decode);
  const outcome = await resolveRecalls(make, candidates, vehicle.year);

  if (!outcome.ok) {
    await supabase.from("vehicle_recall_checks").upsert(
      {
        vehicle_id: vehicle.id,
        status: "failed",
        checked_at: new Date().toISOString(),
        campaigns_found: null,
        model_used: null,
        note: null,
        error: "NHTSA did not recognize any model name derived from this vehicle's VIN decode.",
      },
      { onConflict: "vehicle_id" },
    );
    return { vehicle_id: vehicle.id, status: "failed", recalls_found: 0, new_recalls: 0, model_used: null };
  }

  // Idempotent write: only campaigns not already on file are inserted, so
  // re-runs never duplicate rows, never reset read state, and never
  // re-enqueue downstream notifications for known campaigns (R-58).
  const { data: existingRows } = await supabase
    .from("recall_alerts")
    .select("nhtsa_id")
    .eq("vehicle_id", vehicle.id);
  const existing = new Set((existingRows || []).map((r) => r.nhtsa_id));

  let newRecalls = 0;
  for (const recall of outcome.recalls) {
    const nhtsaId = recall.NHTSACampaignNumber;
    if (!nhtsaId || existing.has(nhtsaId)) continue;

    const { data, error } = await supabase
      .from("recall_alerts")
      .insert({
        vehicle_id: vehicle.id,
        nhtsa_id: nhtsaId,
        campaign_number: recall.NHTSACampaignNumber || null,
        component: recall.Component || "Unknown Component",
        summary: recall.Summary || "No details available.",
        consequence: recall.Consequence || "",
        remedy: recall.Remedy || "Contact your dealer.",
        is_read: false,
      })
      .select("id");

    if (error) {
      console.warn("[check-recalls] insert error:", error);
    } else if (data && data.length > 0) {
      newRecalls++;
      existing.add(nhtsaId);
      await supabase.from("webhook_queue").insert({
        event_type: "recall_found",
        payload: {
          recall_id: data[0].id,
          vehicle_id: vehicle.id,
          component: recall.Component || "Unknown Component",
          summary: recall.Summary || "No details available.",
          consequence: recall.Consequence || "",
          remedy: recall.Remedy || "Contact your dealer.",
        },
      });
    }
  }

  await supabase.from("vehicle_recall_checks").upsert(
    {
      vehicle_id: vehicle.id,
      status: "ok",
      checked_at: new Date().toISOString(),
      campaigns_found: outcome.recalls.length,
      model_used: outcome.modelUsed,
      note: outcome.validatedZero
        ? "NHTSA returned no campaigns for this vehicle's exact model year; the model name was validated against adjacent model years in NHTSA data."
        : null,
      error: null,
    },
    { onConflict: "vehicle_id" },
  );

  return {
    vehicle_id: vehicle.id,
    status: "ok",
    recalls_found: outcome.recalls.length,
    new_recalls: newRecalls,
    model_used: outcome.modelUsed,
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const userVehicleId = typeof body.user_vehicle_id === "string" ? body.user_vehicle_id : null;
    const internal = isInternalCaller(req);

    if (userVehicleId) {
      const { data: vehicle, error: vErr } = await supabase
        .from("user_vehicles")
        .select("id, user_id, vin, make, model, year, trim")
        .eq("id", userVehicleId)
        .maybeSingle();

      if (vErr) throw vErr;
      if (!vehicle) return jsonResponse({ error: "Vehicle not found" }, 404, corsHeaders);

      if (!internal) {
        const callerUserId = await getCallerUserId(req);
        if (!callerUserId) return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
        if ((vehicle as VehicleRow).user_id !== callerUserId) {
          return jsonResponse({ error: "Forbidden — vehicle belongs to another user" }, 403, corsHeaders);
        }
      }

      const result = await runCheckForVehicle(supabase, vehicle as VehicleRow);
      return jsonResponse(
        result,
        result.status === "ok" ? 200 : 502,
        corsHeaders,
      );
    }

    // Fleet mode (scheduled re-checks / backfill): internal callers only.
    if (!internal) {
      return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
    }

    const { data: vehicles, error: fleetErr } = await supabase
      .from("user_vehicles")
      .select("id, user_id, vin, make, model, year, trim")
      .order("created_at", { ascending: true });
    if (fleetErr) throw fleetErr;

    const results = [];
    for (const vehicle of vehicles || []) {
      try {
        results.push(await runCheckForVehicle(supabase, vehicle as VehicleRow));
      } catch (err) {
        console.error(`[check-recalls] fleet check failed for vehicle ${vehicle.id}:`, err);
        results.push({ vehicle_id: vehicle.id, status: "failed" as const, recalls_found: 0, new_recalls: 0, model_used: null });
      }
    }

    const okCount = results.filter((r) => r.status === "ok").length;
    return jsonResponse(
      {
        mode: "fleet",
        checked: results.length,
        ok: okCount,
        failed: results.length - okCount,
        new_recalls: results.reduce((sum, r) => sum + r.new_recalls, 0),
        results,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("[check-recalls] Error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
      corsHeaders,
    );
  }
});
