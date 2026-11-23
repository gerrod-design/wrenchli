import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleApiDiagnose } from "../_shared/api-diagnose-handler.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";
import { createMcpHandler } from "./handler.ts";
import {
  DEFAULT_RATE_LIMIT_PER_MINUTE,
  type CallerResolution,
} from "./identity.ts";
import type {
  AssessArguments,
  CallLogEntry,
  DownstreamResult,
} from "./protocol.ts";
import { buildDtcLookup, buildPriceCheck } from "./tools.ts";

// Public MCP endpoint (Model Context Protocol, streamable HTTP).
//
// Tools: assess_vehicle_symptoms (wraps the public assessment API),
// check_repair_price and lookup_trouble_code (Decision 1, served from
// the shared price book and trouble-code library in-process).
//
// Identity layer (Decision 1): every tool call is keyed, rate-limited,
// and attributable. Caller keys are free and instant (the mcp-keys
// function); only their SHA-256 hashes are stored (table mcp_api_keys),
// and every answered call is logged to mcp_call_log with its input
// shape and whether a figure was served. The assessment tool answers
// keyless calls during the transition window named by the
// MCP_KEYLESS_TRANSITION_END secret (ISO timestamp); if the secret is
// unset, keyless assessment calls fail closed with key instructions,
// the same posture as a missing MCP_API_KEY below.
//
// The assessment call is dispatched in-process to the same handler
// that serves /api-assess and /api-diagnose
// (_shared/api-diagnose-handler.ts), so every control the API applies
// runs unchanged. The key that handler requires is a dedicated
// first-party API key held only in this function's MCP_API_KEY secret.
async function callAssess(args: AssessArguments): Promise<DownstreamResult> {
  const apiKey = Deno.env.get("MCP_API_KEY");
  if (!apiKey) {
    console.error("mcp: MCP_API_KEY secret is not configured");
    return { status: 503, body: { error: "Assessment service not configured" } };
  }

  const internalReq = new Request("https://mcp.internal/api-assess", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(args),
  });

  const res = await handleApiDiagnose(internalReq, "mcp");
  const body = await res.json().catch(() => null);
  if (res.status !== 200) {
    // Status only — never log payloads or downstream error bodies.
    console.error(`mcp: downstream api-assess returned ${res.status}`);
  }
  return { status: res.status, body };
}

function supabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function hashKey(key: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(key),
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function resolveCaller(
  credential: string | null,
): Promise<CallerResolution> {
  if (!credential) return { kind: "keyless" };
  const db = supabase();
  const keyHash = await hashKey(credential);
  const { data, error } = await db
    .from("mcp_api_keys")
    .select("id, agent_name, tier, is_active, rate_limit_per_minute")
    .eq("key_hash", keyHash)
    .maybeSingle();
  if (error || !data || !data.is_active) return { kind: "invalid" };
  db.from("mcp_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});
  return {
    kind: "keyed",
    keyId: data.id,
    agentName: data.agent_name,
    tier: data.tier,
    rateLimitPerMinute: data.rate_limit_per_minute ?? DEFAULT_RATE_LIMIT_PER_MINUTE,
  };
}

async function getUsage(keyId: string): Promise<{
  callsLastMinute: number;
  distinctTargetsLastHour: number;
}> {
  const db = supabase();
  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db
    .from("mcp_call_log")
    .select("*", { count: "exact", head: true })
    .eq("key_id", keyId)
    .gte("created_at", minuteAgo);
  const { data } = await db
    .from("mcp_call_log")
    .select("repair_id, dtc_code")
    .eq("key_id", keyId)
    .gte("created_at", hourAgo)
    .limit(1000);
  const distinct = new Set<string>();
  for (const row of data ?? []) {
    const target = row.repair_id ?? row.dtc_code;
    if (target) distinct.add(target);
  }
  return {
    callsLastMinute: count ?? 0,
    distinctTargetsLastHour: distinct.size,
  };
}

async function logCall(entry: CallLogEntry): Promise<void> {
  // The log is evidence, not a gate: a logging failure must never
  // break a caller's answer, so errors are swallowed after a note.
  try {
    const { error } = await supabase().from("mcp_call_log").insert({
      key_id: entry.keyId,
      caller_kind: entry.callerKind,
      tool: entry.tool,
      vehicle_class: entry.vehicleClass,
      repair_id: entry.repairId,
      dtc_code: entry.dtcCode,
      served_figure: entry.servedFigure,
      range_low_cents: entry.rangeLowCents,
      range_high_cents: entry.rangeHighCents,
    });
    if (error) console.error("mcp: call log insert failed");
  } catch {
    console.error("mcp: call log insert threw");
  }
}

const handleMcp = createMcpHandler({
  callAssess,
  buildPriceCheck,
  buildDtcLookup,
  resolveCaller,
  getUsage,
  logCall,
  transitionEndsAt: Deno.env.get("MCP_KEYLESS_TRANSITION_END") ?? null,
});

serve(async (req) => {
  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const res = await handleMcp(req);
  const headers = mergeSecurityHeaders(getCorsHeaders(req.headers.get("origin")));
  const merged = new Headers(res.headers);
  for (const [key, value] of Object.entries(headers)) merged.set(key, value);
  return new Response(res.body, { status: res.status, headers: merged });
});
