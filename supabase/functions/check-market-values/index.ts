import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Significant change threshold (percentage)
const SIGNIFICANT_CHANGE_PERCENT = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all vehicles with value history
    const { data: vehicles, error: vErr } = await supabase
      .from("user_vehicles")
      .select("id, make, model, year, user_id");

    if (vErr) throw vErr;
    if (!vehicles || vehicles.length === 0) {
      return new Response(JSON.stringify({ message: "No vehicles to check", alerts: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalAlerts = 0;
    const newValueAlerts: { userId: string; vehicleName: string; previousValue: number; currentValue: number; changePercent: number; changeDirection: string; summary: string }[] = [];

    for (const vehicle of vehicles) {
      try {
        // Check user notification preferences
        const { data: prefData } = await supabase
          .from("notification_preferences")
          .select("inapp_market_value")
          .eq("user_id", vehicle.user_id)
          .maybeSingle();

        const enabled = prefData?.inapp_market_value ?? true;
        if (!enabled) continue;

        // Get last two value records for this vehicle
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

        // Check for duplicate alert (same vehicle, same values, within 24h)
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
            vehicle_id: vehicle.id,
            previous_value: previous,
            current_value: current,
            change_percent: Number(absChange.toFixed(2)),
            change_direction: direction,
            summary,
          });

        if (!insertErr) {
          totalAlerts++;
          // Queue email
          newValueAlerts.push({
            userId: vehicle.user_id,
            vehicleName,
            previousValue: previous,
            currentValue: current,
            changePercent: absChange,
            changeDirection: direction,
            summary,
          });
        }
      } catch (err) {
        console.warn(`Failed to check market value for vehicle ${vehicle.id}:`, err);
      }
    }

    // Send email notifications
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
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                to: email,
                alertData: {
                  type: "market_value",
                  vehicleName: alert.vehicleName,
                  previousValue: alert.previousValue,
                  currentValue: alert.currentValue,
                  changePercent: alert.changePercent,
                  changeDirection: alert.changeDirection,
                  summary: alert.summary,
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
      JSON.stringify({
        message: `Checked ${vehicles.length} vehicles, created ${totalAlerts} market value alerts, sent ${emailsSent} emails`,
        checked: vehicles.length,
        newAlerts: totalAlerts,
        emailsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-market-values:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
