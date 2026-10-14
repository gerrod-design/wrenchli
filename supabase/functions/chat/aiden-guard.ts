// ── Aiden combined guard (code-level, deterministic) ──
//
// Two structural guards for the chat function, added 2026-10-14 under the
// combined-guard brief. Prompt prose alone produced both defects, so these
// run in code on EVERY outgoing assistant reply:
//
// Guard 1 — persona/output guard: strips any "[Agent: ...]" marker and any
// persona-handoff announcement sentence before the reply reaches the
// consumer. What survives is delivered by Aiden himself, in one voice.
//
// Guard 2 — assessment-path guard: when a preliminary assessment is OWED on
// this turn (Shop Required category, or an assessment tool just ran, with
// vehicle + symptom detail already in the conversation), a name ask may not
// preempt or replace it, and likely-cause discussion must carry the exact
// Rule 0 framing ("preliminary assessment"). A violating draft gets ONE
// bounded regeneration with a corrective instruction; if that still
// violates, deterministic repair (strip the name ask, restore the framing,
// or a fixed fallback) guarantees the contract. Legitimate name collection
// — after the assessment is delivered, or where no assessment is owed — is
// untouched.
//
// This module is pure (no Deno/Node APIs) so it is unit-testable under
// vitest from src/lib/__tests__/aiden-guard.test.ts.

// The exact disclaimer the system prompt already mandates verbatim whenever
// assessment results are presented. The deterministic fallback presents an
// assessment framing, so it carries the same line, unchanged.
export const REQUIRED_DISCLAIMER =
  "Wrenchli is not a licensed mechanic. This is an informational symptom assessment only. For professional diagnosis and repair, please consult a qualified automotive technician.";

// Used when Guard 1 removes an entire reply (it was nothing but a handoff
// announcement): Aiden simply takes the conversation himself.
export const TAKEOVER_LINE =
  "I can help you with that directly — tell me a little more about what's going on.";

// ── Detection primitives ──

