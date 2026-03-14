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
    const { image_urls, vehicle_info } = await req.json();

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one image URL is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const vehicleContext = vehicle_info
      ? `The vehicle is a ${vehicle_info}.`
      : "The vehicle make/model is unknown.";

    const imageContent = image_urls.map((url: string) => ({
      type: "image_url" as const,
      image_url: { url },
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert automotive damage assessment specialist. Analyze vehicle damage photos and provide a structured diagnosis.

Always respond with valid JSON in this exact format:
{
  "damage_type": "Brief name of the damage type",
  "severity": "minor" | "moderate" | "severe",
  "affected_area": "Which part of the vehicle is affected",
  "description": "Detailed description of the visible damage",
  "safety_concern": true | false,
  "safety_notes": "Any safety concerns if applicable",
  "repair_options": [
    {
      "option": "Name of repair option",
      "description": "What this repair involves",
      "estimated_cost_low": number,
      "estimated_cost_high": number,
      "difficulty": "DIY" | "Professional" | "Body Shop",
      "time_estimate": "Estimated time to complete"
    }
  ],
  "recommended_action": "What the vehicle owner should do next",
  "urgency": "can_wait" | "soon" | "immediate"
}

Be specific and helpful. Provide realistic cost estimates in USD. If you cannot identify damage or the image is unclear, say so honestly.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze the following vehicle damage photo(s). ${vehicleContext} Identify the damage, assess severity, and provide repair options with cost estimates.`,
              },
              ...imageContent,
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Extract JSON from the response (handle markdown code blocks)
    let diagnosis;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      diagnosis = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({
          error: "Could not analyze the image. Please try with a clearer photo.",
          raw_response: content,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ diagnosis, image_urls }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diagnose-damage-photo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
