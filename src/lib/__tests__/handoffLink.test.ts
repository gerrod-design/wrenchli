import { describe, it, expect, vi, type Mock } from "vitest";
import { buildSnapshotFromWizard, type HandoffSnapshot } from "../handoff";
import {
  snapshotVehicleMatches,
  selectClaimableHandoffIds,
  resolveStampVehicleId,
  summarizeLinkedAssessments,
  claimHandoffsForVehicle,
  type GarageVehicleIdentity,
  type LinkedAssessmentRow,
} from "../handoffLink";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    from: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";

const invokeMock = supabase.functions.invoke as unknown as Mock;
const fromMock = supabase.from as unknown as Mock;

function buildTestSnapshot(
  vehicleOverrides?: Partial<{ year: number; make: string; model: string; vin: string }>
): HandoffSnapshot {
  return buildSnapshotFromWizard({
    vehicle: {
      year: vehicleOverrides?.year ?? 2020,
      make: vehicleOverrides?.make ?? "Honda",
      model: vehicleOverrides?.model ?? "Civic",
      mileage: 30000,
      ...(vehicleOverrides?.vin ? { vin: vehicleOverrides.vin } : {}),
    },
    symptoms: { primary_symptom: "noise", severity: "moderate" },
    assessment: {
      explanation: "Test explanation",
      confidence: "medium",
      urgency: "soon",
      possible_causes: [
        { name: "Cause 1", probability: 0.6, estimated_cost_low: 100, estimated_cost_high: 200 },
      ],
    },
  });
}

function makeQueryBuilder(result: { data: any; error: any }) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

describe("snapshotVehicleMatches", () => {
  const vehicle: GarageVehicleIdentity = { id: "v1", year: 2020, make: "Honda", model: "Civic" };

  it("matches exactly", () => {
    expect(snapshotVehicleMatches({ year: 2020, make: "Honda", model: "Civic" }, vehicle)).toBe(true);
  });

  it("matches with case and whitespace differences", () => {
    expect(
      snapshotVehicleMatches({ year: 2020, make: "  HONDA  ", model: " civic " }, vehicle)
    ).toBe(true);
  });

  it("does not match different year", () => {
    expect(snapshotVehicleMatches({ year: 2021, make: "Honda", model: "Civic" }, vehicle)).toBe(false);
  });

  it("does not match different model", () => {
    expect(snapshotVehicleMatches({ year: 2020, make: "Honda", model: "Accord" }, vehicle)).toBe(false);
  });

  it("matches when VINs present and equal", () => {
    const v: GarageVehicleIdentity = { ...vehicle, vin: "1HGCM82633A004352" };
    expect(
      snapshotVehicleMatches({ year: 2020, make: "Honda", model: "Civic", vin: "1hgcm82633a004352" }, v)
    ).toBe(true);
  });

  it("does not match when VINs present and different (negative control)", () => {
    const v: GarageVehicleIdentity = { ...vehicle, vin: "1HGCM82633A004352" };
    expect(
      snapshotVehicleMatches({ year: 2020, make: "Honda", model: "Civic", vin: "DIFFERENTVIN123456" }, v)
    ).toBe(false);
  });

  it("matches when VIN only present on snapshot", () => {
    expect(
      snapshotVehicleMatches({ year: 2020, make: "Honda", model: "Civic", vin: "1HGCM82633A004352" }, vehicle)
    ).toBe(true);
  });

  it("matches when VIN only present on vehicle", () => {
    const v: GarageVehicleIdentity = { ...vehicle, vin: "1HGCM82633A004352" };
    expect(snapshotVehicleMatches({ year: 2020, make: "Honda", model: "Civic" }, v)).toBe(true);
  });
});

describe("selectClaimableHandoffIds", () => {
  const added: GarageVehicleIdentity = { id: "added", year: 2020, make: "Honda", model: "Civic" };
  const other: GarageVehicleIdentity = { id: "other", year: 2021, make: "Toyota", model: "Corolla" };

  it("selects a matching handoff", () => {
    const handoffs = [{ id: "h1", snapshot: buildTestSnapshot() }];
    expect(selectClaimableHandoffIds(handoffs, added, [added])).toEqual(["h1"]);
  });

  it("excludes a non-matching snapshot", () => {
    const handoffs = [{ id: "h1", snapshot: buildTestSnapshot({ model: "Accord" }) }];
    expect(selectClaimableHandoffIds(handoffs, added, [added])).toEqual([]);
  });

  it("selects two handoffs matching the added vehicle", () => {
    const handoffs = [
      { id: "h1", snapshot: buildTestSnapshot() },
      { id: "h2", snapshot: buildTestSnapshot() },
    ];
    expect(selectClaimableHandoffIds(handoffs, added, [added])).toEqual(["h1", "h2"]);
  });

  it("excludes a handoff matching added vehicle AND another vehicle (ambiguous negative control)", () => {
    const ambiguousOther: GarageVehicleIdentity = { id: "other", year: 2020, make: "Honda", model: "Civic" };
    const handoffs = [{ id: "h1", snapshot: buildTestSnapshot() }];
    expect(selectClaimableHandoffIds(handoffs, added, [added, ambiguousOther])).toEqual([]);
  });

  it("excludes a handoff matching only the other vehicle", () => {
    const handoffs = [{ id: "h1", snapshot: buildTestSnapshot({ year: 2021, make: "Toyota", model: "Corolla" }) }];
    expect(selectClaimableHandoffIds(handoffs, added, [added, other])).toEqual([]);
  });
});

