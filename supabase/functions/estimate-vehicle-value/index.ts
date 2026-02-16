const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ValueRequest {
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  zipCode?: string;
  condition?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ValueRequest = await req.json();
    const { year, make, model, trim, mileage, zipCode, condition } = body;

    if (!year || !make || !model || !mileage) {
      return new Response(
        JSON.stringify({ success: false, error: "year, make, model, and mileage are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vehicleDesc = [year, make, model, trim].filter(Boolean).join(" ");
    const conditionNote = condition || "average";

    const prompt = `You are a vehicle valuation expert. Estimate the current fair market value of the following vehicle as of February 2026. Provide values similar to what KBB, Edmunds, or NADA would show.

Vehicle: ${vehicleDesc}
Mileage: ${mileage.toLocaleString()} miles
Condition: ${conditionNote}
${zipCode ? `Location ZIP: ${zipCode}` : ""}

Respond ONLY with a valid JSON object (no markdown, no explanation) with these exact fields:
{
  "private_party_low": <number>,
  "private_party_high": <number>,
  "trade_in_low": <number>,
  "trade_in_high": <number>,
  "dealer_retail_low": <number>,
  "dealer_retail_high": <number>,
  "fair_market_value": <number>,
  "confidence": <number 1-100>,
  "factors": [<string>, <string>, ...],
  "market_trend": "appreciating" | "stable" | "depreciating"
}

Be accurate and realistic. Consider current used car market conditions, supply/demand, vehicle reliability reputation, and any special factors (e.g., PHEV tax credits, discontinued models, high demand trims).`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: "Valuation service temporarily unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResp.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? "";
    
    // Strip markdown fences if present
    const jsonStr = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let valuation;
    try {
      valuation = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse valuation response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        vehicle: { year, make, model, trim, mileage },
        valuation,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("estimate-vehicle-value error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Valuation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
