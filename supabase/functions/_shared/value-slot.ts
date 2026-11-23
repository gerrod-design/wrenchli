/**
 * value-slot.ts
 * ---------------------------------------------------------------------------
 * The repair-versus-value context block (Moments That Matter map,
 * Decision 1): the shared response shape carried by a price answer so
 * the driver can set the repair cost against the vehicle's likely
 * current market value, as perspective for their own decision.
 *
 * Awareness, not decisions: this block presents the figure, its source
 * and date, and the ratio. It never carries a verdict on whether a
 * repair is "worth it" and never a recommendation.
 *
 * Until a value source is validated (Decision 2: MarketCheck first,
 * J.D. Power as the tested fallback), the block serves its empty state
 * in words. An estimated or model-generated value is NEVER served in
 * this slot; that is exactly the method this slot exists to replace.
 * ---------------------------------------------------------------------------
 */

export type RatioBand = "under_25" | "25_50" | "50_100" | "over_100";

export interface VehicleValue {
  figureUsd: number;
  /** Named source of the figure (e.g. the validated market data feed). */
  source: string;
  /** ISO date the figure was observed. */
  asOf: string;
}

export interface ValueContext {
  status: "available" | "not_available";
  /** Plain-language state of the slot; always present, always honest. */
  note: string;
  repair_range_usd: { low: number; high: number } | null;
  vehicle_value_usd: number | null;
  vehicle_value_source: string | null;
  vehicle_value_as_of: string | null;
  /** Repair range midpoint divided by vehicle value, when both exist. */
  repair_to_value_ratio: number | null;
  repair_to_value_band: RatioBand | null;
}

export const EMPTY_VALUE_NOTE =
  "Value context is not available yet: Wrenchli is validating a market " +
  "value source for this slot, and until it checks out the repair range " +
  "stands on its own. This slot is never filled with a guessed value.";

/** Reporting bands fixed in advance (Moments map): ratio of repair to value. */
export function ratioBand(ratio: number): RatioBand {
  if (ratio < 0.25) return "under_25";
  if (ratio < 0.5) return "25_50";
  if (ratio <= 1.0) return "50_100";
  return "over_100";
}

/** The slot in its designed empty state: present, honest, figure-free. */
export function emptyValueContext(
  range: { low: number; high: number } | null,
): ValueContext {
  return {
    status: "not_available",
    note: EMPTY_VALUE_NOTE,
    repair_range_usd: range,
    vehicle_value_usd: null,
    vehicle_value_source: null,
    vehicle_value_as_of: null,
    repair_to_value_ratio: null,
    repair_to_value_band: null,
  };
}

/**
 * The slot with a validated value. The ratio uses the repair range's
 * midpoint as the representative repair figure; the band boundaries
 * are the fixed reporting bands from the moments map.
 */
export function valueContext(
  range: { low: number; high: number },
  value: VehicleValue,
): ValueContext {
  const ratio = (range.low + range.high) / 2 / value.figureUsd;
  return {
    status: "available",
    note:
      "The repair range is set against the vehicle's market value as " +
      "perspective for your own decision; Wrenchli does not call the " +
      "decision either way.",
    repair_range_usd: range,
    vehicle_value_usd: value.figureUsd,
    vehicle_value_source: value.source,
    vehicle_value_as_of: value.asOf,
    repair_to_value_ratio: Math.round(ratio * 1000) / 1000,
    repair_to_value_band: ratioBand(ratio),
  };
}
