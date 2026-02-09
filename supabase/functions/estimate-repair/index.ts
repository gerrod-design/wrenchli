import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { diagnosis_title, diagnosis_code, vehicle_year, vehicle_make, vehicle_model, vehicle_trim, zip_code, diy_feasibility, urgency } =
      body as Record<string, string>;

    if (!diagnosis_title || !zip_code) {
      return new Response(
        JSON.stringify({ error: "diagnosis_title and zip_code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate ZIP
    const zipClean = (zip_code || "").replace(/\D/g, "").slice(0, 5);
    if (zipClean.length !== 5) {
      return new Response(
        JSON.stringify({ error: "Invalid ZIP code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeTitle = (diagnosis_title || "").slice(0, 200);
    const safeCode = (diagnosis_code || "").slice(0, 10);
    const safeYear = (vehicle_year || "").slice(0, 4);
    const safeMake = (vehicle_make || "").slice(0, 30);
    const safeModel = (vehicle_model || "").slice(0, 30);
    const safeTrim = (vehicle_trim || "").slice(0, 30);
    const safeDiy = (diy_feasibility || "").slice(0, 20);
    const safeUrgency = (urgency || "").slice(0, 10);

    const vehicleStr = [safeYear, safeMake, safeModel, safeTrim].filter(Boolean).join(" ");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Estimate professional repair costs for the following:

Vehicle: ${vehicleStr || "Unknown vehicle"}
Diagnosis: ${safeTitle}${safeCode ? ` (Code: ${safeCode})` : ""}
DIY Feasibility: ${safeDiy || "unknown"}
Urgency: ${safeUrgency || "unknown"}
Customer ZIP Code: ${zipClean}

Provide a realistic cost estimate for this repair in the metro area around ZIP code ${zipClean}. Consider labor rates, parts costs, and regional pricing variations. Be honest and transparent — this estimate will be shared with both the customer and the repair shop.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are Wrenchli's automotive repair cost estimator. You provide transparent, realistic repair cost estimates based on the diagnosis, vehicle, and customer's geographic area (ZIP code). Your estimates should reflect real-world pricing including parts and labor for that region. Be honest — both the customer and the repair shop will see this estimate. Always provide a range (low to high). Include a brief breakdown of what's included in the estimate.`,
            },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "provide_cost_estimate",
                description: "Return a structured cost estimate for a vehicle repair",
                parameters: {
                  type: "object",
                  properties: {
                    metro_area: {
                      type: "string",
                      description: "The metro area name based on the ZIP code, e.g. 'Detroit Metro Area'",
                    },
                    cost_low: {
                      type: "number",
                      description: "Low end of the estimated cost range in dollars",
                    },
                    cost_high: {
                      type: "number",
                      description: "High end of the estimated cost range in dollars",
                    },
                    parts_estimate: {
                      type: "string",
                      description: "Estimated parts cost range, e.g. '$80–$150'",
                    },
                    labor_estimate: {
                      type: "string",
                      description: "Estimated labor cost range, e.g. '$120–$250'",
                    },
                    labor_hours: {
                      type: "string",
                      description: "Estimated labor hours, e.g. '1.5–2.5 hours'",
                    },
                    regional_notes: {
                      type: "string",
                      description: "Any regional pricing notes, e.g. 'Detroit area labor rates average $95–$130/hr'",
                    },
                    what_to_expect: {
                      type: "string",
                      description: "Brief 1-2 sentence description of what the repair involves for the customer",
                    },
                    warranty_note: {
                      type: "string",
                      description: "Typical warranty information for this type of repair",
                    },
                  },
                  required: ["metro_area", "cost_low", "cost_high", "parts_estimate", "labor_estimate", "labor_hours", "regional_notes", "what_to_expect", "warranty_note"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "provide_cost_estimate" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "provide_cost_estimate") {
      return new Response(
        JSON.stringify({ error: "Unexpected AI response format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const estimate = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(estimate), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("estimate-repair error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
