/** Returns true when a DIY section should be shown based on repair cost and feasibility level. */
export function showDIY(repairCost: number, diyFeasibility?: string): boolean {
  const thresholds: Record<string, number> = {
    easy: 5000,
    moderate: 3000,
    advanced: 1500,
  };
  const maxCost = thresholds[diyFeasibility || ""] ?? 2000;
  return repairCost < maxCost;
}
