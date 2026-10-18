// Caleb Voss — Cybersecurity Monitoring Agent worker v1.
// Trigger: daily schedule (pg_cron) + manual invoke.
// Does: daily RLS regression test (all public tables), kill-switch
//       activation review, agent-flag volume spike detection.
// Writes: security_alerts (append-only), briefing_items daily summary.
// Never: modifies RLS, rotates secrets, or takes containment action.
import { withAgent } from "../_shared/agent.ts";

Deno.serve(
  withAgent("Caleb Voss", ["security_monitor", "alert_write"], async ({ supabase, agent }) => {
    let alertCount = 0;

    async function raise(severity: string, category: string, message: string) {
      alertCount++;
      await supabase.from("security_alerts").insert({
        agent_id: agent.id, severity, category, message,
      });
    }

    // 1. RLS regression — every public table must have RLS enabled
    const { data: rlsGaps, error: rlsErr } = await supabase.rpc("wrenchli_rls_gap_tables");
    if (rlsErr) {
      await raise("medium", "monitor_health", `RLS regression check could not run: ${rlsErr.message}`);
    } else {
      for (const row of (rlsGaps ?? []) as Array<{ tablename: string }>) {
        await raise("high", "rls_regression", `Table "${row.tablename}" in public schema has RLS disabled`);
      }
    }
    const gaps = rlsErr ? -1 : ((rlsGaps ?? []) as unknown[]).length;

    // 2. Kill-switch activations in last 24h
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: blocked } = await supabase
      .from("agent_runs")
      .select("id, summary")
      .eq("status", "blocked")
      .gte("created_at", dayAgo);
    for (const b of (blocked ?? []) as Array<{ id: string; summary: string | null }>) {
      await raise("medium", "killswitch_activation", `Blocked agent run in last 24h: ${b.summary ?? b.id}`);
    }

    // 3. Flag-volume spike vs 7-day baseline
    const { count: c24 } = await supabase.from("agent_flags").select("id", { count: "exact", head: true }).gte("created_at", dayAgo);
    const { count: cPrior } = await supabase.from("agent_flags").select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString())
      .lt("created_at", dayAgo);
    const n24 = c24 ?? 0;
    const baseline = (cPrior ?? 0) / 7;
    if (baseline > 0 && n24 > baseline * 3) {
      await raise("medium", "flag_spike", `Agent flags in last 24h (${n24}) exceed 3x the 7-day daily baseline (${baseline.toFixed(1)})`);
    }

    // 4. Daily summary
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("briefing_items").insert({
      agent_id: agent.id,
      briefing_date: today,
      section: "security_monitor",
      content: `Caleb daily monitor: RLS regression ${gaps < 0 ? "CHECK FAILED" : gaps === 0 ? "clean" : gaps + " gap(s)"}; ` +
        `${(blocked ?? []).length} blocked run(s); ${n24} flag(s) in 24h vs ${baseline.toFixed(1)}/day baseline; ` +
        `${alertCount} alert(s) raised.`,
    });

    return { summary: `${alertCount} alert(s) raised; RLS ${gaps < 0 ? "check failed" : gaps === 0 ? "clean" : gaps + " gap(s)"}`, data: { alerts: alertCount, rlsGaps: gaps } };
  }),
);
