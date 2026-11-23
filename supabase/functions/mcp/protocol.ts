// MCP protocol layer for Wrenchli's public MCP endpoint.
//
// Pure module: no Deno APIs, no I/O, no imports. The HTTP layer
// (handler.ts) parses the request body and hands parsed JSON-RPC
// messages here; the downstream assessment call is injected as a
// dependency so tests can mock it.
//
// Protocol: Model Context Protocol over streamable HTTP, JSON-RPC 2.0.
// Protocol versions supported: 2025-03-26 (preferred) and 2024-11-05
// (accepted in version negotiation for older clients).

import {
  decideToolAccess,
  type CallerKind,
  type CallerResolution,
} from "./identity.ts";
import {
  buildDtcLookup,
  buildPriceCheck,
  DTC_TOOL,
  DTC_TOOL_NAME,
  PRICE_TOOL,
  PRICE_TOOL_NAME,
  validateDtcLookupArguments,
  validatePriceCheckArguments,
  type DtcLookupArguments,
  type DtcLookupOutcome,
  type PriceCheckArguments,
  type PriceCheckOutcome,
} from "./tools.ts";

export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-03-26", "2024-11-05"];
export const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];

export const SERVER_INFO = { name: "wrenchli", version: "1.1.0" };

export const TOOL_NAME = "assess_vehicle_symptoms";
export { DTC_TOOL_NAME, PRICE_TOOL_NAME };

// The tool contract mirrors the public assessment API
// (supabase/functions/api-assess -> _shared/api-diagnose-handler.ts):
//   request:  { symptoms: string[], vehicle: { year, make, model,
//               mileage? }, location? }
//   response: { diagnosis: {...}, assessment: {...}, assessment_title,
//               recommendations: {...}, wrenchli_services: {...} }
export const ASSESS_TOOL = {
  name: TOOL_NAME,
  description:
    "Run a free preliminary symptom assessment for a vehicle with Wrenchli. " +
    "Given the vehicle's year, make, and model plus the symptoms the owner is " +
    "experiencing, it returns the likely causes, an urgency level, estimated " +
    "cost ranges, the recommended immediate action, and safety advice. This " +
    "is a preliminary informational assessment, not a diagnosis: it helps the " +
    "owner understand what is likely going on and what to discuss with a " +
    "qualified technician. Always free. A free Wrenchli API key identifies " +
    "the calling agent (instant to request); keyless calls are answered " +
    "during a transition window only.",
  inputSchema: {
    type: "object",
    properties: {
      symptoms: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        description:
          "The symptoms the owner is experiencing, one per entry, in plain " +
          "language (e.g. \"grinding noise when braking\", \"check engine " +
          "light is on\", \"car won't start, just clicks\").",
      },
      vehicle: {
        type: "object",
        properties: {
          year: { type: "integer", description: "Model year, e.g. 2020." },
          make: { type: "string", description: "Manufacturer, e.g. Toyota." },
          model: { type: "string", description: "Model, e.g. Camry." },
          mileage: {
            type: "number",
            description: "Current odometer reading in miles (optional).",
          },
        },
        required: ["year", "make", "model"],
        additionalProperties: false,
      },
      location: {
        type: "string",
        description:
          "Optional location (city or ZIP) used for local context in the " +
          "assessment record.",
      },
    },
    required: ["symptoms", "vehicle"],
    additionalProperties: false,
  },
};

export interface AssessArguments {
  symptoms: string[];
  vehicle: {
    year: number;
    make: string;
    model: string;
    mileage?: number;
  };
  location?: string;
}

export interface DownstreamResult {
  status: number;
  body: unknown;
}

/** One answered tool call, as recorded by the identity layer's log. */
export interface CallLogEntry {
  keyId: string | null;
  callerKind: CallerKind;
  tool: string;
  /** Input shape only: "year make model" class, never a consumer identity. */
  vehicleClass: string | null;
  repairId: string | null;
  dtcCode: string | null;
  /** True when a price figure was served; null where no figure applies. */
  servedFigure: boolean | null;
  rangeLowCents: number | null;
  rangeHighCents: number | null;
}

