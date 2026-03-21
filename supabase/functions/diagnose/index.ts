import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  // Rate limiting
  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = checkRateLimit(rateLimitId, RATE_LIMITS.STANDARD);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
      {
        status: 429,
        headers: {
          ...securityHeaders,
          ...getRateLimitHeaders(RATE_LIMITS.STANDARD.maxRequests, rateResult.remaining, rateResult.resetTime),
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } }
      );
    }

    const { codes, symptom, year, make, model } = body as Record<string, string>;

    if (!codes && !symptom) {
      return new Response(
        JSON.stringify({ error: "Provide either 'codes' or 'symptom'" }),
        { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } }
      );
    }

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
              content: `You are Wrenchli's expert automotive diagnostics AI. Given a DTC code or symptom description, return one or more structured diagnoses using the provide_diagnoses tool. Each diagnosis should be specific to the vehicle when provided. Be honest about when a professional is needed. Provide realistic cost ranges. If the input could indicate multiple issues, return multiple diagnoses (up to 3).`,
            },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "provide_diagnoses",
                description: "Return structured vehicle diagnosis results",
                parameters: {
                  type: "object",
                  properties: {
                    diagnoses: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "Short diagnosis title, e.g. 'Worn Brake Pads'" },
                          code: { type: "string", description: "The DTC code if applicable, e.g. 'P0420'. Empty string if from symptom." },
                          urgency: { type: "string", enum: ["low", "medium", "high"], description: "Urgency level" },
                          whats_happening: { type: "string", description: "2-3 sentence plain-language explanation. No jargon. Written for someone who knows nothing about cars." },
                          common_causes: {
                            type: "array",
                            items: { type: "string" },
                            description: "2-4 most common causes"
                          },
                          diy_feasibility: { type: "string", enum: ["easy", "moderate", "advanced"], description: "DIY difficulty rating" },
                          diy_cost: { type: "string", description: "DIY parts-only cost range, e.g. '$25–$60'" },
                          shop_cost: { type: "string", description: "Professional repair cost range, e.g. '$150–$350'" },
                        },
                        required: ["title", "code", "urgency", "whats_happening", "common_causes", "diy_feasibility", "diy_cost", "shop_cost"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["diagnoses"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "provide_diagnoses" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...securityHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...securityHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "provide_diagnoses") {
      return new Response(
        JSON.stringify({ error: "Unexpected AI response format" }),
        { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } }
      );
    }

    const diagnoses = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(diagnoses), {
      headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diagnose error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } }
    );
  }
});
