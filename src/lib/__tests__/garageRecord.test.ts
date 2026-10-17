import { describe, expect, it } from "vitest";
import {
  CORE_BASELINE_CHECKS,
  baselineCompletionState,
  buildAidenLayerAnswer,
  conditionEvidenceLabel,
  matchesWeakPoint,
  observedCoverage,
  splitTimelineEvents,
  statusFromBaselineResponse,
  weakPointCheckKey,
} from "@/lib/garageRecord";
import { createGarageRecordPdf } from "@/lib/garageRecordPdf";
import { toPdfSafeText } from "@/lib/garageRecordPdf";
import type {
  VehicleBaselineResponse,
  VehicleConditionCheck,
  VehicleTimelineEvent,
  WeakPointCheck,
} from "@/types/garageRecord";

const weakPoint: WeakPointCheck = {
  id: "weak-1",
  slug: "mercedes-benz-glc-x253-rear-wheel-wells",
  make: "Mercedes-Benz",
  model: "GLC",
  generation: "X253",
  year_start: 2016,
  year_end: 2022,
  title: "Rear wheel wells — dampness and corrosion",
  instruction: "Look and feel around both rear wheel-well areas.",
  why_it_matters: "Water can reach electrical modules.",
  sense: "feel",
  citation_label: "Documented X253 rear water-intrusion pattern",
  citation_details: "Owner-community reports and the 2017 GLC300 amplifier-corrosion case.",
  sort_order: 10,
};

function response(
  checkKey: string,
  value: VehicleBaselineResponse["response"],
  skipReason?: string,
): VehicleBaselineResponse {
  return {
    id: `response-${checkKey}`,
    baseline_id: "baseline-1",
    vehicle_id: "vehicle-1",
    owner_user_id: "user-1",
    weak_point_check_id: checkKey.startsWith("weakpoint:") ? weakPoint.id : null,
    check_key: checkKey,
    check_label: checkKey,
    response: value,
    skip_reason: skipReason ?? null,
    source_type: "owner",
    source_name: "Owner Name",
    responded_at: "2026-10-12T12:00:00.000Z",
    media: [],
  };
}

function allCoreResponses() {
  return CORE_BASELINE_CHECKS.map((check) => response(check.key, "ok"));
}

