import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createMcpHandler } from "./handler.ts";
import { MAX_BODY_BYTES } from "./handler.ts";
import type { CallerResolution } from "./identity.ts";
import type {
  AssessArguments,
  CallLogEntry,
  DownstreamResult,
} from "./protocol.ts";
import { buildDtcLookup, buildPriceCheck } from "./tools.ts";

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

const KEYED_CALLER: CallerResolution = {
  kind: "keyed",
  keyId: "key-1",
  agentName: "test-agent",
  tier: "free_taste",
  rateLimitPerMinute: 60,
};

interface MockOptions {
  usage?: { callsLastMinute: number; distinctTargetsLastHour: number };
  transitionEndsAt?: string | null;
}

function mockDeps(result: DownstreamResult | Error, options: MockOptions = {}) {
  const calls: AssessArguments[] = [];
  const log: CallLogEntry[] = [];
  const handler = createMcpHandler({
    callAssess: (args) => {
      calls.push(args);
      if (result instanceof Error) return Promise.reject(result);
      return Promise.resolve(result);
    },
    buildPriceCheck,
    buildDtcLookup,
    // Credential "wk_test_key" resolves keyed, "wk_bad" invalid, and
    // anything else (including no credential) keyless.
    resolveCaller: (credential) => {
      if (credential === "wk_test_key") return Promise.resolve(KEYED_CALLER);
      if (credential === "wk_bad") return Promise.resolve({ kind: "invalid" });
      return Promise.resolve({ kind: "keyless" });
    },
    getUsage: () =>
      Promise.resolve(options.usage ?? { callsLastMinute: 0, distinctTargetsLastHour: 0 }),
    logCall: (entry) => {
      log.push(entry);
      return Promise.resolve();
    },
    transitionEndsAt:
      options.transitionEndsAt === undefined
        ? "2999-01-01T00:00:00.000Z"
        : options.transitionEndsAt,
  });
  return { handler, calls, log };
}

function rpcRequest(payload: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://wrenchli.net/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
}

const KEYED = { Authorization: "Bearer wk_test_key" };

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

Deno.test("tools/list returns the three tools with their schemas", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(rpcRequest({ jsonrpc: "2.0", id: 5, method: "tools/list" }));
  const body = await res.json();
  assertEquals(body.result.tools.length, 3);
  const tool = body.result.tools[0];
  assertEquals(tool.name, "assess_vehicle_symptoms");
  assertStringIncludes(tool.description, "preliminary");
  assertEquals(tool.inputSchema.type, "object");
  assertEquals(tool.inputSchema.required, ["symptoms", "vehicle"]);
  assertEquals(tool.inputSchema.properties.vehicle.required, ["year", "make", "model"]);
  assertEquals(tool.inputSchema.properties.vehicle.properties.mileage !== undefined, true);
  assertEquals(tool.inputSchema.properties.location !== undefined, true);
  const names = body.result.tools.map((t: { name: string }) => t.name);
  assertEquals(names, [
    "assess_vehicle_symptoms",
    "check_repair_price",
    "lookup_trouble_code",
  ]);
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

// ---------------------------------------------------------------------------
// Decision 1: price check, code lookup, and the identity layer.
// Known-answer gates from the brief: SOUND entries serve the book's
// exact ranges; SUSPECT/UNRESOLVED entries return the not-yet answer;
// P0420 returns its meaning with no price figure at all.
// ---------------------------------------------------------------------------

function toolCall(id: number, name: string, args: unknown, headers: Record<string, string> = {}) {
  return rpcRequest({
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { name, arguments: args },
  }, headers);
}

Deno.test("price check serves a SOUND entry's exact book range with its basis", async () => {
  const { handler, log } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(toolCall(20, "check_repair_price", { repair: "alternator replacement" }, KEYED));
  const body = await res.json();
  assertEquals(body.result.isError, false);
  const out = body.result.structuredContent;
  assertEquals(out.published, true);
  assertEquals(out.repair.id, "alternator");
  assertEquals(out.range_usd, { low: 445, high: 940 });
  assertEquals(out.range_formatted, "$445–$940");
  assertStringIncludes(out.basis.framing, "independent shop");
  assertStringIncludes(out.basis.framing, "franchised dealership");
  assertEquals(out.value_context.status, "not_available");
  assertEquals(out.value_context.vehicle_value_usd, null);
  assertEquals(JSON.stringify(out).toLowerCase().includes("diagnos"), false);
  // The call was logged under the key, figure served.
  assertEquals(log.length, 1);
  assertEquals(log[0].keyId, "key-1");
  assertEquals(log[0].callerKind, "keyed");
  assertEquals(log[0].repairId, "alternator");
  assertEquals(log[0].servedFigure, true);
  assertEquals(log[0].rangeLowCents, 44500);
  assertEquals(log[0].rangeHighCents, 94000);
});

Deno.test("price check serves the re-derived SOUND thermostat range", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(toolCall(21, "check_repair_price", { repair: "thermostat" }, KEYED));
  const body = await res.json();
  const out = body.result.structuredContent;
  assertEquals(out.published, true);
  assertEquals(out.range_usd, { low: 160, high: 535 });
  assertStringIncludes(out.basis.scope_note, "housing assembly");
});

Deno.test("price check refuses a SUSPECT entry (radiator) with the not-yet answer", async () => {
  const { handler, log } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(toolCall(22, "check_repair_price", { repair: "radiator replacement" }, KEYED));
  const body = await res.json();
  const out = body.result.structuredContent;
  assertEquals(out.published, false);
  assertEquals(out.repair_matched.id, "radiator");
  assertStringIncludes(out.message, "not published yet");
  assertEquals(out.range_usd, undefined);
  assertEquals(log[0].servedFigure, false);
});

