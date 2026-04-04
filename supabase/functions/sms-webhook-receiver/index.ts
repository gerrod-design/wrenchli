import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "@supabase/supabase-js/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Webhook receiver for SMS systems posting repair order status changes
// URL pattern: /functions/v1/sms-webhook-receiver?provider=tekmetric

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider");
    if (!provider) {
      return new Response(JSON.stringify({ error: "provider query param required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Normalize payload based on provider
    let repairOrderId = "";
    let shopIntegrationId = "";
    let isClosed = false;

    if (provider === "tekmetric") {
      // Tekmetric webhook payload structure
      repairOrderId = body?.repairOrderId?.toString() || body?.id?.toString() || "";
      isClosed = body?.status === "COMPLETED" || body?.status === "INVOICED";

      // Look up integration by webhook source
      if (repairOrderId) {
        const { data: syncLog } = await supabase
          .from("integration_sync_log")
          .select("shop_integration_id")
          .eq("sms_record_id", repairOrderId)
          .limit(1)
          .single();
        shopIntegrationId = syncLog?.shop_integration_id || "";
      }
    }

    // If repair order is closed, trigger pull
    if (isClosed && shopIntegrationId && repairOrderId) {
      // Call sms-pull-outcome
      const pullRes = await fetch(`${SUPABASE_URL}/functions/v1/sms-pull-outcome`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shop_integration_id: shopIntegrationId,
          sms_record_id: repairOrderId,
        }),
      });
      const pullResult = await pullRes.json();

      return new Response(JSON.stringify({ received: true, pull_triggered: true, result: pullResult }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Acknowledge receipt even if not closed
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
