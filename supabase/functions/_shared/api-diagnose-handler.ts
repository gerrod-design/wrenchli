// Shared handler for the public assessment API (audit R-35).
// Served under two names: /api-diagnose (the original live contract,
// kept) and /api-assess (the assessment-named alias). Both wrappers
// pass their own endpoint name for request logging.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";
import { analyzeSymptoms } from "./api-diagnose-analysis.ts";
import { logRateMatch } from "./rate-match-log.ts";

// Re-exported for compatibility with existing import sites; the pure
// analysis lives in api-diagnose-analysis.ts (R-68).
export { analyzeSymptoms };

// API endpoints keep CORS open (* via getCorsHeaders fallback) since they're
// consumed by third-party integrations authenticated via x-api-key.

interface DiagnoseRequest {
  symptoms: string[];
  vehicle: {
    year: number;
    make: string;
    model: string;
    mileage?: number;
  };
  location?: string;
}

async function hashApiKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function handleApiDiagnose(req: Request, endpoint: string): Promise<Response> {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key. Include x-api-key header." }), {
      status: 401, headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const keyHash = await hashApiKey(apiKey);

  const { data: keyRecord, error: keyError } = await supabase
    .from("api_keys").select("id, is_active, rate_limit_per_minute").eq("key_hash", keyHash).maybeSingle();

  if (keyError || !keyRecord) {
    return new Response(JSON.stringify({ error: "Invalid API key." }), { status: 403, headers: { ...securityHeaders, "Content-Type": "application/json" } });
  }
  if (!keyRecord.is_active) {
    return new Response(JSON.stringify({ error: "API key is deactivated." }), { status: 403, headers: { ...securityHeaders, "Content-Type": "application/json" } });
  }

  // DB-backed rate limiting
  const windowStart = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase.from("api_rate_limits").select("*", { count: "exact", head: true }).eq("key_hash", keyHash).gte("requested_at", windowStart);

  if ((count ?? 0) >= keyRecord.rate_limit_per_minute) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded.", limit_per_minute: keyRecord.rate_limit_per_minute, retry_after_seconds: 60 }), {
      status: 429, headers: { ...securityHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  supabase.from("api_rate_limits").insert({ key_hash: keyHash }).then(() => {});
  supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id).then(() => {});
  if (Math.random() < 0.05) supabase.rpc("cleanup_old_rate_limits").then(() => {});

  const requestStart = Date.now();
  try {
    const body: DiagnoseRequest = await req.json();
    const { symptoms, vehicle, location } = body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return new Response(JSON.stringify({ error: "Symptoms are required" }), { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } });
    }
    if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) {
      return new Response(JSON.stringify({ error: "Vehicle year, make, and model are required" }), { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } });
    }

    const diagnosis = analyzeSymptoms(symptoms, vehicle);
    const baseUrl = "https://wrenchli.net";

    // R-68: log the matcher outcome (fire-and-forget). cost_estimate is
    // null with price_status "not_in_book" when the bucket has no rate
    // table entry; rate_source is present only for book-priced results.
    logRateMatch({
      pipeline: endpoint,
      repairText: symptoms.join(" "),
      matched: !!diagnosis.rate_source,
      rateEntryId: diagnosis.rate_entry_id ?? null,
    });

    const response = {
      diagnosis: { probable_issue: diagnosis.issue, description: diagnosis.description, urgency: diagnosis.urgency, cost_estimate: diagnosis.cost_estimate, price_status: diagnosis.price_status, ...(diagnosis.rate_source ? { rate_source: diagnosis.rate_source } : {}) },
      assessment: { probable_issue: diagnosis.issue, description: diagnosis.description, urgency: diagnosis.urgency, cost_estimate: diagnosis.cost_estimate, price_status: diagnosis.price_status, ...(diagnosis.rate_source ? { rate_source: diagnosis.rate_source } : {}) },
      assessment_title: diagnosis.issue,
      recommendations: { immediate_action: diagnosis.action, safety_advice: diagnosis.safety, diy_feasible: diagnosis.diy_possible },
      wrenchli_services: {
        get_quotes_url: `${baseUrl}/vehicle-insights?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&symptom=${encodeURIComponent(symptoms.join(", "))}`,
        find_shops_url: `${baseUrl}/for-shops`,
      },
    };

    supabase.from("api_request_logs").insert({
      endpoint, key_hash: keyHash, diagnosis_title: diagnosis.issue,
      vehicle_year: String(vehicle.year), vehicle_make: vehicle.make, vehicle_model: vehicle.model,
      zip_code: location || null, response_status: 200, response_time_ms: Date.now() - requestStart,
      cost_low: diagnosis.cost_estimate?.min ?? null, cost_high: diagnosis.cost_estimate?.max ?? null,
    }).then(() => {});

    return new Response(JSON.stringify(response), { headers: { ...securityHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("api-diagnose error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } });
  }
}
