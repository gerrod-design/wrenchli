import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const corsHeaders = getCorsHeaders(null);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PushRequest {
  session_id: string;
  shop_integration_id: string;
}

async function pushToTekmetric(apiKey: string, locationId: string, sessionData: Record<string, unknown>) {
  // Tekmetric API: create repair order
  const res = await fetch("https://shop.tekmetric.com/api/v1/repair-orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shopId: parseInt(locationId),
      customerId: null,
      vehicleId: null,
      note: `Wrenchli Assessment: ${sessionData.primary_diagnosis || "See details"}\nVehicle: ${sessionData.vehicle_year} ${sessionData.vehicle_make} ${sessionData.vehicle_model}\nSymptoms: ${sessionData.symptoms}\nEstimated Cost: $${sessionData.cost_estimate_low}–$${sessionData.cost_estimate_high}`,
    }),
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
    const { session_id, shop_integration_id }: PushRequest = await req.json();
    if (!session_id || !shop_integration_id) {
      return new Response(JSON.stringify({ error: "session_id and shop_integration_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get integration details
    const { data: integration, error: intErr } = await supabase
      .from("shop_integrations")
      .select("*")
      .eq("id", shop_integration_id)
      .single();
    if (intErr || !integration) throw new Error("Integration not found");

    // Get session/diagnosis data
    const { data: diagnosis } = await supabase
      .from("diagnosis_records")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const sessionData = diagnosis || {};

    // Create sync log entry
    const { data: syncLog } = await supabase
      .from("integration_sync_log")
      .insert({
        shop_integration_id,
        session_id,
        direction: "push",
        status: "pending",
        payload_sent: sessionData,
      })
      .select()
      .single();

    let result: Record<string, unknown> = {};
    let smsRecordId = "";

    try {
      if (integration.sms_provider === "tekmetric") {
        result = await retryWithBackoff(() =>
          pushToTekmetric(integration.api_key_encrypted, integration.shop_location_id || "", sessionData)
        );
        smsRecordId = result?.id?.toString() || "";
      } else {
        // Placeholder for other providers — architecture supports adding them
        throw new Error(`Provider ${integration.sms_provider} not yet implemented`);
      }

      // Update sync log as success
      await supabase
        .from("integration_sync_log")
        .update({ status: "success", response_received: result, sms_record_id: smsRecordId, completed_at: new Date().toISOString() })
        .eq("id", syncLog?.id);

      // Update last_sync_at
      await supabase
        .from("shop_integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", shop_integration_id);

      return new Response(JSON.stringify({ success: true, repair_order_id: smsRecordId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (pushErr: unknown) {
      const errMsg = pushErr instanceof Error ? pushErr.message : "Unknown error";
      await supabase
        .from("integration_sync_log")
        .update({ status: "failed", error_message: errMsg, completed_at: new Date().toISOString() })
        .eq("id", syncLog?.id);

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