Deno.test("price check refuses the UNRESOLVED entry (brake caliper)", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(toolCall(23, "check_repair_price", { repair: "brake caliper" }, KEYED));
  const body = await res.json();
  const out = body.result.structuredContent;
  assertEquals(out.published, false);
  assertEquals(out.repair_matched.id, "brake_caliper");
});

Deno.test("price check answers honestly for a repair outside the book", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(toolCall(24, "check_repair_price", { repair: "flux capacitor replacement" }, KEYED));
  const body = await res.json();
  const out = body.result.structuredContent;
  assertEquals(out.published, false);
  assertEquals(out.repair_matched, null);
  assertStringIncludes(out.message, "do not publish a range");
});

Deno.test("price check requires a key from launch (keyless is refused with instructions)", async () => {
  const { handler, log } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(toolCall(25, "check_repair_price", { repair: "alternator" }));
  const body = await res.json();
  assertEquals(body.result.isError, true);
  assertStringIncludes(body.result.content[0].text, "free Wrenchli API key");
  assertEquals(log.length, 0);
});

Deno.test("an unrecognized key is refused on every tool", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const bad = { Authorization: "Bearer wk_bad" };
  const priceRes = await handler(toolCall(26, "check_repair_price", { repair: "alternator" }, bad));
  const priceBody = await priceRes.json();
  assertEquals(priceBody.result.isError, true);
  assertStringIncludes(priceBody.result.content[0].text, "not recognized");
  const assessRes = await handler(toolCall(27, "assess_vehicle_symptoms", VALID_ARGS, bad));
  const assessBody = await assessRes.json();
  assertEquals(assessBody.result.isError, true);
  assertStringIncludes(assessBody.result.content[0].text, "not recognized");
});

Deno.test("keyless assessment inside the transition window is answered and counted separately", async () => {
  const { handler, log } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(toolCall(28, "assess_vehicle_symptoms", VALID_ARGS));
  const body = await res.json();
  assertEquals(body.result.isError, false);
  assertEquals(log.length, 1);
  assertEquals(log[0].callerKind, "keyless_transition");
  assertEquals(log[0].keyId, null);
});

Deno.test("keyless assessment after the transition window closes is refused", async () => {
  const { handler, log } = mockDeps(
    { status: 200, body: SUCCESS_BODY },
    { transitionEndsAt: "2020-01-01T00:00:00.000Z" },
  );
  const res = await handler(toolCall(29, "assess_vehicle_symptoms", VALID_ARGS));
  const body = await res.json();
  assertEquals(body.result.isError, true);
  assertStringIncludes(body.result.content[0].text, "transition window");
  assertEquals(log.length, 0);
});

Deno.test("a keyed caller over the per-minute limit is rate limited", async () => {
  const { handler } = mockDeps(
    { status: 200, body: SUCCESS_BODY },
    { usage: { callsLastMinute: 60, distinctTargetsLastHour: 0 } },
  );
  const res = await handler(toolCall(30, "check_repair_price", { repair: "alternator" }, KEYED));
  const body = await res.json();
  assertEquals(body.result.isError, true);
  assertStringIncludes(body.result.content[0].text, "Rate limit reached");
});

Deno.test("a key enumerating the book is throttled by the anti-harvesting guard", async () => {
  const { handler } = mockDeps(
    { status: 200, body: SUCCESS_BODY },
    { usage: { callsLastMinute: 0, distinctTargetsLastHour: 25 } },
  );
  const res = await handler(toolCall(31, "check_repair_price", { repair: "alternator" }, KEYED));
  const body = await res.json();
  assertEquals(body.result.isError, true);
  assertStringIncludes(body.result.content[0].text, "not available in bulk");
});

Deno.test("code lookup returns P0420's meaning with no price figure (OI-014 + gate)", async () => {
  const { handler, log } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(toolCall(32, "lookup_trouble_code", { code: "P0420" }, KEYED));
  const body = await res.json();
  assertEquals(body.result.isError, false);
  const out = body.result.structuredContent;
  assertEquals(out.found, true);
  assertEquals(out.code, "P0420");
  assertStringIncludes(out.meaning, "catalytic converter");
  assertEquals(out.price.published, false);
  // The library's own display cost strings for this code are never served.
  const text = body.result.content[0].text;
  assertEquals(text.includes("$300"), false);
  assertEquals(text.includes("2,500"), false);
  assertEquals(text.includes("$645"), false);
  assertEquals(JSON.stringify(out).toLowerCase().includes("diagnos"), false);
  assertEquals(log[0].dtcCode, "P0420");
  assertEquals(log[0].servedFigure, false);
});

Deno.test("code lookup serves the mapped SOUND price for P0128 (thermostat)", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(toolCall(33, "lookup_trouble_code", { code: "p0128" }, KEYED));
  const body = await res.json();
  const out = body.result.structuredContent;
  assertEquals(out.found, true);
  assertEquals(out.price.published, true);
  assertEquals(out.price.repair.id, "thermostat");
  assertEquals(out.price.range_usd, { low: 160, high: 535 });
});

Deno.test("code lookup answers honestly for a code outside the library", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(toolCall(34, "lookup_trouble_code", { code: "P0999" }, KEYED));
  const body = await res.json();
  const out = body.result.structuredContent;
  assertEquals(out.found, false);
  assertStringIncludes(out.message, "not in our trouble-code library");
});

Deno.test("code lookup rejects a malformed code before serving anything", async () => {
  const { handler } = mockDeps({ status: 200, body: SUCCESS_BODY });
  const res = await handler(toolCall(35, "lookup_trouble_code", { code: "hello" }, KEYED));
  const body = await res.json();
  assertEquals(body.error.code, -32602);
});
