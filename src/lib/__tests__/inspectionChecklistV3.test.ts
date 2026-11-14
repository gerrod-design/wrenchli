/**
 * Tests for the checklist v3 configuration (Mobility Brief 2,
 * approved 2026-11-14): the content counts the draft promises,
 * the version stamp, per-item severity derivation with the
 * rule 5 core-item cap, the rule 1 safety gate, the
 * not-inspected collection for the owner's summary, the
 * known-issues helpers, and the suspected-cause derivation the
 * server mirrors (inspection_suspected_causes in the
 * 20261114130000 migration — the SQL side is pinned by the
 * migration replay tests).
 */
import { describe, expect, it } from "vitest";
import {
  INSPECTION_CHECKLIST,
  INSPECTION_CHECKLIST_VERSION,
  INSPECTION_DEPENDENCY_PROMPT_COUNT,
  INSPECTION_DEPENDENCY_PROMPTS,
  INSPECTION_GENERAL_ITEM_COUNT,
  INSPECTION_SECTIONS,
  INSPECTION_SYSTEMS,
  INSPECTION_WHOLE_CAR_RULES,
  KNOWN_ISSUES_EMPTY_STATEMENT,
  deriveSectionSeverity,
  inspectionSection,
  knownIssuesComplete,
  knownIssuesHeader,
  notInspectedEntries,
  safetyGateTriggers,
  sealSuspectedCauses,
  suspectedCausesFromDiagnosisDetails,
  type InspectionFinding,
} from "@/config/inspection";

describe("checklist v3 content", () => {
  it("stamps the v3 version everywhere it is named", () => {
    expect(INSPECTION_CHECKLIST_VERSION).toBe(
      "wrenchli-inspection-checklist-v3",
    );
    expect(INSPECTION_CHECKLIST.version).toBe(INSPECTION_CHECKLIST_VERSION);
  });

  it("carries the same 12 system keys as v1, in order", () => {
    expect(INSPECTION_SYSTEMS.map((s) => s.key)).toEqual([
      "engine",
      "transmission_drivetrain",
      "brakes",
      "steering_suspension",
      "tires_wheels",
      "electrical_battery",
      "cooling",
      "exhaust",
      "fluids_leaks",
      "lights_signals",
      "hvac",
      "body_glass",
    ]);
    expect(INSPECTION_CHECKLIST.systems).toBe(INSPECTION_SYSTEMS);
  });

  it("carries 137 general items: 118 across the systems, 8 code scan, 11 road test", () => {
    const systemItems = INSPECTION_SYSTEMS.reduce(
      (n, s) => n + s.items.length,
      0,
    );
    expect(systemItems).toBe(118);
    expect(inspectionSection("code_scan")?.items.length).toBe(8);
    expect(inspectionSection("road_test")?.items.length).toBe(11);
    expect(INSPECTION_GENERAL_ITEM_COUNT).toBe(137);
    expect(INSPECTION_SECTIONS.length).toBe(14);
  });

  it("gives every item a unique id that matches its section", () => {
    const ids = new Set<string>();
    for (const section of INSPECTION_SECTIONS) {
      section.items.forEach((def, i) => {
        expect(def.id).toBe(`${section.key}-${i + 1}`);
        expect(ids.has(def.id)).toBe(false);
        ids.add(def.id);
      });
    }
  });

  it("carries 50 dependency prompts, keyed to the 12 systems", () => {
    expect(INSPECTION_DEPENDENCY_PROMPT_COUNT).toBe(50);
    expect(Object.keys(INSPECTION_DEPENDENCY_PROMPTS).sort()).toEqual(
      INSPECTION_SYSTEMS.map((s) => s.key).sort(),
    );
  });

  it("carries the 13 whole-car rules in order", () => {
    expect(INSPECTION_WHOLE_CAR_RULES.map((r) => r.n)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    ]);
    expect(INSPECTION_WHOLE_CAR_RULES[0].title).toBe("The safety gate");
  });

  it("names measurements where the draft names them, including the core items", () => {
    const brakes = inspectionSection("brakes")!;
    const pads = brakes.items.find((i) => i.id === "brakes-4")!;
    expect(pads.core).toBe(true);
    expect(pads.measurement).toContain("mm");
    const tires = inspectionSection("tires_wheels")!;
    expect(tires.items.find((i) => i.id === "tires_wheels-1")?.core).toBe(true);
    const electrical = inspectionSection("electrical_battery")!;
    expect(electrical.items.find((i) => i.id === "electrical_battery-1")?.core).toBe(true);
    expect(electrical.items.find((i) => i.id === "electrical_battery-6")?.core).toBe(true);
  });

  it("carries the standing not-inspected items the draft names", () => {
    expect(
      inspectionSection("brakes")?.items.find((i) => i.id === "brakes-9")
        ?.standingNotInspected,
    ).toBeTruthy();
    expect(
      inspectionSection("transmission_drivetrain")?.items.find(
        (i) => i.id === "transmission_drivetrain-1",
      )?.standingNotInspected,
    ).toBeTruthy();
    expect(
      inspectionSection("steering_suspension")?.items.find(
        (i) => i.id === "steering_suspension-10",
      )?.standingNotInspected,
    ).toBeTruthy();
    expect(
      inspectionSection("exhaust")?.items.find((i) => i.id === "exhaust-7")
        ?.standingNotInspected,
    ).toBeTruthy();
  });
});

