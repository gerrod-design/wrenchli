/** Returns a human-readable time estimate for DIY repairs by difficulty level. */
export function getRepairTimeEstimate(difficulty: string): string | null {
  switch (difficulty) {
    case "easy":
      return "30–60 minutes";
    case "moderate":
      return "1–3 hours";
    case "professional_only":
      return null;
    default:
      return null;
  }
}
