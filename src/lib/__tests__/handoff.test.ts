import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    auth: { getSession: vi.fn() },
  },
}));

import { supabase } from "@/integrations/supabase/client";
import {
  buildSnapshotFromWizard,
  createAssessmentHandoff,
  listDeviceHandoffs,
  isHandoffExpired,
  setPendingHandoff,
  consumePendingHandoff,
  HANDOFF_PENDING_EVENT,
  type DeviceHandoff,
} from "../handoff";

const invokeMock = supabase.functions.invoke as unknown as Mock;

const STORAGE_KEY = "wrenchli_handoffs_v1";
const PENDING_KEY = "wrenchli_pending_handoff";

function buildTestSnapshot(overrides?: Partial<{ year: number; make: string; model: string }>) {
  return buildSnapshotFromWizard({
    vehicle: {
      year: overrides?.year ?? 2018,
      make: overrides?.make ?? "Honda",
      model: overrides?.model ?? "Civic",
      mileage: 50000,
    },
    symptoms: { primary_symptom: "noise", severity: "moderate" },
    assessment: {
      explanation: "Likely brake wear.",
      confidence: "medium",
      urgency: "soon",
      possible_causes: [
        { name: "Worn brake pads", probability: 0.6, estimated_cost_low: 100, estimated_cost_high: 200 },
      ],
    },
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  invokeMock.mockReset();
});

describe("buildSnapshotFromWizard", () => {
  it("derives cost_range from min-low/max-high across causes with both numbers, maps names, passes vehicle+symptoms through", () => {
    const symptoms = { primary_symptom: "noise", severity: "moderate" };
    const snapshot = buildSnapshotFromWizard({
      vehicle: { year: 2018, make: "Honda", model: "Civic", mileage: 50000 },
      symptoms,
      assessment: {
        explanation: "exp",
        possible_causes: [
          { name: "Brake pad", probability: 0.5, estimated_cost_low: 100, estimated_cost_high: 200 },
          { name: "Rotor", probability: 0.3, estimated_cost_low: 50, estimated_cost_high: 500 },
        ],
      },
    });

    expect(snapshot.assessment.cost_range).toEqual({ low: 50, high: 500 });
    expect(snapshot.assessment.possible_causes[0].name).toBe("Brake pad");
    expect(snapshot.assessment.possible_causes[1].name).toBe("Rotor");
    expect(snapshot.vehicle).toEqual({ year: 2018, make: "Honda", model: "Civic", mileage: 50000 });
    expect(snapshot.symptoms).toEqual(symptoms);
    expect(new Date(snapshot.completed_at).toString()).not.toBe("Invalid Date");
  });

  it("returns cost_range null when no cause has both low and high", () => {
    const snapshot = buildSnapshotFromWizard({
      vehicle: { year: 2020, make: "Toyota", model: "Camry", mileage: 20000 },
      symptoms: {},
      assessment: {
        explanation: "exp",
        possible_causes: [
          { name: "A", estimated_cost_low: 100 },
          { name: "B", estimated_cost_high: 200 },
        ],
      },
    });

    expect(snapshot.assessment.cost_range).toBeNull();
  });

  it("omits vin when empty and includes it when present", () => {
    const withoutVin = buildSnapshotFromWizard({
      vehicle: { year: 2020, make: "Toyota", model: "Camry", mileage: 20000, vin: "" },
      symptoms: {},
      assessment: { explanation: "exp", possible_causes: [] },
    });
    expect("vin" in withoutVin.vehicle).toBe(false);

    const withVin = buildSnapshotFromWizard({
      vehicle: { year: 2020, make: "Toyota", model: "Camry", mileage: 20000, vin: "1HGCM82633A004352" },
      symptoms: {},
      assessment: { explanation: "exp", possible_causes: [] },
    });
    expect(withVin.vehicle.vin).toBe("1HGCM82633A004352");
  });
});

describe("createAssessmentHandoff", () => {
  it("token path: returns token ref, stores device record, sets pending handoff", async () => {
    const future = "2099-01-01T00:00:00.000Z";
    invokeMock.mockResolvedValueOnce({
      data: { id: "x", kind: "token", token: "tok123", expiresAt: future },
      error: null,
    });

    const snapshot = buildTestSnapshot();
    const ref = await createAssessmentHandoff(snapshot);

    expect(ref).toEqual({ kind: "token", token: "tok123" });

    const list = listDeviceHandoffs();
    expect(list.length).toBe(1);
    expect(list[0].ref).toEqual({ kind: "token", token: "tok123" });
    expect(list[0].expiresAt).toBe(future);
    expect(list[0].label).toBe("2018 Honda Civic");

    const pending = consumePendingHandoff();
    expect(pending).toEqual({ kind: "token", token: "tok123" });
  });

  it("owned path: returns owned ref and stores a record with expiresAt null", async () => {
    invokeMock.mockResolvedValueOnce({
      data: { id: "row-1", kind: "owned" },
      error: null,
    });

    const snapshot = buildTestSnapshot();
    const ref = await createAssessmentHandoff(snapshot);

    expect(ref).toEqual({ kind: "owned", id: "row-1" });

    const list = listDeviceHandoffs();
    expect(list.length).toBe(1);
    expect(list[0].ref).toEqual({ kind: "owned", id: "row-1" });
    expect(list[0].expiresAt).toBeNull();
  });

  it("failure: returns null and stores nothing", async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: new Error("boom") });

    const snapshot = buildTestSnapshot();
    const ref = await createAssessmentHandoff(snapshot);

    expect(ref).toBeNull();
    expect(listDeviceHandoffs()).toEqual([]);
  });

  it("prunes the oldest token record when exceeding MAX_DEVICE_HANDOFFS and fires a delete for it", async () => {
    const far = "2099-01-01T00:00:00.000Z";
    const seed: DeviceHandoff[] = [
      { ref: { kind: "token", token: "t1" }, label: "L1", createdAt: "2024-01-01T00:00:00.000Z", expiresAt: far },
      { ref: { kind: "token", token: "t2" }, label: "L2", createdAt: "2024-01-02T00:00:00.000Z", expiresAt: far },
      { ref: { kind: "token", token: "t3" }, label: "L3", createdAt: "2024-01-03T00:00:00.000Z", expiresAt: far },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));

    invokeMock.mockImplementation((_name: string, opts: any) => {
      if (opts.body.action === "create") {
        return Promise.resolve({
          data: { id: "x4", kind: "token", token: "t4", expiresAt: far },
          error: null,
        });
      }
      if (opts.body.action === "delete") {
        return Promise.resolve({ data: { deleted: 1 }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const snapshot = buildTestSnapshot();
    const ref = await createAssessmentHandoff(snapshot);
    expect(ref).toEqual({ kind: "token", token: "t4" });

    // allow the fire-and-forget delete promise chain to settle
    await new Promise((resolve) => setTimeout(resolve, 0));

    const list = listDeviceHandoffs();
    expect(list.length).toBe(3);
    expect(list.map((l) => (l.ref as { token: string }).token)).toEqual(["t2", "t3", "t4"]);
    expect(invokeMock).toHaveBeenCalledWith("assessment-handoff", {
      body: { action: "delete", token: "t1" },
    });
  });
});

describe("isHandoffExpired", () => {
  const base: DeviceHandoff = {
    ref: { kind: "token", token: "t" },
    label: "L",
    createdAt: "2024-01-01T00:00:00.000Z",
    expiresAt: null,
  };

  it("returns true for a past expiresAt", () => {
    expect(isHandoffExpired({ ...base, expiresAt: "2000-01-01T00:00:00.000Z" })).toBe(true);
  });

  it("returns false for a future expiresAt", () => {
    expect(isHandoffExpired({ ...base, expiresAt: "2999-01-01T00:00:00.000Z" })).toBe(false);
  });

  it("returns false when expiresAt is null", () => {
    expect(isHandoffExpired(base)).toBe(false);
  });
});

describe("consumePendingHandoff", () => {
  it("returns null when nothing is stored, and clears the key after a successful consume", () => {
    expect(consumePendingHandoff()).toBeNull();

    setPendingHandoff({ kind: "owned", id: "abc" });
    expect(sessionStorage.getItem(PENDING_KEY)).not.toBeNull();

    const result = consumePendingHandoff();
    expect(result).toEqual({ kind: "owned", id: "abc" });
    expect(sessionStorage.getItem(PENDING_KEY)).toBeNull();
  });
});

describe("pending handoff notification (Continuity 1.1)", () => {
  it("dispatches HANDOFF_PENDING_EVENT on window every time a pending handoff is set", () => {
    const seen: string[] = [];
    const listener = (e: Event) => seen.push(e.type);
    window.addEventListener(HANDOFF_PENDING_EVENT, listener);
    try {
      setPendingHandoff({ kind: "token", token: "t1" });
      setPendingHandoff({ kind: "owned", id: "o1" });
    } finally {
      window.removeEventListener(HANDOFF_PENDING_EVENT, listener);
    }
    expect(HANDOFF_PENDING_EVENT).toBe("wrenchli:pending-handoff");
    expect(seen).toEqual(["wrenchli:pending-handoff", "wrenchli:pending-handoff"]);
  });
});
