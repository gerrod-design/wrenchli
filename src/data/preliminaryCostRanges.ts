/**
 * Preliminary cost-range lookup by symptom category.
 * Used during the loading state to show a broad estimate
 * before the full AI assessment returns.
 */

interface CostCategory {
  label: string;
  keywords: string[];
  low: number;
  high: number;
}

const CATEGORIES: CostCategory[] = [
  {
    label: "Brake repair",
    keywords: ["brake", "braking", "grinding", "squealing", "squeak", "rotor", "caliper", "pad", "pedal spongy", "pedal soft"],
    low: 150,
    high: 450,
  },
  {
    label: "Engine / check engine",
    keywords: ["engine", "check engine", "misfire", "stall", "stalling", "idle", "rough idle", "won't start", "no start", "knocking", "ticking", "oil", "overheating", "coolant", "radiator", "thermostat", "p0"],
    low: 80,
    high: 600,
  },
  {
    label: "Suspension / steering",
    keywords: ["suspension", "steering", "strut", "shock", "clunk", "clunking", "tie rod", "ball joint", "wheel bearing", "alignment", "pulling", "vibrat", "wobble", "bounce"],
    low: 100,
    high: 800,
  },
  {
    label: "Electrical",
    keywords: ["electrical", "battery", "alternator", "starter", "fuse", "light", "headlight", "tail light", "dash light", "window", "power window", "wiring", "short", "not charging"],
    low: 75,
    high: 400,
  },
  {
    label: "Transmission",
    keywords: ["transmission", "trans", "shifting", "shift", "gear", "slipping", "jerking", "cvt", "torque converter", "clutch"],
    low: 150,
    high: 900,
  },
  {
    label: "Exhaust / emissions",
    keywords: ["exhaust", "catalytic", "muffler", "emission", "smog", "o2 sensor", "oxygen sensor", "p04"],
    low: 100,
    high: 500,
  },
  {
    label: "AC / heating",
    keywords: ["ac", "a/c", "air conditioning", "heat", "heater", "blower", "compressor", "refrigerant", "freon", "defrost"],
    low: 100,
    high: 600,
  },
];

export interface PreliminaryCostRange {
  category: string;
  low: number;
  high: number;
}

export function getPreliminaryCostRange(symptomText: string): PreliminaryCostRange | null {
  if (!symptomText) return null;
  const lower = symptomText.toLowerCase();

  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return { category: cat.label, low: cat.low, high: cat.high };
    }
  }

  return null;
}
