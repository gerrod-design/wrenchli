/**
 * Scan report import — every user-facing string for the feature lives in
 * this one module (the copy sweep test reads it from here).
 *
 * Language rules (build brief):
 *  - The word for what Aiden gives is a preliminary assessment; the
 *    banned-word list in BANNED_COPY_PATTERNS is enforced by test over
 *    every string this module can produce.
 *  - Codes are what the tool reported, stated plainly. Nothing here says
 *    a code is minor, safe, or fine, and nothing offers to remove a code.
 *  - Compatibility wording is factual only, exactly as written in
 *    `compatibilityLine`.
 *  - The iPhone note is honest: there is no direct app-to-app share into
 *    a web page on iOS, so the saved PDF is the way in.
 */

import type { ScanReport, ScanReportParsedPayload } from "./types";
import { vehicleDisplayName, type MatchableVehicle } from "./types";

export const scanReportCopy = {
  addButton: "Add a scan report",
  sectionTitle: "Scan reports",
  sectionEmpty: "No scan reports filed for this vehicle yet.",
  importTitle: "Add a scan report",
  importIntro:
    "Bring a report from your scan tool. In the scan app, export the report as a PDF and save the file, then pick it here. On iPhone there is no direct app-to-app share into a web page, so the saved PDF is the way in.",
  compatibilityLine:
    "Works with reports from scan tools like Innova RepairSolutions2 and BlueDriver.",
  chooseFile: "Choose the report PDF",
  readingReport: "Reading the report…",
  uploadingReport: "Saving the file to your Garage…",
  filingReport: "Filing the report…",
  parseHeading: "Here is what we read",
  unparsedNote:
    "We could not read this file as a scan report. The original PDF is still yours to file below, and you can open it from the record at any time.",
  partialNote:
    "We read part of this report. Some details may be missing, and the codes below are a best-effort read of the file.",
  noCodesNote: "The report states that no codes were reported.",
  codesStatement:
    "These are the codes your scan tool reported, in the report's own words. This entry is a record of that report, not a verdict on the vehicle.",
  confirmHeading: "Which vehicle does this report belong to?",
  neverSilentNote:
    "A report is filed only after you confirm the vehicle. Nothing is filed automatically.",
  confirmFileButton: "File it on this vehicle's record",
  cancelButton: "Cancel",
  filedToast: "Scan report filed on the vehicle's record.",
  fileErrorToast: "The report could not be filed. Please try again.",
  uploadErrorToast: "That file could not be saved. Please try again.",
  parseErrorToast:
    "We could not read that file. Check that it is the PDF exported from your scan app.",
  openOriginal: "Open the original report",
  aidenButton: "Go through this with Aiden",
  proposalExactBadge: "VIN match",
  proposalWeakBadge: "Best match",
  filedOnPrefix: "Filed",
  reportIdLabel: "Report",
  scannedAtLabel: "Scanned",
  recordedOdometerPrefix: "Odometer on the report",
  codesCountSuffix: "codes reported",
  oneCodeSuffix: "code reported",
} as const;

export function formatOdometerLine(report: {
  odometer: number | null;
  parsed_payload: ScanReportParsedPayload;
}): string | null {
  const value = report.odometer ?? report.parsed_payload.odometer;
  if (value === null || value === undefined) return null;
  const unit = report.parsed_payload.odometerUnit === "km" ? "km" : "mi";
  return `${scanReportCopy.recordedOdometerPrefix}: ${value.toLocaleString("en-US")} ${unit}`;
}

export function formatCodesCount(count: number): string {
  return count === 1
    ? `1 ${scanReportCopy.oneCodeSuffix}`
    : `${count} ${scanReportCopy.codesCountSuffix}`;
}

export function matchProposalText(
  strength: "exact" | "weak",
  vehicle: MatchableVehicle,
): string {
  const name = vehicleDisplayName(vehicle);
  return strength === "exact"
    ? `This looks like your ${name} — the VIN digits on the report match this vehicle.`
    : `This may be your ${name} — the year, make, and model match, but the report's VIN digits could not be checked against this vehicle.`;
}

export const matchNoneText =
  "We could not match this report to a vehicle in your Garage. Pick the vehicle it belongs to below.";

export const confirmRequiredError =
  "Confirm which vehicle this report belongs to before filing it.";

export function timelineTitle(report: Pick<ScanReport, "source_tool" | "report_id">): string {
  return report.report_id
    ? `Scan report — ${report.source_tool} report ${report.report_id}`
    : `Scan report — ${report.source_tool}`;
}

export function timelineDetail(report: ScanReport): string {
  const payload = report.parsed_payload;
  const parts: string[] = [];
  parts.push(
    payload.codes.length > 0
      ? formatCodesCount(payload.codes.length)
      : "No codes were read from this report",
  );
  const odo = formatOdometerLine(report);
  if (odo) parts.push(odo);
  parts.push("Filed from the PDF the owner added. The codes are recorded in the scan report entry.");
  return parts.join(" · ");
}

/** The first message Aiden receives when the owner taps the entry's
 *  action: a factual summary of the filed report, nothing more. */
export function buildAidenPrefillMessage(
  report: ScanReport,
  vehicle: MatchableVehicle,
): string {
  const payload = report.parsed_payload;
  const name = vehicleDisplayName(vehicle);
  const lines: string[] = [];
  lines.push(
    `I added a scan report to my ${name} in the Garage and I would like to go through it with you.`,
  );
  lines.push(
    `The report is from ${report.source_tool}${report.report_id ? `, report ${report.report_id}` : ""}.`,
  );
  const odo = formatOdometerLine(report);
  if (odo) lines.push(`${odo}.`);
  if (payload.codes.length > 0) {
    lines.push("The tool reported these codes:");
    for (const code of payload.codes) {
      const status = code.status ? ` (${code.status})` : "";
      const desc = code.description ? ` — ${code.description}` : "";
      lines.push(`- ${code.system}: ${code.code}${status}${desc}`);
    }
    lines.push(
      "Please explain what each code reports in plain English, which ones are commonly minor, and which ones deserve a preliminary assessment.",
    );
  } else if (payload.noCodesReported) {
    lines.push(
      "The report states that no codes were reported. Please explain what that does and does not tell me about the vehicle.",
    );
  } else {
    lines.push(
      "The report could not be read for codes. Please help me understand what to do with it.",
    );
  }
  return lines.join("\n");
}

/**
 * Patterns that must never appear in a produced string. Enforced by the
 * copy sweep test over this module's strings and builder outputs.
 * (Comments are not produced strings.)
 */
export const BANNED_COPY_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "diagnose-family", re: /\bdiagnos(?:is|e[sd]?|ing|tic|tics)\b/i },
  { label: "harmless", re: /\bharmless\b/i },
  { label: "code-clearing offer", re: /\b(clear|clears|cleared|clearing|erase|erases|erasing|reset|resets|resetting)\s+(the\s+)?(codes?|dtcs?)\b/i },
  { label: "shop matching claim", re: /\b(matched with a shop|shops? (are )?waiting|book a shop|find a shop near)/i },
  { label: "coverage claim", re: /\b(covered nationwide|nationwide coverage|shops in every)/i },
];
