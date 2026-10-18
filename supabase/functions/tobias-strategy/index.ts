// Tobias Wren — Chief Strategy Officer worker v2 (hybrid).
// Trigger: weekly schedule (pg_cron) + manual invoke.
// Does: (1) reads the latest market digest (NHTSA recalls + repair CPI,
//       ingested by the proven Monday market-sensing job into market_digests —
//       the 310MB NHTSA flat file cannot be parsed inside an edge function:
//       Supabase caps CPU at ~2s/request, verified by probe 2026-09-25);
//       (2) fetches live BLS repair CPI as a freshness cross-check;
//       (3) gathers internal runtime signals (Vera accuracy, Argus flags,
//       Sloane/Caleb alerts, Amara regulatory);
//       (4) Claude Sonnet 5 synthesis into verdict / recommendations / next action
//       per the strategy charter (protect > improve > grow, Michigan-niche-first).
// Writes: briefing_items (strategy_synthesis), approval_queue (recommendations
//         flagged needs_founder_decision, max 3/run).
// Never: acts autonomously on recommendations — signals only.
// Model: claude-sonnet-5 pinned. Requires ANTHROPIC_API_KEY in secrets.
// Test: invoke with {"mode":"signals_only"} to verify data gathering without
//       spending on a Claude call.
import { withAgent } from "../_shared/agent.ts";

const MODEL = "claude-sonnet-5";
const MAX_OUTPUT_TOKENS = 2000;
const DIGEST_MAX_AGE_DAYS = 10;

const BLS_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
const BLS_REPAIR = "CUUR0000SETD";
const BLS_HEADLINE = "CUUR0000SA0";

async function pullBls(): Promise<{ ok: boolean; text: string }> {
  const now = new Date();
  try {
    const res = await fetch(BLS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Wrenchli-Tobias/1.0" },
      body: JSON.stringify({
        seriesid: [BLS_REPAIR, BLS_HEADLINE],
        startyear: String(now.getFullYear() - 2),
        endyear: String(now.getFullYear()),
      }),
    });
    const d = await res.json();
    if (d.status !== "REQUEST_SUCCEEDED") return { ok: false, text: `BLS status=${d.status}` };
    const parse = (s: { data: Array<{ year: string; period: string; value: string }> }) =>
      s.data
        .filter((it) => it.period.startsWith("M"))
        .map((it) => ({ d: `${it.year}-${it.period.slice(1).padStart(2, "0")}-01`, v: parseFloat(it.value) }))
        .filter((pt) => !isNaN(pt.v))
        .sort((a, b) => (a.d < b.d ? -1 : 1));
    const byId: Record<string, Array<{ d: string; v: number }>> = {};
    for (const s of d.Results.series) byId[s.seriesID] = parse(s);
    const rep = byId[BLS_REPAIR] ?? [];
    const head = byId[BLS_HEADLINE] ?? [];
    if (rep.length < 13) return { ok: false, text: "BLS returned <13 months of repair CPI" };
    const last = rep[rep.length - 1], prev = rep[rep.length - 2];
    const yoyBase = rep.find((pt) => pt.d === `${parseInt(last.d.slice(0, 4)) - 1}${last.d.slice(4)}`);
    const hyoyBase = head.find((pt) => pt.d === `${parseInt(last.d.slice(0, 4)) - 1}${last.d.slice(4)}`);
    const mom = ((last.v - prev.v) / prev.v * 100).toFixed(2);
    const yoy = yoyBase ? ((last.v - yoyBase.v) / yoyBase.v * 100).toFixed(2) : "n/a";
    const hyoy = hyoyBase ? ((head[head.length - 1].v - hyoyBase.v) / hyoyBase.v * 100).toFixed(2) : "n/a";
    const monthName = new Date(last.d + "T00:00:00").toLocaleString("en-US", { month: "long", year: "numeric" });
    return { ok: true, text: `Motor vehicle maintenance & repair CPI (${monthName}): ${yoy}% YoY (MoM ${mom}%), vs headline ${hyoy}% YoY` };
  } catch (e) {
    return { ok: false, text: `BLS unreachable: ${(e as Error).message}` };
  }
}

