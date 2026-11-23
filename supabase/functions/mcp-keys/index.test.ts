import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKeysHandler, type KeyRecord } from "./handler.ts";
import { hashApiKey } from "./issuance.ts";

// The issuance handler with the database insert mocked: no network,
// no production, no real keys involved.

function mockHandler() {
  const records: KeyRecord[] = [];
  const handler = createKeysHandler({
    insertKey: (record) => {
      records.push(record);
      return Promise.resolve({ ok: true });
    },
  });
  return { handler, records };
}

function post(body: unknown): Request {
  return new Request("https://wrenchli.net/mcp-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.test("issuance returns a plaintext key once and stores only its hash", async () => {
  const { handler, records } = mockHandler();
  const res = await handler(post({
    agent_name: "test-agent",
    developer_contact: "dev@example.com",
  }));
  assertEquals(res.status, 201);
  const body = await res.json();
  assertEquals(body.api_key.startsWith("wk_"), true);
  assertEquals(body.tier, "free_taste");
  assertEquals(records.length, 1);
  assertEquals(records[0].key_prefix, body.key_prefix);
  assertEquals(records[0].agent_name, "test-agent");
  // The stored value is the SHA-256 hash, never the plaintext key.
  assertEquals(records[0].key_hash, await hashApiKey(body.api_key));
  assertEquals(records[0].key_hash.includes(body.api_key), false);
});

Deno.test("issuance rejects a missing agent name", async () => {
  const { handler, records } = mockHandler();
  const res = await handler(post({ developer_contact: "dev@example.com" }));
  assertEquals(res.status, 400);
  const body = await res.json();
  assertStringIncludes(body.error, "agent_name");
  assertEquals(records.length, 0);
});

Deno.test("issuance rejects a malformed contact email", async () => {
  const { handler, records } = mockHandler();
  const res = await handler(post({
    agent_name: "test-agent",
    developer_contact: "not-an-email",
  }));
  assertEquals(res.status, 400);
  const body = await res.json();
  assertStringIncludes(body.error, "developer_contact");
  assertEquals(records.length, 0);
});

Deno.test("GET explains the endpoint", async () => {
  const { handler } = mockHandler();
  const res = await handler(new Request("https://wrenchli.net/mcp-keys", { method: "GET" }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertStringIncludes(body.how, "agent_name");
});
