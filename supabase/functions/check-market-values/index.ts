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

        if (!insertErr) totalAlerts++;
      } catch (err) {
        console.warn(`Failed to check market value for vehicle ${vehicle.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Checked ${vehicles.length} vehicles, created ${totalAlerts} market value alerts`,
        checked: vehicles.length,
        newAlerts: totalAlerts,
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