export interface McpDeps {
  callAssess: (args: AssessArguments) => Promise<DownstreamResult>;
  buildPriceCheck: (args: PriceCheckArguments) => PriceCheckOutcome;
  buildDtcLookup: (args: DtcLookupArguments) => DtcLookupOutcome;
  /** Resolve the request's credential to a caller (wiring layer, DB). */
  resolveCaller: (credential: string | null) => Promise<CallerResolution>;
  /** Usage counts for a keyed caller, measured by the wiring layer. */
  getUsage: (keyId: string) => Promise<{
    callsLastMinute: number;
    distinctTargetsLastHour: number;
  }>;
  /** Record one answered call. Fire-and-forget at the wiring layer. */
  logCall: (entry: CallLogEntry) => Promise<void>;
  /** ISO timestamp the keyless transition window closes, or null. */
  transitionEndsAt: string | null;
}

/** Per-request context the HTTP layer supplies (the caller's credential). */
export interface McpRequestContext {
  credential: string | null;
}

// JSON-RPC 2.0 error codes used by this endpoint.
export const ERR_PARSE = -32700;
export const ERR_INVALID_REQUEST = -32600;
export const ERR_METHOD_NOT_FOUND = -32601;
export const ERR_INVALID_PARAMS = -32602;
export const ERR_INTERNAL = -32603;

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc?: unknown;
  id?: JsonRpcId;
  method?: unknown;
  params?: unknown;
}

