import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      current_vehicle,
      repair_cost_low,
      repair_cost_high,
      replacement_year,
      replacement_make,
      replacement_model,
      replacement_price,
      replacement_url,
      zip_code,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const replacementDesc = [replacement_year, replacement_make, replacement_model]
      .filter(Boolean)
      .join(" ");

    const prompt = `You are an automotive financial advisor. Compare the total cost of ownership (TCO) over 3 years for two options:

**Option A: Repair current vehicle**
- Vehicle: ${current_vehicle}
- Estimated repair cost: $${repair_cost_low} – $${repair_cost_high}
- ZIP code area: ${zip_code}

**Option B: Purchase replacement vehicle**
- Vehicle: ${replacementDesc || "Not specified"}
- Approximate purchase price: $${replacement_price || "Not specified"}
${replacement_url ? `- Listing URL for reference: ${replacement_url}` : ""}
- ZIP code area: ${zip_code}

Estimate the following for EACH option over 3 years:
1. Upfront cost (repair cost OR down payment + taxes/fees)
2. Monthly payment (if financing the replacement)
3. Annual insurance estimate
4. Annual depreciation estimate
5. Expected maintenance costs over 3 years
6. Total 3-year cost of ownership

Use the tool "compare_tco" to return structured results. Be realistic with estimates based on the ZIP code region. If the replacement vehicle details are vague, make reasonable assumptions and note them. All dollar amounts should be numbers (not strings).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "compare_tco",
              description: "Return a structured TCO comparison between repairing and replacing a vehicle.",
              parameters: {
                type: "object",
                properties: {
                  repair_option: {
                    type: "object",
                    properties: {
                      upfront_cost: { type: "number" },
                      monthly_payment: { type: "number" },
                      annual_insurance: { type: "number" },
                      annual_depreciation: { type: "number" },
                      maintenance_3yr: { type: "number" },
                      total_3yr: { type: "number" },
                    },
                    required: ["upfront_cost", "monthly_payment", "annual_insurance", "annual_depreciation", "maintenance_3yr", "total_3yr"],
                    additionalProperties: false,
                  },
                  replace_option: {
                    type: "object",
                    properties: {
                      upfront_cost: { type: "number" },
                      monthly_payment: { type: "number" },
                      annual_insurance: { type: "number" },
                      annual_depreciation: { type: "number" },
                      maintenance_3yr: { type: "number" },
                      total_3yr: { type: "number" },
                    },
                    required: ["upfront_cost", "monthly_payment", "annual_insurance", "annual_depreciation", "maintenance_3yr", "total_3yr"],
                    additionalProperties: false,
                  },
                  recommendation: { type: "string", description: "A 2-3 sentence plain-English recommendation." },
                  assumptions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key assumptions made in the estimate.",
                  },
                  savings_amount: { type: "number", description: "How much cheaper the better option is over 3 years." },
                  better_option: { type: "string", enum: ["repair", "replace"], description: "Which option is cheaper over 3 years." },
                },
                required: ["repair_option", "replace_option", "recommendation", "assumptions", "savings_amount", "better_option"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "compare_tco" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI comparison failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compare-ownership error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
