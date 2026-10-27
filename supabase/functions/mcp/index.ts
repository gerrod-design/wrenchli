import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleApiDiagnose } from "../_shared/api-diagnose-handler.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";
import { createMcpHandler } from "./handler.ts";
import type { AssessArguments, DownstreamResult } from "./protocol.ts";

// Public MCP endpoint (Model Context Protocol, streamable HTTP).
//
// Wraps the existing public assessment API: tools/call is dispatched
// in-process to the same handler that serves /api-assess and
// /api-diagnose (_shared/api-diagnose-handler.ts), so every control the
// API applies runs unchanged — the x-api-key gate, the per-key DB-backed
// rate limit, and request logging (logged under endpoint "mcp").
//
// The key the handler requires is a dedicated first-party API key held
// only in this function's MCP_API_KEY secret. MCP clients never need or
// see any Wrenchli key: the assessment is free for consumers, and this
// endpoint is the consumer-facing machine surface for it. If MCP_API_KEY
// is not configured, the endpoint fails closed (tool calls return an
// unavailable error) rather than ever calling the API unauthenticated.
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

const handleMcp = createMcpHandler({ callAssess });

serve(async (req) => {
  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const res = await handleMcp(req);
  const headers = mergeSecurityHeaders(getCorsHeaders(req.headers.get("origin")));
  const merged = new Headers(res.headers);
  for (const [key, value] of Object.entries(headers)) merged.set(key, value);
  return new Response(res.body, { status: res.status, headers: merged });
});
