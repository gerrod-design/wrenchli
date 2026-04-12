import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. New diagnostic sessions
    const { count: sessionCount } = await supabase
      .from("diagnostic_sessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);

    // 2. Shop onboarded events from webhook_queue
    const { data: shopEvents } = await supabase
      .from("webhook_queue")
      .select("payload, created_at")
      .eq("event_type", "shop_onboarded")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    // 3. Accuracy alerts
    const { data: accuracyAlerts } = await supabase
      .from("accuracy_alerts")
      .select("category, accuracy_rate, sample_size, alert_date")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    // 4. Security alerts
    const { data: securityAlerts } = await supabase
      .from("security_alerts")
      .select("alert_type, severity, description, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    // 5. Recall found events
    const { data: recallEvents } = await supabase
      .from("webhook_queue")
      .select("payload, created_at")
      .eq("event_type", "recall_found")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    // 6. New pro subscriptions
    const { data: newSubs } = await supabase
      .from("pro_subscriptions")
      .select("status, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    // Build plain-text email
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Detroit",
    });

    const lines: string[] = [];
    lines.push(`WRENCHLI MORNING BRIEFING`);
    lines.push(`${dateStr}`);
    lines.push(`Covering the last 24 hours`);
    lines.push(`${"─".repeat(40)}`);
    lines.push(``);

    // Sessions
    lines.push(`ASSESSMENTS`);
    lines.push(`  New sessions: ${sessionCount ?? 0}`);
    lines.push(``);

    // Shop onboarded
    lines.push(`SHOP ONBOARDING`);
    if (shopEvents && shopEvents.length > 0) {
      for (const ev of shopEvents) {
        const p = ev.payload as Record<string, unknown>;
        lines.push(`  ✓ ${p?.shop_name || "Unknown shop"} — ${p?.city || ""}, ${p?.state || ""}`);
      }
    } else {
      lines.push(`  No new shops onboarded.`);
    }
    lines.push(``);

    // Accuracy alerts
    lines.push(`ACCURACY ALERTS`);
    if (accuracyAlerts && accuracyAlerts.length > 0) {
      for (const a of accuracyAlerts) {
        lines.push(`  ⚠ ${a.category} — ${a.accuracy_rate}% accuracy (n=${a.sample_size})`);
      }
    } else {
      lines.push(`  No accuracy alerts. All clear.`);
    }
    lines.push(``);

    // Security alerts
    lines.push(`SECURITY ALERTS`);
    if (securityAlerts && securityAlerts.length > 0) {
      for (const s of securityAlerts) {
        lines.push(`  🔒 [${s.severity?.toUpperCase()}] ${s.alert_type}: ${s.description}`);
      }
    } else {
      lines.push(`  No security alerts. All clear.`);
    }
    lines.push(``);

    // Recall events
    lines.push(`RECALL ALERTS`);
    if (recallEvents && recallEvents.length > 0) {
      lines.push(`  ${recallEvents.length} new recall(s) discovered.`);
      for (const r of recallEvents.slice(0, 5)) {
        const p = r.payload as Record<string, unknown>;
        lines.push(`  • ${p?.component || "Unknown component"}`);
      }
      if (recallEvents.length > 5) {
        lines.push(`  ... and ${recallEvents.length - 5} more.`);
      }
    } else {
      lines.push(`  No new recalls found.`);
    }
    lines.push(``);

    // Pro subscriptions
    lines.push(`PRO SUBSCRIPTIONS`);
    if (newSubs && newSubs.length > 0) {
      lines.push(`  ${newSubs.length} new subscription(s).`);
    } else {
      lines.push(`  No new subscriptions.`);
    }
    lines.push(``);

    lines.push(`${"─".repeat(40)}`);
    lines.push(`Wrenchli, Inc. · Detroit, MI`);
    lines.push(`https://wrenchli.net`);

    const body = lines.join("\n");

    // Send via Resend (direct API — same pattern as send-alert-email)
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Wrenchli <onboarding@resend.dev>",
        to: ["gerrod@wrenchli.net"],
        subject: `Morning Briefing — ${dateStr}`,
        text: body,
      }),
    });
    const sendResult = await res.json();
    if (!res.ok) throw new Error(`Resend error [${res.status}]: ${JSON.stringify(sendResult)}`);

        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
          "X-Connection-Api-Key": resendApiKey,
        },
        body: JSON.stringify({
          from: "Wrenchli <onboarding@resend.dev>",
          to: ["gerrod@wrenchli.net"],
          subject: `Morning Briefing — ${dateStr}`,
          text: body,
        }),
      });
      sendResult = await res.json();
      if (!res.ok) throw new Error(`Resend error [${res.status}]: ${JSON.stringify(sendResult)}`);
    } else {
      // Direct Resend fallback
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Wrenchli <onboarding@resend.dev>",
          to: ["gerrod@wrenchli.net"],
          subject: `Morning Briefing — ${dateStr}`,
          text: body,
        }),
      });
      sendResult = await res.json();
      if (!res.ok) throw new Error(`Resend error [${res.status}]: ${JSON.stringify(sendResult)}`);
    }

    console.log("[morning-briefing] Sent successfully:", sendResult);

    return new Response(
      JSON.stringify({ success: true, sessions: sessionCount ?? 0, email_id: sendResult?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[morning-briefing] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
