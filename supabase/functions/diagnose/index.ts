import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.STANDARD);
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

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: `You are Wrenchli's expert automotive diagnostics AI. Given a DTC code or symptom description, return one or more structured diagnoses using the provide_diagnoses tool. Each diagnosis should be specific to the vehicle when provided. Be honest about when a professional is needed. If the input could indicate multiple issues, return multiple diagnoses (up to 3).

For every easy or moderate DIY result, provide one internally consistent comparison with four distinct estimates: DIY parts cost, DIY hands-on time, shop parts and labor separately plus shop total, and shop appointment/service time. Never reuse one range for two meanings. Shop total must equal shop parts plus shop labor at both ends and must not equal the DIY parts range. Use the exact same time estimates everywhere in the result and do not add competing times to explanatory text.

For every part in diy_parts, provide matching safe instructions in diy_steps_by_part using the exact same part_name. Omit any part that lacks instructions. Filters, wipers, and bulbs are routine maintenance: say replace, check, or handle this maintenance; never say "schedule a repair."

SAFETY HARD BLOCK: Any diagnosis involving brakes, steering, airbags, or fuel must use diy_feasibility "advanced", return empty diy_parts and diy_steps_by_part arrays, and contain no DIY guidance.`,
        messages: [{ role: "user", content: userPrompt }],
        tools: [
          {
            name: "provide_diagnoses",
            description: "Return structured vehicle diagnosis results",
            input_schema: {
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
                      diy_time: { type: "string", description: "DIY hands-on time range; empty for advanced results" },
                      shop_parts_cost: { type: "string", description: "Shop parts cost range only" },
                      shop_labor_cost: { type: "string", description: "Shop labor cost range only" },
                      shop_cost: { type: "string", description: "Shop total range equal to shop parts plus shop labor" },
                      shop_time: { type: "string", description: "Expected shop appointment or service time range" },
                      diy_parts: { type: "array", items: { type: "string" }, description: "Parts with matching DIY instructions; empty for advanced results" },
                      diy_steps_by_part: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            part_name: { type: "string" },
                            steps: { type: "array", items: { type: "string" } },
                          },
                          required: ["part_name", "steps"],
                        },
                      },
                    },
                    required: ["title", "code", "urgency", "whats_happening", "common_causes", "diy_feasibility", "diy_cost", "diy_time", "shop_parts_cost", "shop_labor_cost", "shop_cost", "shop_time", "diy_parts", "diy_steps_by_part"],
                  },
                },
              },
              required: ["diagnoses"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "provide_diagnoses" },
      }),
    });

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
      console.error("Anthropic API error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolUse = data.content?.find((block: any) => block.type === "tool_use" && block.name === "provide_diagnoses");
    if (!toolUse) {
      return new Response(
        JSON.stringify({ error: "Unexpected AI response format" }),
        { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } }
      );
    }

    const diagnoses = Array.isArray(toolUse.input?.diagnoses) ? toolUse.input.diagnoses : [];
    for (const diagnosis of diagnoses) {
      const text = `${diagnosis.title ?? ""} ${(diagnosis.common_causes ?? []).join(" ")} ${diagnosis.whats_happening ?? ""}`;
      const safetyCritical = /\bbrak/i.test(text) || /\bsteer/i.test(text) || /\bair\s?bags?/i.test(text) || /\bfuel/i.test(text);
      if (safetyCritical) {
        diagnosis.diy_feasibility = "advanced";
        diagnosis.diy_cost = "Not available — shop required";
        diagnosis.diy_time = "Not available — shop required";
        diagnosis.diy_parts = [];
        diagnosis.diy_steps_by_part = [];
      } else {
        const steps = new Map(
          (Array.isArray(diagnosis.diy_steps_by_part) ? diagnosis.diy_steps_by_part : [])
            .filter((item: any) => typeof item?.part_name === "string" && Array.isArray(item.steps) && item.steps.length > 0)
            .map((item: any) => [item.part_name.trim().toLowerCase(), item])
        );
        diagnosis.diy_parts = (Array.isArray(diagnosis.diy_parts) ? diagnosis.diy_parts : [])
          .filter((part: string) => steps.has(part.trim().toLowerCase()));
        diagnosis.diy_steps_by_part = diagnosis.diy_parts
          .map((part: string) => steps.get(part.trim().toLowerCase()))
          .filter(Boolean);
      }
    }

    return new Response(JSON.stringify({ ...toolUse.input, diagnoses }), {
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
