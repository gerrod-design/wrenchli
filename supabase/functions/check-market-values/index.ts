import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

const SIGNIFICANT_CHANGE_PERCENT = 5;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = checkRateLimit(rateLimitId, RATE_LIMITS.ADMIN);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      { status: 429, headers: { ...securityHeaders, ...getRateLimitHeaders(RATE_LIMITS.ADMIN.maxRequests, rateResult.remaining, rateResult.resetTime), "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: vehicles, error: vErr } = await supabase
      .from("user_vehicles")
      .select("id, make, model, year, user_id");

    if (vErr) throw vErr;
    if (!vehicles || vehicles.length === 0) {
      return new Response(JSON.stringify({ message: "No vehicles to check", alerts: 0 }), {
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    let totalAlerts = 0;
    const newValueAlerts: { userId: string; vehicleName: string; previousValue: number; currentValue: number; changePercent: number; changeDirection: string; summary: string }[] = [];

    for (const vehicle of vehicles) {
      try {
        const { data: prefData } = await supabase
          .from("notification_preferences")
          .select("inapp_market_value")
          .eq("user_id", vehicle.user_id)
          .maybeSingle();

        const enabled = prefData?.inapp_market_value ?? true;
        if (!enabled) continue;

        const { data: history, error: hErr } = await supabase
          .from("vehicle_value_history")
          .select("estimated_value, recorded_at")
          .eq("vehicle_id", vehicle.id)
          .order("recorded_at", { ascending: false })
          .limit(2);

        if (hErr || !history || history.length < 2) continue;

        const current = Number(history[0].estimated_value);
        const previous = Number(history[1].estimated_value);
        if (previous === 0) continue;

        const changePercent = ((current - previous) / previous) * 100;
        const absChange = Math.abs(changePercent);
        if (absChange < SIGNIFICANT_CHANGE_PERCENT) continue;

        const direction = changePercent > 0 ? "increase" : "decrease";
        const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        const arrow = direction === "increase" ? "↑" : "↓";
        const summary = `Your ${vehicleName} market value shifted ${arrow} ${absChange.toFixed(1)}% — from $${previous.toLocaleString()} to $${current.toLocaleString()}.`;

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: existing } = await supabase
          .from("market_value_alerts")
          .select("id")
          .eq("vehicle_id", vehicle.id)
          .eq("current_value", current)
          .gte("created_at", oneDayAgo)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const { error: insertErr } = await supabase
          .from("market_value_alerts")
          .insert({
            vehicle_id: vehicle.id, previous_value: previous, current_value: current,
            change_percent: Number(absChange.toFixed(2)), change_direction: direction, summary,
          });

        if (!insertErr) {
          totalAlerts++;
          newValueAlerts.push({ userId: vehicle.user_id, vehicleName, previousValue: previous, currentValue: current, changePercent: absChange, changeDirection: direction, summary });
        }
      } catch (err) {
        console.warn(`Failed to check market value for vehicle ${vehicle.id}:`, err);
      }
    }

    let emailsSent = 0;
    const byUser = new Map<string, typeof newValueAlerts>();
    for (const alert of newValueAlerts) {
      if (!byUser.has(alert.userId)) byUser.set(alert.userId, []);
      byUser.get(alert.userId)!.push(alert);
    }

    for (const [userId, alerts] of byUser) {
      try {
        const { data: prefData } = await supabase
          .from("notification_preferences")
          .select("email_market_value")
          .eq("user_id", userId)
          .maybeSingle();

        if ((prefData?.email_market_value ?? true) === false) continue;

        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const email = userData?.user?.email;
        if (!email) continue;

        for (const alert of alerts) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
              body: JSON.stringify({
                to: email,
                alertData: {
                  type: "market_value", vehicleName: alert.vehicleName, previousValue: alert.previousValue,
                  currentValue: alert.currentValue, changePercent: alert.changePercent,
                  changeDirection: alert.changeDirection, summary: alert.summary,
                },
              }),
            });
            emailsSent++;
          } catch (e) {
            console.warn(`Failed to send market value email to ${email}:`, e);
          }
        }
      } catch (err) {
        console.warn(`Failed to notify user ${userId}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ message: `Checked ${vehicles.length} vehicles, created ${totalAlerts} market value alerts, sent ${emailsSent} emails`, checked: vehicles.length, newAlerts: totalAlerts, emailsSent }),
      { headers: { ...securityHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-market-values:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  }
});
