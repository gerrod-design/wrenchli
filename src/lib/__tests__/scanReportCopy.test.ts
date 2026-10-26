import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BANNED_COPY_PATTERNS,
  buildAidenPrefillMessage,
  confirmRequiredError,
  formatCodesCount,
  formatOdometerLine,
  matchNoneText,
  matchProposalText,
  scanReportCopy,
  timelineDetail,
  timelineTitle,
} from "@/lib/scanReport/copy";
import type { MatchableVehicle, ScanReport } from "@/lib/scanReport/types";

const VEHICLE: MatchableVehicle = {
  id: "veh-1",
  year: 2022,
  make: "BMW",
  model: "M850i",
  vin: "WBAGV8C0XNCH32006",
};

function makeReport(overrides: Partial<ScanReport> = {}): ScanReport {
  return {
    id: "report-1",
    owner_user_id: "user-1",
    vehicle_id: null,
    timeline_event_id: null,
    source_tool: "Innova RepairSolutions2",
    report_id: "102",
    scanned_at: "2026-10-25T16:41:00.000Z",
    odometer: 144128,
    vin_fragment: "H32006",
    vehicle_label: "2022 BMW M850XI",
    storage_bucket: "garage-vehicle-media",
    storage_path: "user-1/scan-reports/rs2.pdf",
    original_filename: "rs2.pdf",
    parse_status: "parsed",
    parsed_payload: {
      sourceTool: "Innova RepairSolutions2",
      reportId: "102",
      scannedAt: "2026-10-25T16:41:00.000Z",
      vehicleLabel: "2022 BMW M850XI",
      year: 2022,
      make: "BMW",
      model: "M850XI",
      vinFragment: "H32006",
      odometer: 144128,
      odometerUnit: "mi",
      codes: [
        {
          code: "B7F500",
          system: "HiFi Amplifier",
          description: "Microphone driver not calibrated",
          status: "Intermittent",
        },
        {
          code: "03178A",
          system: "Telematic Communication Box",
          description: "Mobile network functional limitation",
          status: "Permanent",
        },
      ],
      noCodesReported: true,
      parseStatus: "parsed",
      parserVersion: 1,
    },
    created_at: "2026-10-26T12:00:00.000Z",
    updated_at: "2026-10-26T12:00:00.000Z",
    ...overrides,
  };
}

function producedStrings(): string[] {
  const report = makeReport();
  const zeroCodeReport = makeReport({
    parsed_payload: { ...report.parsed_payload, codes: [], noCodesReported: true },
  });
  return [
    ...Object.values(scanReportCopy).filter(
      (v) => typeof v === "string",
    ),
    confirmRequiredError,
    matchNoneText,
    matchProposalText("exact", VEHICLE),
    matchProposalText("weak", VEHICLE),
    formatCodesCount(1),
    formatCodesCount(15),
    formatOdometerLine(report) ?? "",
    timelineTitle(report),
    timelineTitle(zeroCodeReport),
    timelineDetail(report),
    timelineDetail(zeroCodeReport),
    buildAidenPrefillMessage(report, VEHICLE),
    buildAidenPrefillMessage(zeroCodeReport, VEHICLE),
  ];
}

describe("scan report copy", () => {
  it("uses the sanctioned compatibility sentence verbatim", () => {
    expect(scanReportCopy.compatibilityLine).toBe(
      "Works with reports from scan tools like Innova RepairSolutions2 and BlueDriver.",
    );
  });

  it("no produced string hits a banned pattern (diagnose family, harmless, code-clearing offers, shop/coverage claims)", () => {
    for (const text of producedStrings()) {
      for (const { label, re: pattern } of BANNED_COPY_PATTERNS) {
        expect(pattern.test(text), `${label} in: ${text}`).toBe(false);
      }
    }
  });

  it("the Aiden prefill carries the codes exactly as the report states them", () => {
    const message = buildAidenPrefillMessage(makeReport(), VEHICLE);
    expect(message).toContain("B7F500");
    expect(message).toContain("Microphone driver not calibrated");
    expect(message).toContain("03178A");
    expect(message).toContain("preliminary assessment");
  });

  it("new scan-report components contain no banned wording in source", () => {
    const files = [
      "../../components/garage/ScanReportImport.tsx",
      "../../components/garage/ScanReportsSection.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      for (const { label, re: pattern } of BANNED_COPY_PATTERNS) {
        expect(pattern.test(source), `${label} in ${file}`).toBe(false);
      }
    }
  });
});
