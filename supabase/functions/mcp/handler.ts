// HTTP layer for the public MCP endpoint (streamable HTTP transport).
//
// Runtime-agnostic on purpose (standard Request/Response only): index.ts
// wires it to Deno's serve with the real downstream dependency, and tests
// import it directly with a mocked downstream. No request payloads are
// logged here; only the protocol layer's responses leave this function.

import {
  ERR_INVALID_REQUEST,
  ERR_PARSE,
  type McpDeps,
  processMessage,
  rpcError,
} from "./protocol.ts";

// Symptom assessments are small JSON documents; 64 KiB is generous and
// caps abuse well below anything the downstream API would accept blindly.
export const MAX_BODY_BYTES = 64 * 1024;

const JSON_HEADERS = { "Content-Type": "application/json" };

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}

export function createMcpHandler(deps: McpDeps) {
  return async (req: Request): Promise<Response> => {
    // Streamable HTTP: this endpoint is stateless and POST-only. GET would
    // open the optional server-to-client stream, which this server does
    // not offer, so it is refused per spec.
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }
    if (req.method !== "POST") {
      return jsonResponse(
        405,
        rpcError(null, ERR_INVALID_REQUEST, "Method not allowed: this MCP endpoint accepts POST only."),
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonResponse(
        415,
        rpcError(null, ERR_INVALID_REQUEST, "Content-Type must be application/json."),
      );
    }

    const declaredLength = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return jsonResponse(
        413,
        rpcError(null, ERR_INVALID_REQUEST, `Request body exceeds the ${MAX_BODY_BYTES}-byte limit.`),
      );
    }

    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      return jsonResponse(
        413,
        rpcError(null, ERR_INVALID_REQUEST, `Request body exceeds the ${MAX_BODY_BYTES}-byte limit.`),
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return jsonResponse(400, rpcError(null, ERR_PARSE, "Parse error: request body is not valid JSON."));
    }

    // A JSON-RPC batch (accepted for 2024-11-05-era clients) or a single
    // message. Notifications produce no response payload.
    if (Array.isArray(parsed)) {
      const responses: unknown[] = [];
      for (const message of parsed) {
        const response = await processMessage(message, deps);
        if (response !== null) responses.push(response);
      }
      if (responses.length === 0) return new Response(null, { status: 202 });
      return jsonResponse(200, responses);
    }

    const response = await processMessage(parsed, deps);
    if (response === null) return new Response(null, { status: 202 });
    return jsonResponse(200, response);
  };
}