async function gatherInternal(supabase: any): Promise<string> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const lines: string[] = [];

  const { data: metrics } = await supabase.from("accuracy_metrics")
    .select("period, cause_key, confirmed, hit_rate, cleared_by_watchdog")
    .order("computed_at", { ascending: false }).limit(3);
  lines.push(`Vera accuracy rollups (latest 3): ${JSON.stringify(metrics ?? [])}`);

  const { data: flags } = await supabase.from("agent_flags")
    .select("severity, category").gte("created_at", weekAgo);
  const byCat: Record<string, number> = {};
  for (const f of (flags ?? []) as Array<{ severity: string; category: string }>) {
    byCat[`${f.category}/${f.severity}`] = (byCat[`${f.category}/${f.severity}`] ?? 0) + 1;
  }
  lines.push(`Agent flags last 7d by category/severity: ${JSON.stringify(byCat)}`);

  const { data: alerts } = await supabase.from("security_alerts")
    .select("severity, category").gte("created_at", weekAgo);
  const bySev: Record<string, number> = {};
  for (const a of (alerts ?? []) as Array<{ severity: string }>) {
    bySev[a.severity] = (bySev[a.severity] ?? 0) + 1;
  }
  lines.push(`Security alerts last 7d by severity: ${JSON.stringify(bySev)}`);

  const { count: outcomes } = await supabase.from("outcome_reports").select("id", { count: "exact", head: true });
  lines.push(`Outcome reports total (data moat): ${outcomes ?? 0}`);

  const { data: proposals } = await supabase.from("approval_queue")
    .select("proposed_action, status").eq("status", "pending");
  lines.push(`Open approval-queue proposals: ${JSON.stringify((proposals ?? []).map((p: any) => p.proposed_action))}`);

  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are Tobias Wren, Chief Strategy Officer of Wrenchli — an AI vehicle symptom-assessment platform. Assessment and Garage are live nationally and always free; the consumer never pays. Shop matching is PAUSED (zero shops signed). Strategy is Michigan-niche-first, shop-channel-first. Tagline: "Wrenchli: Mobility for All."

Strategic thesis (the fortress, one brick at a time): Metro Detroit. Ten shops. Fifty percent outcome-confirmation rate. Everything else is a distraction until that is done.

Apply only the relevant checks from: Ghost Town (is anyone here?), LIT (love, intensity, tenacity of the need), DNA (does this fit what Wrenchli is?), Fortress (does this build the moat?), Starting Line (can we start small?), Effort (is the return worth the effort?).

Priority order: Protect, then Improve, then Grow. Signals only — you never take autonomous action; recommendations needing a human decision must set needs_founder_decision=true.

Respond with JSON ONLY, no markdown fences, matching this schema:
{"verdict": "one sentence",
 "market_summary": "2-3 sentences on what the market signals mean for Wrenchli",
 "internal_summary": "2-3 sentences on what the internal runtime signals mean",
 "recommendations": [{"title": "...", "rationale": "one sentence", "priority": "protect|improve|grow", "needs_founder_decision": true|false, "proposed_action": "snake_case action id or null"}],
 "next_action": "the single cheapest concrete next step, one sentence"}

Rules: never invent data — every claim must trace to the signals provided. If a source is marked STALE or FAILED, say so and discount it rather than filling gaps. Keep recommendations to at most 4. If signals are thin, say so and recommend the cheapest validation step.`;

interface Synthesis {
  verdict: string;
  market_summary: string;
  internal_summary: string;
  recommendations: Array<{
    title: string; rationale: string; priority: string;
    needs_founder_decision: boolean; proposed_action: string | null;
  }>;
  next_action: string;
}

async function synthesize(apiKey: string, signalsText: string): Promise<Synthesis> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Weekly strategic signals (14-day market window; 7-day internal window):\n\n${signalsText}` }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  const text = (body.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Claude did not return JSON");
  return JSON.parse(text.slice(start, end + 1)) as Synthesis;
}

