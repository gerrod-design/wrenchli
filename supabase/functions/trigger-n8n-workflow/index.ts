import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  // Internal-only: cron/function-to-function callers must present INTERNAL_SECRET
  const internalSecret = Deno.env.get('INTERNAL_SECRET');
  const callerSecret = req.headers.get('x-internal-secret');
  if (!internalSecret || callerSecret !== internalSecret) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }



  try {
    const { event_type, payload } = await req.json();

    if (!event_type || !payload) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: event_type, payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Insert into webhook queue
    const { error: insertError } = await supabase
      .from("webhook_queue")
      .insert({ event_type, payload });

    if (insertError) {
      console.error("[trigger-n8n-workflow] Insert error:", insertError);
      throw insertError;
    }

    // Immediately drain the queue
    const drainUrl = `${supabaseUrl}/functions/v1/drain-webhook-queue`;
    const drainRes = await fetch(drainUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({}),
    });

    const drainResult = await drainRes.json();

    return new Response(
      JSON.stringify({ queued: true, drain_result: drainResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[trigger-n8n-workflow] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