describe("resolveStampVehicleId", () => {
  it("returns the id when launch matches wizard vehicle", () => {
    const launch = { userVehicleId: "uv1", year: 2020, make: "Honda", model: "Civic" };
    expect(resolveStampVehicleId(launch, { year: 2020, make: "Honda", model: "Civic" })).toBe("uv1");
  });

  it("returns null when launch YMM differs from wizard vehicle (negative control)", () => {
    const launch = { userVehicleId: "uv1", year: 2020, make: "Honda", model: "Civic" };
    expect(resolveStampVehicleId(launch, { year: 2021, make: "Honda", model: "Civic" })).toBeNull();
  });

  it("returns null when launch is null", () => {
    expect(resolveStampVehicleId(null, { year: 2020, make: "Honda", model: "Civic" })).toBeNull();
  });
});

describe("summarizeLinkedAssessments", () => {
  it("counts two rows for one vehicle and picks the later completed_at", () => {
    const rows: LinkedAssessmentRow[] = [
      { user_vehicle_id: "v1", created_at: "2024-01-01T00:00:00Z", snapshot: { completed_at: "2024-01-02T00:00:00Z" } },
      { user_vehicle_id: "v1", created_at: "2024-01-05T00:00:00Z", snapshot: { completed_at: "2024-01-06T00:00:00Z" } },
    ];
    const result = summarizeLinkedAssessments(rows);
    expect(result.v1.count).toBe(2);
    expect(result.v1.latestDate).toBe("2024-01-06T00:00:00Z");
  });

  it("skips rows with null user_vehicle_id", () => {
    const rows: LinkedAssessmentRow[] = [
      { user_vehicle_id: null, created_at: "2024-01-01T00:00:00Z", snapshot: {} },
    ];
    expect(summarizeLinkedAssessments(rows)).toEqual({});
  });

  it("falls back to created_at when completed_at absent", () => {
    const rows: LinkedAssessmentRow[] = [
      { user_vehicle_id: "v2", created_at: "2024-03-01T00:00:00Z", snapshot: {} },
    ];
    const result = summarizeLinkedAssessments(rows);
    expect(result.v2.latestDate).toBe("2024-03-01T00:00:00Z");
  });
});

describe("claimHandoffsForVehicle", () => {
  const vehicle: GarageVehicleIdentity = { id: "added", year: 2020, make: "Honda", model: "Civic" };

  it("happy path links the claimable handoff", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "assessment_handoffs") {
        return makeQueryBuilder({ data: [{ id: "h1", snapshot: buildTestSnapshot() }], error: null });
      }
      if (table === "user_vehicles") {
        return makeQueryBuilder({ data: [vehicle], error: null });
      }
      return makeQueryBuilder({ data: [], error: null });
    });
    invokeMock.mockResolvedValue({ data: { linked: 1 }, error: null });

    const result = await claimHandoffsForVehicle(vehicle);

    expect(result).toBe(1);
    expect(invokeMock).toHaveBeenCalledWith("assessment-handoff", {
      body: { action: "link", userVehicleId: "added", handoffIds: ["h1"] },
    });
  });

  it("returns 0 and does not invoke when there are no candidates", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "assessment_handoffs") {
        return makeQueryBuilder({ data: [], error: null });
      }
      if (table === "user_vehicles") {
        return makeQueryBuilder({ data: [vehicle], error: null });
      }
      return makeQueryBuilder({ data: [], error: null });
    });
    invokeMock.mockClear();

    const result = await claimHandoffsForVehicle(vehicle);

    expect(result).toBe(0);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("returns 0 when the handoff query errors", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "assessment_handoffs") {
        return makeQueryBuilder({ data: null, error: { message: "boom" } });
      }
      return makeQueryBuilder({ data: [vehicle], error: null });
    });

    const result = await claimHandoffsForVehicle(vehicle);

    expect(result).toBe(0);
  });
});
