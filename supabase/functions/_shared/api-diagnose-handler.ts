// Shared handler for the public assessment API (audit R-35).
// Served under two names: /api-diagnose (the original live contract,
// kept) and /api-assess (the assessment-named alias). Both wrappers
// pass their own endpoint name for request logging.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";
import { findRepairRate, rateFigures, RATE_SOURCE_ID } from "./repair-rates.ts";

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

function analyzeSymptomsRaw(symptoms: string[], vehicle: { year: number; make: string; model: string }) {
  const text = symptoms.join(" ").toLowerCase();

  if (text.includes("grinding") || text.includes("brake")) {
    return { issue: "Brake System Issue", description: "Grinding noises typically indicate worn brake pads that need replacement. This can damage rotors if not addressed promptly.", urgency: "high" as const, cost_estimate: { min: 200, max: 600 }, action: "Schedule brake inspection within 48 hours", safety: "Avoid heavy braking and increase following distance", diy_possible: false };
  }
  if (text.includes("check engine") || text.includes("engine light")) {
    return { issue: "Engine Assessment Needed", description: "Check engine light indicates a system malfunction. Could range from a loose gas cap to serious engine issues.", urgency: "medium" as const, cost_estimate: { min: 100, max: 800 }, action: "Get a professional scan to identify the specific issue", safety: "Safe to drive short distances, avoid hard acceleration", diy_possible: true };
  }
  if (text.includes("oil") || text.includes("leak")) {
    return { issue: "Oil System Issue", description: "Oil leaks can lead to engine damage if oil levels drop too low. Check oil level immediately.", urgency: "medium" as const, cost_estimate: { min: 50, max: 300 }, action: "Check oil level and look for leak source", safety: "Check oil level before driving", diy_possible: true };
  }
  if (text.includes("overheat") || text.includes("temperature") || text.includes("coolant") || text.includes("steam")) {
    return { issue: "Engine Overheating", description: "Your engine is running hotter than it should. This can cause permanent engine damage if not addressed immediately.", urgency: "high" as const, cost_estimate: { min: 150, max: 800 }, action: "Pull over safely and turn off the engine. Do not drive until resolved.", safety: "Do NOT open the radiator cap while hot. Let engine cool completely.", diy_possible: false };
  }
  if (text.includes("noise") || text.includes("sound") || text.includes("rattle") || text.includes("knock")) {
    return { issue: "Mechanical Issue — Assessment Needed", description: "Unusual noises can indicate various mechanical issues. A professional inspection is recommended to identify the source.", urgency: "medium" as const, cost_estimate: { min: 100, max: 500 }, action: "Schedule professional inspection", safety: "Monitor for changes in noise intensity", diy_possible: false };
  }
  if (text.includes("battery") || text.includes("won't start") || text.includes("click") || text.includes("crank")) {
    return { issue: "Battery or Starting System Issue", description: "If your vehicle won't start or you hear clicking, the most common cause is a dead or weak battery.", urgency: "high" as const, cost_estimate: { min: 100, max: 500 }, action: "Test battery voltage or jump-start the vehicle", safety: "Ensure the vehicle is in park and on a level surface before jump-starting", diy_possible: true };
  }
  if (text.includes("transmission") || text.includes("shifting") || text.includes("slipping")) {
    return { issue: "Transmission Issue", description: "Transmission problems can range from low fluid to serious internal damage. Address promptly to prevent costly repairs.", urgency: "high" as const, cost_estimate: { min: 150, max: 3000 }, action: "Check transmission fluid level and schedule inspection", safety: "Avoid aggressive driving and heavy loads", diy_possible: false };
  }

  return { issue: "Professional Inspection Recommended", description: "Multiple symptoms or unclear issue. A professional inspection will identify the specific problem.", urgency: "medium" as const, cost_estimate: { min: 100, max: 400 }, action: "Schedule an inspection appointment with a local mechanic", safety: "Safe to drive short distances unless symptoms worsen", diy_possible: false };
}

// R-56 (Batch 9): buckets whose definition names one specific repair that
// exists in the shared rate table derive their cost_estimate from the
// table, so the public API quotes the same figure as every other surface
// for the same repair. Buckets spanning several repairs (overheating,
// transmission) or lacking a table entry keep their bucket range and
// visibly lack rate_source (Batch 6 matcher precedent: no match, no pin,
// no invented rates).
const BUCKET_RATE_LABELS: Record<string, string> = {
  "Brake System Issue": "Brake Pads Replacement",
  "Battery or Starting System Issue": "Battery Replacement",
};

export function analyzeSymptoms(symptoms: string[], vehicle: { year: number; make: string; model: string }) {
  const result = analyzeSymptomsRaw(symptoms, vehicle);
  const label = BUCKET_RATE_LABELS[result.issue];
  if (label) {
    const entry = findRepairRate(label);
    if (entry) {
      const figures = rateFigures(entry);
      result.cost_estimate = { min: figures.shopTotal[0], max: figures.shopTotal[1] };
      (result as any).rate_source = RATE_SOURCE_ID;
    }
  }
  return result as any;
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

    const response = {
      diagnosis: { probable_issue: diagnosis.issue, description: diagnosis.description, urgency: diagnosis.urgency, cost_estimate: diagnosis.cost_estimate, ...(diagnosis.rate_source ? { rate_source: diagnosis.rate_source } : {}) },
      assessment: { probable_issue: diagnosis.issue, description: diagnosis.description, urgency: diagnosis.urgency, cost_estimate: diagnosis.cost_estimate, ...(diagnosis.rate_source ? { rate_source: diagnosis.rate_source } : {}) },
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
      cost_low: diagnosis.cost_estimate.min, cost_high: diagnosis.cost_estimate.max,
    }).then(() => {});

    return new Response(JSON.stringify(response), { headers: { ...securityHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("api-diagnose error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } });
  }
}
