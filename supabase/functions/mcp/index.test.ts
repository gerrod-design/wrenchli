import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createMcpHandler } from "./handler.ts";
import { MAX_BODY_BYTES } from "./handler.ts";
import type { AssessArguments, DownstreamResult } from "./protocol.ts";

// Unlike the older api-* suites (which call the deployed functions), this
// suite imports the handler directly with the downstream assessment call
// mocked: no network, no production, no keys involved.

const SUCCESS_BODY = {
  diagnosis: {
    probable_issue: "Brake System Issue",
    description: "Grinding noises typically indicate worn brake pads.",
    urgency: "high",
    cost_estimate: { min: 200, max: 600 },
  },
  assessment: {
    probable_issue: "Brake System Issue",
    description: "Grinding noises typically indicate worn brake pads.",
    urgency: "high",
    cost_estimate: { min: 200, max: 600 },
  },
  assessment_title: "Brake System Issue",
  recommendations: {
    immediate_action: "Schedule brake inspection within 48 hours",
    safety_advice: "Avoid heavy braking and increase following distance",
    diy_feasible: false,
  },
  wrenchli_services: {
    get_quotes_url: "https://wrenchli.net/vehicle-insights?year=2020&make=Toyota&model=Camry&symptom=grinding",
    find_shops_url: "https://wrenchli.net/for-shops",
  },
};

function mockDeps(result: DownstreamResult | Error) {
  const calls: AssessArguments[] = [];
  const handler = createMcpHandler({
    callAssess: (args) => {
      calls.push(args);
      if (result instanceof Error) return Promise.reject(result);
      return Promise.resolve(result);
    },
  });
  return { handler, calls };
}

function rpcRequest(payload: unknown): Request {
  return new Request("https://wrenchli.net/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

const VALID_ARGS = {
  symptoms: ["grinding noise when braking"],
  vehicle: { year: 2020, make: "Toyota", model: "Camry", mileage: 85000 },
};

Deno.test("initialize completes the handshake with the preferred protocol version", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(rpcRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "test-client", version: "0.1.0" },
    },
  }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.jsonrpc, "2.0");
  assertEquals(body.id, 1);
  assertEquals(body.result.protocolVersion, "2025-03-26");
  assertEquals(body.result.serverInfo.name, "wrenchli");
  assertEquals(typeof body.result.serverInfo.version, "string");
  assertEquals(body.result.capabilities.tools !== undefined, true);
});

Deno.test("initialize negotiates the older 2024-11-05 protocol version", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(rpcRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "initialize",
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "old", version: "1" } },
  }));
  const body = await res.json();
  assertEquals(body.result.protocolVersion, "2024-11-05");
});

Deno.test("initialize answers an unknown version with the latest supported", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(rpcRequest({
    jsonrpc: "2.0",
    id: 3,
    method: "initialize",
    params: { protocolVersion: "2999-01-01", capabilities: {}, clientInfo: { name: "future", version: "1" } },
  }));
  const body = await res.json();
  assertEquals(body.result.protocolVersion, "2025-03-26");
});

Deno.test("notifications/initialized is accepted with no response body", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(rpcRequest({
    jsonrpc: "2.0",
    method: "notifications/initialized",
  }));
  assertEquals(res.status, 202);
  assertEquals(await res.text(), "");
});

Deno.test("ping returns an empty result", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(rpcRequest({ jsonrpc: "2.0", id: 4, method: "ping" }));
  const body = await res.json();
  assertEquals(body.result, {});
});

Deno.test("tools/list returns exactly the assess_vehicle_symptoms tool with the mirrored schema", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(rpcRequest({ jsonrpc: "2.0", id: 5, method: "tools/list" }));
  const body = await res.json();
  assertEquals(body.result.tools.length, 1);
  const tool = body.result.tools[0];
  assertEquals(tool.name, "assess_vehicle_symptoms");
  assertStringIncludes(tool.description, "preliminary");
  assertEquals(tool.inputSchema.type, "object");
  assertEquals(tool.inputSchema.required, ["symptoms", "vehicle"]);
  assertEquals(tool.inputSchema.properties.vehicle.required, ["year", "make", "model"]);
  assertEquals(tool.inputSchema.properties.vehicle.properties.mileage !== undefined, true);
  assertEquals(tool.inputSchema.properties.location !== undefined, true);
});

