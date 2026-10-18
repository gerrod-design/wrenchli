// Shared runtime wrapper for real Wrenchli agents.
// Every agent edge function wraps its handler with withAgent().
// Enforces: identity + kill switch, capability allowlist, audit logging,
// tripwire (capability violation → flag + suspend).

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AgentRecord {
  id: string;
  name: string;
  suspended: boolean;
  capability_allowlist: string[];
  status: string;
}

export interface AgentContext {
  supabase: SupabaseClient;
  agent: AgentRecord;
  req: Request;
}

export interface AgentResult {
  summary: string;
  data?: unknown;
}

export function withAgent(
  agentName: string,
  requiredCapabilities: string[],
  handler: (ctx: AgentContext) => Promise<AgentResult>,
) {
  return async (req: Request): Promise<Response> => {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Identity + kill switch
    const { data: agent, error: agentErr } = await supabase
      .from("agents")
      .select("*")
      .eq("name", agentName)
      .single();
    if (agentErr || !agent) {
      return Response.json({ ok: false, error: "unknown agent" }, { status: 403 });
    }
    if (agent.suspended) {
      await supabase.from("agent_runs").insert({
        agent_id: agent.id,
        status: "blocked",
        summary: "kill switch active — run refused",
      });
      return Response.json({ ok: false, error: "agent suspended" }, { status: 403 });
    }

    // 2. Capability enforcement + tripwire
    const allowed: string[] = agent.capability_allowlist ?? [];
    const missing = requiredCapabilities.filter((c) => !allowed.includes(c));
    if (missing.length > 0) {
      await supabase.from("agent_flags").insert({
        agent_id: agent.id,
        severity: "high",
        category: "capability_violation",
        message: `withAgent: missing capabilities: ${missing.join(",")}`,
      });
      await supabase.from("agents").update({ suspended: true }).eq("id", agent.id);
      return Response.json(
        { ok: false, error: "capability violation — agent suspended" },
        { status: 403 },
      );
    }

    // 3. Audit: log run start (agent_runs is append-only)
    const { error: startErr } = await supabase.from("agent_runs").insert({
      agent_id: agent.id,
      status: "started",
      summary: `${req.method} ${new URL(req.url).pathname}`,
    });
    if (startErr) console.error("audit start insert failed:", startErr.message);

    try {
      const result = await handler({ supabase, agent, req });
      const { error: doneErr } = await supabase.from("agent_runs").insert({
        agent_id: agent.id,
        status: "completed",
        summary: result.summary,
      });
      if (doneErr) console.error("audit complete insert failed:", doneErr.message);
      return Response.json({ ok: true, agent: agentName, summary: result.summary, data: result.data ?? null });
    } catch (e) {
      const { error: failErr } = await supabase.from("agent_runs").insert({
        agent_id: agent.id,
        status: "failed",
        summary: String((e as Error)?.message ?? e),
      });
      if (failErr) console.error("audit fail insert failed:", failErr.message);
      return Response.json({ ok: false, error: "handler failed" }, { status: 500 });
    }
  };
}
