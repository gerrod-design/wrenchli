import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");

    if (!n8nWebhookUrl) {
      return new Response(
        JSON.stringify({ error: "N8N_WEBHOOK_URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch pending events, oldest first, max 10
    const { data: pendingEvents, error: fetchError } = await supabase
      .from("webhook_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("[drain-webhook-queue] Fetch error:", fetchError);
      throw fetchError;
    }

    if (!pendingEvents || pendingEvents.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, sent: 0, failed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    let failed = 0;

    for (const event of pendingEvents) {
      try {
        const res = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: event.event_type,
            payload: event.payload,
          }),
        });

        if (res.ok) {
          await supabase
            .from("webhook_queue")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", event.id);
          sent++;
        } else {
          const body = await res.text();
          console.warn(`[drain-webhook-queue] N8N returned ${res.status}:`, body);
          const newAttempts = (event.attempts || 0) + 1;
          await supabase
            .from("webhook_queue")
            .update({
              attempts: newAttempts,
              status: newAttempts >= 3 ? "failed" : "pending",
            })
            .eq("id", event.id);
          if (newAttempts >= 3) failed++;
        }
      } catch (err) {
        console.error(`[drain-webhook-queue] Error sending event ${event.id}:`, err);
        const newAttempts = (event.attempts || 0) + 1;
        await supabase
          .from("webhook_queue")
          .update({
            attempts: newAttempts,
            status: newAttempts >= 3 ? "failed" : "pending",
          })
          .eq("id", event.id);
        if (newAttempts >= 3) failed++;
      }
    }

    return new Response(
      JSON.stringify({ processed: pendingEvents.length, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[drain-webhook-queue] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
