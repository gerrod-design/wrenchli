// Caller identity and access decisions for the MCP surface (Decision 1).
//
// Pure module: the protocol layer asks it whether a tool call may run,
// given who the caller resolved to and the usage counts the wiring
// layer measured. Database access lives in index.ts; everything here
// is decided from values, so it is unit-testable without a database.
//
// The layer meters the channel, never the person: it identifies the
// calling agent or developer, never the consumer an agent is helping,
// and nothing here counts, caps, or charges a consumer.

/** How a caller resolved at the wiring layer. */
export type CallerResolution =
  | {
    kind: "keyed";
    keyId: string;
    agentName: string;
    tier: string;
    rateLimitPerMinute: number;
  }
  | { kind: "invalid" }
  | { kind: "keyless" };

export type CallerKind = "keyed" | "keyless_transition";

/** Default per-key rate limit for the free taste tier (calls/minute). */
export const DEFAULT_RATE_LIMIT_PER_MINUTE = 60;

/**
 * Anti-harvesting guard: distinct repairs or codes one key may price
 * or look up per hour. The whole book holds 30 repairs and the code
 * library 37 codes; a genuine agent session does not enumerate them,
 * a harvester does.
 */
export const ENUMERATION_DISTINCT_PER_HOUR = 25;

export const KEY_ISSUANCE_URL = "https://www.wrenchli.net/mcp-keys";
export const KEY_DOCS_URL = "https://www.wrenchli.net/developers";

export const KEY_REQUIRED_MESSAGE =
  "This tool requires a free Wrenchli API key. Keys are instant and " +
  `free: request one at ${KEY_ISSUANCE_URL} and send it as an ` +
  "Authorization: Bearer header (or x-api-key). Developer documentation: " +
  KEY_DOCS_URL + ".";

export const INVALID_KEY_MESSAGE =
  "That Wrenchli API key was not recognized, or it is no longer " +
  "active. Keys are free: request a new one at " + KEY_ISSUANCE_URL + ".";

export const TRANSITION_ENDED_MESSAGE =
  "Keyless calls to the assessment tool were answered during a " +
  "transition window that has now closed, so live integrations could " +
  "move over without breaking. A free Wrenchli API key is now " +
  "required: request one instantly at " + KEY_ISSUANCE_URL + ".";

export interface ToolAccessInput {
  caller: CallerResolution;
  /** True for the Decision 1 tools, which launched keyed from day one. */
  keyRequiredFromLaunch: boolean;
  now: Date;
  /** ISO timestamp the keyless transition window closes, or null. */
  transitionEndsAt: string | null;
  /** This key's answered calls in the last minute (keyed callers). */
  callsLastMinute: number;
  /** This key's distinct repairs/codes in the last hour (keyed callers). */
  distinctTargetsLastHour: number;
  /**
   * Whether the enumeration guard applies to this tool. It guards the
   * price book and code library; the assessment tool does not expose
   * either, so it is rate-limited but not enumeration-guarded.
   */
  enumerationApplies: boolean;
}

export type ToolAccessDecision =
  | { allowed: true; callerKind: CallerKind }
  | {
    allowed: false;
    reason: "invalid_key" | "key_required" | "rate_limited" | "enumeration_throttled";
    message: string;
  };

export function decideToolAccess(input: ToolAccessInput): ToolAccessDecision {
  const { caller } = input;

  if (caller.kind === "invalid") {
    return { allowed: false, reason: "invalid_key", message: INVALID_KEY_MESSAGE };
  }

  if (caller.kind === "keyless") {
    if (input.keyRequiredFromLaunch) {
      return { allowed: false, reason: "key_required", message: KEY_REQUIRED_MESSAGE };
    }
    const inTransition = input.transitionEndsAt !== null &&
      input.now.getTime() <= new Date(input.transitionEndsAt).getTime();
    if (!inTransition) {
      return {
        allowed: false,
        reason: "key_required",
        message: input.transitionEndsAt === null
          ? KEY_REQUIRED_MESSAGE
          : TRANSITION_ENDED_MESSAGE,
      };
    }
    return { allowed: true, callerKind: "keyless_transition" };
  }

  // Keyed caller: per-key rate limit, then the enumeration guard.
  if (input.callsLastMinute >= caller.rateLimitPerMinute) {
    return {
      allowed: false,
      reason: "rate_limited",
      message:
        "Rate limit reached for this key " +
        `(${caller.rateLimitPerMinute} calls per minute). Wait about ` +
        "60 seconds and try again.",
    };
  }
  if (input.enumerationApplies && input.distinctTargetsLastHour >= ENUMERATION_DISTINCT_PER_HOUR) {
    return {
      allowed: false,
      reason: "enumeration_throttled",
      message:
        "This key has priced or looked up an unusual number of " +
        "different repairs or codes in the last hour, so further " +
        "lookups are paused for a while. Wrenchli serves published " +
        "ranges and meanings one at a time; the underlying data set is " +
        "not available in bulk.",
    };
  }
  return { allowed: true, callerKind: "keyed" };
}

/**
 * Extract the caller's credential from request headers: an
 * Authorization: Bearer token, or an x-api-key header (the partner
 * API's convention). Returns null when no credential was sent.
 */
export function parseCredential(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (match && match[1].trim().length > 0) return match[1].trim();
  }
  const apiKey = headers.get("x-api-key");
  if (apiKey && apiKey.trim().length > 0) return apiKey.trim();
  return null;
}
