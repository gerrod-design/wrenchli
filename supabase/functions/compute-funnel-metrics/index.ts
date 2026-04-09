import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const STEPS = [
  { number: 1, name: "vehicle_entry" },
  { number: 2, name: "symptom_entry" },
  { number: 3, name: "assessment_generating" },
  { number: 4, name: "results_shown" },
  { number: 5, name: "recommendation_shown" },
];

Deno.serve(async (req) => {
  const optResp = handleCorsOptions(req);
  if (optResp) return optResp;

  const origin = req.headers.get("Origin");
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  if (origin) {
    const dynamic = (await import("../_shared/cors.ts")).getCorsHeaders(origin);
    Object.assign(headers, dynamic);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Current Monday
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const weekOf = monday.toISOString().slice(0, 10);

    // Past 7 days
    const since = new Date(now.getTime() - 7 * 86400000).toISOString();

    const { data: events, error } = await sb
      .from("wizard_funnel_events")
      .select("session_id, step_number, step_name, device_type, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: "No events in window" }), { headers, status: 200 });
    }

    // Group by session
    const sessions = new Map<string, typeof events>();
    for (const e of events) {
      if (!e.session_id) continue;
      const arr = sessions.get(e.session_id) || [];
      arr.push(e);
      sessions.set(e.session_id, arr);
    }

    const totalStep1 = Array.from(sessions.values()).filter(
      (evts) => evts.some((e) => e.step_number === 1)
    ).length || 1;

    const metrics = STEPS.map((step) => {
      const sessionsAtStep = Array.from(sessions.entries()).filter(
        ([, evts]) => evts.some((e) => e.step_number === step.number)
      );

      const total = sessionsAtStep.length;
      const completionRate = Math.round((total / totalStep1) * 10000) / 100;

      // Avg time from previous step
      let avgSeconds: number | null = null;
      if (step.number > 1) {
        const diffs: number[] = [];
        for (const [, evts] of sessionsAtStep) {
          const curr = evts.find((e) => e.step_number === step.number);
          const prev = evts.find((e) => e.step_number === step.number - 1);
          if (curr && prev) {
            const d = (new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()) / 1000;
            if (d > 0 && d < 3600) diffs.push(d);
          }
        }
        if (diffs.length) avgSeconds = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
      }

      // Mobile vs desktop
      const mobileAtStep = sessionsAtStep.filter(
        ([, evts]) => evts.find((e) => e.step_number === step.number)?.device_type === "mobile"
      ).length;
      const desktopAtStep = sessionsAtStep.filter(
        ([, evts]) => evts.find((e) => e.step_number === step.number)?.device_type === "desktop"
      ).length;

      const mobileStep1 = Array.from(sessions.values()).filter(
        (evts) => evts.some((e) => e.step_number === 1 && e.device_type === "mobile")
      ).length || 1;
      const desktopStep1 = Array.from(sessions.values()).filter(
        (evts) => evts.some((e) => e.step_number === 1 && e.device_type === "desktop")
      ).length || 1;

      return {
        week_of: weekOf,
        step_number: step.number,
        step_name: step.name,
        total_sessions: total,
        completed_step: total,
        completion_rate: completionRate,
        avg_time_seconds: avgSeconds,
        mobile_completion_rate: Math.round((mobileAtStep / mobileStep1) * 10000) / 100,
        desktop_completion_rate: Math.round((desktopAtStep / desktopStep1) * 10000) / 100,
      };
    });

    // Delete existing rows for this week, then insert
    await sb.from("funnel_metrics").delete().eq("week_of", weekOf);
    const { error: insertErr } = await sb.from("funnel_metrics").insert(metrics);
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ weekOf, metrics }), { headers, status: 200 });
  } catch (e) {
    console.error("compute-funnel-metrics error:", e);
    return new Response(JSON.stringify({ error: e.message }), { headers, status: 500 });
  }
});
