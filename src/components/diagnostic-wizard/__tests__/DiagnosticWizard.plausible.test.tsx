import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const { plausibleSpy } = vi.hoisted(() => ({ plausibleSpy: vi.fn() }));

vi.mock("@/lib/analytics", () => ({
  trackPlausibleEvent: plausibleSpy,
  trackEvent: vi.fn(),
  trackAdImpression: vi.fn(),
  trackAnalyticsAdClick: vi.fn(),
  trackConversion: vi.fn(),
  flushEvents: vi.fn(async () => {}),
  trackPagePerformance: vi.fn(),
}));

vi.mock("@/lib/funnelTracking", () => ({
  logFunnelEvent: vi.fn(),
  flushPendingFunnelEvents: vi.fn(),
}));

vi.mock("@/lib/handoff", () => ({
  buildSnapshotFromWizard: vi.fn(() => ({
    vehicle: { year: 2020, make: "Ford", model: "F-150" },
    symptoms: {},
    assessment: {},
  })),
  createAssessmentHandoff: vi.fn(async () => null),
  setPendingHandoff: vi.fn(),
}));

vi.mock("@/lib/handoffLink", () => ({
  resolveStampVehicleId: vi.fn(() => null),
}));

vi.mock("@/components/diagnostic-wizard/steps/VehicleStep", () => ({
  default: (props: {
    onNext: (v: unknown, sid: string) => void;
  }) => (
    <button
      onClick={() =>
        props.onNext({ year: 2020, make: "Ford", model: "F-150", mileage: 50000 }, "sess-1")
      }
    >
      vehicle-next
    </button>
  ),
}));

vi.mock("@/components/diagnostic-wizard/steps/SymptomStep", () => ({
  default: (props: {
    onNext: (s: unknown, d: unknown) => void;
  }) => (
    <button
      onClick={() =>
        props.onNext(
          { primary_symptom: "grinding noise" },
          {
            diagnosis_id: "d1",
            confidence: "high",
            urgency: "soon",
            explanation: "Likely worn brake pads",
            possible_causes: [],
          }
        )
      }
    >
      symptom-next
    </button>
  ),
}));

vi.mock("@/components/diagnostic-wizard/steps/DiagnosisStep", () => ({
  default: () => <div>diagnosis-step</div>,
}));

vi.mock("@/components/diagnostic-wizard/steps/RecommendationStep", () => ({
  default: () => <div>recommendation-step</div>,
}));

import DiagnosticWizard from "../DiagnosticWizard";

beforeEach(() => {
  plausibleSpy.mockClear();
});

describe("DiagnosticWizard funnel events", () => {
  it("fires assessment_started exactly once when the wizard opens", () => {
    render(
      <MemoryRouter>
        <DiagnosticWizard />
      </MemoryRouter>
    );
    // Called with the event name only — no props.
    expect(plausibleSpy.mock.calls).toEqual([["assessment_started"]]);
  });

  it("fires assessment_completed exactly once when results are shown, with only the vehicle make", async () => {
    render(
      <MemoryRouter>
        <DiagnosticWizard />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("vehicle-next"));
    fireEvent.click(screen.getByText("symptom-next"));

    await vi.waitFor(() =>
      expect(plausibleSpy).toHaveBeenCalledWith("assessment_completed", {
        vehicle_make: "Ford",
      })
    );
    const completed = plausibleSpy.mock.calls.filter(([n]) => n === "assessment_completed");
    expect(completed).toHaveLength(1);
    const started = plausibleSpy.mock.calls.filter(([n]) => n === "assessment_started");
    expect(started).toHaveLength(1);
    // Symptom text never reaches Plausible.
    expect(JSON.stringify(plausibleSpy.mock.calls)).not.toContain("grinding");
  });
});
