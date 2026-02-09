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

    const { codes, symptom, year, make, model } = body as Record<string, string>;

    if (!codes && !symptom) {
      return new Response(
        JSON.stringify({ error: "Provide either 'codes' or 'symptom'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs
    const safeYear = (year || "").slice(0, 4);
    const safeMake = (make || "").slice(0, 30);
    const safeModel = (model || "").slice(0, 30);
    const safeCodes = (codes || "").slice(0, 60);
    const safeSymptom = (symptom || "").slice(0, 500);

    const vehicleStr = [safeYear, safeMake, safeModel].filter(Boolean).join(" ");

    let userPrompt: string;
    if (safeCodes) {
      userPrompt = `Diagnose these OBD2 diagnostic trouble codes for a ${vehicleStr || "vehicle"}: ${safeCodes}`;
    } else {
      userPrompt = `Diagnose this car problem for a ${vehicleStr || "vehicle"}: "${safeSymptom}"`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
              content: `You are Wrenchli's expert automotive diagnostics AI. Given a DTC code or symptom description, provide a structured diagnosis. Format your response EXACTLY as follows using these section headers on their own lines:

**DIAGNOSIS TITLE**
[One-line title of the most likely issue]

**WHAT'S HAPPENING**
[2-3 sentence plain-English explanation of the problem]

**COMMON CAUSES**
- [Cause 1]
- [Cause 2]
- [Cause 3]

**URGENCY**
[One word: Low, Medium, or High]

**DIY DIFFICULTY**
[One word: Easy, Moderate, or Advanced]

**ESTIMATED DIY COST**
[Range like $50–$150]

**ESTIMATED SHOP COST**
[Range like $200–$500]

**RECOMMENDED NEXT STEPS**
1. [Step 1]
2. [Step 2]
3. [Step 3]

Be specific to the vehicle when provided. Be honest about when a professional is needed. Keep it concise and actionable.`,
            },
            { role: "user", content: userPrompt },
          ],
          stream: true,
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
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("diagnose error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
