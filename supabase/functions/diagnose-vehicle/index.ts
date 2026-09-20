// supabase/functions/diagnose-vehicle/index.ts
// ============================================================
// WRENCHLI — Edge Function: Diagnose Vehicle Issue (Stage 3)
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ────────────────────────────────────────────────────

interface Vehicle {
  make: string;
  model: string;
  year: number;
  mileage: number;
  trim?: string;
}

interface SymptomReport {
  primary_symptom: string;
  symptom_location?: string;
  when_it_happens?: string;
  severity?: "minor" | "moderate" | "urgent" | "do_not_drive";
  warning_lights?: string[];
  raw_description?: string;
}

interface PossibleCause {
  name: string;
  probability: number;
  estimated_cost_low: number;
  estimated_cost_high: number;
  diy_parts_cost_low: number | null;
  diy_parts_cost_high: number | null;
  diy_time: string | null;
  shop_parts_cost_low: number;
  shop_parts_cost_high: number;
  shop_labor_cost_low: number;
  shop_labor_cost_high: number;
  shop_time: string;
  diy_difficulty: "easy" | "moderate" | "professional_only";
  diy_steps?: string[] | null;
  notes?: string;
}

interface Diagnosis {
  confidence: "low" | "medium" | "high";
  urgency: "monitor" | "schedule" | "soon" | "immediate";
  explanation: string;
  possible_causes: PossibleCause[];
}

// ── System Prompt ────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior automotive diagnostic expert. 
Given a vehicle and symptom report, return a structured diagnosis.

CRITICAL — VEHICLE VALIDATION (must be done FIRST):
Before ANY diagnosis, verify the year/make/model combination is historically accurate.
Check whether that specific model was actually manufactured in that year.

Examples of INVALID combinations:
- 2012 Ford Bronco (Bronco was made 1966-1996 and 2021-present, NOT 1997-2020)
- 2024 Honda S2000 (discontinued in 2009)
- 2015 Pontiac G6 (Pontiac ceased operations in 2010)
- Any year before the brand was founded
- Any model year beyond ${new Date().getFullYear() + 1}

If the year/make/model combination is implausible or was never manufactured:
Return ONLY this JSON — do NOT include possible_causes or run a diagnosis:
{
  "vehicle_invalid": true,
  "validation_message": "We want to make sure we give you the most accurate assessment. We don't have records of a [year] [make] [model] in our database. Could you double-check your vehicle details? If your vehicle details are correct, please try a similar year or trim level."
}

If the vehicle IS valid, return ONLY valid JSON matching this exact schema:
{
  "confidence": "low" | "medium" | "high",
  "urgency": "monitor" | "schedule" | "soon" | "immediate",
  "explanation": "Plain English summary in 2-3 sentences. No jargon.",
  "possible_causes": [
    {
      "name": "Cause name",
      "probability": 0.0 to 1.0,
      "estimated_cost_low": integer USD,
      "estimated_cost_high": integer USD,
       "diy_parts_cost_low": integer USD or null,
       "diy_parts_cost_high": integer USD or null,
       "diy_time": "One realistic hands-on time range" or null,
       "shop_parts_cost_low": integer USD,
       "shop_parts_cost_high": integer USD,
       "shop_labor_cost_low": integer USD,
       "shop_labor_cost_high": integer USD,
       "shop_time": "One realistic total shop visit or service time range",
      "diy_difficulty": "easy" | "moderate" | "professional_only",
      "diy_steps": ["One concise step", "..."] or omitted for professional_only,
      "notes": "Optional brief note"
    }
  ]
}

Rules:
- List 2-5 possible causes, ordered by probability descending
- Probabilities across all causes should sum to roughly 1.0
- estimated_cost_low/high are the SHOP TOTAL and MUST equal shop_parts_cost_low/high plus shop_labor_cost_low/high respectively
- For every easy or moderate cause, always provide FOUR distinct, clearly scoped estimates: DIY parts cost, DIY hands-on time, shop parts and labor as separate ranges plus their total, and shop time
- Never copy or reuse one range for two meanings. DIY parts may resemble shop parts, but shop total must include non-zero labor and must not equal the DIY parts range
- Use one internally consistent DIY time and one shop time per cause. Do not put competing time estimates in explanation or notes
- DIY time means hands-on owner time. Shop time means expected appointment/service duration, not labor hours
- For professional_only causes, set diy_parts_cost_low, diy_parts_cost_high, and diy_time to null
- urgency "immediate" = do not drive; "soon" = within 1 week; "schedule" = within 1 month; "monitor" = watch it
- explanation should be something a non-mechanic can understand and act on
- If symptom information is thin, lower confidence accordingly
- Filters, wipers, and bulbs are routine maintenance. Describe replacing or checking them; never say "schedule a repair"
- Any cause involving brakes, steering, airbags, or the fuel system MUST have diy_difficulty "professional_only" — these systems are never DIY-eligible`;

// ── Deterministic safety override ────────────────────────────

const SAFETY_CRITICAL_PATTERNS = [/\bbrak/i, /\bsteer/i, /\bair\s?bags?/i, /\bfuel/i];

// ── Main Handler ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Parse & validate input ──────────────────────────
    const body = await req.json();
    const { session_id, vehicle, symptom } = body as {
      session_id: string;
      vehicle: Vehicle;
      symptom: SymptomReport;
    };

    if (!session_id || !vehicle || !symptom) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: session_id, vehicle, symptom" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Build the user message ──────────────────────────
    const userMessage = `