Deno.serve(
  withAgent("Tobias Wren", ["strategy_scan", "briefing_write", "proposal_write", "llm_invoke"], async ({ supabase, agent, req }) => {
    let mode = "full";
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.mode === "signals_only") mode = "signals_only";
    } catch { /* GET or empty body */ }
    if (new URL(req.url).searchParams.get("mode") === "signals_only") mode = "signals_only";

    const signalParts: string[] = [];

    // 1. Market digest (NHTSA ingestion lives in the Monday market-sensing job)
    const { data: digests } = await supabase.from("market_digests")
      .select("computed_at, window_days, nhtsa_campaigns, nhtsa_totals, bls_text")
      .order("computed_at", { ascending: false }).limit(1);
    const digest = (digests ?? [])[0];
    let digestOk = false, digestBlsFallback: string | null = null;
    if (!digest) {
      signalParts.push("NHTSA recalls: NO DIGEST AVAILABLE — market-sensing ingestion has not produced one yet");
    } else {
      const ageDays = (Date.now() - new Date(digest.computed_at).getTime()) / 86400000;
      const staleTag = ageDays > DIGEST_MAX_AGE_DAYS ? `STALE (${ageDays.toFixed(0)}d old)` : "fresh";
      const camps = (digest.nhtsa_campaigns ?? []) as Array<any>;
      const totals = digest.nhtsa_totals ?? {};
      signalParts.push(
        `NHTSA recalls (${digest.window_days}d window, digest ${staleTag}, computed ${digest.computed_at}): ` +
        `${totals.campaigns_in_window ?? "?"} campaigns / ~${(totals.units_affected_total ?? 0).toLocaleString()} units.\n` +
        camps.map((c: any, i: number) =>
          `${i + 1}. ${c.manufacturer} ${c.vehicles} — recall ${c.campno} (${(c.units_affected ?? 0).toLocaleString()} units` +
          `${(c.safety_critical_hits ?? []).length ? `; safety-critical: ${(c.safety_critical_hits ?? []).join(", ").toLowerCase()}` : ""}` +
          `${c.do_not_drive ? "; DO NOT DRIVE" : ""}${c.park_outside ? "; park outside" : ""}). ${c.nhtsa_url ?? ""}`
        ).join("\n"),
      );
      digestOk = ageDays <= DIGEST_MAX_AGE_DAYS;
      digestBlsFallback = digest.bls_text ?? null;
    }

    // 2. Live BLS cross-check (falls back to digest text)
    const bls = await pullBls();
    signalParts.push(`Repair inflation (live BLS): ${bls.ok ? bls.text : "FAILED — " + bls.text + (digestBlsFallback ? ` | digest fallback: ${digestBlsFallback}` : "")}`);

    // 3. Internal runtime signals
    signalParts.push("Internal runtime signals:\n" + await gatherInternal(supabase));
    const signalsText = signalParts.join("\n\n");

    if (mode === "signals_only") {
      return {
        summary: `signals gathered (digest ${digest ? (digestOk ? "fresh" : "stale") : "missing"}, BLS ${bls.ok ? "ok" : "failed"}); Claude synthesis skipped`,
        data: { mode, digestOk, blsOk: bls.ok },
      };
    }

    if (!digest) throw new Error("no market digest available — refusing to synthesize without market data");

    // 4. Claude synthesis (fail closed without key)
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured in Supabase secrets — Claude synthesis unavailable");
    const s = await synthesize(apiKey, signalsText);

    // 5. Write briefing
    const today = new Date().toISOString().slice(0, 10);
    const recs = (s.recommendations ?? []).slice(0, 4);
    const briefing =
      `Tobias weekly strategy synthesis (${MODEL}):\n\n` +
      `VERDICT: ${s.verdict}\n\n` +
      `MARKET: ${s.market_summary}\n\n` +
      `INTERNAL: ${s.internal_summary}\n\n` +
      `RECOMMENDATIONS:\n${recs.map((r, i) => `${i + 1}. [${r.priority}] ${r.title} — ${r.rationale}${r.needs_founder_decision ? " (needs founder decision)" : ""}`).join("\n")}\n\n` +
      `NEXT ACTION: ${s.next_action}`;
    await supabase.from("briefing_items").insert({
      agent_id: agent.id, briefing_date: today, section: "strategy_synthesis", content: briefing,
    });

    // 6. Founder-decision proposals (max 3)
    let proposals = 0;
    for (const r of recs) {
      if (!r.needs_founder_decision || proposals >= 3) continue;
      await supabase.from("approval_queue").insert({
        agent_id: agent.id,
        proposed_action: r.proposed_action || "strategic_recommendation",
        payload: { title: r.title, rationale: r.rationale, priority: r.priority, verdict: s.verdict },
        rationale: `Tobias (CSO) weekly synthesis: ${r.title} — ${r.rationale}`,
        confidence: "0.7",
        status: "pending",
      });
      proposals++;
    }

    return {
      summary: `synthesis complete; ${recs.length} recommendation(s), ${proposals} proposal(s)`,
      data: { recommendations: recs.length, proposals, verdict: s.verdict },
    };
  }),
);