describe("deriveSectionSeverity", () => {
  const brakes = inspectionSection("brakes")!;

  it("is ok when nothing is a concern", () => {
    expect(
      deriveSectionSeverity(brakes, [{ item: "brakes-1", status: "checked_ok" }]),
    ).toBe("ok");
    expect(deriveSectionSeverity(brakes, [])).toBe("ok");
    expect(deriveSectionSeverity(brakes, undefined)).toBe("ok");
  });

  it("takes the worst concern item as the grade", () => {
    expect(
      deriveSectionSeverity(brakes, [
        { item: "brakes-1", status: "concern", severity: "monitor" },
        { item: "brakes-4", status: "concern", severity: "safety_concern" },
        { item: "brakes-5", status: "concern", severity: "needs_attention" },
      ]),
    ).toBe("safety_concern");
  });

  it("defaults a concern with no severity to needs_attention", () => {
    expect(
      deriveSectionSeverity(brakes, [{ item: "brakes-1", status: "concern" }]),
    ).toBe("needs_attention");
  });

  it("caps at monitor when a core item was not inspected (rule 5)", () => {
    expect(
      deriveSectionSeverity(brakes, [
        { item: "brakes-4", status: "not_inspected", notInspectedReason: "needs_wheel_off" },
        { item: "brakes-1", status: "checked_ok" },
      ]),
    ).toBe("monitor");
    // A real concern still outranks the cap.
    expect(
      deriveSectionSeverity(brakes, [
        { item: "brakes-4", status: "not_inspected", notInspectedReason: "needs_wheel_off" },
        { item: "brakes-2", status: "concern", severity: "needs_attention" },
      ]),
    ).toBe("needs_attention");
    // A non-core not-inspected item does not cap.
    expect(
      deriveSectionSeverity(brakes, [
        { item: "brakes-9", status: "not_inspected", notInspectedReason: "not_fitted" },
      ]),
    ).toBe("ok");
  });
});

describe("safetyGateTriggers (whole-car rule 1)", () => {
  const finding = (
    system: string,
    severity: InspectionFinding["severity"],
    items: InspectionFinding["items"] = [],
  ): InspectionFinding => ({ system, severity, note: "", items });

  it("does not trigger when the car is not safe to drive", () => {
    expect(
      safetyGateTriggers([finding("brakes", "safety_concern")], false),
    ).toEqual([]);
  });

  it("triggers on a safety-concern grade in a gated system", () => {
    expect(
      safetyGateTriggers([finding("tires_wheels", "safety_concern")], true),
    ).toEqual(["Tires and wheels"]);
    expect(
      safetyGateTriggers([finding("engine", "safety_concern")], true),
    ).toEqual([]);
  });

  it("triggers on an active fuel leak or cabin fumes item", () => {
    expect(
      safetyGateTriggers(
        [
          finding("fluids_leaks", "safety_concern", [
            {
              item: "fluids_leaks-7",
              status: "concern",
              severity: "safety_concern",
            },
          ]),
        ],
        true,
      ).length,
    ).toBe(1);
    expect(
      safetyGateTriggers(
        [
          finding("exhaust", "needs_attention", [
            {
              item: "exhaust-6",
              status: "concern",
              severity: "needs_attention",
            },
          ]),
        ],
        true,
      ),
    ).toEqual([]);
  });
});

