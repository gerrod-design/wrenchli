import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

async function hashApiKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function authenticateApiKey(req: Request, securityHeaders: Record<string, string>) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return { error: "Missing API key. Include x-api-key header.", status: 401 };

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const keyHash = await hashApiKey(apiKey);

  const { data: keyRecord, error: keyError } = await supabase
    .from("api_keys").select("id, is_active, rate_limit_per_minute").eq("key_hash", keyHash).maybeSingle();

  if (keyError || !keyRecord) return { error: "Invalid API key.", status: 403 };
  if (!keyRecord.is_active) return { error: "API key is deactivated.", status: 403 };

  const windowStart = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase.from("api_rate_limits").select("*", { count: "exact", head: true }).eq("key_hash", keyHash).gte("requested_at", windowStart);

  if ((count ?? 0) >= keyRecord.rate_limit_per_minute) {
    return { error: "Rate limit exceeded.", status: 429, extra: { limit_per_minute: keyRecord.rate_limit_per_minute, retry_after_seconds: 60 } };
  }

  supabase.from("api_rate_limits").insert({ key_hash: keyHash }).then(() => {});
  supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id).then(() => {});
  if (Math.random() < 0.05) supabase.rpc("cleanup_old_rate_limits").then(() => {});

  return { authenticated: true };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...securityHeaders, "Content-Type": "application/json" } });
  }

  const authResult = await authenticateApiKey(req, securityHeaders);
  if (authResult.error) {
    return new Response(JSON.stringify({ error: authResult.error, ...authResult.extra }), {
      status: authResult.status, headers: { ...securityHeaders, "Content-Type": "application/json", ...(authResult.status === 429 ? { "Retry-After": "60" } : {}) },
    });
  }

  try {
    const body = await req.json();
    const { diagnosis_title, diagnosis_code, vehicle_year, vehicle_make, vehicle_model, vehicle_trim, zip_code, diy_feasibility, urgency } = body;

    if (!diagnosis_title || !zip_code) {
      return new Response(JSON.stringify({ error: "diagnosis_title and zip_code are required" }), { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } });
    }

    const zipClean = (zip_code || "").toString().replace(/\D/g, "").slice(0, 5);
    if (zipClean.length !== 5) {
      return new Response(JSON.stringify({ error: "Invalid ZIP code — must be 5 digits" }), { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } });
    }

    const safeTitle = (diagnosis_title || "").slice(0, 200);
    const safeCode = (diagnosis_code || "").slice(0, 10);
    const safeYear = (vehicle_year || "").toString().slice(0, 4);
    const safeMake = (vehicle_make || "").slice(0, 30);
    const safeModel = (vehicle_model || "").slice(0, 30);
    const safeTrim = (vehicle_trim || "").slice(0, 30);
    const safeDiy = (diy_feasibility || "").slice(0, 20);
    const safeUrgency = (urgency || "").slice(0, 10);

    const vehicleStr = [safeYear, safeMake, safeModel, safeTrim].filter(Boolean).join(" ");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Estimate professional repair costs for the following:\n\nVehicle: ${vehicleStr || "Unknown vehicle"}\nDiagnosis: ${safeTitle}${safeCode ? ` (Code: ${safeCode})` : ""}\nDIY Feasibility: ${safeDiy || "unknown"}\nUrgency: ${safeUrgency || "unknown"}\nCustomer ZIP Code: ${zipClean}\n\nProvide a realistic cost estimate for this repair in the metro area around ZIP code ${zipClean}. Consider labor rates, parts costs, and regional pricing variations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are Wrenchli's automotive repair cost estimator. Provide transparent, realistic repair cost estimates based on diagnosis, vehicle, and ZIP code region. Include parts, labor, and regional pricing. Always provide a range." },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_cost_estimate",
            description: "Return a structured cost estimate for a vehicle repair",
            parameters: {
              type: "object",
              properties: {
                metro_area: { type: "string" }, cost_low: { type: "number" }, cost_high: { type: "number" },
                parts_estimate: { type: "string" }, labor_estimate: { type: "string" }, labor_hours: { type: "string" },
                regional_notes: { type: "string" }, what_to_expect: { type: "string" }, warranty_note: { type: "string" },
              },
              required: ["metro_area", "cost_low", "cost_high", "parts_estimate", "labor_estimate", "labor_hours", "regional_notes", "what_to_expect", "warranty_note"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "provide_cost_estimate" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "AI rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...securityHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), { status: 402, headers: { ...securityHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "provide_cost_estimate") {
      return new Response(JSON.stringify({ error: "Unexpected AI response format" }), { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } });
    }

    const estimate = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(estimate), { headers: { ...securityHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("api-estimate-repair error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } });
  }
});