const NAME_ASK_PATTERNS: RegExp[] = [
  /\bwhat('s| is) your name\b/i,
  /\bwhat should i call you\b/i,
  /\bwhat do i call you\b/i,
  /\bmay i (have|ask|get) your name\b/i,
  /\bcan i (have|get|ask) your name\b/i,
  /\byour name,?\s*(please|by the way)?\s*\?/i,
  /\bwho am i (talking|speaking|chatting) (to|with)\b/i,
  /\bwhat('s| is) your first name\b/i,
];

export function containsNameAsk(text: string): boolean {
  return NAME_ASK_PATTERNS.some((p) => p.test(text));
}

export function containsPreliminaryAssessment(text: string): boolean {
  return /preliminary assessment/i.test(text);
}

const AGENT_MARKER_PATTERN = /\[Agent:[^\]]*\]/gi;

// Sentences announcing a handoff to another persona. Kept deliberately
// narrow: removing legitimate content is worse than missing an exotic
// phrasing, and the marker strip above catches the machine-readable form.
const HANDOFF_SENTENCE_PATTERNS: RegExp[] = [
  /\blet me (bring in|hand you|pass you|transfer you|connect you|get)\b[^.?!]*\b(sam|jess|kai|priya|mike|specialist|expert|colleague)\b/i,
  /\bi('ll| will) (bring in|hand you|pass you|transfer you|connect you)\b/i,
  /\bhanding you (off|over)\b/i,
  /\bhand you (off|over)\b/i,
  /\b(sam|jess|kai|priya|mike) (handles|will handle|can handle|specializes|specialises|takes care of|will take it|will help you)\b/i,
  /\bbringing in (sam|jess|kai|priya|mike|our|a)\b/i,
  /\blet (sam|jess|kai|priya|mike) (take|handle|help)\b/i,
  /\bour (cost |repair )?(specialist|expert)\b[^.?!]*\b(take over|take it from here|joining)\b/i,
];

// Split into sentences, keeping it simple and conservative: model replies in
// this product are short (1-3 sentences by style rule). Returns the trimmed
// non-empty sentences in order.
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function isHandoffSentence(sentence: string): boolean {
  return HANDOFF_SENTENCE_PATTERNS.some((p) => p.test(sentence));
}

// Guard 1. Returns the cleaned text. If nothing was removed, the ORIGINAL
// string is returned untouched (no reformatting of compliant replies).
export function stripPersonaHandoffs(
  text: string,
): { text: string; changed: boolean } {
  let changed = false;

  let working = text.replace(AGENT_MARKER_PATTERN, () => {
    changed = true;
    return "";
  });

  const sentences = splitSentences(working);
  const kept = sentences.filter((s) => {
    if (isHandoffSentence(s)) {
      changed = true;
      return false;
    }
    return true;
  });

  if (!changed) return { text, changed: false };

  working = kept.join(" ").replace(/\s{2,}/g, " ").trim();
  return { text: working, changed: true };
}

// Remove only the name-ask sentences from a reply (deterministic repair).
// Returns the original string untouched when no sentence matches.
export function stripNameAskSentences(text: string): string {
  const sentences = splitSentences(text);
  const kept = sentences.filter((s) => !containsNameAsk(s));
  if (kept.length === sentences.length) return text;
  return kept.join(" ").replace(/\s{2,}/g, " ").trim();
}

// ── Guard context: what is true about this conversation, deterministically ──

export interface GuardContext {
  vehicleKnown: boolean;
  symptomPresent: boolean;
  shopRequired: boolean;
  // Human phrase for the Rule 0 category in play, e.g. "your brakes".
  categoryPhrase: string | null;
  assessToolCalled: boolean;
  assessmentAlreadyDelivered: boolean;
  // True when THIS turn owes the consumer a preliminary assessment before
  // anything else (in particular, before any name ask).
  assessmentOwed: boolean;
}

const KNOWN_MAKES = [
  "honda", "toyota", "ford", "chevrolet", "chevy", "nissan", "jeep", "dodge",
  "ram", "gmc", "bmw", "mercedes", "audi", "volkswagen", "vw", "hyundai",
  "kia", "subaru", "mazda", "tesla", "lexus", "acura", "cadillac",
  "chrysler", "buick", "volvo", "porsche", "land rover", "mini",
  "mitsubishi", "infiniti", "lincoln", "genesis", "rivian", "lucid",
];

// Rule 0 categories, mirrored from the system prompt's own lists.
const RULE0_CATEGORY_TERMS: Array<{ phrase: string; terms: string[] }> = [
  {
    phrase: "your brakes",
    terms: [
      "brake", "braking", "rotor", "caliper", "brake pad", "brake line",
      "brake fluid",
    ],
  },
  {
    phrase: "your steering",
    terms: ["steering", "power steering", "tie rod"],
  },
  { phrase: "your airbags", terms: ["airbag", "srs"] },
  {
    phrase: "your fuel system",
    terms: [
      "fuel pump", "fuel filter", "fuel injector", "fuel line", "fuel tank",
      "gas tank",
    ],
  },
];

const SYMPTOM_TERMS = [
  "squeal", "squeak", "grind", "clicking", "knock", "rattle", "clunk",
  "hiss", "leak", "drip", "smoke", "smell", "vibrat", "shak", "stall",
  "won't start", "wont start", "not starting", "no start", "check engine",
  "warning light", "noise", "sound", "overheat", "pulling", "spongy",
  "soft pedal", "dead battery", "flat tire", "jerking", "hesitat",
  "rough idle", "misfir", "grinding", "whine", "whining", "thump",
  "banging", "burning smell", "dashboard light",
];

export function buildGuardContext(input: {
  messages: Array<{ role: string; content: string }>;
  vehicleContext?: { year?: string; make?: string; model?: string } | undefined;
  toolsCalled?: string[];
}): GuardContext {
  const userText = input.messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n")
    .toLowerCase();
  const assistantText = input.messages
    .filter((m) => m.role === "assistant")
    .map((m) => m.content)
    .join("\n");

  const vehicleKnown = Boolean(
    input.vehicleContext?.make ||
    input.vehicleContext?.model ||
    /\b(19|20)\d{2}\s+[a-z]/.test(userText) ||
    KNOWN_MAKES.some((make) => new RegExp(`\\b${make}\\b`).test(userText)),
  );

  const symptomPresent = SYMPTOM_TERMS.some((t) => userText.includes(t));

  let shopRequired = false;
  let categoryPhrase: string | null = null;
  for (const cat of RULE0_CATEGORY_TERMS) {
    if (cat.terms.some((t) => userText.includes(t))) {
      shopRequired = true;
      categoryPhrase = cat.phrase;
      break;
    }
  }

  const tools = input.toolsCalled ?? [];
  const assessToolCalled =
    tools.includes("assess_symptoms") || tools.includes("assess_damage_photo");

  const assessmentAlreadyDelivered = containsPreliminaryAssessment(assistantText);

  const assessmentOwed =
    vehicleKnown &&
    symptomPresent &&
    (shopRequired || assessToolCalled) &&
    !assessmentAlreadyDelivered;

  return {
    vehicleKnown,
    symptomPresent,
    shopRequired,
    categoryPhrase,
    assessToolCalled,
    assessmentAlreadyDelivered,
    assessmentOwed,
  };
}

// ── Evaluation ──

export type GuardViolation =
  | "name-ask-preempts-assessment"
  | "missing-assessment-framing";

const CAUSE_MODAL_PATTERN =
  /\b(likely|probably|sounds like|could be|might be|may be|usually means|typically means|points to|points toward|indicates|is often|are often)\b/i;
const CAUSE_NOUN_PATTERN =
  /\b(pads?|rotors?|calipers?|alternator|battery|belts?|pumps?|sensors?|starter|compressor|bearings?|struts?|shocks?|muffler|catalytic|thermostat|radiator|hoses?|filters?|spark plugs?|coils?|transmission|engine|motor|fan|switch|relay|fuse|fluid|wear|booster|master cylinder|wheel cylinder|injectors?)\b/i;

// Heuristic for "this reply discusses likely causes": a hedging/modal phrase
// AND a component noun in the same reply. Used only inside a Shop Required
// context, where Rule 0 requires the framing for such discussion.
export function discussesLikelyCauses(text: string): boolean {
  return CAUSE_MODAL_PATTERN.test(text) && CAUSE_NOUN_PATTERN.test(text);
}

export function evaluateReply(
  text: string,
  ctx: GuardContext,
): { ok: boolean; violations: GuardViolation[] } {
  const violations: GuardViolation[] = [];
  const hasPhrase = containsPreliminaryAssessment(text);

  // Name-gate: an owed assessment may not be preempted or replaced by a
  // name ask. (A name ask AFTER the assessment in the same reply — phrase
  // present — is legitimate and passes.)
  if (ctx.assessmentOwed && containsNameAsk(text) && !hasPhrase) {
    violations.push("name-ask-preempts-assessment");
  }

  // Rule 0 framing: likely-cause discussion in a Shop Required category must
  // carry the exact framing, on every turn.
  if (ctx.shopRequired && !hasPhrase && discussesLikelyCauses(text)) {
    violations.push("missing-assessment-framing");
  }

  return { ok: violations.length === 0, violations };
}

// ── Deterministic fallback / repair ──

// Fixed, contract-compliant assessment reply used when the model fails the
// guard twice. Invents no cause, asks for no name, carries the framing and
// the mandated disclaimer.
export function fallbackAssessment(ctx: GuardContext): string {
  if (ctx.shopRequired) {
    const category = ctx.categoryPhrase ?? "that system";
    return (
      `Based on a preliminary assessment of what you're describing, this involves ${category} — ` +
      `that's a Shop Required job that needs a qualified technician, and I don't want to guess at ` +
      `the exact cause without a proper inspection. A shop can confirm what's going on and what ` +
      `it should cost before any work starts.\n${REQUIRED_DISCLAIMER}`
    );
  }
  return (
    `Based on a preliminary assessment of what you've told me so far, there are a few likely ` +
    `causes worth checking. Tell me a little more about when it happens and I'll help narrow it down.\n` +
    REQUIRED_DISCLAIMER
  );
}

const FRAMING_OPENER =
  "Based on a preliminary assessment of what you're describing, here's what stands out: ";

// Deterministic repair of a still-violating reply, in order:
// 1. drop name-ask sentences;
// 2. if the assessment framing is now present, deliver as-is;
// 3. if substantive likely-cause content remains, restore the framing by
//    prepending the framing opener (the content itself is preserved);
// 4. otherwise there is no real assessment content to rescue (the draft was
//    a deflection or filler) — use the fixed fallback rather than dressing
//    filler up as an assessment.
export function repairReply(text: string, ctx: GuardContext): string {
  const working = stripNameAskSentences(text).trim();
  if (working && containsPreliminaryAssessment(working)) return working;
  if (working && discussesLikelyCauses(working)) {
    return FRAMING_OPENER + working.charAt(0).toLowerCase() + working.slice(1);
  }
  return fallbackAssessment(ctx);
}

// ── Orchestration ──
//
// enforceAidenGuards(draft, ctx, regenerate):
//   1. Guard 1 strip (markers + handoff sentences).
//   2. If the strip emptied the reply, substitute the takeover line — or the
//      assessment fallback when an assessment is owed.
//   3. Evaluate. Compliant → return.
//   4. One bounded regeneration via the caller-supplied callback (the chat
//      handler re-asks the model with a corrective instruction). The
//      regenerated text re-enters at step 1.
//   5. Still violating → deterministic repair (repairReply).
export async function enforceAidenGuards(
  draft: string,
  ctx: GuardContext,
  regenerate?: (violations: GuardViolation[]) => Promise<string | null>,
): Promise<{ text: string; actions: string[] }> {
  const actions: string[] = [];

  const first = stripPersonaHandoffs(draft);
  if (first.changed) actions.push("stripped-persona-content");
  let text = first.text.trim();

  if (!text) {
    actions.push("empty-after-strip");
    return {
      text: ctx.assessmentOwed ? fallbackAssessment(ctx) : TAKEOVER_LINE,
      actions,
    };
  }

  const verdict = evaluateReply(text, ctx);
  if (verdict.ok) return { text, actions };

  actions.push(`violation:${verdict.violations.join("+")}`);

  if (regenerate) {
    let regenerated: string | null = null;
    try {
      regenerated = await regenerate(verdict.violations);
    } catch {
      regenerated = null;
    }
    if (regenerated && regenerated.trim()) {
      const second = stripPersonaHandoffs(regenerated);
      if (second.changed) actions.push("stripped-persona-content");
      const candidate = second.text.trim();
      if (candidate && evaluateReply(candidate, ctx).ok) {
        actions.push("regenerated");
        return { text: candidate, actions };
      }
      if (candidate) text = candidate;
    }
  }

  actions.push("deterministic-repair");
  return { text: repairReply(text, ctx), actions };
}
