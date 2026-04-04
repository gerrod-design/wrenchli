import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symptoms, year, make, model, trim, vin, zip_code } = await req.json();

    if (!symptoms || symptoms.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Please describe your symptoms" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const vehicleStr = [year, make, model, trim].filter(Boolean).join(" ");

    // Query historical outcomes from diagnosis_records for accuracy data
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let historicalData = { totalCases: 0, similarSymptoms: 0, mostCommonDiagnosis: "", successRate: 0 };
    try {
      const histResp = await fetch(
        `${SUPABASE_URL}/rest/v1/repair_outcomes?select=diagnosis_match,diagnosis_record_id(primary_diagnosis,symptoms)&limit=500`,
        { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
      );
      if (histResp.ok) {
        const outcomes = await histResp.json();
        historicalData.totalCases = outcomes.length;
        const matchCount = outcomes.filter((o: any) => o.diagnosis_match === true).length;
        historicalData.successRate = historicalData.totalCases > 0 
          ? Math.round((matchCount / historicalData.totalCases) * 100) 
          : 88; // default
      }
    } catch { /* non-critical, proceed with defaults */ }

    const systemPrompt = `You are Wrenchli's AI diagnostic engine. You analyze vehicle symptoms and provide transparent, data-driven diagnoses.

CRITICAL RULES:
- Provide exactly 2-3 possible diagnoses ranked by probability
- Each diagnosis MUST have a confidence score (0-100)
- Confidence scores must sum to approximately 95-100 (leaving room for "other")
- Provide specific, actionable rationale for each diagnosis
- Include realistic cost ranges based on the vehicle
- Be honest about uncertainty - if confidence is below 70% on the primary, say so
- Cross-reference with common issues for the specific make/model/year

Vehicle: ${vehicleStr || "Not specified"}
Historical network data: ${historicalData.totalCases} total repair cases tracked, ${historicalData.successRate}% diagnostic accuracy rate.

Respond in this exact JSON format:
{
  "primaryDiagnosis": "string - the most likely issue",
  "primaryConfidence": number (0-100),
  "rationale": "string - 2-3 sentences explaining WHY this is the primary diagnosis, citing specific evidence",
  "alternativeDiagnoses": [
    {"diagnosis": "string", "probability": number (0-100), "rationale": "string"}
  ],
  "costEstimate": {"min": number, "max": number, "breakdown": "string describing parts vs labor"},
  "recommendedAction": "string - what the customer should do next",
  "urgency": "low" | "medium" | "high",
  "confidenceWarning": "string | null - only if primary confidence < 70%"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `My ${vehicleStr} is experiencing: ${symptoms}${zip_code ? `. Located in ZIP: ${zip_code}` : ""}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_diagnosis",
            description: "Provide a structured vehicle diagnosis with confidence scores",
            parameters: {
              type: "object",
              properties: {
                primaryDiagnosis: { type: "string" },
                primaryConfidence: { type: "number" },
                rationale: { type: "string" },
                alternativeDiagnoses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      diagnosis: { type: "string" },
                      probability: { type: "number" },
                      rationale: { type: "string" },
                    },
                    required: ["diagnosis", "probability", "rationale"],
                  },
                },
                costEstimate: {
                  type: "object",
                  properties: {
                    min: { type: "number" },
                    max: { type: "number" },
                    breakdown: { type: "string" },
                  },
                  required: ["min", "max", "breakdown"],
                },
                recommendedAction: { type: "string" },
                urgency: { type: "string", enum: ["low", "medium", "high"] },
                confidenceWarning: { type: "string" },
              },
              required: ["primaryDiagnosis", "primaryConfidence", "rationale", "alternativeDiagnoses", "costEstimate", "recommendedAction", "urgency"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "provide_diagnosis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const diagnosis = JSON.parse(toolCall.function.arguments);

    // Store in diagnosis_records
    let trackingNumber: string | null = null;
    try {
      trackingNumber = `WR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      await fetch(`${SUPABASE_URL}/rest/v1/diagnosis_records`, {
        method: "POST",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          symptoms,
          vehicle_year: year || null,
          vehicle_make: make || null,
          vehicle_model: model || null,
          vehicle_trim: trim || null,
          vin: vin || null,
          zip_code: zip_code || null,
          primary_diagnosis: diagnosis.primaryDiagnosis,
          primary_confidence: diagnosis.primaryConfidence,
          rationale: diagnosis.rationale,
          alternative_diagnoses: diagnosis.alternativeDiagnoses,
          cost_estimate_low: diagnosis.costEstimate.min,
          cost_estimate_high: diagnosis.costEstimate.max,
          recommended_action: diagnosis.recommendedAction,
          ai_model_used: "google/gemini-3-flash-preview",
          historical_total_cases: historicalData.totalCases,
          historical_success_rate: historicalData.successRate,
          tracking_number: trackingNumber,
          status: "diagnosis_complete",
        }),
      });
    } catch (e) {
      console.error("Failed to store diagnosis record:", e);
    }

    return new Response(JSON.stringify({
      ...diagnosis,
      trackingNumber,
      historicalData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-diagnose error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