describe("notInspectedEntries", () => {
  it("names every not-inspected item with its reason in plain words", () => {
    const entries = notInspectedEntries([
      {
        system: "brakes",
        severity: "monitor",
        note: "",
        items: [
          {
            item: "brakes-4",
            status: "not_inspected",
            notInspectedReason: "needs_wheel_off",
          },
          { item: "brakes-1", status: "checked_ok" },
        ],
      },
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].section).toBe("Brakes");
    expect(entries[0].reason).toBe("Needs a wheel off");
    expect(entries[0].item).toContain("Pad thickness");
  });

  it("tolerates v1 findings with no items", () => {
    expect(
      notInspectedEntries([{ system: "brakes", severity: "ok", note: "" }]),
    ).toEqual([]);
  });
});

describe("known-issues helpers", () => {
  it("prints the block header with counts (rule 4)", () => {
    expect(
      knownIssuesHeader([
        { id: "r", kind: "recall", title: "t", pattern: "p", source: "s" },
        { id: "p1", kind: "pattern", title: "t", pattern: "p", source: "s" },
        { id: "p2", kind: "pattern", title: "t", pattern: "p", source: "s" },
      ]),
    ).toBe("Vehicle-specific checks for this car: 3 (1 recalls, 2 pattern checks)");
  });

  it("keeps the honest empty-block statement from the draft", () => {
    expect(KNOWN_ISSUES_EMPTY_STATEMENT).toBe(
      "No open recalls found in NHTSA data and no documented pattern failures on file for this vehicle",
    );
    expect(knownIssuesComplete([])).toBe(true);
    expect(knownIssuesComplete(null)).toBe(true);
  });

  it("requires a mark and a note for completeness (rule 11)", () => {
    const base = { id: "r", kind: "recall" as const, title: "t", pattern: "p", source: "s" };
    expect(knownIssuesComplete([{ ...base }])).toBe(false);
    expect(
      knownIssuesComplete([{ ...base, mark: "evidence_found" }]),
    ).toBe(false);
    expect(
      knownIssuesComplete([
        { ...base, mark: "evidence_found", evidenceNote: "Seen at the well" },
      ]),
    ).toBe(true);
  });
});

describe("suspectedCausesFromDiagnosisDetails", () => {
  it("derives causes with positional ids and likelihoods, mirroring the SQL", () => {
    const causes = suspectedCausesFromDiagnosisDetails({
      possible_causes: [
        { name: "Worn brake pads", probability: 0.6 },
        { name: "Warped rotors", probability: 0.3 },
      ],
      diagnosis_id: "diag-1",
    });
    expect(causes).toEqual([
      { id: "cause-1", name: "Worn brake pads", likelihood: 0.6 },
      { id: "cause-2", name: "Warped rotors", likelihood: 0.3 },
    ]);
  });

  it("keeps an issued id and accepts a likelihood field", () => {
    expect(
      suspectedCausesFromDiagnosisDetails({
        possible_causes: [{ id: "cause-x", name: "Alternator", likelihood: 0.5 }],
      }),
    ).toEqual([{ id: "cause-x", name: "Alternator", likelihood: 0.5 }]);
  });

  it("returns nothing for missing or malformed details", () => {
    expect(suspectedCausesFromDiagnosisDetails(null)).toEqual([]);
    expect(suspectedCausesFromDiagnosisDetails({})).toEqual([]);
    expect(
      suspectedCausesFromDiagnosisDetails({ possible_causes: "nope" }),
    ).toEqual([]);
    expect(
      suspectedCausesFromDiagnosisDetails({
        possible_causes: [{ probability: 0.5 }, { name: "  " }],
      }),
    ).toEqual([]);
  });

  it("seals causes to name and id only", () => {
    expect(
      sealSuspectedCauses([
        { id: "cause-1", name: "Worn brake pads", likelihood: 0.6 },
      ]),
    ).toEqual([{ id: "cause-1", name: "Worn brake pads" }]);
  });
});
