const SAFETY_CRITICAL_PATTERNS = [/\bbrak/i, /\bsteer/i, /\bair\s?bags?/i, /\bfuel/i];

/** Returns true when a cause name involves brakes, steering, airbags, or the fuel system. */
export function isSafetyCriticalCause(name: string | null | undefined): boolean {
  if (!name) return false;
  return SAFETY_CRITICAL_PATTERNS.some((p) => p.test(name));
}

/** Returns true when a DIY section should be shown based on urgency level and cause difficulties. */
export function showDIY(
  urgency: string | null | undefined,
  causes: { diy_difficulty?: string | null; name?: string | null }[]
): boolean {
  // Never show DIY when urgency is immediate, soon, or unknown
  if (!urgency || urgency === "immediate" || urgency === "soon") return false;

  // Only show for monitor or schedule urgency
  if (urgency !== "monitor" && urgency !== "schedule") return false;

  // Never show DIY when any cause touches a safety-critical system
  if (causes.some((c) => isSafetyCriticalCause(c.name))) return false;

  // At least one cause must be DIY-eligible (easy or moderate)
  return causes.some(
    (c) => c.diy_difficulty === "easy" || c.diy_difficulty === "moderate"
  );
}
