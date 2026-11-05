/**
 * Preliminary cost-range lookup by symptom category.
 * Used during the loading state to show a broad estimate
 * before the full AI assessment returns.
 *
 * R-68 book-only pricing: this module no longer carries its own hand-set
 * dollar ranges. The range for a category is derived from the shared price
 * book (repair-rates.ts): the lowest low end and highest high end of the
 * shop totals of the book entries in that category. If a category had no
 * book entries, no range would be shown at all (null), rather than an
 * invented figure.
 */

import { REPAIR_RATES, rateFigures } from "@/lib/priceBook";

interface CostCategory {
  label: string;
  /** Symptom-text keywords that select this category. */
  keywords: string[];
  /** Substrings matched against price-book entry labels for this category. */
  bookTerms: string[];
}

const CATEGORIES: CostCategory[] = [
  {
    label: "Brake repair",
    keywords: ["brake", "braking", "grinding", "squealing", "squeak", "rotor", "caliper", "pad", "pedal spongy", "pedal soft"],
    bookTerms: ["brake"],
  },
  {
    label: "Engine / check engine",
    keywords: ["engine", "check engine", "misfire", "stall", "stalling", "idle", "rough idle", "won't start", "no start", "knocking", "ticking", "oil", "overheating", "coolant", "radiator", "thermostat", "p0"],
    bookTerms: ["spark plugs", "ignition coil", "water pump", "thermostat", "radiator", "fuel pump", "mass airflow", "serpentine", "oil change", "timing belt"],
  },
  {
    label: "Suspension / steering",
    keywords: ["suspension", "steering", "strut", "shock", "clunk", "clunking", "tie rod", "ball joint", "wheel bearing", "alignment", "pulling", "vibrat", "wobble", "bounce"],
    bookTerms: ["wheel bearing", "struts", "shock absorbers", "control arm"],
  },
  {
    label: "Electrical",
    keywords: ["electrical", "battery", "alternator", "starter", "fuse", "light", "headlight", "tail light", "dash light", "window", "power window", "wiring", "short", "not charging"],
    bookTerms: ["alternator", "starter motor", "battery"],
  },
  {
    label: "Transmission",
    keywords: ["transmission", "trans", "shifting", "shift", "gear", "slipping", "jerking", "cvt", "torque converter", "clutch"],
    bookTerms: ["transmission"],
  },
  {
    label: "Exhaust / emissions",
    keywords: ["exhaust", "catalytic", "muffler", "emission", "smog", "o2 sensor", "oxygen sensor", "p04"],
    bookTerms: ["oxygen", "catalytic"],
  },
  {
    label: "AC / heating",
    keywords: ["ac", "a/c", "air conditioning", "heat", "heater", "blower", "compressor", "refrigerant", "freon", "defrost"],
    bookTerms: ["a/c compressor"],
  },
];

export interface PreliminaryCostRange {
  category: string;
  low: number;
  high: number;
}

/** Book-derived range for one category; null when the book has no entries for it. */
function bookRangeForCategory(cat: CostCategory): PreliminaryCostRange | null {
  let low = Infinity;
  let high = -Infinity;
  for (const entry of REPAIR_RATES) {
    const label = entry.label.toLowerCase();
    if (!cat.bookTerms.some((term) => label.includes(term))) continue;
    const total = rateFigures(entry).shopTotal;
    low = Math.min(low, total[0]);
    high = Math.max(high, total[1]);
  }
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
  return { category: cat.label, low, high };
}

export function getPreliminaryCostRange(symptomText: string): PreliminaryCostRange | null {
  if (!symptomText) return null;
  const lower = symptomText.toLowerCase();

  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return bookRangeForCategory(cat);
    }
  }

  return null;
}
