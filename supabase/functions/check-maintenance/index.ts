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

// R-52 (Batch 1.5): keyword map for feeding timeline service events into the
// last-service map. An event only qualifies when it also carries an odometer
// reading — a dateless, mile-less mention of a service is not a baseline.
const TIMELINE_SERVICE_KEYWORDS: { type: string; keywords: string[] }[] = [
  { type: "cabin_filter", keywords: ["cabin filter", "cabin air filter"] },
  { type: "air_filter", keywords: ["air filter"] },
  { type: "oil_change", keywords: ["oil change", "oil and filter", "oil service"] },
  { type: "tire_rotation", keywords: ["tire rotation", "tyre rotation", "rotate tires", "rotated tires"] },
  { type: "brake_inspection", keywords: ["brake inspection", "brakes inspected", "brake check", "brake service"] },
  { type: "transmission_service", keywords: ["transmission service", "transmission fluid", "gearbox service"] },
  { type: "coolant_flush", keywords: ["coolant flush", "coolant service", "coolant replacement", "antifreeze"] },
  { type: "spark_plugs", keywords: ["spark plug"] },
  { type: "battery_check", keywords: ["battery check", "battery test", "battery replacement", "battery replaced"] },
  { type: "serpentine_belt", keywords: ["serpentine belt", "drive belt"] },
];

function matchTimelineServiceTypes(text: string): string[] {
  const out: string[] = [];
  for (const entry of TIMELINE_SERVICE_KEYWORDS) {
    if (entry.keywords.some((k) => text.includes(k))) out.push(entry.type);
  }
  return out;
}

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

    // R-54 (Batch 1.5): this is an internal-only function — its one
    // legitimate caller is the pg_cron fleet run via wrenchli_cron_call.
    // Require the internal secret or the service-role bearer; the public
    // anon key must not be able to trigger fleet alert generation or email.
    const internalSecret = Deno.env.get("INTERNAL_SECRET");
    const callerSecret = req.headers.get("x-internal-secret");
    const authHeader = req.headers.get("Authorization");
    const isInternal = Boolean(
      (internalSecret && callerSecret === internalSecret) ||
      (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`),
    );
    if (!isInternal) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

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
    // R-53: failures are counted and reported, never swallowed.
    let failureCount = 0;
    const failedVehicleIds: string[] = [];
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

        // R-52: feed timeline service events into the last-service map.
        // Only events carrying an odometer reading qualify as a baseline —
        // the vehicle's own service history is the input the schedule was
        // always supposed to run on (maintenance_records alone is empty
        // system-wide today).
        const { data: serviceEvents } = await supabase
          .from("vehicle_timeline_events")
          .select("title, detail, odometer")
          .eq("vehicle_id", vehicle.id)
          .eq("category", "service")
          .not("odometer", "is", null)
          .order("occurred_at", { ascending: true });

        if (serviceEvents) {
          for (const ev of serviceEvents) {
            if (!ev.odometer) continue;
            const text = `${ev.title || ""} ${ev.detail || ""}`.toLowerCase();
            for (const type of matchTimelineServiceTypes(text)) {
              const prev = lastServices.get(type);
              if (prev === undefined || ev.odometer > prev) {
                lastServices.set(type, ev.odometer);
              }
            }
          }
        }

        for (const item of MAINTENANCE_SCHEDULE) {
          // R-52: never compute overdue from an assumed mile-0 baseline.
          // With no sourced last-service mileage for this item, suppress the
          // alert instead of telling the owner a fabricated "overdue" claim.
          const lastMileage = lastServices.get(item.type);
          if (lastMileage === undefined) continue;
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
        failureCount++;
        failedVehicleIds.push(vehicle.id);
        console.error(`Failed to check maintenance for vehicle ${vehicle.id}:`, err);
      }
    }

    let emailsSent = 0;
    // R-53: an email counts as sent only when send-alert-email confirms OK.
    let emailsFailed = 0;
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
            const res = await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}`, "x-internal-secret": Deno.env.get("INTERNAL_SECRET") ?? "" },
              body: JSON.stringify({
                to: email,
                alertData: {
                  type: "maintenance", vehicleName: alert.vehicleName, serviceLabel: alert.serviceLabel,
                  priority: alert.priority, milesText: alert.milesText, costLow: alert.costLow,
                  costHigh: alert.costHigh, summary: alert.summary,
                },
              }),
            });
            // R-53: dispatch is not delivery — count only confirmed OK.
            if (res.ok) {
              emailsSent++;
            } else {
              emailsFailed++;
              const errBody = await res.text().catch(() => "");
              console.error(`send-alert-email returned ${res.status} for maintenance alert to ${email}: ${errBody.slice(0, 300)}`);
            }
          } catch (e) {
            emailsFailed++;
            console.error(`Failed to send maintenance email to ${email}:`, e);
          }
        }
      } catch (err) {
        failureCount++;
        console.error(`Failed to notify user ${userId}:`, err);
      }
    }

    // R-53: a run with failures must not report plain success.
    const runFailed = failureCount > 0 || emailsFailed > 0;
    return new Response(
      JSON.stringify({
        message: `Checked ${vehicles.length} vehicles, created ${totalAlerts} maintenance alerts, sent ${emailsSent} emails` +
          (runFailed ? `, ${emailsFailed} emails failed, ${failureCount} processing failures` : ""),
        checked: vehicles.length, newAlerts: totalAlerts, emailsSent, emailsFailed,
        failures: failureCount, failedVehicleIds,
      }),
      { status: runFailed ? 502 : 200, headers: { ...securityHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-maintenance:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  }
});