Deno.test("tools/call returns the downstream assessment as text + structured content", async () => {
  const { handler, calls } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(rpcRequest({
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: { name: "assess_vehicle_symptoms", arguments: VALID_ARGS },
  }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.result.isError, false);
  assertEquals(body.result.structuredContent, SUCCESS_BODY);
  assertEquals(JSON.parse(body.result.content[0].text), SUCCESS_BODY);
  // The downstream received exactly the mirrored contract fields.
  assertEquals(calls.length, 1);
  assertEquals(calls[0], VALID_ARGS);
});

Deno.test("tools/call maps a downstream 400 to a tool error with its message", async () => {
  const { handler } = mockDeps({ status: 400, body: { error: "Symptoms are required" } });
  const res = await handler(rpcRequest({
    jsonrpc: "2.0",
    id: 7,
    method: "tools/call",
    params: { name: "assess_vehicle_symptoms", arguments: VALID_ARGS },
  }));
  const body = await res.json();
  assertEquals(body.result.isError, true);
  assertStringIncludes(body.result.content[0].text, "Symptoms are required");
});

Deno.test("tools/call maps a downstream 429 to a rate-limit tool error", async () => {
  const { handler } = mockDeps({
    status: 429,
    body: { error: "Rate limit exceeded.", limit_per_minute: 60, retry_after_seconds: 60 },
  });
  const res = await handler(rpcRequest({
    jsonrpc: "2.0",
    id: 8,
    method: "tools/call",
    params: { name: "assess_vehicle_symptoms", arguments: VALID_ARGS },
  }));
  const body = await res.json();
  assertEquals(body.result.isError, true);
  assertStringIncludes(body.result.content[0].text, "rate limited");
});

Deno.test("tools/call hides downstream auth/internal failures behind a generic tool error", async () => {
  for (const status of [401, 403, 500, 503]) {
    const { handler } = mockDeps({ status, body: { error: "Invalid API key." } });
    const res = await handler(rpcRequest({
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: { name: "assess_vehicle_symptoms", arguments: VALID_ARGS },
    }));
    const body = await res.json();
    assertEquals(body.result.isError, true);
    assertStringIncludes(body.result.content[0].text, "unavailable");
    assertEquals(body.result.content[0].text.includes("API key"), false);
  }
});

Deno.test("tools/call maps a thrown downstream error to a generic tool error", async () => {
  const { handler } = mockDeps(new Error("network down"));
  const res = await handler(rpcRequest({
    jsonrpc: "2.0",
    id: 10,
    method: "tools/call",
    params: { name: "assess_vehicle_symptoms", arguments: VALID_ARGS },
  }));
  const body = await res.json();
  assertEquals(body.result.isError, true);
  assertStringIncludes(body.result.content[0].text, "unavailable");
});

Deno.test("tools/call rejects invalid arguments before reaching the downstream", async () => {
  const { handler, calls } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(rpcRequest({
    jsonrpc: "2.0",
    id: 11,
    method: "tools/call",
    params: {
      name: "assess_vehicle_symptoms",
      arguments: { symptoms: ["clicking"], vehicle: { year: 2020, make: "Toyota" } },
    },
  }));
  const body = await res.json();
  assertEquals(body.error.code, -32602);
  assertStringIncludes(body.error.message, "vehicle.model");
  assertEquals(calls.length, 0);
});

Deno.test("tools/call with an unknown tool name is an invalid-params error", async () => {
  const { handler, calls } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(rpcRequest({
    jsonrpc: "2.0",
    id: 12,
    method: "tools/call",
    params: { name: "erase_codes", arguments: VALID_ARGS },
  }));
  const body = await res.json();
  assertEquals(body.error.code, -32602);
  assertEquals(calls.length, 0);
});

Deno.test("an unknown method returns method-not-found", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(rpcRequest({ jsonrpc: "2.0", id: 13, method: "resources/list" }));
  const body = await res.json();
  assertEquals(body.error.code, -32601);
});

Deno.test("a malformed JSON body returns a parse error", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(new Request("https://wrenchli.net/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not json",
  }));
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error.code, -32700);
});

Deno.test("a GET request is refused with 405", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(new Request("https://wrenchli.net/mcp", { method: "GET" }));
  assertEquals(res.status, 405);
});

Deno.test("an oversized body is refused with 413 before parsing", async () => {
  const { handler, calls } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(new Request("https://wrenchli.net/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: " ".repeat(MAX_BODY_BYTES + 1),
  }));
  assertEquals(res.status, 413);
  assertEquals(calls.length, 0);
});
