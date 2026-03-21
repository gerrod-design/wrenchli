import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

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
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.ADMIN);
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
      .select("id, make, model, year, current_mileage, user_id")
      .not("current_mileage", "is", null);

    if (vErr) throw vErr;
    if (!vehicles || vehicles.length === 0) {
      return new Response(JSON.stringify({ message: "No vehicles with mileage data", alerts: 0 }), {
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    let totalAlerts = 0;
    const newMaintenanceAlerts: { userId: string; vehicleName: string; serviceLabel: string; priority: string; milesText: string; costLow: number; costHigh: number; summary: string }[] = [];

    for (const vehicle of vehicles) {
      try {
        const { data: prefData } = await supabase
          .from("notification_preferences")
          .select("inapp_maintenance")
          .eq("user_id", vehicle.user_id)
          .maybeSingle();

        if ((prefData?.inapp_maintenance ?? true) === false) continue;

        const currentMileage = vehicle.current_mileage;
        const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

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

          if (milesUntilDue > 3000) continue;

          let priority: string;
          if (milesUntilDue < 0) priority = "overdue";
          else if (milesUntilDue <= 1000) priority = "urgent";
          else priority = "soon";

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
              vehicle_id: vehicle.id, service_type: item.type, service_label: item.label,
              priority, due_mileage: dueMileage, current_mileage: currentMileage,
              miles_until_due: milesUntilDue, estimated_cost_low: item.costLow,
              estimated_cost_high: item.costHigh, summary,
            });

          if (!insertErr) {
            totalAlerts++;
            newMaintenanceAlerts.push({
              userId: vehicle.user_id, vehicleName, serviceLabel: item.label,
              priority, milesText, costLow: item.costLow, costHigh: item.costHigh, summary,
            });
          }
        }
      } catch (err) {
        console.warn(`Failed to check maintenance for vehicle ${vehicle.id}:`, err);
      }
    }

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

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        for (const alert of alerts) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
              body: JSON.stringify({
                to: email,
                alertData: {
                  type: "maintenance", vehicleName: alert.vehicleName, serviceLabel: alert.serviceLabel,
                  priority: alert.priority, milesText: alert.milesText, costLow: alert.costLow,
                  costHigh: alert.costHigh, summary: alert.summary,
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
      JSON.stringify({ message: `Checked ${vehicles.length} vehicles, created ${totalAlerts} maintenance alerts, sent ${emailsSent} emails`, checked: vehicles.length, newAlerts: totalAlerts, emailsSent }),
      { headers: { ...securityHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-maintenance:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  }
});