export function rpcError(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

export function rpcResult(id: JsonRpcId, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Validate tools/call arguments against the mirrored api-assess contract
// before anything reaches the downstream API. Returns the normalized
// arguments, or an error message naming the first problem found.
export function validateAssessArguments(
  args: unknown,
): { ok: true; value: AssessArguments } | { ok: false; message: string } {
  if (!isObject(args)) {
    return { ok: false, message: "Arguments must be an object with 'symptoms' and 'vehicle'." };
  }

  const { symptoms, vehicle, location } = args;

  if (!Array.isArray(symptoms) || symptoms.length === 0) {
    return { ok: false, message: "'symptoms' is required and must be a non-empty array of strings." };
  }
  if (symptoms.length > 20) {
    return { ok: false, message: "'symptoms' may contain at most 20 entries." };
  }
  for (const entry of symptoms) {
    if (typeof entry !== "string" || entry.trim().length === 0) {
      return { ok: false, message: "Every 'symptoms' entry must be a non-empty string." };
    }
    if (entry.length > 500) {
      return { ok: false, message: "Every 'symptoms' entry must be at most 500 characters." };
    }
  }

  if (!isObject(vehicle)) {
    return { ok: false, message: "'vehicle' is required and must be an object with year, make, and model." };
  }
  const { year, make, model, mileage } = vehicle;
  if (typeof year !== "number" || !Number.isInteger(year) || year < 1900 || year > 2100) {
    return { ok: false, message: "'vehicle.year' is required and must be an integer model year (1900-2100)." };
  }
  if (typeof make !== "string" || make.trim().length === 0 || make.length > 100) {
    return { ok: false, message: "'vehicle.make' is required and must be a non-empty string (max 100 characters)." };
  }
  if (typeof model !== "string" || model.trim().length === 0 || model.length > 100) {
    return { ok: false, message: "'vehicle.model' is required and must be a non-empty string (max 100 characters)." };
  }
  if (mileage !== undefined && (typeof mileage !== "number" || !(mileage >= 0))) {
    return { ok: false, message: "'vehicle.mileage' must be a non-negative number when provided." };
  }

  if (location !== undefined && (typeof location !== "string" || location.length > 200)) {
    return { ok: false, message: "'location' must be a string of at most 200 characters when provided." };
  }

  const value: AssessArguments = {
    symptoms: symptoms as string[],
    vehicle: {
      year,
      make,
      model,
      ...(mileage !== undefined ? { mileage } : {}),
    },
    ...(location !== undefined ? { location } : {}),
  };
  return { ok: true, value };
}

function toolErrorResult(text: string) {
  return { content: [{ type: "text", text }], isError: true };
}

// Map a downstream api-assess response onto an MCP tools/call result.
// Downstream HTTP contract (from _shared/api-diagnose-handler.ts):
// 200 success payload; 400 validation error with a user-facing message;
// 401/403 API-key problems (server-side configuration from the client's
// point of view); 429 rate limit; 500 internal error. Error text shown to
// MCP clients never exposes key or configuration detail.
function mapDownstreamToToolResult(downstream: DownstreamResult) {
  const { status, body } = downstream;
  if (status === 200) {
    return {
      content: [{ type: "text", text: JSON.stringify(body, null, 2) }],
      structuredContent: body,
      isError: false,
    };
  }
  if (status === 400 && isObject(body) && typeof body.error === "string") {
    return toolErrorResult(`The assessment could not be run: ${body.error}`);
  }
  if (status === 429) {
    return toolErrorResult(
      "The assessment service is rate limited right now. Please wait about 60 seconds and try again.",
    );
  }
  return toolErrorResult(
    "The assessment service is unavailable right now. Please try again later.",
  );
}

function toolResultFromOutcome(result: Record<string, unknown>) {
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    structuredContent: result,
    isError: false,
  };
}

async function handleToolsCall(
  id: JsonRpcId,
  params: unknown,
  deps: McpDeps,
  ctx: McpRequestContext,
) {
  if (!isObject(params) || typeof params.name !== "string") {
    return rpcError(id, ERR_INVALID_PARAMS, "tools/call requires a 'name' parameter.");
  }
  const toolName = params.name;
  const isAssess = toolName === TOOL_NAME;
  const isPrice = toolName === PRICE_TOOL_NAME;
  const isDtc = toolName === DTC_TOOL_NAME;
  if (!isAssess && !isPrice && !isDtc) {
    return rpcError(id, ERR_INVALID_PARAMS, `Unknown tool: ${toolName}`);
  }

  // Identity layer: every tool call is keyed, rate-limited, and
  // attributable. The Decision 1 tools require a key from launch; the
  // assessment tool answers keyless calls only inside the transition
  // window, counted separately.
  const caller = await deps.resolveCaller(ctx.credential);
  const usage = caller.kind === "keyed"
    ? await deps.getUsage(caller.keyId)
    : { callsLastMinute: 0, distinctTargetsLastHour: 0 };
  const access = decideToolAccess({
    caller,
    keyRequiredFromLaunch: !isAssess,
    now: new Date(),
    transitionEndsAt: deps.transitionEndsAt,
    callsLastMinute: usage.callsLastMinute,
    distinctTargetsLastHour: usage.distinctTargetsLastHour,
    enumerationApplies: !isAssess,
  });
  if (!access.allowed) {
    return rpcResult(id, toolErrorResult(access.message));
  }
  const callerKind = access.callerKind;
  const keyId = caller.kind === "keyed" ? caller.keyId : null;

  if (isAssess) {
    const validated = validateAssessArguments(params.arguments);
    if (!validated.ok) {
      return rpcError(id, ERR_INVALID_PARAMS, `Invalid arguments for ${TOOL_NAME}: ${validated.message}`);
    }
    let downstream: DownstreamResult;
    try {
      downstream = await deps.callAssess(validated.value);
    } catch {
      return rpcResult(id, toolErrorResult(
        "The assessment service is unavailable right now. Please try again later.",
      ));
    }
    await deps.logCall({
      keyId,
      callerKind,
      tool: TOOL_NAME,
      vehicleClass:
        `${validated.value.vehicle.year} ${validated.value.vehicle.make} ${validated.value.vehicle.model}`,
      repairId: null,
      dtcCode: null,
      servedFigure: null,
      rangeLowCents: null,
      rangeHighCents: null,
    });
    return rpcResult(id, mapDownstreamToToolResult(downstream));
  }

  if (isPrice) {
    const validated = validatePriceCheckArguments(params.arguments);
    if (!validated.ok) {
      return rpcError(id, ERR_INVALID_PARAMS, `Invalid arguments for ${PRICE_TOOL_NAME}: ${validated.message}`);
    }
    const outcome = deps.buildPriceCheck(validated.value);
    await deps.logCall({
      keyId,
      callerKind,
      tool: PRICE_TOOL_NAME,
      vehicleClass: validated.value.vehicle
        ? `${validated.value.vehicle.year} ${validated.value.vehicle.make} ${validated.value.vehicle.model}`
        : null,
      repairId: outcome.repairId,
      dtcCode: null,
      servedFigure: outcome.servedFigure,
      rangeLowCents: outcome.rangeUsd ? Math.round(outcome.rangeUsd.low * 100) : null,
      rangeHighCents: outcome.rangeUsd ? Math.round(outcome.rangeUsd.high * 100) : null,
    });
    return rpcResult(id, toolResultFromOutcome(outcome.result));
  }

  const validated = validateDtcLookupArguments(params.arguments);
  if (!validated.ok) {
    return rpcError(id, ERR_INVALID_PARAMS, `Invalid arguments for ${DTC_TOOL_NAME}: ${validated.message}`);
  }
  const outcome = deps.buildDtcLookup(validated.value);
  await deps.logCall({
    keyId,
    callerKind,
    tool: DTC_TOOL_NAME,
    vehicleClass: validated.value.vehicle
      ? `${validated.value.vehicle.year} ${validated.value.vehicle.make} ${validated.value.vehicle.model}`
      : null,
    repairId: outcome.repairId,
    dtcCode: outcome.dtcCode,
    servedFigure: outcome.servedFigure,
    rangeLowCents: outcome.rangeUsd ? Math.round(outcome.rangeUsd.low * 100) : null,
    rangeHighCents: outcome.rangeUsd ? Math.round(outcome.rangeUsd.high * 100) : null,
  });
  return rpcResult(id, toolResultFromOutcome(outcome.result));
}

// Process one parsed JSON-RPC message. Returns the response payload, or
// null when the message is a notification (no response is sent).
export async function processMessage(
  message: unknown,
  deps: McpDeps,
  ctx: McpRequestContext = { credential: null },
): Promise<unknown | null> {
  if (!isObject(message)) {
    return rpcError(null, ERR_INVALID_REQUEST, "Request must be a JSON-RPC 2.0 object.");
  }
  const msg = message as JsonRpcRequest;
  const id: JsonRpcId = (msg.id === undefined ? null : msg.id) as JsonRpcId;
  const isNotification = msg.id === undefined;

  if (typeof msg.method !== "string") {
    return isNotification
      ? null
      : rpcError(id, ERR_INVALID_REQUEST, "Request is missing a 'method'.");
  }

  // Notifications never produce a response, whatever the method.
  if (isNotification || msg.method.startsWith("notifications/")) {
    return null;
  }

  switch (msg.method) {
    case "initialize": {
      const params = isObject(msg.params) ? msg.params : {};
      const requested = typeof params.protocolVersion === "string"
        ? params.protocolVersion
        : null;
      const protocolVersion = requested &&
          SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
        ? requested
        : LATEST_PROTOCOL_VERSION;
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: [ASSESS_TOOL, PRICE_TOOL, DTC_TOOL] });
    case "tools/call":
      return handleToolsCall(id, msg.params, deps, ctx);
    default:
      return rpcError(id, ERR_METHOD_NOT_FOUND, `Method not found: ${msg.method}`);
  }
}
