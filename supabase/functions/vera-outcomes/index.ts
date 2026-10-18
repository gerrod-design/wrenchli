// Vera — Outcomes Agent worker v1.
// Trigger: weekly schedule (pg_cron) + manual invoke.
// Does: 30-day hold-check backlog → briefing signals (Vera signals; humans act).
//       Accuracy rollup from outcome_reports → accuracy_metrics (append-only).
// Never: contacts anyone, publishes stats, spends. No PII in these tables.

import { withAgent } from "../_shared/agent.ts";

function currentQuarter(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

Deno.serve(
  withAgent("Vera", ["database_read", "database_write"], async ({ supabase, agent }) => {
    const { data: reports, error } = await supabase
      .from("outcome_reports")
      .select("id, repair_status, within_10pct, reported_at, hold_check_30d");
    if (error) throw new Error(`outcome_reports read failed: ${error.message}`);

    const parts: string[] = [];
    const total = reports.length;

    // 1. 30-day hold-check backlog → briefing item (idempotent: one per day max)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const backlog = reports.filter((r) => !r.hold_check_30d && r.reported_at < thirtyDaysAgo);
    if (backlog.length > 0) {
      const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("briefing_items")
        .select("id")
        .eq("agent_id", agent.id)
        .eq("section", "followup_backlog")
        .gte("created_at", dayAgo)
        .limit(1);
      if (!recent || recent.length === 0) {
        const today = new Date().toISOString().slice(0, 10);
        await supabase.from("briefing_items").insert({
          agent_id: agent.id,
          briefing_date: today,
          section: "followup_backlog",
          content: `Vera: ${backlog.length} outcome report(s) are past 30 days with no hold check recorded. Human follow-up needed — Vera signals, humans act.`,
        });
        parts.push(`${backlog.length} backlog briefing created`);
      } else {
        parts.push("backlog briefing already sent in last 24h — skipped");
      }
    }

    // 2. Accuracy rollup (honest empty-state: skip when no data, never fabricate)
    if (total === 0) {
      parts.push("no outcome data yet — rollup skipped");
      return { summary: parts.join("; "), data: { total: 0 } };
    }

    const confirmed = reports.filter((r) => r.repair_status).length;
    const hits = reports.filter((r) => r.repair_status === "fixed").length;
    const hitRate = confirmed > 0 ? hits / confirmed : null;

    await supabase.from("accuracy_metrics").insert({
      period: currentQuarter(new Date()),
      cause_key: "overall",
      predictions: total,
      confirmed,
      hits,
      hit_rate: hitRate,
      dataset_limitations:
        `v1 overall rollup; n=${total}. Per-cause breakdown pending session linkage (diagnostic_sessions). Early data skews toward engaged users.`,
      cleared_by_watchdog: false,
    });
    parts.push(`rollup inserted: ${hits}/${confirmed} fixed`);

    return { summary: parts.join("; "), data: { total, confirmed, hits, hit_rate: hitRate } };
  }),
);