describe("Garage two-layer record", () => {
  it("keeps reported and observed timeline events in separate collections", () => {
    const events: VehicleTimelineEvent[] = [
      {
        id: "reported-1",
        vehicle_id: "vehicle-1",
        owner_user_id: "user-1",
        layer: "reported",
        category: "damage",
        title: "Damage reported",
        source_type: "document",
        source_name: "History report",
        occurred_at: "2026-10-01T12:00:00.000Z",
        captured_at: "2026-10-12T12:00:00.000Z",
        media: [],
        created_at: "2026-10-12T12:00:00.000Z",
      },
      {
        id: "observed-1",
        vehicle_id: "vehicle-1",
        owner_user_id: "user-1",
        layer: "observed",
        category: "condition_check",
        title: "Rear cargo area checked",
        source_type: "owner",
        source_name: "Owner Name",
        occurred_at: "2026-10-12T12:00:00.000Z",
        captured_at: "2026-10-12T12:00:00.000Z",
        media: [],
        created_at: "2026-10-12T12:00:00.000Z",
      },
    ];

    const split = splitTimelineEvents(events);
    expect(split.reported.map((event) => event.id)).toEqual(["reported-1"]);
    expect(split.observed.map((event) => event.id)).toEqual(["observed-1"]);
  });

  it("uses honest coverage and evidence labels without a condition score", () => {
    const unchecked: VehicleConditionCheck = {
      id: "check-1",
      vehicle_id: "vehicle-1",
      owner_user_id: "user-1",
      check_key: "smell_cabin",
      label: "Cabin smell",
      category: "condition_check",
      sense: "smell",
      status: "not_checked",
      evidence_media: [],
      updated_at: "2026-10-12T12:00:00.000Z",
    };
    const checked: VehicleConditionCheck = {
      ...unchecked,
      id: "check-2",
      check_key: "odometer_photo",
      label: "Odometer photo and reading",
      status: "checked_ok",
      last_checked_at: "2026-10-12T12:00:00.000Z",
      last_source_name: "Owner Name",
      evidence_media: [{ bucket: "garage-vehicle-media", path: "user/vehicle/odometer.jpg", kind: "photo" }],
    };

    expect(conditionEvidenceLabel(unchecked)).toBe("Not yet checked");
    expect(conditionEvidenceLabel(checked)).toContain("Checked Oct 12");
    expect(conditionEvidenceLabel(checked)).toContain("1 evidence file");
    expect(observedCoverage([checked, unchecked]).label).toBe("Baseline: 1 of 2 core checks captured");
  });

  it("requires photos for the odometer and four walkaround capture steps", () => {
    expect(CORE_BASELINE_CHECKS.slice(0, 5).every((check) => check.mediaRequired)).toBe(true);
    expect(CORE_BASELINE_CHECKS.slice(5).some((check) => check.mediaRequired)).toBe(false);
  });

  it("matches weak points by make, model, and year range, including Silverado naming", () => {
    expect(matchesWeakPoint(weakPoint, { make: "Mercedes-Benz", model: "GLC", year: 2017 })).toBe(true);
    expect(matchesWeakPoint(weakPoint, { make: "Mercedes-Benz", model: "GLC", year: 2023 })).toBe(false);
    expect(matchesWeakPoint(
      { ...weakPoint, make: "Chevrolet", model: "Silverado 1500", year_start: 2019, year_end: 2020 },
      { make: "Chevrolet", model: "Silverado", year: 2019 },
    )).toBe(true);
  });

it("matches the GLC weak point when the vehicle model carries the NHTSA -Class suffix", () => {
    expect(
      matchesWeakPoint(weakPoint, {
        make: "Mercedes-Benz",
        model: "GLC-Class",
        year: 2016,
      }),
    ).toBe(true);

    expect(
      matchesWeakPoint(weakPoint, {
        make: "Mercedes-Benz",
        model: "GLC-Class",
        year: 2023,
      }),
    ).toBe(false);

    expect(
      matchesWeakPoint(weakPoint, {
        make: "Toyota",
        model: "GLC-Class",
        year: 2016,
      }),
    ).toBe(false);
  });

  it("keeps matching the other library models under their stored names", () => {
    const rav4 = {
      ...weakPoint,
      make: "Toyota",
      model: "RAV4",
      year_start: 2019,
      year_end: 2021,
    };
    const crv = {
      ...weakPoint,
      make: "Honda",
      model: "CR-V",
      year_start: 2017,
      year_end: 2019,
    };
    const f150 = {
      ...weakPoint,
      make: "Ford",
      model: "F-150",
      year_start: 2018,
      year_end: 2020,
    };
    const silverado = {
      ...weakPoint,
      make: "Chevrolet",
      model: "Silverado 1500",
      year_start: 2019,
      year_end: 2020,
    };
    const cx30 = {
      ...weakPoint,
      make: "Mazda",
      model: "CX-30",
      year_start: 2020,
      year_end: 2024,
    };

    expect(
      matchesWeakPoint(rav4, { make: "Toyota", model: "RAV4", year: 2020 }),
    ).toBe(true);
    expect(
      matchesWeakPoint(crv, { make: "Honda", model: "CR-V", year: 2018 }),
    ).toBe(true);
    expect(
      matchesWeakPoint(f150, { make: "Ford", model: "F-150", year: 2019 }),
    ).toBe(true);
    expect(
      matchesWeakPoint(silverado, {
        make: "Chevrolet",
        model: "Silverado 1500",
        year: 2019,
      }),
    ).toBe(true);
    expect(
      matchesWeakPoint(cx30, { make: "Mazda", model: "CX-30", year: 2022 }),
    ).toBe(true);

    expect(
      matchesWeakPoint(rav4, {
        make: "Mercedes-Benz",
        model: "GLC-Class",
        year: 2020,
      }),
    ).toBe(false);
  });

  it("blocks baseline completion until every weak-point item is answered", () => {
    const incomplete = baselineCompletionState(allCoreResponses(), [weakPoint]);
    expect(incomplete.complete).toBe(false);
    expect(incomplete.missingWeakPoints).toEqual([weakPoint]);

    const skippedWithoutReason = baselineCompletionState(
      [...allCoreResponses(), response(weakPointCheckKey(weakPoint), "skipped")],
      [weakPoint],
    );
    expect(skippedWithoutReason.complete).toBe(false);

    const complete = baselineCompletionState(
      [...allCoreResponses(), response(weakPointCheckKey(weakPoint), "skipped", "No access to the cargo area today")],
      [weakPoint],
    );
    expect(complete.complete).toBe(true);
    expect(statusFromBaselineResponse("skipped")).toBeNull();
  });

  it("builds Aiden's answer in reported, observed, and not-checked parts", () => {
    const answer = buildAidenLayerAnswer({
      reported: [{
        id: "reported-1",
        vehicle_id: "vehicle-1",
        owner_user_id: "user-1",
        layer: "reported",
        category: "service",
        title: "Oil service reported",
        source_type: "shop",
        source_name: "Named Shop",
        occurred_at: "2026-10-01T12:00:00.000Z",
        captured_at: "2026-10-12T12:00:00.000Z",
        media: [],
        created_at: "2026-10-12T12:00:00.000Z",
      }],
      observedChecks: [{
        id: "check-1",
        vehicle_id: "vehicle-1",
        owner_user_id: "user-1",
        check_key: "smell_cabin",
        label: "Cabin smell",
        category: "condition_check",
        sense: "smell",
        status: "not_checked",
        evidence_media: [],
        updated_at: "2026-10-12T12:00:00.000Z",
      }],
    });

    expect(answer.text).toContain("What is reported:");
    expect(answer.text).toContain("What has been observed:");
    expect(answer.text).toContain("What has not been checked: Cabin smell");
    expect(answer.text.toLowerCase()).not.toContain("guaranteed");
  });

  it("creates a PDF export object from stored record data", () => {
    const pdf = createGarageRecordPdf({
      vehicle: {
        id: "vehicle-1",
        user_id: "user-1",
        year: 2017,
        make: "Mercedes-Benz",
        model: "GLC",
        vin: "TESTVIN",
      },
      timeline: [],
      checks: [],
      baselines: [],
      responses: [],
      documents: [],
      weakPoints: [weakPoint],
    });
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it("sanitizes non-WinAnsi characters for PDF export", () => {
    expect(
      toPdfSafeText("Drained 15.3 quarts \u2192 nearly double \u2248 capacity")
    ).toBe("Drained 15.3 quarts -> nearly double ~ capacity");
    expect(toPdfSafeText("a \u2014 b \u00B7 c")).toBe("a \u2014 b \u00B7 c");
    expect(toPdfSafeText("fixed \u{1F527} now")).toBe("fixed  now");
  });

  it("creates a PDF from a record whose text contains arrows and approximations", () => {
    const pdf = createGarageRecordPdf({
      vehicle: {
        id: "vehicle-1",
        user_id: "user-1",
        year: 2017,
        make: "Mercedes-Benz",
        model: "GLC",
        vin: "TESTVIN",
      },
      timeline: [
        {
          layer: "reported",
          occurred_at: "2026-10-02",
          title: "Overfill findings",
          source_name: "Steve's European",
          source_type: "shop",
          detail: "Drained \u2192 \u2248 double",
        } as any,
      ],
      checks: [],
      baselines: [],
      responses: [],
      documents: [],
      weakPoints: [weakPoint],
    });
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
