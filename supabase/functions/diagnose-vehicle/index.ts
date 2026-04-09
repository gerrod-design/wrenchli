// supabase/functions/diagnose-vehicle/index.ts
// ============================================================
// WRENCHLI — Edge Function: Diagnose Vehicle Issue (Stage 3)
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

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
  diy_difficulty: "easy" | "moderate" | "professional_only";
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

Return ONLY valid JSON matching this exact schema. No explanation, no markdown, no preamble:

{
  "confidence": "low" | "medium" | "high",
  "urgency": "monitor" | "schedule" | "soon" | "immediate",
  "explanation": "Plain English summary in 2-3 sentences. No jargon.",
  "vehicle_validation": {
    "is_valid": true | false,
    "message": "Optional message if vehicle combination seems implausible"
  },
  "possible_causes": [
    {
      "name": "Cause name",
      "probability": 0.0 to 1.0,
      "estimated_cost_low": integer USD,
      "estimated_cost_high": integer USD,
      "diy_difficulty": "easy" | "moderate" | "professional_only",
      "notes": "Optional brief note"
    }
  ]
}

Rules:
- VEHICLE VALIDATION (CRITICAL): Before diagnosing, verify the year/make/model combination is historically accurate. Check whether that specific model was actually manufactured in that year. Examples of implausible combinations: "2024 Honda S2000" (discontinued in 2009), "2015 Pontiac G6" (Pontiac ceased in 2010), "2020 Toyota Supra" with a trim that didn't exist. If the combination is implausible or you have no record of it:
  - Set vehicle_validation.is_valid to false
  - Set vehicle_validation.message to: "We want to make sure we give you accurate information — we don't have records of a [year] [make] [model]. Could you double-check your vehicle details?"
  - Still attempt a best-effort diagnosis based on the closest known model, but lower confidence to "low"
  - If the combination is valid, set vehicle_validation.is_valid to true and omit the message field
- List 2-5 possible causes, ordered by probability descending
- Probabilities across all causes should sum to roughly 1.0
- Cost ranges are for parts + labor at an average US shop
- urgency "immediate" = do not drive; "soon" = within 1 week; "schedule" = within 1 month; "monitor" = watch it
- explanation should be something a non-mechanic can understand and act on
- If symptom information is thin, lower confidence accordingly`;

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
        max_tokens: 1000,
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

    let diagnosis: Diagnosis;
    try {
      diagnosis = JSON.parse(cleanedText);
    } catch {
      console.error("Failed to parse AI response:", rawText);
      throw new Error("AI returned invalid JSON");
    }

    if (!diagnosis.confidence || !diagnosis.urgency || !diagnosis.explanation) {
      throw new Error("AI response missing required fields");
    }
    if (!Array.isArray(diagnosis.possible_causes) || diagnosis.possible_causes.length === 0) {
      throw new Error("AI response missing possible_causes");
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

    // ── 6. Return result ───────────────────────────────────
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
