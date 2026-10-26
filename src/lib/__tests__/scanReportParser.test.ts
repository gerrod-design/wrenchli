import { describe, expect, it } from "vitest";
import {
  groupCodesBySystem,
  parseScanReportText,
  SOURCE_TOOL_BLUEDRIVER,
  SOURCE_TOOL_INNOVA,
} from "../../../supabase/functions/parse-scan-report/parser";

/**
 * Fixtures are modeled on the documented RepairSolutions2 report layout
 * (observed from Gerrod's Report #102, Oct 25, 2026: header with Report
 * #, vehicle bar with masked VIN, odometer, per-system sections with
 * status-tagged module codes, an OBD2 engine section that can report no
 * codes). No real export is available in the build environment, so these
 * fixtures encode the observed layout; the numbered assumptions in the
 * build report are what the gate checks against a real export.
 */
const RS2_REPORT = [
  "INNOVA RepairSolutions2",
  "Diagnostic Report",
  "Report #102",
  "Date: October 25, 2026 12:41 PM",
  "Vehicle: 2022 BMW M850XI",
  "VIN: ******H32006",
  "Odometer: 144,128 mi",
  "",
  "Engine (OBD2)",
  "No codes reported.",
  "",
  "Anti-lock Braking System (ABS)",
  "804081 Drive readiness error - Intermittent",
  "",
  "Body Control Module",
  "804415 Key fob battery undervoltage - Intermittent",
  "CA944E Invalid remote control signal",
  "",
  "HiFi Amplifier",
  "B7F500 Microphone driver not calibrated - Intermittent",
  "",
  "Telematic Communication Box",
  "03178A Mobile network functional limitation - Permanent",
  "",
  "Head Unit (HU-H)",
  "031791 Bluetooth connection",
  "031793 WLAN connection - Permanent",
  "B7F89E Backend certificates not valid",
  "",
  "Driver Camera System",
  "808607 Facial recognition failed - Intermittent",
].join("\n");

const RS2_ZERO_CODES = [
  "INNOVA RepairSolutions2",
  "Report #77",
  "Vehicle: 2020 Toyota Camry",
  "VIN: ******X48291",
  "Odometer: 45,210 mi",
  "Engine (OBD2)",
  "No codes reported.",
].join("\n");

const GENERIC_REPORT = [
  "BlueDriver Scan Report",
  "Vehicle: 2019 Honda Accord",
  "Odometer: 87,540 mi",
  "Engine",
  "P0300 Random/multiple cylinder misfire detected",
  "P0171 System too lean (Bank 1)",
].join("\n");

const GARBAGE = [
  "Weekly grocery list and receipt",
  "Milk, eggs, bread, butter, coffee, apples, chicken, rice, pasta, cheese.",
  "Thank you for shopping with us today. Please come again soon.",
].join("\n");

describe("parseScanReportText — RepairSolutions2 layout", () => {
  const parsed = parseScanReportText(RS2_REPORT);

  it("identifies the source tool", () => {
    expect(parsed.sourceTool).toBe(SOURCE_TOOL_INNOVA);
  });

  it("reads the report id", () => {
    expect(parsed.reportId).toBe("102");
  });

  it("reads the scan date", () => {
    expect(parsed.scannedAt).not.toBeNull();
    expect(new Date(parsed.scannedAt!).getFullYear()).toBe(2026);
    expect(new Date(parsed.scannedAt!).getMonth()).toBe(9); // October
    expect(new Date(parsed.scannedAt!).getDate()).toBe(25);
  });

  it("reads the vehicle bar", () => {
    expect(parsed.year).toBe(2022);
    expect(parsed.make).toBe("BMW");
    expect(parsed.model).toBe("M850XI");
    expect(parsed.vehicleLabel).toBe("2022 BMW M850XI");
  });

  it("reads the VIN fragment from the masked VIN", () => {
    expect(parsed.vinFragment).toBe("H32006");
  });

  it("reads the odometer in miles", () => {
    expect(parsed.odometer).toBe(144128);
    expect(parsed.odometerUnit).toBe("mi");
  });

  it("collects every module code with its system and status", () => {
    const byCode = new Map(parsed.codes.map((c) => [c.code, c]));
    expect(parsed.codes).toHaveLength(9);
    expect(byCode.get("804081")?.system).toContain("Braking");
    expect(byCode.get("804081")?.status).toBe("Intermittent");
    expect(byCode.get("804415")?.description).toContain("Key fob battery");
    expect(byCode.get("CA944E")?.system).toContain("Body");
    expect(byCode.get("B7F500")?.system).toContain("HiFi");
    expect(byCode.get("03178A")?.status).toBe("Permanent");
    expect(byCode.get("031791")?.system).toContain("Head Unit");
    expect(byCode.get("031793")?.status).toBe("Permanent");
    expect(byCode.get("B7F89E")?.system).toContain("Head Unit");
    expect(byCode.get("808607")?.system).toContain("Camera");
  });

  it("does not invent engine codes when the engine section reports none", () => {
    expect(parsed.codes.some((c) => c.system.includes("OBD2"))).toBe(false);
    expect(parsed.noCodesReported).toBe(true);
  });

  it("grades the full RS2 shape as parsed", () => {
    expect(parsed.parseStatus).toBe("parsed");
  });

  it("groups codes by system without dropping any", () => {
    const groups = groupCodesBySystem(parsed.codes);
    const total = groups.reduce((sum, g) => sum + g.codes.length, 0);
    expect(total).toBe(parsed.codes.length);
    expect(groups.length).toBeGreaterThanOrEqual(5);
  });
});

describe("parseScanReportText — RS2 report with no codes anywhere", () => {
  const parsed = parseScanReportText(RS2_ZERO_CODES);

  it("still grades as parsed (zero codes is a real result, not a failure)", () => {
    expect(parsed.parseStatus).toBe("parsed");
    expect(parsed.codes).toHaveLength(0);
    expect(parsed.noCodesReported).toBe(true);
  });

  it("reads identity fields", () => {
    expect(parsed.reportId).toBe("77");
    expect(parsed.vinFragment).toBe("X48291");
    expect(parsed.odometer).toBe(45210);
    expect(parsed.year).toBe(2020);
    expect(parsed.make).toBe("Toyota");
  });
});

describe("parseScanReportText — generic scan tool report", () => {
  const parsed = parseScanReportText(GENERIC_REPORT);

  it("names the tool and extracts standard OBD codes", () => {
    expect(parsed.sourceTool).toBe(SOURCE_TOOL_BLUEDRIVER);
    expect(parsed.codes.map((c) => c.code)).toEqual(["P0300", "P0171"]);
    expect(parsed.codes[0].description).toContain("misfire");
  });

  it("grades as partial, not parsed (generic layout is best-effort)", () => {
    expect(parsed.parseStatus).toBe("partial");
  });
});

describe("parseScanReportText — non-report text", () => {
  const parsed = parseScanReportText(GARBAGE);

  it("reports unparsed and fabricates nothing", () => {
    expect(parsed.parseStatus).toBe("unparsed");
    expect(parsed.codes).toHaveLength(0);
    expect(parsed.reportId).toBeNull();
    expect(parsed.vinFragment).toBeNull();
    expect(parsed.odometer).toBeNull();
  });

  it("treats empty and near-empty text as unparsed", () => {
    expect(parseScanReportText("").parseStatus).toBe("unparsed");
    expect(parseScanReportText("hello").parseStatus).toBe("unparsed");
  });
});
