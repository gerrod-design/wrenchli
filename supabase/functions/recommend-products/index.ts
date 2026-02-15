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
    const body = await req.json().catch(() => ({}));
    const {
      diagnosis_title,
      diagnosis_code,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      vehicle_trim,
    } = body as Record<string, string>;

    if (!diagnosis_title) {
      return new Response(
        JSON.stringify({ error: "diagnosis_title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vehicleStr = [vehicle_year, vehicle_make, vehicle_model, vehicle_trim]
      .filter(Boolean)
      .join(" ");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            content: `You are an automotive parts recommendation engine. Given a vehicle diagnosis and optional vehicle info, recommend 3 specific real products (parts, tools, or supplies) that would help a DIYer fix the issue. Use real brand names and realistic pricing. Each product should have an Amazon search query that would find a relevant product. Also estimate the DIY time range and approximate total parts cost.`,
          },
          {
            role: "user",
            content: `Diagnosis: ${diagnosis_title}${diagnosis_code ? ` (Code: ${diagnosis_code})` : ""}
Vehicle: ${vehicleStr || "Unknown"}

Recommend 3 specific products to fix this issue.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_product_recommendations",
              description: "Return product recommendations for a vehicle diagnosis",
              parameters: {
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
                    minItems: 3,
                    maxItems: 3,
                  },
                  diy_time_range: { type: "string", description: "Estimated DIY time, e.g. '1-2 hours'" },
                  total_parts_range: { type: "string", description: "Approximate total parts cost range, e.g. '$30-$80'" },
                },
                required: ["products", "diy_time_range", "total_parts_range"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_product_recommendations" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: response.status >= 400 && response.status < 500 ? response.status : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "provide_product_recommendations") {
      return new Response(
        JSON.stringify({ error: "Unexpected AI response format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recommendations = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend-products error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
