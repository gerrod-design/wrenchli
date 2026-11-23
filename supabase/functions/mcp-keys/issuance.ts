// Key issuance logic for Wrenchli's free agent API keys (Decision 1).
//
// Pure module: key generation, input validation, and hashing. The
// wiring layer (index.ts) stores the record; the plaintext key is
// returned to the requester exactly once and never stored — only its
// SHA-256 hash and a display prefix land in the database, the same
// posture as the partner API's api_keys table.

export const KEY_PREFIX_LENGTH = 12;
export const KEY_TIER = "free_taste";

const KEY_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** A new plaintext key: "wk_" plus 40 random characters. */
export function generateApiKey(): string {
  const bytes = new Uint8Array(40);
  crypto.getRandomValues(bytes);
  let body = "";
  for (const b of bytes) body += KEY_ALPHABET[b % KEY_ALPHABET.length];
  return `wk_${body}`;
}

export function keyPrefix(key: string): string {
  return key.slice(0, KEY_PREFIX_LENGTH);
}

export async function hashApiKey(key: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(key),
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface IssuanceInput {
  agentName: string;
  developerContact: string;
}

export function validateIssuanceInput(
  body: unknown,
): { ok: true; value: IssuanceInput } | { ok: false; message: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      ok: false,
      message: "Request body must be a JSON object with 'agent_name' and 'developer_contact'.",
    };
  }
  const { agent_name, developer_contact } = body as Record<string, unknown>;
  if (
    typeof agent_name !== "string" || agent_name.trim().length === 0 ||
    agent_name.length > 100
  ) {
    return {
      ok: false,
      message: "'agent_name' is required: the name of the agent or product that will use the key (max 100 characters).",
    };
  }
  if (
    typeof developer_contact !== "string" ||
    developer_contact.length > 200 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(developer_contact.trim())
  ) {
    return {
      ok: false,
      message: "'developer_contact' is required and must be an email address for the developer responsible for the key.",
    };
  }
  return {
    ok: true,
    value: {
      agentName: agent_name.trim(),
      developerContact: developer_contact.trim(),
    },
  };
}
