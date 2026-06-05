import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";

const corsHeaders = getCorsHeaders(null);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Webhook receiver for SMS systems posting repair order status changes
// URL pattern: /functions/v1/sms-webhook-receiver?provider=tekmetric&integration_id=<uuid>
// Requires HMAC-SHA256 signature in X-Webhook-Signature (hex), keyed by integration's webhook_secret.

const SUPPORTED_PROVIDERS = new Set(["tekmetric"]);

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider") ?? "";
    const integrationId = url.searchParams.get("integration_id") ?? "";

    if (!SUPPORTED_PROVIDERS.has(provider)) {
      return new Response(JSON.stringify({ error: "unsupported provider" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!integrationId) {
      return new Response(JSON.stringify({ error: "integration_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: integration, error: intErr } = await supabase
      .from("shop_integrations")
      .select("id, webhook_secret, sms_provider")
      .eq("id", integrationId)
      .eq("sms_provider", provider)
      .single();

    if (intErr || !integration?.webhook_secret) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify HMAC signature. Accept X-Webhook-Signature or X-Tekmetric-Signature.
    const provided = (
      req.headers.get("x-webhook-signature") ||
      req.headers.get("x-tekmetric-signature") ||
      ""
    ).replace(/^sha256=/, "").trim().toLowerCase();

    const expected = await hmacSha256Hex(integration.webhook_secret, rawBody);

    if (!provided || !timingSafeEqualHex(provided, expected)) {
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: any = {};
    try { body = JSON.parse(rawBody); } catch { body = {}; }

    let repairOrderId = "";
    let isClosed = false;

    if (provider === "tekmetric") {
      repairOrderId = body?.repairOrderId?.toString() || body?.id?.toString() || "";
      isClosed = body?.status === "COMPLETED" || body?.status === "INVOICED";
    }

    if (isClosed && repairOrderId) {
      const internalSecret = Deno.env.get("INTERNAL_SECRET") ?? "";
      const pullRes = await fetch(`${SUPABASE_URL}/functions/v1/sms-pull-outcome`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "x-internal-secret": internalSecret,
        },
        body: JSON.stringify({
          shop_integration_id: integration.id,
          sms_record_id: repairOrderId,
        }),
      });
      const pullResult = await pullRes.json();

      return new Response(JSON.stringify({ received: true, pull_triggered: true, result: pullResult }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ received: true, pull_triggered: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("Webhook error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
