// HTTP layer for the free key issuance endpoint (POST /mcp-keys).
//
// Runtime-agnostic: index.ts wires it to Deno's serve with the real
// database insert; tests import it with a mocked insert. The plaintext
// key leaves this function exactly once, in the 201 response.

import {
  generateApiKey,
  hashApiKey,
  keyPrefix,
  KEY_TIER,
  validateIssuanceInput,
} from "./issuance.ts";

export const MAX_BODY_BYTES = 8 * 1024;

const JSON_HEADERS = { "Content-Type": "application/json" };

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}

export interface KeyRecord {
  key_hash: string;
  key_prefix: string;
  agent_name: string;
  developer_contact: string;
  tier: string;
}

export interface KeysDeps {
  insertKey: (record: KeyRecord) => Promise<{ ok: boolean }>;
}

export function createKeysHandler(deps: KeysDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }
    if (req.method === "GET") {
      return jsonResponse(200, {
        service: "Wrenchli API key issuance",
        how:
          "POST a JSON body with agent_name and developer_contact to " +
          "receive a free key for the Wrenchli MCP tools. Keys are " +
          "instant and free; the taste tier stays free. Documentation: " +
          "https://www.wrenchli.net/developers",
      });
    }
    if (req.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed: POST a key request, or GET for information." });
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonResponse(415, { error: "Content-Type must be application/json." });
    }
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      return jsonResponse(413, { error: `Request body exceeds the ${MAX_BODY_BYTES}-byte limit.` });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return jsonResponse(400, { error: "Request body is not valid JSON." });
    }

    const validated = validateIssuanceInput(parsed);
    if (!validated.ok) {
      return jsonResponse(400, { error: validated.message });
    }

    const apiKey = generateApiKey();
    const record: KeyRecord = {
      key_hash: await hashApiKey(apiKey),
      key_prefix: keyPrefix(apiKey),
      agent_name: validated.value.agentName,
      developer_contact: validated.value.developerContact,
      tier: KEY_TIER,
    };
    const inserted = await deps.insertKey(record);
    if (!inserted.ok) {
      return jsonResponse(503, { error: "Key issuance is unavailable right now. Please try again later." });
    }

    return jsonResponse(201, {
      api_key: apiKey,
      key_prefix: record.key_prefix,
      agent_name: record.agent_name,
      tier: record.tier,
      note:
        "Store this key now: it is shown once and cannot be recovered. " +
        "Send it as an Authorization: Bearer header (or x-api-key) when " +
        "calling https://www.wrenchli.net/mcp.",
    });
  };
}
