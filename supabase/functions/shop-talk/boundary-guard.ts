// ── Shop assistant boundary guard ──
// Option B inbound build spec (2026-11-02), condition 2: high-level
// information only, and the no-commitments boundary is enforced in the
// implementation, not just requested in the prompt. The shop-talk handler
// buffers the model's full reply and runs it through enforceShopBoundary
// before anything reaches the visitor: if the draft invents or concedes
// any term, discusses a competitor, touches consumer data, claims to be
// human, or strays into legal/tax territory, the WHOLE reply is replaced
// with the config's FALLBACK_LINE. Nothing partial ships.
//
// Pure functions, no runtime APIs: the repo test set
// (src/lib/__tests__/shopTalkBoundary.test.ts) imports this module
// directly, the same pattern as chat/aiden-guard.ts.

import {
  FALLBACK_LINE,
  type BoundaryCategory,
} from "../_shared/shop-talk-config.ts";

// Dollar figures the assistant may state (first five free: $0; founding
// rate after the free first five: $50; monthly cap: $299).
const ALLOWED_DOLLAR_AMOUNTS = new Set([0, 50, 299]);

function findMoneyViolations(text: string): boolean {
  const dollarPattern = /\$\s?(\d[\d,]*(?:\.\d{2})?)/g;
  let match: RegExpExecArray | null;
  while ((match = dollarPattern.exec(text)) !== null) {
    const amount = Number(match[1].replace(/,/g, ""));
    if (!ALLOWED_DOLLAR_AMOUNTS.has(amount)) return true;
  }
  // Percentages and "percent" never appear in the allowed facts.
  if (/\d+(?:\.\d+)?\s?%/.test(text) || /\bpercent\b/i.test(text)) return true;
  return false;
}

const NEGOTIATION_PATTERNS: RegExp[] = [
  /\bdiscount(s|ed)?\b/i,
  /\bspecial (deal|price|rate|offer)\b/i,
  /\bi can offer\b/i,
  /\bwe can offer\b/i,
  /\bwaiv\w* (the )?fee\b/i,
  /\bmatch (that|their|any|a) price\b/i,
  /\bbeat (that|their|any) price\b/i,
  /\bfree for (the first )?\d+\s*(months?|weeks?)\b/i,
  /\bextend\w* (the )?(pilot|free period|trial)\b/i,
  /\blower (the )?(fee|price|rate)\b/i,
  /\bbetter (deal|rate|price) for you\b/i,
];

const COMMITMENT_PATTERNS: RegExp[] = [
  /\bwe guarantee\b/i,
  /\bi guarantee\b/i,
  /\bguarantee you\b/i,
  /\bi promise\b/i,
  /\bwe promise\b/i,
  /\bsign you up\b/i,
  /\byou'?re (all )?signed up\b/i,
  /\byou are (now )?enrolled\b/i,
  /\bwe'?ll send you \d+\b/i,
  /\b\d+\s+(referrals|customers|jobs) (a|per) month\b/i,
  /\bconsider it done\b/i,
];

const COMPETITOR_NAMES: RegExp[] = [
  /\brepairpal\b/i,
  /\byourmechanic\b/i,
  /\bopenbay\b/i,
  /\bmech\s?ai\b/i,
  /\bcarfax\b/i,
  /\bkbb\b/i,
  /\bkelly blue book\b/i,
];

const VIN_PATTERN = /\b[A-HJ-NPR-Z0-9]{17}\b/;
const CONSUMER_DATA_PATTERNS: RegExp[] = [
  VIN_PATTERN,
  /\bsend (you|over) the (customer|driver)/i,
  /\bgive you the (customer|driver)/i,
  /\b(customer|driver)'?s (phone|email|number|address) is\b/i,
  /\b(their|his|her) (phone|email) is\b/i,
];

const IMPERSONATION_PATTERNS: RegExp[] = [
  /\bi am gerrod\b/i,
  /\bi'?m gerrod\b/i,
  /\bthis is gerrod\b/i,
  /\bi am a (real )?(person|human)\b/i,
  /\bi'?m a (real )?(person|human)\b/i,
  /\bi am not an ai\b/i,
  /\bi'?m not an ai\b/i,
  /\bnot a bot\b/i,
];

const LEGAL_TAX_PATTERNS: RegExp[] = [
  /\btax deductible\b/i,
  /\byou can deduct\b/i,
  /\bwrite (it|this) off\b/i,
  /\bthe (agreement|contract|terms) (means|requires|obligates|allows you)\b/i,
  /\blegally (required|obligated|binding)\b/i,
  /\byour (legal|tax) (obligation|liability)\b/i,
];

const DETECTORS: Array<{ category: BoundaryCategory; fires: (text: string) => boolean }> = [
  { category: "money_terms", fires: (t) => findMoneyViolations(t) },
  { category: "negotiation", fires: (t) => NEGOTIATION_PATTERNS.some((p) => p.test(t)) },
  { category: "commitment", fires: (t) => COMMITMENT_PATTERNS.some((p) => p.test(t)) },
  { category: "competitor", fires: (t) => COMPETITOR_NAMES.some((p) => p.test(t)) },
  { category: "consumer_data", fires: (t) => CONSUMER_DATA_PATTERNS.some((p) => p.test(t)) },
  { category: "impersonation", fires: (t) => IMPERSONATION_PATTERNS.some((p) => p.test(t)) },
  { category: "legal_tax", fires: (t) => LEGAL_TAX_PATTERNS.some((p) => p.test(t)) },
];

/** Returns the boundary categories a draft reply violates (empty = clean). */
export function evaluateShopReply(text: string): BoundaryCategory[] {
  if (!text) return [];
  return DETECTORS.filter((d) => d.fires(text)).map((d) => d.category);
}

export interface ShopBoundaryResult {
  text: string;
  violations: BoundaryCategory[];
}

/**
 * The enforcement used by the shop-talk handler: any violation replaces
 * the entire reply with the fallback line. Clean replies pass through
 * unchanged.
 */
export function enforceShopBoundary(text: string): ShopBoundaryResult {
  const violations = evaluateShopReply(text);
  if (violations.length > 0) {
    return { text: FALLBACK_LINE, violations };
  }
  return { text, violations: [] };
}
