// Sloane Ashford — CISO worker v1.
// Trigger: weekly schedule (pg_cron) + manual invoke.
// Does: weekly security posture audit — RLS coverage, append-only trigger
//       coverage, Caleb's weekly alert rollup, partner review renewals,
//       credential rotation schedule status.
// Writes: agent_flags (findings), approval_queue (remediation proposals),
//         briefing_items (weekly posture summary).
// Never: rotates credentials or takes containment action herself —
//        containment runs under founder direction per wrenchli-CRISIS.md.
import { withAgent } from "../_shared/agent.ts";

const AUDIT_TABLES = [
  "agent_runs",
  "agent_flags",
  "briefing_items",
  "outcome_reports",
  "accuracy_metrics",
  "security_alerts",
];

Deno.serve(
  withAgent("Sloane Ashford", ["security_audit", "flag_write", "proposal_write"], async ({ supabase, agent }) => {
    const parts: string[] = [];
    let flagCount = 0;

    async function flag(severity: string, category: string, message: string) {
      flagCount++;
      await supabase.from("agent_flags").insert({
        agent_id: agent.id, severity, category, message,
      });
    }

    // 1. RLS coverage
    const { data: rlsGaps } = await supabase.rpc("wrenchli_rls_gap_tables");
    const gaps = ((rlsGaps ?? []) as Array<{ tablename: string }>).map((r) => r.tablename);
    if (gaps.length > 0) {
      await flag("high", "security_posture", `RLS disabled on: ${gaps.join(", ")}`);
    }
    parts.push(`RLS gaps: ${gaps.length}`);

    // 2. Append-only trigger coverage on audit tables
    const { data: trigTables } = await supabase.rpc("wrenchli_mutation_trigger_tables");
    const covered = new Set(((trigTables ?? []) as Array<{ tablename: string }>).map((r) => r.tablename));
    const missing = AUDIT_TABLES.filter((t) => !covered.has(t));
    if (missing.length > 0) {
      await flag("high", "security_posture", `Append-only trigger missing on audit tables: ${missing.join(", ")}`);
    }
    parts.push(`trigger gaps: ${missing.length}`);

    // 3. Caleb's week — alert rollup by severity
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: alerts } = await supabase.from("security_alerts").select("severity").gte("created_at", weekAgo);
    const bySev: Record<string, number> = {};
    for (const a of (alerts ?? []) as Array<{ severity: string }>) bySev[a.severity] = (bySev[a.severity] ?? 0) + 1;
    const critHigh = (bySev["critical"] ?? 0) + (bySev["high"] ?? 0);
    if (critHigh > 0) {
      await flag("high", "security_posture", `${critHigh} critical/high security alert(s) in the last 7 days — review security_alerts`);
    }
    parts.push(`alerts(7d): ${JSON.stringify(bySev)}`);

    // 4. Partner security review renewals
    const today = new Date().toISOString().slice(0, 10);
    const soon = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const { data: partners } = await supabase.from("partner_security_reviews").select("partner_name, expiration_date, approval_status");
    const overdue = ((partners ?? []) as Array<{ partner_name: string; expiration_date: string | null; approval_status: string }>)
      .filter((p) => p.approval_status === "approved" && p.expiration_date && p.expiration_date < today);
    const dueSoon = ((partners ?? []) as Array<{ partner_name: string; expiration_date: string | null; approval_status: string }>)
      .filter((p) => p.approval_status === "approved" && p.expiration_date && p.expiration_date >= today && p.expiration_date <= soon);
    for (const p of overdue) await flag("high", "partner_security", `Partner security review EXPIRED: ${p.partner_name} (expired ${p.expiration_date})`);
    for (const p of dueSoon) await flag("medium", "partner_security", `Partner security review due within 30 days: ${p.partner_name} (expires ${p.expiration_date})`);
    parts.push(`partners tracked: ${(partners ?? []).length}, overdue: ${overdue.length}, due<30d: ${dueSoon.length}`);

    // 5. Credential rotation schedule
    const { data: creds } = await supabase.from("credential_rotations").select("credential_name, last_rotated_at, rotation_window_days, status");
    const credList = (creds ?? []) as Array<{ credential_name: string; last_rotated_at: string | null; rotation_window_days: number; status: string }>;
    if (credList.length === 0) {
      // Propose initializing the rotation log; surface the known exposed PAT as the first item.
      const { data: open } = await supabase.from("approval_queue").select("id").eq("agent_id", agent.id).eq("status", "pending").eq("proposed_action", "initialize_credential_rotation_log");
      if (!open || open.length === 0) {
        await supabase.from("approval_queue").insert({
          agent_id: agent.id,
          proposed_action: "initialize_credential_rotation_log",
          payload: {
            credentials: ["supabase_personal_access_token", "supabase_service_role", "supabase_anon", "anthropic_api_key", "stripe_secret", "n8n_api_key"],
            note: "Names only — values never stored. First entry: revoke the PAT exposed in chat on 2026-09-25 and issue a replacement from desktop.",
          },
          rationale: "Charter requires Sloane to own the credential rotation schedule. The log is empty; initializing it is the prerequisite for rotation tracking. The PAT exposed in chat on 2026-09-25 must be revoked before any other rotation work.",
          confidence: "0.95",
          status: "pending",
        });
        parts.push("rotation log: empty — initialization proposed");
      }
    } else {
      const now = Date.now();
      for (const c of credList) {
        if (c.status === "compromised") await flag("critical", "credential", `Credential marked compromised: ${c.credential_name} — rotate immediately`);
        else if (c.last_rotated_at) {
          const ageDays = (now - new Date(c.last_rotated_at).getTime()) / 86400000;
          if (ageDays > c.rotation_window_days) await flag("high", "credential", `Credential overdue for rotation: ${c.credential_name} (${Math.floor(ageDays)}d since rotation, window ${c.rotation_window_days}d)`);
          else if (ageDays > c.rotation_window_days * 0.8) await flag("medium", "credential", `Credential rotation due soon: ${c.credential_name}`);
        }
      }
      parts.push(`credentials tracked: ${credList.length}`);
    }

    // 6. Weekly posture summary
    await supabase.from("briefing_items").insert({
      agent_id: agent.id,
      briefing_date: today,
      section: "security_posture",
      content: `Sloane weekly posture: ${parts.join("; ")}. ${flagCount} finding(s) flagged.`,
    });

    return { summary: parts.join("; "), data: { flags: flagCount } };
  }),
);
