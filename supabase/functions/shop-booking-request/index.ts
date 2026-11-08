import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { isValidWindowId } from "../_shared/shop-talk-config.ts";

// Booking requests from /for-shops/talk (Option B inbound layer, build
// spec 2026-11-02). NOT the consumer submit-booking-request function
// (that one forwards a shop-visit email; this one never sends anything).
//
// Phase 1 behavior: validate the request, insert it as a PENDING row in
// shop_booking_requests under the service role, and link it to the
// shop-talk conversation when one exists. A human confirms every
// appointment manually, by email or phone (condition 3). This function
// sends NO emails and makes NO calls.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\-.\s\d]{7,25}$/;

function isNonEmptyString(v: unknown, max: number): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, securityHeaders);
  }

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.STRICT);
  if (!rateResult.allowed) {
    return jsonResponse(
      { error: "Rate limit exceeded" },
      429,
      {
        ...securityHeaders,
        ...getRateLimitHeaders(RATE_LIMITS.STRICT.maxRequests, rateResult.remaining, rateResult.resetTime),
      },
    );
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400, securityHeaders);
    }
    const b = (body ?? {}) as Record<string, unknown>;

    if (!isNonEmptyString(b.contactName, 100) || !isNonEmptyString(b.shopName, 200)) {
      return jsonResponse(
        { error: "Please give your name and your shop's name." },
        400,
        securityHeaders,
      );
    }

    const contactPhone =
      typeof b.contactPhone === "string" && PHONE_PATTERN.test(b.contactPhone.trim())
        ? b.contactPhone.trim()
        : null;
    const contactEmail =
      typeof b.contactEmail === "string" && EMAIL_PATTERN.test(b.contactEmail.trim())
        ? b.contactEmail.trim()
        : null;
    if (!contactPhone && !contactEmail) {
      return jsonResponse(
        { error: "Please give a business phone number or an email address so we can confirm." },
        400,
        securityHeaders,
      );
    }

    if (!Array.isArray(b.preferredWindows) || b.preferredWindows.length === 0) {
      return jsonResponse(
        { error: "Please pick at least one time window." },
        400,
        securityHeaders,
      );
    }
    const preferredWindows: string[] = [];
    for (const w of b.preferredWindows) {
      if (!isValidWindowId(w)) {
        return jsonResponse(
          { error: "One of the time windows is not valid." },
          400,
          securityHeaders,
        );
      }
      if (!preferredWindows.includes(w)) preferredWindows.push(w);
    }

    const notes =
      typeof b.notes === "string" ? b.notes.slice(0, 500) : null;
    const conversationId =
      typeof b.conversationId === "string" && UUID_PATTERN.test(b.conversationId)
        ? b.conversationId
        : null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase service configuration missing");
    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await sb
      .from("shop_booking_requests")
      .insert({
        contact_name: b.contactName.trim(),
        shop_name: b.shopName.trim(),
        contact_phone: contactPhone,
        contact_email: contactEmail,
        preferred_windows: preferredWindows,
        notes,
        conversation_id: conversationId,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("shop-booking-request insert failed:", error?.message);
      return jsonResponse(
        { error: "We could not save your request. Please try again." },
        500,
        securityHeaders,
      );
    }

    // Link the conversation log to this booking so the transcript sits
    // against the shop record (condition 4). Fail-soft: the booking is
    // already saved.
    if (conversationId) {
      const { error: linkError } = await sb
        .from("shop_talk_conversations")
        .update({
          booking_request_id: data.id,
          shop_name: b.shopName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
      if (linkError) {
        console.error("shop-booking-request conversation link failed:", linkError.message);
      }
    }

    return jsonResponse(
      { success: true, status: "PENDING", requestId: data.id },
      200,
      securityHeaders,
    );
  } catch (err) {
    console.error("shop-booking-request error:", err);
    return jsonResponse(
      { error: "We could not save your request. Please try again." },
      500,
      securityHeaders,
    );
  }
});
