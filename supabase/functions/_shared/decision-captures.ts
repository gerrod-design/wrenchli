/**
 * decision-captures.ts
 * ---------------------------------------------------------------------------
 * The repair-versus-value decision record (Moments That Matter map,
 * Decision 1 capture requirements): when a price check or assessment
 * reaches a referral, the decision point is recorded with the value
 * snapshot shown, the repair range shown, the confirmed quote when
 * one lands, and the outcome. This is the seed of the proceed-rate
 * data set and of the first-party outcome data that becomes the price
 * book's long-term basis.
 *
 * Storage-terms rule: a value figure is stored only when the value
 * source's terms allow it (the Decision 2 written question). When
 * they do not, the row stores the ratio band only, never the figure.
 * buildCaptureRow enforces that split; it is the only sanctioned way
 * to shape a row for public.decision_point_captures.
 * ---------------------------------------------------------------------------
 */

import { ratioBand, type RatioBand } from "./value-slot.ts";

export type CaptureSource =
  | "mcp_price_check"
  | "mcp_assessment"
  | "web_assessment"
  | "web_quote_approval";

export type CaptureOutcome =
  | "proceeded"
  | "declined"
  | "replacement"
  | "no_decision";

export interface CaptureValueSnapshot {
  figureUsd: number;
  source: string;
  /** ISO date the figure was observed. */
  asOf: string;
  /** The terms basis under which the figure may be stored. */
  termsBasis: string;
  /** False when the source's terms refuse figure storage: band only. */
  figureStorageAllowed: boolean;
}

export interface CaptureInput {
  source: CaptureSource;
  mcpKeyId?: string | null;
  assessmentSessionId?: string | null;
  referralPackageId?: string | null;
  vehicle?: { year: number; make: string; model: string } | null;
  repairId?: string | null;
  rangeUsd?: { low: number; high: number } | null;
  value?: CaptureValueSnapshot | null;
  confirmedQuoteUsd?: number | null;
  outcome?: CaptureOutcome;
}

export interface CaptureRow {
  source: CaptureSource;
  mcp_key_id: string | null;
  assessment_session_id: string | null;
  referral_package_id: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  repair_id: string | null;
  range_low_cents: number | null;
  range_high_cents: number | null;
  value_figure_cents: number | null;
  value_source: string | null;
  value_as_of: string | null;
  value_terms_basis: string | null;
  ratio_band: RatioBand | null;
  confirmed_quote_cents: number | null;
  outcome: CaptureOutcome;
}

const cents = (usd: number) => Math.round(usd * 100);

export function buildCaptureRow(input: CaptureInput): CaptureRow {
  const range = input.rangeUsd ?? null;
  const value = input.value ?? null;

  let band: RatioBand | null = null;
  if (range && value) {
    band = ratioBand((range.low + range.high) / 2 / value.figureUsd);
  }

  // The figure columns are populated only when storage is allowed;
  // the band is computed either way and is all that survives a refusal.
  const storeFigure = Boolean(value && value.figureStorageAllowed);

  return {
    source: input.source,
    mcp_key_id: input.mcpKeyId ?? null,
    assessment_session_id: input.assessmentSessionId ?? null,
    referral_package_id: input.referralPackageId ?? null,
    vehicle_year: input.vehicle?.year ?? null,
    vehicle_make: input.vehicle?.make ?? null,
    vehicle_model: input.vehicle?.model ?? null,
    repair_id: input.repairId ?? null,
    range_low_cents: range ? cents(range.low) : null,
    range_high_cents: range ? cents(range.high) : null,
    value_figure_cents: storeFigure && value ? cents(value.figureUsd) : null,
    value_source: storeFigure && value ? value.source : null,
    value_as_of: storeFigure && value ? value.asOf : null,
    value_terms_basis: storeFigure && value ? value.termsBasis : null,
    ratio_band: band,
    confirmed_quote_cents:
      input.confirmedQuoteUsd != null ? cents(input.confirmedQuoteUsd) : null,
    outcome: input.outcome ?? "no_decision",
  };
}
