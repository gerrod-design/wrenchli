import type { DtcCategory } from "./dtcCodes";

export interface ToolItem {
  name: string;
  icon: string; // emoji
  optional?: boolean;
}

/**
 * Tools mapped by DTC category. These represent common tools needed
 * for the most typical DIY repair in each category.
 */
export const toolsByCategory: Record<DtcCategory, ToolItem[]> = {
  ignition: [
    { name: "Spark plug socket", icon: "🔧" },
    { name: "Socket wrench set", icon: "🔧" },
    { name: "Gap gauge", icon: "📏" },
    { name: "Dielectric grease", icon: "🧴", optional: true },
  ],
  fuel: [
    { name: "Socket wrench set", icon: "🔧" },
    { name: "Fuel pressure gauge", icon: "📏", optional: true },
    { name: "Safety glasses", icon: "🥽" },
    { name: "Gloves", icon: "🧤" },
  ],
  emissions: [
    { name: "Socket wrench set", icon: "🔧" },
    { name: "O2 sensor socket", icon: "🔧", optional: true },
    { name: "Penetrating oil", icon: "🧴" },
    { name: "Safety glasses", icon: "🥽" },
  ],
  engine: [
    { name: "Throttle body cleaner", icon: "🧴" },
    { name: "Socket wrench set", icon: "🔧" },
    { name: "Screwdriver set", icon: "🪛" },
    { name: "Shop towels", icon: "🧻" },
  ],
  cooling: [
    { name: "Socket wrench set", icon: "🔧" },
    { name: "Drain pan", icon: "🪣" },
    { name: "Coolant funnel", icon: "🔧", optional: true },
    { name: "Gloves", icon: "🧤" },
  ],
  electrical: [
    { name: "Multimeter", icon: "📟" },
    { name: "Wire strippers", icon: "🔧" },
    { name: "Electrical tape", icon: "🧴" },
    { name: "Socket wrench set", icon: "🔧" },
  ],
  transmission: [
    { name: "Socket wrench set", icon: "🔧" },
    { name: "Drain pan", icon: "🪣" },
    { name: "Funnel", icon: "🔧" },
    { name: "Jack & jack stands", icon: "🏗️" },
  ],
  evap: [
    { name: "Replacement gas cap", icon: "🔧" },
    { name: "EVAP smoke machine", icon: "💨", optional: true },
    { name: "Screwdriver set", icon: "🪛" },
  ],
  safety: [
    { name: "Professional service recommended", icon: "⚠️" },
  ],
  abs: [
    { name: "Socket wrench set", icon: "🔧" },
    { name: "Jack & jack stands", icon: "🏗️" },
    { name: "Multimeter", icon: "📟", optional: true },
  ],
  network: [
    { name: "OBD2 scanner", icon: "📟" },
    { name: "Multimeter", icon: "📟" },
    { name: "Fuse puller", icon: "🔧" },
  ],
  sensor: [
    { name: "Socket wrench set", icon: "🔧" },
    { name: "Penetrating oil", icon: "🧴" },
    { name: "Multimeter", icon: "📟", optional: true },
    { name: "Gloves", icon: "🧤" },
  ],
  body: [
    { name: "Screwdriver set", icon: "🪛" },
    { name: "Trim removal tools", icon: "🔧" },
    { name: "Multimeter", icon: "📟", optional: true },
  ],
  chassis: [
    { name: "Socket wrench set", icon: "🔧" },
    { name: "Jack & jack stands", icon: "🏗️" },
    { name: "Torque wrench", icon: "🔧" },
    { name: "Safety glasses", icon: "🥽" },
  ],
};

/**
 * Fallback tools by DIY feasibility level (used for symptom-based diagnoses
 * that don't have a DTC category).
 */
export const toolsByDifficulty: Record<"easy" | "moderate" | "advanced", ToolItem[]> = {
  easy: [
    { name: "Basic socket wrench set", icon: "🔧" },
    { name: "Screwdriver set", icon: "🪛" },
    { name: "Gloves", icon: "🧤" },
  ],
  moderate: [
    { name: "Socket wrench set", icon: "🔧" },
    { name: "Jack & jack stands", icon: "🏗️" },
    { name: "Screwdriver set", icon: "🪛" },
    { name: "Torque wrench", icon: "🔧", optional: true },
    { name: "Safety glasses", icon: "🥽" },
  ],
  advanced: [
    { name: "Professional service recommended", icon: "⚠️" },
    { name: "Specialized tools may be required", icon: "🔧" },
  ],
};

/**
 * Get tools for a diagnosis based on category (if available) or difficulty level.
 */
export function getToolsForDiagnosis(
  category?: DtcCategory,
  difficulty?: "easy" | "moderate" | "advanced"
): ToolItem[] {
  if (category && toolsByCategory[category]) {
    return toolsByCategory[category];
  }
  if (difficulty && toolsByDifficulty[difficulty]) {
    return toolsByDifficulty[difficulty];
  }
  return toolsByDifficulty.easy;
}
