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
  diy_parts_cost_low?: number | null;
  diy_parts_cost_high?: number | null;
  diy_time?: string | null;
  shop_parts_cost_low?: number;
  shop_parts_cost_high?: number;
  shop_labor_cost_low?: number;
  shop_labor_cost_high?: number;
  shop_time?: string;
  notes?: string;
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
  diy_steps_by_part: { part_name: string; steps: string[] }[];
}

// ── System Prompt ────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a trusted automotive advisor helping a vehicle owner understand what to do next after receiving a diagnosis.

OUTPUT CONTRACT (absolute): respond with ONE valid JSON object and nothing else. No markdown code fences, no \`\`\`json, no table, no bullet list, no commentary before or after, no trailing commas. Your first character must be { and your last character must be }. Any DIY-vs-shop cost or time content must live inside JSON string values or fields of this schema — never as markdown outside the object.

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
  ],
  "diy_steps_by_part": [
    {
      "part_name": "Exact matching part name",
      "steps": ["Specific step 1", "Specific step 2"]
    }
  ]
}

Rules:
- action: direct, specific, no fluff. E.g. "Schedule a brake inspection within the next week."
- next_steps: 3-5 ordered steps. Practical, specific, actionable.
- questions_to_ask_mechanic: exactly 5 questions. These empower the owner to not get taken advantage of. Include questions about diagnosis confirmation, cost breakdown, timeline, and whether other related items should be inspected.
- Do not mention any cost or time in action or next_steps. The app shows the authoritative comparison separately.
- For filters, wipers, and bulbs, say "replace," "check," or "handle this maintenance"; never say "schedule a repair."
- parts_likely_needed: just the part names, no prices. Include only parts that have matching instructions in diy_steps_by_part.
- diy_steps_by_part: for every part in parts_likely_needed, include safe, useful steps under the exact same part_name. Omit a part if you cannot provide steps.
- If urgency is immediate/soon, no cause is easy/moderate, or any cause involves brakes, steering, airbags, or fuel: return empty parts_likely_needed and diy_steps_by_part arrays. Do not provide DIY content.
- The assessment's cost and time fields are authoritative. Never invent, repeat, round, shorten, or contradict them.
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
          `- ${c.name} (${Math.round(c.probability * 100)}% likely, ${c.diy_difficulty})\n  DIY parts: ${c.diy_parts_cost_low == null || c.diy_parts_cost_high == null ? "not available" : `$${c.diy_parts_cost_low}–$${c.diy_parts_cost_high}`}\n  DIY time: ${c.diy_time ?? "not available"}\n  Shop parts: $${c.shop_parts_cost_low ?? 0}–$${c.shop_parts_cost_high ?? 0}\n  Shop labor: $${c.shop_labor_cost_low ?? 0}–$${c.shop_labor_cost_high ?? 0}\n  Shop total: $${c.estimated_cost_low}–$${c.estimated_cost_high}\n  Shop time: ${c.shop_time ?? "not available"}`
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

    // ── 3. Call Claude API (with one retry on unparseable JSON) ──
    const callModel = async (strict: boolean): Promise<string> => {
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
          messages: [
            {
              role: "user",
              content: strict
                ? `${userMessage}\n\nYour previous answer was not valid JSON. Return ONLY the JSON object for the schema. No markdown fences, no commentary, no trailing commas.`
                : userMessage,
            },
            // Prefill forces the model to continue a JSON object instead of prose/markdown.
            { role: "assistant", content: "{" },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const err = await aiResponse.text();
        console.error("Anthropic API error:", err);
        throw new Error(`AI service error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const text = String(aiData.content?.[0]?.text ?? "");
      // Prefill is not echoed back, so re-attach the opening brace when needed.
      return text.trimStart().startsWith("{") ? text : `{${text}`;
    };

    // ── 4. Parse & validate ────────────────────────────────
    const parseRecommendation = (rawText: string): RepairRecommendation | null => {
      // Claude sometimes wraps JSON in markdown fences; strip them before parsing.
      const cleanedText = String(rawText)
        .replace(/^\s*```(?:json)?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();

      try {
        return JSON.parse(cleanedText);
      } catch {
        // Fallback: extract the outermost JSON object if extra prose slipped in.
        const start = cleanedText.indexOf("{");
        const end = cleanedText.lastIndexOf("}");
        if (start === -1 || end <= start) return null;
        try {
          return JSON.parse(cleanedText.slice(start, end + 1));
        } catch {
          // Last resort: drop trailing commas before closing braces/brackets.
          try {
            return JSON.parse(cleanedText.slice(start, end + 1).replace(/,(\s*[}\]])/g, "$1"));
          } catch {
            return null;
          }
        }
      }
    };

    let rawText = await callModel(false);
    let recommendation = parseRecommendation(rawText);

    if (!recommendation) {
      console.error("Failed to parse AI response, retrying once:", rawText);
      rawText = await callModel(true);
      recommendation = parseRecommendation(rawText);
    }

    if (!recommendation) {
      console.error("Failed to parse AI response after retry:", rawText);
      throw new Error("AI returned invalid JSON");
    }

    if (!recommendation.action || !Array.isArray(recommendation.next_steps)) {
      throw new Error("AI response missing required fields");
    }

    recommendation.questions_to_ask_mechanic ??= [];
    recommendation.parts_likely_needed ??= [];
    recommendation.diy_steps_by_part ??= [];

    const safetyCritical = diagnosis.possible_causes.some((cause) => {
      const text = `${cause.name ?? ""} ${cause.notes ?? ""}`;
      return /\bbrak/i.test(text) || /\bsteer/i.test(text) || /\bair\s?bags?/i.test(text) || /\bfuel/i.test(text);
    });
    const diyAllowed = (diagnosis.urgency === "monitor" || diagnosis.urgency === "schedule")
      && !safetyCritical
      && diagnosis.possible_causes.some((cause) => cause.diy_difficulty === "easy" || cause.diy_difficulty === "moderate");

    if (!diyAllowed) {
      recommendation.parts_likely_needed = [];
      recommendation.diy_steps_by_part = [];
    } else {
      const stepsByPart = new Map(
        recommendation.diy_steps_by_part
          .filter((item) => item && typeof item.part_name === "string" && Array.isArray(item.steps) && item.steps.length > 0)
          .map((item) => [item.part_name.trim().toLowerCase(), item])
      );
      recommendation.parts_likely_needed = recommendation.parts_likely_needed.filter((part) =>
        stepsByPart.has(part.trim().toLowerCase())
      );
      recommendation.diy_steps_by_part = recommendation.parts_likely_needed
        .map((part) => stepsByPart.get(part.trim().toLowerCase()))
        .filter((item): item is { part_name: string; steps: string[] } => Boolean(item));
    }

    const routineMaintenance = diagnosis.possible_causes.some((cause) =>
      /\b(filter|wiper|bulb)s?\b/i.test(cause.name)
    );
    if (routineMaintenance) {
      const replaceRepairPhrase = (text: string) =>
        text.replace(/schedule (?:a |the )?repair/gi, "handle this maintenance");
      recommendation.action = replaceRepairPhrase(recommendation.action);
      recommendation.next_steps = recommendation.next_steps.map(replaceRepairPhrase);
    }

    // ── 4b. Build the authoritative DIY vs. shop comparison ─
    // Numbers come from the assessment (never the model) so the four values
    // are always distinct and never reused for two different meanings.
    const comparisonCause = diyAllowed
      ? diagnosis.possible_causes.find((c) => c.diy_difficulty === "easy" || c.diy_difficulty === "moderate")
        ?? diagnosis.possible_causes[0]
      : diagnosis.possible_causes[0];

    // Realistic DIY times for simple, well-known jobs — prevents inflated ranges
    // that contradict an "easy" difficulty badge.
    const REALISTIC_DIY_TIME: { pattern: RegExp; time: string }[] = [
      { pattern: /\bengine air filter\b|\bair filter\b/i, time: "5–15 minutes" },
      { pattern: /\bcabin (air )?filter\b/i, time: "10–20 minutes" },
      { pattern: /\bwiper\b/i, time: "5–10 minutes" },
      { pattern: /\b(head|tail|brake|turn signal)?\s?(light )?bulb\b/i, time: "10–20 minutes" },
      { pattern: /\bkey fob battery\b/i, time: "5 minutes" },
      { pattern: /\bwasher fluid\b/i, time: "5 minutes" },
      { pattern: /\bengine (oil|air)\b.*\bcap\b/i, time: "5 minutes" },
    ];

    const realisticDiyTime = (causeName: string, provided?: string | null): string | null => {
      const match = REALISTIC_DIY_TIME.find((entry) => entry.pattern.test(causeName ?? ""));
      if (match) return match.time;
      return provided ?? null;
    };

    const diyTime = diyAllowed && comparisonCause
      ? realisticDiyTime(comparisonCause.name, comparisonCause.diy_time)
      : null;

    const num = (value: unknown): number | null =>
      typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;

    const costComparison = comparisonCause
      ? {
          cause_name: comparisonCause.name,
          diy_available: Boolean(diyAllowed && diyTime),
          diy: {
            parts_cost_low: diyAllowed ? num(comparisonCause.diy_parts_cost_low) : null,
            parts_cost_high: diyAllowed ? num(comparisonCause.diy_parts_cost_high) : null,
            time: diyTime,
          },
          shop: {
            parts_cost_low: num(comparisonCause.shop_parts_cost_low),
            parts_cost_high: num(comparisonCause.shop_parts_cost_high),
            labor_cost_low: num(comparisonCause.shop_labor_cost_low),
            labor_cost_high: num(comparisonCause.shop_labor_cost_high),
            total_cost_low: num(comparisonCause.estimated_cost_low),
            total_cost_high: num(comparisonCause.estimated_cost_high),
            time: comparisonCause.shop_time ?? null,
          },
        }
      : null;

    const range = (low: number | null, high: number | null) =>
      low == null || high == null ? null : `$${low}–$${high}`;

    const comparisonLines = costComparison
      ? {
          diy: costComparison.diy_available
            ? [
                `Parts: ${range(costComparison.diy.parts_cost_low, costComparison.diy.parts_cost_high) ?? "not available"}`,
                `Time: ${costComparison.diy.time ?? "not available"}`,
              ]
            : [],
          shop: [
            `Parts: ${range(costComparison.shop.parts_cost_low, costComparison.shop.parts_cost_high) ?? "not available"}`,
            `Labor: ${range(costComparison.shop.labor_cost_low, costComparison.shop.labor_cost_high) ?? "not available"}`,
            `Total: ${range(costComparison.shop.total_cost_low, costComparison.shop.total_cost_high) ?? "not available"}`,
            `Time: ${costComparison.shop.time ?? "not available"}`,
          ],
        }
      : { diy: [], shop: [] };

    const shopMatchingNote =
      "Shop matching is currently paused — Wrenchli has no partner shops. When the shop track reopens, partner shops will earn placement through verified repair outcomes, not paid placement.";

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
        diy_time: diyTime,
        shop_time: costComparison?.shop.time ?? null,
        cost_comparison: costComparison,
        comparison_lines: comparisonLines,
        shop_matching_note: shopMatchingNote,
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
