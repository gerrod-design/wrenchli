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
      { status: 429, headers: { ...securityHeaders, ...getRateLimitHeaders(RATE_LIMITS.STANDARD.maxRequests, rateResult.remaining, rateResult.resetTime), "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { diagnosis_title, diagnosis_code, vehicle_year, vehicle_make, vehicle_model, vehicle_trim } = body as Record<string, string>;

    if (!diagnosis_title) {
      return new Response(
        JSON.stringify({ error: "diagnosis_title is required" }),
        { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } }
      );
    }

    const vehicleStr = [vehicle_year, vehicle_make, vehicle_model, vehicle_trim].filter(Boolean).join(" ");

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
        max_tokens: 1024,
        system: `You are an automotive parts recommendation engine. Given a vehicle diagnosis and optional vehicle info, recommend 3 specific real products (parts, tools, or supplies) that would help a DIYer fix the issue. Use real brand names and realistic pricing. Each product should have an Amazon search query that would find a relevant product. Also estimate the DIY time range and approximate total parts cost.`,
        messages: [
          {
            role: "user",
            content: `Diagnosis: ${diagnosis_title}${diagnosis_code ? ` (Code: ${diagnosis_code})` : ""}\nVehicle: ${vehicleStr || "Unknown"}\n\nRecommend 3 specific products to fix this issue.`,
          },
        ],
        tools: [
          {
            name: "provide_product_recommendations",
            description: "Return product recommendations for a vehicle diagnosis",
            input_schema: {
              type: "object",
              properties: {
                products: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Product name with brand" },
                      description: { type: "string", description: "One-line product description" },
                      price: { type: "string", description: "Estimated price, e.g. '$24.99'" },
                      brand: { type: "string" },
                      search_query: { type: "string", description: "Amazon search query to find this product" },
                      category: { type: "string", enum: ["part", "tool", "supply"] },
                      rating: { type: "number", description: "Typical rating 4.0-4.8" },
                      review_count: { type: "number", description: "Approximate review count" },
                    },
                    required: ["title", "description", "price", "brand", "search_query", "category", "rating", "review_count"],
                  },
                },
                diy_time_range: { type: "string", description: "Estimated DIY time, e.g. '1-2 hours'" },
                total_parts_range: { type: "string", description: "Approximate total parts cost range, e.g. '$30-$80'" },
              },
              required: ["products", "diy_time_range", "total_parts_range"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "provide_product_recommendations" },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Anthropic API error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: response.status >= 400 && response.status < 500 ? response.status : 500, headers: { ...securityHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolUse = data.content?.find((block: any) => block.type === "tool_use" && block.name === "provide_product_recommendations");
    if (!toolUse) {
      return new Response(
        JSON.stringify({ error: "Unexpected AI response format" }),
        { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(toolUse.input), {
      headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend-products error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } }
    );
  }
});
