import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Standard maintenance schedule (mirrors src/data/maintenanceSchedule.ts)
const MAINTENANCE_SCHEDULE = [
  { type: "oil_change", label: "Oil Change", intervalMiles: 5000, costLow: 30, costHigh: 75 },
  { type: "tire_rotation", label: "Tire Rotation", intervalMiles: 7500, costLow: 25, costHigh: 50 },
  { type: "brake_inspection", label: "Brake Inspection", intervalMiles: 15000, costLow: 0, costHigh: 50 },
  { type: "air_filter", label: "Engine Air Filter", intervalMiles: 15000, costLow: 15, costHigh: 40 },
  { type: "cabin_filter", label: "Cabin Air Filter", intervalMiles: 15000, costLow: 15, costHigh: 35 },
  { type: "transmission_service", label: "Transmission Service", intervalMiles: 60000, costLow: 150, costHigh: 400 },
  { type: "coolant_flush", label: "Coolant Flush", intervalMiles: 30000, costLow: 100, costHigh: 200 },
  { type: "spark_plugs", label: "Spark Plug Replacement", intervalMiles: 60000, costLow: 100, costHigh: 300 },
  { type: "battery_check", label: "Battery Check", intervalMiles: 30000, costLow: 0, costHigh: 25 },
  { type: "serpentine_belt", label: "Serpentine Belt", intervalMiles: 60000, costLow: 100, costHigh: 200 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get vehicles with mileage data
    const { data: vehicles, error: vErr } = await supabase
      .from("user_vehicles")
      .select("id, make, model, year, current_mileage, user_id")
      .not("current_mileage", "is", null);

    if (vErr) throw vErr;
    if (!vehicles || vehicles.length === 0) {
      return new Response(JSON.stringify({ message: "No vehicles with mileage data", alerts: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalAlerts = 0;
    const newMaintenanceAlerts: { userId: string; vehicleName: string; serviceLabel: string; priority: string; milesText: string; costLow: number; costHigh: number; summary: string }[] = [];

    for (const vehicle of vehicles) {
      try {
        // Check user preferences
        const { data: prefData } = await supabase
          .from("notification_preferences")
          .select("inapp_maintenance")
          .eq("user_id", vehicle.user_id)
          .maybeSingle();

        if ((prefData?.inapp_maintenance ?? true) === false) continue;

        const currentMileage = vehicle.current_mileage;
        const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

        // Get last maintenance records for this vehicle
        const { data: records } = await supabase
          .from("maintenance_records")
          .select("service_type, mileage_at_service")
          .eq("vehicle_id", vehicle.id)
          .order("service_date", { ascending: false });

        const lastServices = new Map<string, number>();
        if (records) {
          for (const r of records) {
            if (!lastServices.has(r.service_type) && r.mileage_at_service) {
              lastServices.set(r.service_type, r.mileage_at_service);
            }
          }
        }

        for (const item of MAINTENANCE_SCHEDULE) {
          const lastMileage = lastServices.get(item.type) ?? 0;
          const dueMileage = lastMileage + item.intervalMiles;
          const milesUntilDue = dueMileage - currentMileage;

          // Only alert for overdue, urgent (<=1000mi), or soon (<=3000mi)
          if (milesUntilDue > 3000) continue;

          let priority: string;
          if (milesUntilDue < 0) priority = "overdue";
          else if (milesUntilDue <= 1000) priority = "urgent";
          else priority = "soon";

          // Check for duplicate (same vehicle + service_type within 7 days)
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const { data: existing } = await supabase
            .from("maintenance_alerts")
            .select("id")
            .eq("vehicle_id", vehicle.id)
            .eq("service_type", item.type)
            .gte("created_at", sevenDaysAgo)
            .limit(1);

          if (existing && existing.length > 0) continue;

          const milesText = milesUntilDue < 0
            ? `${Math.abs(milesUntilDue).toLocaleString()} miles overdue`
            : `due in ${milesUntilDue.toLocaleString()} miles`;

          const summary = `${item.label} for your ${vehicleName} is ${milesText}. Estimated cost: $${item.costLow}–$${item.costHigh}.`;

          const { error: insertErr } = await supabase
            .from("maintenance_alerts")
            .insert({
              vehicle_id: vehicle.id,
              service_type: item.type,
              service_label: item.label,
              priority,
              due_mileage: dueMileage,
              current_mileage: currentMileage,
              miles_until_due: milesUntilDue,
              estimated_cost_low: item.costLow,
              estimated_cost_high: item.costHigh,
              summary,
            });

          if (!insertErr) {
            totalAlerts++;
            // Queue email for this alert
            newMaintenanceAlerts.push({
              userId: vehicle.user_id,
              vehicleName,
              serviceLabel: item.label,
              priority,
              milesText: milesUntilDue < 0
                ? `${Math.abs(milesUntilDue).toLocaleString()} miles overdue`
                : `due in ${milesUntilDue.toLocaleString()} miles`,
              costLow: item.costLow,
              costHigh: item.costHigh,
              summary,
            });
          }
        }
      } catch (err) {
        console.warn(`Failed to check maintenance for vehicle ${vehicle.id}:`, err);
      }
    }

    // Send email notifications
    let emailsSent = 0;
    const byUser = new Map<string, typeof newMaintenanceAlerts>();
    for (const alert of newMaintenanceAlerts) {
      if (!byUser.has(alert.userId)) byUser.set(alert.userId, []);
      byUser.get(alert.userId)!.push(alert);
    }

    for (const [userId, alerts] of byUser) {
      try {
        const { data: prefData } = await supabase
          .from("notification_preferences")
          .select("email_maintenance")
          .eq("user_id", userId)
          .maybeSingle();

        if ((prefData?.email_maintenance ?? true) === false) continue;

        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const email = userData?.user?.email;
        if (!email) continue;

        // Send one email per maintenance alert
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
                  type: "maintenance",
                  vehicleName: alert.vehicleName,
                  serviceLabel: alert.serviceLabel,
                  priority: alert.priority,
                  milesText: alert.milesText,
                  costLow: alert.costLow,
                  costHigh: alert.costHigh,
                  summary: alert.summary,
                },
              }),
            });
            emailsSent++;
          } catch (e) {
            console.warn(`Failed to send maintenance email to ${email}:`, e);
          }
        }
      } catch (err) {
        console.warn(`Failed to notify user ${userId}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Checked ${vehicles.length} vehicles, created ${totalAlerts} maintenance alerts, sent ${emailsSent} emails`,
        checked: vehicles.length,
        newAlerts: totalAlerts,
        emailsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-maintenance:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
