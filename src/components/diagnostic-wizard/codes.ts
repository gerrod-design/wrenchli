/**
 * Brief 5 — OBD code entry for the wizard's symptom step.
 *
 * The owner may already have fault codes (from a scanner or a parts-store
 * read). Codes are format-validated here before they are stored on the
 * session or passed to the assessment engine: a code is P, B, C, or U
 * followed by 4 characters (hex digits, e.g. P0300, P0A80, U0100).
 * Anything else is rejected at the field with a plain message — it never
 * reaches the engine payload.
 */

export const OBD_CODE_PATTERN = /^[PBCU][0-9A-F]{4}$/;

export function isValidDiagnosticCode(token: string): boolean {
  return OBD_CODE_PATTERN.test(token.trim().toUpperCase());
}

export interface ParsedCodes {
  /** Valid codes, uppercased and de-duplicated, in entry order. */
  codes: string[];
  /** Tokens that are not valid codes, as entered (trimmed). */
  invalid: string[];
}

export function parseDiagnosticCodes(input: string): ParsedCodes {
  const tokens = input
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const codes: string[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    const normalized = token.toUpperCase();
    if (OBD_CODE_PATTERN.test(normalized)) {
      if (!codes.includes(normalized)) codes.push(normalized);
    } else {
      invalid.push(token);
    }
  }
  return { codes, invalid };
}
