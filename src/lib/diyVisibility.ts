/** Returns true when a DIY section should be shown based on urgency level and cause difficulties. */
export function showDIY(
  urgency: string | null | undefined,
  causes: { diy_difficulty?: string | null }[]
): boolean {
  // Never show DIY when urgency is immediate, soon, or unknown
  if (!urgency || urgency === "immediate" || urgency === "soon") return false;

  // Only show for monitor or schedule urgency
  if (urgency !== "monitor" && urgency !== "schedule") return false;

  // At least one cause must be DIY-eligible (easy or moderate)
  return causes.some(
    (c) => c.diy_difficulty === "easy" || c.diy_difficulty === "moderate"
  );
}
