import { describe, expect, it } from "vitest";
import {
  deriveDiscrepancy,
  deriveLatestReading,
  estimateCurrentMiles,
  evaluateReadingGate,
  formatReadingLabel,
  readingStatusLabel,
  toMiles,
  type MileageReading,
  type ReadingDisputeFact,
} from "@/lib/mileage";

function reading(partial: Partial<MileageReading>): MileageReading {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    vehicle_id: "v1",
    owner_user_id: "u1",
    odometer_value: partial.odometer_miles ?? 100000,
    unit: "mi",
    odometer_miles: 100000,
    reading_date: "2026-01-01",
    source: "owner_reported",
    source_detail: null,
    layer: "reported",
    status: "current",
    superseded_by: null,
    unsupported: false,
    outlier_confirmed: false,
    evidence_media: [],
    created_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("toMiles", () => {
  it("converts km with 2-decimal rounding", () => {
    expect(toMiles(100, "km")).toBe(62.14);
    expect(toMiles(160934, "km")).toBe(99999.75);
  });
  it("passes miles through", () => {
    expect(toMiles(123456, "mi")).toBe(123456);
  });
});

describe("deriveLatestReading", () => {
  it("returns null for an empty ledger", () => {
    expect(deriveLatestReading([])).toBeNull();
  });
  it("picks the greatest reading_date, not the latest insert", () => {
    const older = reading({ id: "a", reading_date: "2026-08-23", odometer_miles: 132141, created_at: "2026-10-18T00:00:00Z" });
    const newer = reading({ id: "b", reading_date: "2026-10-13", odometer_miles: 134163, created_at: "2026-10-17T00:00:00Z" });
    expect(deriveLatestReading([older, newer])?.id).toBe("b");
  });
  it("breaks a date tie toward the Observed reading", () => {
    const rep = reading({ id: "r", reading_date: "2026-10-13", odometer_miles: 134200, layer: "reported", created_at: "2026-10-14T00:00:00Z" });
    const obs = reading({ id: "o", reading_date: "2026-10-13", odometer_miles: 134163, layer: "observed", created_at: "2026-10-13T00:00:00Z" });
    expect(deriveLatestReading([rep, obs])?.id).toBe("o");
  });
  it("excludes disputed and superseded readings", () => {
    const cur = reading({ id: "c", reading_date: "2026-09-01", odometer_miles: 130000 });
    const dis = reading({ id: "d", reading_date: "2026-10-13", odometer_miles: 999999, status: "disputed" });
    const sup = reading({ id: "s", reading_date: "2026-10-13", odometer_miles: 888888, status: "superseded" });
    expect(deriveLatestReading([cur, dis, sup])?.id).toBe("c");
  });
});

describe("formatReadingLabel", () => {
  it("renders the spec's model example", () => {
    const r = reading({
      odometer_miles: 134163,
      reading_date: "2026-10-13",
      source: "shop_document",
      source_detail: "Steve's European DVI",
      layer: "observed",
    });
    expect(formatReadingLabel(r, "mi")).toBe("134,163 mi — Oct 13, 2026, Steve's European DVI");
  });
  it("falls back to the source label when no detail is recorded", () => {
    const r = reading({ odometer_miles: 50000, reading_date: "2026-01-05", source: "dashboard_photo" });
    expect(formatReadingLabel(r, "mi")).toBe("50,000 mi — Jan 5, 2026, dashboard photo");
  });
  it("converts the display value to km when asked", () => {
    const r = reading({ odometer_miles: 100000, reading_date: "2026-01-05" });
    expect(formatReadingLabel(r, "km")).toContain("160,934 km");
  });
});

describe("estimateCurrentMiles", () => {
  const r = reading({ odometer_miles: 100000, reading_date: "2026-01-01" });
  it("returns no_rate without an owner-supplied annual rate", () => {
    expect(estimateCurrentMiles(r, null, new Date("2026-07-01T00:00:00Z")).kind).toBe("no_rate");
  });
  it("projects with the rate while the reading is fresh enough", () => {
    const out = estimateCurrentMiles(r, 12000, new Date("2026-07-01T00:00:00Z"));
    expect(out.kind).toBe("estimate");
    if (out.kind === "estimate") expect(out.miles).toBeGreaterThan(105000);
  });
  it("refuses to project from a reading older than 18 months", () => {
    expect(estimateCurrentMiles(r, 12000, new Date("2027-08-01T00:00:00Z")).kind).toBe("too_old");
  });
});

describe("evaluateReadingGate", () => {
  const base = [
    reading({ id: "p", reading_date: "2026-08-15", odometer_miles: 132042 }),
    reading({ id: "s", reading_date: "2026-10-13", odometer_miles: 134163, layer: "observed", source: "shop_document" }),
  ];
  it("accepts a consistent later reading", () => {
    expect(evaluateReadingGate(base, { odometer_miles: 135000, reading_date: "2026-11-01" }).kind).toBe("ok");
  });
  it("accepts a backdated reading consistent with its own neighbors", () => {
    expect(evaluateReadingGate(base, { odometer_miles: 132100, reading_date: "2026-08-20" }).kind).toBe("ok");
  });
  it("routes a decrease against the predecessor to the correction path", () => {
    const out = evaluateReadingGate(base, { odometer_miles: 133000, reading_date: "2026-11-01" });
    expect(out.kind).toBe("decrease");
  });
  it("routes a reading that would strand a later reading as a decrease", () => {
    const out = evaluateReadingGate(base, { odometer_miles: 140000, reading_date: "2026-09-01" });
    expect(out.kind).toBe("decrease");
  });
  it("flags an implausible jump as an outlier", () => {
    const out = evaluateReadingGate(base, { odometer_miles: 170000, reading_date: "2026-11-01" });
    expect(out.kind).toBe("outlier");
  });
});

describe("deriveDiscrepancy", () => {
  const obs = reading({ id: "o", reading_date: "2026-10-13", odometer_miles: 134163, layer: "observed", source: "shop_document", created_at: "2026-10-13T10:00:00Z" });
  const repLow = reading({ id: "r", reading_date: "2026-10-15", odometer_miles: 120000, layer: "reported", created_at: "2026-10-15T10:00:00Z" });
  it("surfaces a cross-layer decrease", () => {
    expect(deriveDiscrepancy([obs, repLow], [])).not.toBeNull();
  });
  it("is null when the layers agree", () => {
    const repOk = reading({ id: "r2", reading_date: "2026-10-15", odometer_miles: 134500, layer: "reported" });
    expect(deriveDiscrepancy([obs, repOk], [])).toBeNull();
  });
  it("resolves when a newer reading follows the consistent line", () => {
    const newer = reading({ id: "n", reading_date: "2026-10-20", odometer_miles: 134800, layer: "reported", created_at: "2026-10-20T00:00:00Z" });
    expect(deriveDiscrepancy([obs, repLow, newer], [])).toBeNull();
  });
  it("resolves on an owner dismissal fact", () => {
    const fact: ReadingDisputeFact = {
      id: "f1", vehicle_id: "v1", reading_id: null, kind: "discrepancy_dismissal",
      raised_by: "u1", reason: "Shop confirmed their figure was a typo", created_at: "2026-10-16T00:00:00Z",
    };
    expect(deriveDiscrepancy([obs, repLow], [fact])).toBeNull();
  });
});

describe("readingStatusLabel", () => {
  it("prioritizes the unsupported stamp", () => {
    expect(readingStatusLabel(reading({ unsupported: true, status: "disputed" }))).toBe("Unsupported — no source");
  });
  it("labels disputed, superseded, outlier", () => {
    expect(readingStatusLabel(reading({ status: "disputed" }))).toBe("Disputed");
    expect(readingStatusLabel(reading({ status: "superseded" }))).toBe("Superseded");
    expect(readingStatusLabel(reading({ outlier_confirmed: true }))).toBe("Owner-confirmed outlier");
    expect(readingStatusLabel(reading({}))).toBeNull();
  });
});
