// Pure symptom-bucket analysis for the public assessment API.
// Split out of api-diagnose-handler.ts (R-68) so the pricing behavior is
// unit-testable without the handler's Deno/Supabase imports. The handler
// re-exports analyzeSymptoms from here; behavior is unchanged apart from
// the R-68 book-only semantics noted below.
import { findRepairRate, rateFigures, RATE_SOURCE_ID, PRICE_STATUS_BOOK, PRICE_STATUS_NOT_IN_BOOK } from "./repair-rates.ts";

function analyzeSymptomsRaw(symptoms: string[], vehicle: { year: number; make: string; model: string }) {
  const text = symptoms.join(" ").toLowerCase();

  if (text.includes("grinding") || text.includes("brake")) {
    return { issue: "Brake System Issue", description: "Grinding noises typically indicate worn brake pads that need replacement. This can damage rotors if not addressed promptly.", urgency: "high" as const, cost_estimate: { min: 200, max: 600 } as { min: number; max: number } | null, action: "Schedule brake inspection within 48 hours", safety: "Avoid heavy braking and increase following distance", diy_possible: false };
  }
  if (text.includes("check engine") || text.includes("engine light")) {
    return { issue: "Engine Assessment Needed", description: "Check engine light indicates a system malfunction. Could range from a loose gas cap to serious engine issues.", urgency: "medium" as const, cost_estimate: { min: 100, max: 800 } as { min: number; max: number } | null, action: "Get a professional scan to identify the specific issue", safety: "Safe to drive short distances, avoid hard acceleration", diy_possible: true };
  }
  if (text.includes("oil") || text.includes("leak")) {
    return { issue: "Oil System Issue", description: "Oil leaks can lead to engine damage if oil levels drop too low. Check oil level immediately.", urgency: "medium" as const, cost_estimate: { min: 50, max: 300 } as { min: number; max: number } | null, action: "Check oil level and look for leak source", safety: "Check oil level before driving", diy_possible: true };
  }
  if (text.includes("overheat") || text.includes("temperature") || text.includes("coolant") || text.includes("steam")) {
    return { issue: "Engine Overheating", description: "Your engine is running hotter than it should. This can cause permanent engine damage if not addressed immediately.", urgency: "high" as const, cost_estimate: { min: 150, max: 800 } as { min: number; max: number } | null, action: "Pull over safely and turn off the engine. Do not drive until resolved.", safety: "Do NOT open the radiator cap while hot. Let engine cool completely.", diy_possible: false };
  }
  if (text.includes("noise") || text.includes("sound") || text.includes("rattle") || text.includes("knock")) {
    return { issue: "Mechanical Issue — Assessment Needed", description: "Unusual noises can indicate various mechanical issues. A professional inspection is recommended to identify the source.", urgency: "medium" as const, cost_estimate: { min: 100, max: 500 } as { min: number; max: number } | null, action: "Schedule professional inspection", safety: "Monitor for changes in noise intensity", diy_possible: false };
  }
  if (text.includes("battery") || text.includes("won't start") || text.includes("click") || text.includes("crank")) {
    return { issue: "Battery or Starting System Issue", description: "If your vehicle won't start or you hear clicking, the most common cause is a dead or weak battery.", urgency: "high" as const, cost_estimate: { min: 100, max: 500 } as { min: number; max: number } | null, action: "Test battery voltage or jump-start the vehicle", safety: "Ensure the vehicle is in park and on a level surface before jump-starting", diy_possible: true };
  }
  if (text.includes("transmission") || text.includes("shifting") || text.includes("slipping")) {
    return { issue: "Transmission Issue", description: "Transmission problems can range from low fluid to serious internal damage. Address promptly to prevent costly repairs.", urgency: "high" as const, cost_estimate: { min: 150, max: 3000 } as { min: number; max: number } | null, action: "Check transmission fluid level and schedule inspection", safety: "Avoid aggressive driving and heavy loads", diy_possible: false };
  }

  return { issue: "Professional Inspection Recommended", description: "Multiple symptoms or unclear issue. A professional inspection will identify the specific problem.", urgency: "medium" as const, cost_estimate: { min: 100, max: 400 } as { min: number; max: number } | null, action: "Schedule an inspection appointment with a local mechanic", safety: "Safe to drive short distances unless symptoms worsen", diy_possible: false };
}

// R-56 (Batch 9): buckets whose definition names one specific repair that
// exists in the shared rate table derive their cost_estimate from the
// table, so the public API quotes the same figure as every other surface
// for the same repair.
// R-68: book-only pricing. Buckets spanning several repairs (overheating,
// transmission) or lacking a table entry no longer present their bucket
// range as a price: cost_estimate is null and price_status is
// "not_in_book", the same explicit marker every other pipeline emits.
const BUCKET_RATE_LABELS: Record<string, string> = {
  "Brake System Issue": "Brake Pads Replacement",
  "Battery or Starting System Issue": "Battery Replacement",
};

export function analyzeSymptoms(symptoms: string[], vehicle: { year: number; make: string; model: string }) {
  const result = analyzeSymptomsRaw(symptoms, vehicle);
  const label = BUCKET_RATE_LABELS[result.issue];
  const entry = label ? findRepairRate(label) : null;
  if (entry) {
    const figures = rateFigures(entry);
    result.cost_estimate = { min: figures.shopTotal[0], max: figures.shopTotal[1] };
    (result as any).rate_source = RATE_SOURCE_ID;
    (result as any).price_status = PRICE_STATUS_BOOK;
    (result as any).rate_entry_id = entry.id;
  } else {
    result.cost_estimate = null;
    (result as any).price_status = PRICE_STATUS_NOT_IN_BOOK;
    (result as any).rate_entry_id = null;
  }
  return result as any;
}
