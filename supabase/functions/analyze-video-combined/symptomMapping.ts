// supabase/functions/analyze-video-combined/symptomMapping.ts

export interface SenseBundle {
  observations: {
    sense: "SEE" | "HEAR" | "SMELL" | "FEEL";
    descriptors: string[];
    freeText?: string;
  }[];
  timing: string[];
  conditions: string[];
  locations: string[];
}

export const DESCRIPTOR_TO_SYSTEMS: Record<string, string[]> = {
  // SEE
  "warning light on": ["electrical"],
  smoke: ["engine", "cooling"],
  steam: ["cooling"],
  "leak under car": ["cooling", "transmission", "engine"],
  "visible damage": ["body"],
  "tire looks low": ["tires"],
  "fluid on ground": ["cooling", "transmission", "brakes"],
  "rust/corrosion": ["body", "exhaust"],

  // HEAR
  squealing: ["brakes", "belts"],
  grinding: ["brakes"],
  knocking: ["engine"],
  rattling: ["exhaust", "suspension"],
  hissing: ["cooling", "tires"],
  clicking: ["electrical", "engine"],
  "humming/whining": ["transmission", "wheel bearings"],
  "clunking over bumps": ["suspension"],

  // SMELL
  sweet: ["cooling"],
  "rotten egg": ["catalytic converter", "battery"],
  burning: ["engine", "brakes"],
  gasoline: ["fuel system"],
  musty: ["cabin air"],
  "hot/metallic": ["brakes", "engine"],

  // FEEL
  "vibration in steering wheel": ["tires", "suspension"],
  "vibration in seat": ["tires", "drivetrain"],
  "pulling left": ["alignment", "brakes"],
  "pulling right": ["alignment", "brakes"],
  "spongy brake pedal": ["brake hydraulics"],
  "shaking at speed": ["tires", "suspension"],
  "hard to steer": ["power steering", "suspension"],
};

export function computeUrgency(
  bundle: SenseBundle,
): { tier: 1 | 2 | 3; reason?: string } {
  // Collect all descriptors and freeText
  const allDescriptors: string[] = [];
  let allFreeText = "";

  for (const obs of bundle.observations) {
    allDescriptors.push(...obs.descriptors);
    if (obs.freeText) {
      allFreeText += " " + obs.freeText.toLowerCase();
    }
  }

  const descriptorSet = new Set(allDescriptors);
  const conditionSet = new Set(bundle.conditions);
  const locationSet = new Set(bundle.locations);

  // Tier 3 checks
  if (
    descriptorSet.has("spongy brake pedal") &&
    conditionSet.has("when braking")
  ) {
    return {
      tier: 3,
      reason: "Spongy brake pedal can mean brake fluid loss — this is safety-critical.",
    };
  }

  if (descriptorSet.has("grinding") && conditionSet.has("when braking")) {
    return {
      tier: 3,
      reason: "Grinding brakes can mean pads worn through to metal.",
    };
  }

  if (descriptorSet.has("smoke") && descriptorSet.has("burning")) {
    return {
      tier: 3,
      reason: "Smoke plus a burning smell needs immediate attention.",
    };
  }

  if (descriptorSet.has("steam")) {
    return {
      tier: 3,
      reason: "Steam can mean overheating — continued driving risks engine damage.",
    };
  }

  if (
    descriptorSet.has("gasoline") && locationSet.has("inside the cabin")
  ) {
    return {
      tier: 3,
      reason: "Strong fuel smell inside the car is a fire risk.",
    };
  }

  if (allFreeText) {
    const hasSteeringMention = allFreeText.includes("steering");
    const hasCriticalWord = /\b(loss|gone|failed)\b/.test(allFreeText);
    if (hasSteeringMention && hasCriticalWord) {
      return {
        tier: 3,
        reason: "Loss of steering needs immediate attention.",
      };
    }
  }

  // Tier 2 checks
  if (
    descriptorSet.has("grinding") ||
    descriptorSet.has("knocking") ||
    descriptorSet.has("squealing")
  ) {
    return {
      tier: 2,
      reason: "That sound can mean a part wearing out — get it checked this week.",
    };
  }

  if (descriptorSet.has("warning light on")) {
    return {
      tier: 2,
      reason: "A warning light means the car is flagging something — get it checked this week.",
    };
  }

  if (
    descriptorSet.has("leak under car") || descriptorSet.has("fluid on ground")
  ) {
    return {
      tier: 2,
      reason: "Fluid leaks get worse if ignored — get it checked this week.",
    };
  }

  if (allFreeText.trim().length > 0) {
    return {
      tier: 2,
      reason: "You described something custom — a shop should look this week.",
    };
  }

  // Default: tier 1
  return { tier: 1 };
}

export function mapToSystemAreas(bundle: SenseBundle): string[] {
  const systemSet = new Set<string>();

  for (const obs of bundle.observations) {
    for (const descriptor of obs.descriptors) {
      const systems = DESCRIPTOR_TO_SYSTEMS[descriptor];
      if (systems) {
        systems.forEach((s) => systemSet.add(s));
      }
    }
  }

  return Array.from(systemSet);
}

export function generateShopSummary(
  bundle: SenseBundle,
  systemAreas: string[],
): string {
  // Build descriptor summary
  const descriptorParts: string[] = [];
  for (const obs of bundle.observations) {
    if (obs.descriptors.length > 0) {
      descriptorParts.push(obs.descriptors.join(", "));
    }
    if (obs.freeText) {
      descriptorParts.push(`(notes: ${obs.freeText})`);
    }
  }

  const descriptorSummary = descriptorParts.join("; ");

  // Timing
  const timingStr = bundle.timing.length > 0
    ? bundle.timing.join(", ")
    : "recently";

  // Conditions
  const conditionsStr = bundle.conditions.length > 0
    ? bundle.conditions.join(", ")
    : "general driving";

  // Locations
  const locationsStr = bundle.locations.length > 0
    ? ", " + bundle.locations.join(", ")
    : "";

  // Systems
  const systemsStr = systemAreas.length > 0
    ? systemAreas.join(", ")
    : "unknown";

  return `Customer reports ${descriptorSummary} (${timingStr}), ${conditionsStr}${locationsStr}. Likely systems: ${systemsStr}. Advise inspection and assessment.`;
}