Vehicle:
- ${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}
- Mileage: ${vehicle.mileage.toLocaleString()} miles

Symptom Report:
- Primary symptom: ${symptom.primary_symptom}
${symptom.symptom_location ? `- Location: ${symptom.symptom_location}` : ""}
${symptom.when_it_happens ? `- When it happens: ${symptom.when_it_happens}` : ""}
${symptom.severity ? `- Severity: ${symptom.severity}` : ""}
${symptom.warning_lights?.length ? `- Warning lights: ${symptom.warning_lights.join(", ")}` : ""}
${symptom.raw_description ? `- User description: "${symptom.raw_description}"` : ""}

Diagnose this vehicle issue and return the JSON schema.`.trim();

    // ── 3. Call Claude API ─────────────────────────────────
    const aiResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error("Anthropic API error:", err);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.content?.[0]?.text ?? "";

    // ── 4. Parse & validate AI response ───────────────────
    // Strip markdown code fences if present (Claude sometimes wraps JSON)
    const cleanedText = rawText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      console.error("Failed to parse AI response:", rawText);
      throw new Error("AI returned invalid JSON");
    }

    // ── 4b. Check for vehicle validation rejection ────────
    if (parsed.vehicle_invalid === true) {
      return new Response(
        JSON.stringify({
          vehicle_invalid: true,
          validation_message: parsed.validation_message || `We don't have records of a ${vehicle.year} ${vehicle.make} ${vehicle.model}. Could you double-check your vehicle details?`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 4c. Validate diagnosis fields ─────────────────────
    const diagnosis: Diagnosis = parsed;
    if (!diagnosis.confidence || !diagnosis.urgency || !diagnosis.explanation) {
      throw new Error("AI response missing required fields");
    }
    if (!Array.isArray(diagnosis.possible_causes) || diagnosis.possible_causes.length === 0) {
      throw new Error("AI response missing possible_causes");
    }

    // ── 4d. Deterministic safety override ─────────────────
    for (const cause of diagnosis.possible_causes) {
      const haystack = `${cause.name ?? ""} ${cause.notes ?? ""}`;
      if (SAFETY_CRITICAL_PATTERNS.some((p) => p.test(haystack))) {
        cause.diy_difficulty = "professional_only";
        (cause as any).difficulty = "professional_only";
        cause.diy_parts_cost_low = null;
        cause.diy_parts_cost_high = null;
        cause.diy_time = null;
      }

      const shopPartsLow = Math.max(0, Math.round(Number(cause.shop_parts_cost_low) || 0));
      const shopPartsHigh = Math.max(shopPartsLow, Math.round(Number(cause.shop_parts_cost_high) || shopPartsLow));
      const isDiyEligible = cause.diy_difficulty === "easy" || cause.diy_difficulty === "moderate";
      const shopLaborLow = Math.max(isDiyEligible ? 1 : 0, Math.round(Number(cause.shop_labor_cost_low) || 0));
      const shopLaborHigh = Math.max(shopLaborLow, Math.round(Number(cause.shop_labor_cost_high) || shopLaborLow));
      cause.shop_parts_cost_low = shopPartsLow;
      cause.shop_parts_cost_high = shopPartsHigh;
      cause.shop_labor_cost_low = shopLaborLow;
      cause.shop_labor_cost_high = shopLaborHigh;
      cause.estimated_cost_low = shopPartsLow + shopLaborLow;
      cause.estimated_cost_high = shopPartsHigh + shopLaborHigh;
    }

    // ── 5. Persist to Supabase ─────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: diagnosisRecord, error: diagnosisError } = await supabase
      .from("diagnoses")
      .insert({
        session_id,
        confidence: diagnosis.confidence,
        urgency: diagnosis.urgency,
        explanation: diagnosis.explanation,
        raw_ai_response: aiData,
        model_used: MODEL,
      })
      .select()
      .single();

    if (diagnosisError) throw diagnosisError;

    const causesPayload = diagnosis.possible_causes.map((cause, index) => ({
      diagnosis_id: diagnosisRecord.id,
      name: cause.name,
      probability: cause.probability,
      estimated_cost_low: cause.estimated_cost_low,
      estimated_cost_high: cause.estimated_cost_high,
      diy_difficulty: cause.diy_difficulty,
      notes: cause.notes ?? null,
      sort_order: index,
    }));

    const { error: causesError } = await supabase
      .from("possible_causes")
      .insert(causesPayload);

    if (causesError) throw causesError;

    await supabase
      .from("diagnostic_sessions")
      .update({ status: "diagnosing" })
      .eq("id", session_id);

    // ── 6. Queue N8N webhook ──────────────────────────────
    await supabase.from("webhook_queue").insert({
      event_type: "assessment_complete",
      payload: {
        session_id,
        vehicle_id: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : null,
        diagnosis_id: diagnosisRecord.id,
        confidence: diagnosis.confidence,
        urgency: diagnosis.urgency,
        created_at: diagnosisRecord.created_at,
      },
    });

    // ── 7. Return result ───────────────────────────────────
    return new Response(
      JSON.stringify({
        diagnosis_id: diagnosisRecord.id,
        ...diagnosis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("diagnose-vehicle error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
