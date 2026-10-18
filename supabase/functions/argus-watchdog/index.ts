// Argus — Compliance Watchdog worker v1.
// Trigger: weekly schedule (pg_cron) + manual invoke.
// Does: scans live site content against the banned-phrase rulebook
//       (wrenchli-COMPLIANCE.md / audit-copy.mjs), flags violations,
//       reviews Vera's accuracy rollups and proposes clearance (warn-first:
//       Argus proposes, humans decide).
// Never: rewrites copy, publishes, deploys, or auto-clears claims.
// Firewall: Green — reads production content, writes only flags/reports.

import { withAgent } from "../_shared/agent.ts";

interface Rule {
  pattern: RegExp;
  label: string;
  fix: string;
  severity: "high" | "medium";
}

// Ported from scripts/audit-copy.mjs BANNED_WORDS (consumer-facing critical rules)
const BANNED: Rule[] = [
  { pattern: /\bdiagnos(?:is|e[sd]?|ing)\b/gi, label: "diagnosis/diagnose", fix: 'Use "symptom assessment" or "likely causes"', severity: "high" },
  { pattern: /\bAI[- ]powered diagnos/gi, label: "AI-powered diagnosis", fix: 'Use "AI-powered symptom assessment"', severity: "high" },
  { pattern: /\bmachine learning diagnos/gi, label: "machine learning diagnosis", fix: 'Use "symptom assessment"', severity: "high" },
  { pattern: /\bdiagnose your car\b/gi, label: "diagnose your car", fix: 'Use "assess your symptoms"', severity: "high" },
  { pattern: /\bverified shops?\b/gi, label: "verified shops", fix: 'Always banned — use "trusted shops"', severity: "high" },
  { pattern: /\bvetted shops?\b/gi, label: "vetted shops", fix: 'Use "trusted shops"', severity: "high" },
  { pattern: /\blive in Michigan and Ohio\b/gi, label: "false availability claim", fix: "Never claim shop matching is live — Michigan assessment/Garage only, no Ohio", severity: "high" },
  { pattern: /\bcoming soon to [A-Z][a-z]+/gi, label: "coming soon (availability)", fix: "Michigan-pilot language only — never claim shop matching is live", severity: "high" },
  { pattern: /\bPro Only\b/g, label: "Pro Only", fix: "Garage Pro retired 2026-09-17 — flag for human rewrite, no auto-substitution", severity: "high" },
  { pattern: /\bAlways free\b/gi, label: "Always free", fix: 'Use "Assessment always free"', severity: "medium" },
  { pattern: /\bembedded financing\b/gi, label: "embedded financing", fix: 'Use "repair financing on the way"', severity: "medium" },
  { pattern: /\bour platform\b/gi, label: "our platform", fix: 'Use "Wrenchli"', severity: "medium" },
  { pattern: /\binstant AI diagnostics?\b/gi, label: "instant AI diagnostics", fix: 'Use "free symptom assessment"', severity: "medium" },
  // Pricing claims — costs are always estimates; flag for human review (medium).
  // Legit in quoted customer speech and for Wrenchli's own fees to shops;
  // never promise a shop's pricing to a consumer.
  { pattern: /\breal prices?\b/gi, label: '"real prices" (pricing claim)', fix: 'Costs are estimates — use "typical cost ranges"', severity: "medium" },
  { pattern: /\bno hidden fees?\b/gi, label: '"no hidden fees" (pricing claim)', fix: 'OK only for Wrenchli\'s own fees to shops; never promise a shop\'s pricing', severity: "medium" },
  { pattern: /\bno surprises\b/gi, label: '"no surprises" (absolute promise)', fix: 'Avoid absolute promises — say what the consumer actually gets', severity: "medium" },
  { pattern: /\bguaranteed prices?\b/gi, label: '"guaranteed price" (pricing claim)', fix: 'Costs are estimates — use "typical cost ranges"', severity: "medium" },
];

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

