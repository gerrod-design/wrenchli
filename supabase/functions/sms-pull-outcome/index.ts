import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "@supabase/supabase-js/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PullRequest {
  shop_integration_id: string;
  sms_record_id: string;
}

async function pullFromTekmetric(apiKey: string, repairOrderId: string) {
  const res = await fetch(`https://shop.tekmetric.com/api/v1/repair-orders/${repairOrderId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tekmetric API error [${res.status}]: ${body}`);
  }
  return await res.json();
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error("Retry exhausted");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { shop_integration_id, sms_record_id }: PullRequest = await req.json();
    if (!shop_integration_id || !sms_record_id) {
      return new Response(JSON.stringify({ error: "shop_integration_id and sms_record_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: integration } = await supabase
      .from("shop_integrations")
      .select("*")
      .eq("id", shop_integration_id)
      .single();
    if (!integration) throw new Error("Integration not found");

    // Find the sync log to get the session_id
    const { data: syncLog } = await supabase
      .from("integration_sync_log")
      .select("*")
      .eq("shop_integration_id", shop_integration_id)
      .eq("sms_record_id", sms_record_id)
      .eq("direction", "push")
      .order("attempted_at", { ascending: false })
      .limit(1)
      .single();

    // Create pull sync log
    const { data: pullLog } = await supabase
      .from("integration_sync_log")
      .insert({
        shop_integration_id,
        session_id: syncLog?.session_id || null,
        direction: "pull",
        status: "pending",
        sms_record_id,
      })
      .select()
      .single();

    try {
      let repairData: Record<string, unknown> = {};

      if (integration.sms_provider === "tekmetric") {
        repairData = await retryWithBackoff(() =>
          pullFromTekmetric(integration.api_key_encrypted, sms_record_id)
        );
      } else {
        throw new Error(`Provider ${integration.sms_provider} not yet implemented for pull`);
      }

      // Map to shop_repair_confirmations
      if (syncLog?.session_id) {
        await supabase.from("shop_repair_confirmations").insert({
          session_id: syncLog.session_id,
          shop_id: integration.shop_id,
          shop_integration_id: integration.id,
          confirmed_issue: (repairData as any)?.note || "See repair order",
          actual_total_cost: (repairData as any)?.totalAmount || null,
          repair_order_id: sms_record_id,
        });
      }

      await supabase
        .from("integration_sync_log")
        .update({ status: "success", response_received: repairData, completed_at: new Date().toISOString() })
        .eq("id", pullLog?.id);

      return new Response(JSON.stringify({ success: true, data: repairData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (pullErr: unknown) {
      const errMsg = pullErr instanceof Error ? pullErr.message : "Unknown error";
      await supabase
        .from("integration_sync_log")
        .update({ status: "failed", error_message: errMsg, completed_at: new Date().toISOString() })
        .eq("id", pullLog?.id);

      return new Response(JSON.stringify({ error: errMsg }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
