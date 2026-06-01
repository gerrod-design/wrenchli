import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

// Public wrapper around the internal send-alert-email function for the
// browser-side "Book at This Shop" flow. Validates input + rate limits,
// then forwards server-to-server using INTERNAL_SECRET so the email
// function itself stays locked down.

interface BookingBody {
  to?: string;
  shopName?: string;
  customerName?: string;
  customerPhone?: string;
  preferredTime?: string;
  vehicle?: string;
  diagnosisTitle?: string;
  notes?: string;
}

function isNonEmptyString(v: unknown, max: number): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  }

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.STRICT);
  if (!rateResult.allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: {
        ...securityHeaders,
        ...getRateLimitHeaders(RATE_LIMITS.STRICT.maxRequests, rateResult.remaining, rateResult.resetTime),
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const body = (await req.json()) as BookingBody;

    if (
      !isNonEmptyString(body.customerName, 100) ||
      !isNonEmptyString(body.customerPhone, 20) ||
      !isNonEmptyString(body.preferredTime, 120) ||
      !isNonEmptyString(body.vehicle, 200) ||
      !isNonEmptyString(body.diagnosisTitle, 200)
    ) {
      return new Response(JSON.stringify({ error: "Missing or invalid fields" }), {
        status: 400,
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const to =
      isNonEmptyString(body.to, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)
        ? body.to
        : "bookings@wrenchli.net";

    const notes = typeof body.notes === "string" ? body.notes.slice(0, 500) : "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const internalSecret = Deno.env.get("INTERNAL_SECRET") ?? "";

    const res = await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({
        to,
        alertData: {
          type: "booking",
          shopName: body.shopName || "your shop",
          customerName: body.customerName,
          customerPhone: body.customerPhone,
          preferredTime: body.preferredTime,
          vehicle: body.vehicle,
          diagnosisTitle: body.diagnosisTitle,
          notes,
        },
      }),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("send-alert-email failed:", res.status, result);
      return new Response(JSON.stringify({ error: "Booking forward failed" }), {
        status: 502,
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submit-booking-request error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } }
    );
  }
});