Deno.serve(
  withAgent("Argus", ["content_read", "flag_write", "proposal_write"], async ({ supabase, agent }) => {
    const parts: string[] = [];
    let violationCount = 0;

    // 1. Discover pages via sitemap (fall back to homepage)
    const site = "https://www.wrenchli.net";
    let urls: string[] = [site + "/"];
    try {
      const sm = await fetch(site + "/sitemap.xml", { headers: { "User-Agent": "Wrenchli-Argus/1.0" } });
      if (sm.ok) {
        const xml = await sm.text();
        const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
          .map((m) => m[1])
          .filter((u) => u.startsWith(site));
        if (locs.length > 0) urls = [...new Set(locs)].slice(0, 25);
      }
    } catch { /* homepage fallback */ }
    parts.push(`scanning ${urls.length} page(s)`);

    // 2. Scan each page against the rulebook
    for (const url of urls) {
      let text = "";
      try {
        const res = await fetch(url, { headers: { "User-Agent": "Wrenchli-Argus/1.0" } });
        if (!res.ok) continue;
        text = stripHtml(await res.text());
      } catch { continue; }
      if (!text) continue;

      for (const rule of BANNED) {
        rule.pattern.lastIndex = 0;
        for (const m of text.matchAll(rule.pattern)) {
          if (rule.label === "Always free" && /assessment always free/i.test(text)) continue;
          violationCount++;
          await supabase.from("agent_flags").insert({
            agent_id: agent.id,
            severity: rule.severity,
            category: "copy_violation",
            message: `[${rule.label}] ${url}: "${m[0]}" — ${rule.fix}`,
          });
        }
      }
    }
    parts.push(`${violationCount} violation(s) flagged`);

    // 3. Claim clearance — warn-first: propose, human decides
    const { data: pending } = await supabase
      .from("accuracy_metrics")
      .select("id, period, cause_key, confirmed, hits, hit_rate")
      .eq("cleared_by_watchdog", false)
      .order("computed_at", { ascending: false })
      .limit(5);
    let proposals = 0;
    for (const row of pending ?? []) {
      const { data: open } = await supabase
        .from("approval_queue")
        .select("id, payload")
        .eq("agent_id", agent.id)
        .eq("status", "pending");
      const already = (open ?? []).some((p: { payload: { accuracy_metrics_id?: string } }) =>
        p.payload?.accuracy_metrics_id === row.id
      );
      if (already) continue;
      const n = row.confirmed ?? 0;
      const recommendClear = n >= 100;
      await supabase.from("approval_queue").insert({
        agent_id: agent.id,
        proposed_action: recommendClear ? "clear_accuracy_claim" : "hold_accuracy_claim",
        payload: {
          accuracy_metrics_id: row.id,
          period: row.period,
          cause_key: row.cause_key,
          confirmed: n,
          hit_rate: row.hit_rate,
        },
        rationale: recommendClear
          ? `Rollup ${row.period}/${row.cause_key}: ${n} confirmed outcomes (≥100). Propose clearing for public claim use.`
          : `Rollup ${row.period}/${row.cause_key}: only ${n} confirmed outcomes (<100). Recommend holding — dataset too small for public claims.`,
        confidence: recommendClear ? "0.85" : "0.9",
        status: "pending",
      });
      proposals++;
    }
    parts.push(`${proposals} clearance proposal(s)`);

    // 4. Weekly summary to briefings
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("briefing_items").insert({
      agent_id: agent.id,
      briefing_date: today,
      section: "watchdog_scan",
      content:
        `Argus weekly scan: ${urls.length} pages, ${violationCount} copy violation(s), ` +
        `${proposals} accuracy-clearance proposal(s). AI-response audit (50 convos/persona) pending conversation-log access.`,
    });

    return {
      summary: parts.join("; "),
      data: { pages: urls.length, violations: violationCount, proposals },
    };
  }),
);
