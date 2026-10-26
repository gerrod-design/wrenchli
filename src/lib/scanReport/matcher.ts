/**
 * Scan report vehicle matcher — pure module.
 *
 * Given a parsed report (a VIN fragment of up to the last 6 characters,
 * plus year/make/model) and the OWNER's vehicles, propose at most one
 * match:
 *
 *  - "exact": a vehicle's full VIN ends with the report's VIN fragment.
 *  - "weak": no exact VIN match, and exactly one vehicle matches on
 *    year/make/model (model compared loosely — reports print trim-shaped
 *    model strings like "M850XI" where the Garage stores "M850i").
 *  - "none": no candidate, or the candidates are ambiguous. An ambiguous
 *    proposal is worse than none: the owner picks in the UI.
 *
 * The matcher only PROPOSES. Filing always requires the owner's explicit
 * confirmation (see filing.ts — it throws without a confirmed vehicle id).
 */

import type { MatchableVehicle } from "./types";

export type ScanReportMatchStrength = "exact" | "weak" | "none";

export interface ScanReportMatchProposal {
  vehicleId: string | null;
  strength: ScanReportMatchStrength;
  reason: string;
}

export interface MatchableParsedReport {
  vinFragment: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
}

export function normalizeVinFragment(fragment: string | null | undefined): string | null {
  if (!fragment) return null;
  const cleaned = fragment.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length < 4) return null;
  return cleaned.slice(-6);
}

function normalizeLoose(value: string | null | undefined): string {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Loose model equality, because reports print trim-shaped model strings:
 *  equal after normalization; or one is a prefix of the other (≥3 chars);
 *  or they share a ≥4-char prefix with a length difference of at most 2 —
 *  the "M850XI" (report) vs "M850I" (Garage) shape, where the report
 *  inserts the drivetrain letter before the trim letter. */
function modelMatches(a: string | null, b: string | null): boolean {
  const na = normalizeLoose(a);
  const nb = normalizeLoose(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const [shorter, longer] = na.length <= nb.length ? [na, nb] : [nb, na];
  if (shorter.length >= 3 && longer.startsWith(shorter)) return true;
  let prefix = 0;
  while (
    prefix < shorter.length &&
    shorter.charCodeAt(prefix) === longer.charCodeAt(prefix)
  ) {
    prefix++;
  }
  return prefix >= 4 && longer.length - shorter.length <= 2;
}

function yearMakeModelMatches(
  parsed: MatchableParsedReport,
  vehicle: MatchableVehicle,
): boolean {
  if (!parsed.make || !parsed.model) return false;
  if (normalizeLoose(parsed.make) !== normalizeLoose(vehicle.make)) return false;
  if (!modelMatches(parsed.model, vehicle.model)) return false;
  if (parsed.year !== null && parsed.year !== vehicle.year) return false;
  return true;
}

export function proposeScanReportMatch(
  parsed: MatchableParsedReport,
  vehicles: MatchableVehicle[],
): ScanReportMatchProposal {
  const fragment = normalizeVinFragment(parsed.vinFragment);

  if (fragment) {
    const exact = vehicles.filter(
      (v) => v.vin && normalizeLoose(v.vin).endsWith(fragment),
    );
    if (exact.length === 1) {
      return {
        vehicleId: exact[0].id,
        strength: "exact",
        reason: "vin-fragment",
      };
    }
    if (exact.length > 1) {
      const narrowed = exact.filter((v) => yearMakeModelMatches(parsed, v));
      if (narrowed.length === 1) {
        return {
          vehicleId: narrowed[0].id,
          strength: "exact",
          reason: "vin-fragment+ymm",
        };
      }
      return {
        vehicleId: null,
        strength: "none",
        reason: "ambiguous-vin-fragment",
      };
    }
  }

  const weak = vehicles.filter((v) => yearMakeModelMatches(parsed, v));
  if (weak.length === 1) {
    return { vehicleId: weak[0].id, strength: "weak", reason: "ymm-only" };
  }
  if (weak.length > 1) {
    return { vehicleId: null, strength: "none", reason: "ambiguous-ymm" };
  }
  return { vehicleId: null, strength: "none", reason: "no-candidate" };
}
