import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

// Batch 5 (spec SS2): odometer photo intake. The function READS a dashboard
// photo and returns a candidate value — it stores NOTHING. The client
// shows the value to the owner as a prefill; only an owner-confirmed value
// is written to the readings ledger (as a normal sourced insert). When the
// reading is not clearly legible, the function says so (confident: false)
// and the owner enters the number manually. Authenticated callers only:
// the photo lives in the owner's private garage media bucket.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";

async function getCallerUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  if (token === Deno.env.get("SUPABASE_ANON_KEY")) return null;
  if (token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await authClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  if ((data.claims as Record<string, unknown>).role !== "authenticated") return null;
  return data.claims.sub as string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.STRICT);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
      { status: 429, headers: { ...securityHeaders, ...getRateLimitHeaders(RATE_LIMITS.STRICT.maxRequests, rateResult.remaining, rateResult.resetTime), "Content-Type": "application/json" } },
    );
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = await getCallerUserId(req);
    if (!callerUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const { image_url } = await req.json();
    if (!image_url || typeof image_url !== "string" || !image_url.startsWith("https://")) {
      return new Response(
        JSON.stringify({ error: "A single image URL is required." }),
        { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    const ANTHROPIC_API_KEY = <redacted_query_secret_1>("ANTHROPIC_API_KEY");
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
        max_tokens: 300,
        system: `You read vehicle odometer photos. Extract the TOTAL odometer value (the main lifetime mileage counter — never a trip counter if both are visible; if you cannot tell which is the total, say confident false).

Always respond with valid JSON in exactly this format:
{
  "value": number or null,
  "unit": "mi" or "km",
  "confident": true or false
}

Rules:
- "value" is the odometer number as a plain integer (no commas, no decimals). A tenths digit after a decimal point is NOT part of the value.
- "unit" is what the cluster displays ("mi"/"miles" -> "mi", "km" -> "km"). If no unit is visible, use "mi".
- "confident" is false when the digits are blurry, partially hidden, ambiguous, or the image is not an odometer. Never guess digits you cannot read.`,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Read the total odometer value in this dashboard photo." },
              { type: "image", source: { type: "url", url: image_url } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "The photo could not be read. Enter the reading manually." }),
        { status: 502, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiResult = await response.json();
    const content: string = aiResult.content?.[0]?.text || "";
    let parsed: { value?: unknown; unit?: unknown; confident?: unknown } | null = null;
    try {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch {
      parsed = null;
    }

    const value = typeof parsed?.value === "number" && Number.isFinite(parsed.value) && parsed.value > 0
      ? Math.round(parsed.value)
      : null;
    const unit = parsed?.unit === "km" ? "km" : "mi";
    const confident = parsed?.confident === true && value !== null;

    return new Response(
      JSON.stringify({ value, unit, confident }),
      { headers: { ...securityHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in read-odometer-photo:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } },
    );
  }
});
