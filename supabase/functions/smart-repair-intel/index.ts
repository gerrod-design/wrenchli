import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { diagnosis_title, diagnosis_code, vehicle_year, vehicle_make, vehicle_model, diy_cost, shop_cost } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const vehicleStr = [vehicle_year, vehicle_make, vehicle_model].filter(Boolean).join(" ");

    const systemPrompt = `You are an automotive repair intelligence engine. You must respond ONLY by calling the provided tool function. Never respond with plain text.`;

    const userPrompt = `Vehicle: ${vehicleStr || "Unknown"}
Repair: ${diagnosis_title}
DTC Code: ${diagnosis_code || "N/A"}
DIY cost estimate: ${diy_cost || "N/A"}
Shop cost estimate: ${shop_cost || "N/A"}

Analyze this repair scenario and provide:
1. Three precise YouTube search queries optimized to find the BEST tutorial video for this EXACT vehicle and repair. Each query should target a different angle (model-specific tutorial, general technique, troubleshooting).
2. Whether this is a commonly known issue for this specific vehicle make/model/year. If yes, explain why (e.g., "The ${vehicleStr} is known for premature brake wear due to undersized rotors").
3. An estimated DIY success rate percentage (realistic, based on difficulty) and the approximate number of steps.
4. A one-line motivational message for the DIYer (e.g., "Most owners complete this in under 2 hours").`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        tools: [
          {
            name: "provide_repair_intel",
            description: "Return structured repair intelligence data",
            input_schema: {
              type: "object",
              properties: {
                youtube_queries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      query: { type: "string", description: "Optimized YouTube search query" },
                      label: { type: "string", description: "Short human-readable label for the query" },
                      angle: { type: "string", enum: ["model_specific", "technique", "troubleshooting"] },
                    },
                    required: ["query", "label", "angle"],
                  },
                },
                is_common_issue: { type: "boolean", description: "Whether this is a known common issue for this vehicle" },
                common_issue_reason: { type: "string", description: "Why this is a common issue, or empty if not" },
                diy_success_rate: { type: "number", description: "Estimated success rate for DIY repair (0-100)" },
                estimated_steps: { type: "number", description: "Approximate number of steps to complete the repair" },
                confidence_message: { type: "string", description: "One-line motivational message for the DIYer" },
              },
              required: ["youtube_queries", "is_common_issue", "common_issue_reason", "diy_success_rate", "estimated_steps", "confidence_message"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "provide_repair_intel" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Anthropic API error:", response.status, t);
      throw new Error("Anthropic API error");
    }

    const data = await response.json();
    const toolUse = data.content?.find((block: any) => block.type === "tool_use" && block.name === "provide_repair_intel");
    if (!toolUse) throw new Error("No tool call in response");

    return new Response(JSON.stringify(toolUse.input), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("smart-repair-intel error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
