const SAFETY_CRITICAL_PATTERNS = [/\bbrak/i, /\bsteer/i, /\bair\s?bags?/i, /\bfuel/i];

/** Returns true when a cause name involves brakes, steering, airbags, or the fuel system. */
export function isSafetyCriticalCause(name: string | null | undefined): boolean {
  if (!name) return false;
  return SAFETY_CRITICAL_PATTERNS.some((p) => p.test(name));
}

export interface DIYCause {
  diy_difficulty?: string | null;
  name?: string | null;
}

/**
 * Returns true when a single cause is safe to show DIY guidance for:
 * easy/moderate difficulty AND not safety-critical.
 *
 * Safety-critical causes (brakes, steering, airbags, fuel) always resolve to
 * Shop Required, even if a backend ever mislabels their difficulty. They are
 * excluded per-cause rather than vetoing DIY for unrelated causes, so a
 * "DIY Friendly" air filter still surfaces its DIY card and outcome prompt
 * when a fuel-system cause appears elsewhere in the differential.
 */
export function isDIYEligibleCause(c: DIYCause): boolean {
  const diff = c.diy_difficulty === "easy" || c.diy_difficulty === "moderate";
  return diff && !isSafetyCriticalCause(c.name);
}

/** Returns true when a DIY section should be shown based on urgency level and cause difficulties. */
export function showDIY(
  urgency: string | null | undefined,
  causes: DIYCause[]
): boolean {
  // Never show DIY when urgency is immediate, soon, or unknown
  if (!urgency || urgency === "immediate" || urgency === "soon") return false;

  // Only show for monitor or schedule urgency
  if (urgency !== "monitor" && urgency !== "schedule") return false;

  // At least one cause must be DIY-eligible and not safety-critical
  return causes.some(isDIYEligibleCause);
}
