import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");
  const headers = {
    ...corsHeaders,
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Content-Type": "application/json",
  };

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get all shops from service_providers
    const { data: shops, error: shopsErr } = await supabase
      .from("service_providers")
      .select("id, name, created_at");

    if (shopsErr) throw shopsErr;
    if (!shops || shops.length === 0) {
      return new Response(JSON.stringify({
        shops_processed: 0, shops_flagged: 0, flagged_shops: [],
      }), { headers });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Current week Monday
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const weekOf = d.toISOString().split("T")[0];

    const flaggedShops: Array<{
      shop_id: string;
      shop_name: string;
      flag_reason: string;
      confirmation_rate: number;
    }> = [];

    for (const shop of shops) {
      // Count sessions where this shop was selected
      const { count: sessionsCount } = await supabase
        .from("diagnosis_records")
        .select("id", { count: "exact", head: true })
        .eq("selected_shop_id", shop.id)
        .gte("created_at", thirtyDaysAgo);

      const sessions = sessionsCount ?? 0;

      // Count outcome_reports for sessions linked to this shop
      // Join through diagnosis_records → diagnostic_sessions → outcome_reports
      const { data: shopSessions } = await supabase
        .from("diagnosis_records")
        .select("session_id")
        .eq("selected_shop_id", shop.id)
        .gte("created_at", thirtyDaysAgo)
        .not("session_id", "is", null);

      let outcomes = 0;
      if (shopSessions && shopSessions.length > 0) {
        const sessionIds = shopSessions
          .map((s) => s.session_id)
          .filter(Boolean);

        if (sessionIds.length > 0) {
          const { count: outcomesCount } = await supabase
            .from("outcome_reports")
            .select("id", { count: "exact", head: true })
            .in("session_id", sessionIds)
            .gte("reported_at", thirtyDaysAgo);

          outcomes = outcomesCount ?? 0;
        }
      }

      const confirmationRate = sessions > 0
        ? Math.round((outcomes / sessions) * 10000) / 100
        : 0;

      // Determine flag
      let flagged = false;
      let flagReason: string | null = null;

      if (sessions >= 5 && confirmationRate < 30) {
        flagged = true;
        flagReason = "LOW_CONFIRMATION_RATE";
      } else if (sessions >= 3 && outcomes === 0) {
        // Check if most recent session is older than 14 days
        const { data: recentSession } = await supabase
          .from("diagnosis_records")
          .select("created_at")
          .eq("selected_shop_id", shop.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (
          recentSession && recentSession.length > 0 &&
          recentSession[0].created_at < fourteenDaysAgo
        ) {
          flagged = true;
          flagReason = "NO_RECENT_OUTCOMES";
        }
      } else if (sessions === 0) {
        const shopAge = now.getTime() -
          new Date(shop.created_at).getTime();
        if (shopAge > 14 * 24 * 60 * 60 * 1000) {
          flagged = true;
          flagReason = "INACTIVE";
        }
      }

      // Upsert
      await supabase
        .from("shop_engagement_metrics")
        .upsert({
          shop_id: shop.id,
          week_of: weekOf,
          sessions_count: sessions,
          outcomes_count: outcomes,
          confirmation_rate: confirmationRate,
          flagged,
          flag_reason: flagReason,
          computed_at: new Date().toISOString(),
        }, { onConflict: "shop_id,week_of" });

      if (flagged) {
        flaggedShops.push({
          shop_id: shop.id,
          shop_name: shop.name,
          flag_reason: flagReason!,
          confirmation_rate: confirmationRate,
        });
      }
    }

    return new Response(JSON.stringify({
      shops_processed: shops.length,
      shops_flagged: flaggedShops.length,
      flagged_shops: flaggedShops,
    }), { headers });
  } catch (err: any) {
    console.error("shop-engagement-monitor error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
});
