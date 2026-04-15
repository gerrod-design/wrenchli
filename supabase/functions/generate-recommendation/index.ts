// supabase/functions/generate-recommendation/index.ts
// ============================================================
// WRENCHLI — Edge Function: Generate Repair Recommendation (Stage 4)
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
}

interface PossibleCause {
  name: string;
  probability: number;
  estimated_cost_low: number;
  estimated_cost_high: number;
  diy_difficulty: string;
}

interface Diagnosis {
  confidence: string;
  urgency: string;
  explanation: string;
  possible_causes: PossibleCause[];
}

interface RepairRecommendation {
  action: string;
  next_steps: string[];
  questions_to_ask_mechanic: string[];
  parts_likely_needed: string[];
}

// ── System Prompt ────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a trusted automotive advisor helping a vehicle owner understand what to do next after receiving a diagnosis.

Return ONLY valid JSON matching this exact schema. No explanation, no markdown, no preamble:

{
  "action": "One clear sentence: what the owner should do right now.",
  "next_steps": [
    "Step 1 (most immediate first)",
    "Step 2",
    "Step 3"
  ],
  "questions_to_ask_mechanic": [
    "Question 1",
    "Question 2",
    "Question 3",
    "Question 4",
    "Question 5"
  ],
  "parts_likely_needed": [
    "Part name 1",
    "Part name 2"
  ]
}

Rules:
- action: direct, specific, no fluff. E.g. "Schedule a brake inspection within the next week."
- next_steps: 3-5 ordered steps. Practical, specific, actionable.
- questions_to_ask_mechanic: exactly 5 questions. These empower the owner to not get taken advantage of. Include questions about diagnosis confirmation, cost breakdown, timeline, and whether other related items should be inspected.
- parts_likely_needed: just the part names, no prices. 1-4 items. Empty array if unclear.
- Match urgency: "immediate" urgency → step 1 is "Do not drive this vehicle"
- Write as if talking to someone who knows nothing about cars but is smart`;

// ── Main Handler ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Parse input ─────────────────────────────────────
    const body = await req.json();
    const { session_id, vehicle, diagnosis } = body as {
      session_id: string;
      vehicle: Vehicle;
      diagnosis: Diagnosis;
    };

    if (!session_id || !vehicle || !diagnosis) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: session_id, vehicle, diagnosis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Build user message ──────────────────────────────
    const topCauses = diagnosis.possible_causes
      .slice(0, 3)
      .map(
        (c) =>
          `- ${c.name} (${Math.round(c.probability * 100)}% likely, $${c.estimated_cost_low}–$${c.estimated_cost_high}, ${c.diy_difficulty})`
      )
      .join("\n");

    const userMessage = `
Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.mileage.toLocaleString()} miles)

Diagnosis Summary:
- Confidence: ${diagnosis.confidence}
- Urgency: ${diagnosis.urgency}
- Explanation: ${diagnosis.explanation}

Most Likely Causes:
${topCauses}

Generate a repair recommendation for this owner.`.trim();

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

    // ── 4. Parse & validate ────────────────────────────────
    let recommendation: RepairRecommendation;
    try {
      recommendation = JSON.parse(rawText);
    } catch {
      console.error("Failed to parse AI response:", rawText);
      throw new Error("AI returned invalid JSON");
    }

    if (!recommendation.action || !Array.isArray(recommendation.next_steps)) {
      throw new Error("AI response missing required fields");
    }

    recommendation.questions_to_ask_mechanic ??= [];
    recommendation.parts_likely_needed ??= [];

    // ── 5. Persist to Supabase ─────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: recRecord, error: recError } = await supabase
      .from("repair_recommendations")
      .insert({
        session_id,
        action: recommendation.action,
        next_steps: recommendation.next_steps,
        questions_to_ask_mechanic: recommendation.questions_to_ask_mechanic,
        parts_likely_needed: recommendation.parts_likely_needed,
      })
      .select()
      .single();

    if (recError) throw recError;

    await supabase
      .from("diagnostic_sessions")
      .update({ status: "complete" })
      .eq("id", session_id);

    // ── 6. Return result ───────────────────────────────────
    return new Response(
      JSON.stringify({
        recommendation_id: recRecord.id,
        ...recommendation,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("generate-recommendation error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
