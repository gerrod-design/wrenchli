import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VehicleAssessmentsSection from "@/components/garage/VehicleAssessmentsSection";
import { setPendingHandoff } from "@/lib/handoff";
import type { HandoffSnapshot } from "@/lib/handoff";

vi.mock("@/lib/handoff", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/handoff")>();
  return {
    ...actual,
    setPendingHandoff: vi.fn(),
  };
});

function makeSnapshot(overrides: Partial<HandoffSnapshot> = {}): HandoffSnapshot {
  return {
    vehicle: { year: 2018, make: "Honda", model: "Civic", mileage: 65000 },
    symptoms: { primary_symptom: "Grinding noise when braking" },
    assessment: {
      explanation: "The pads are likely worn down to the wear indicator.",
      possible_causes: [
        { name: "Worn brake pads", probability: 0.8 },
        { name: "Warped rotor", probability: 0.2 },
      ],
      cost_range: { low: 150, high: 300 },
    },
    completed_at: "2026-10-21T12:00:00.000Z",
    ...overrides,
  };
}

describe("VehicleAssessmentsSection", () => {
  it("renders entries with date, symptom, causes, cost range, and explanation", () => {
    const handoffs = [
      { id: "handoff-1", snapshot: makeSnapshot() },
      {
        id: "handoff-2",
        snapshot: makeSnapshot({
          symptoms: { primary_symptom: "Check engine light" },
          completed_at: "2026-09-01T12:00:00.000Z",
          assessment: {
            explanation: "Likely an oxygen sensor fault.",
            possible_causes: [{ name: "Faulty O2 sensor" }],
            cost_range: { low: 200, high: 400 },
          },
        }),
      },
    ];

    render(<VehicleAssessmentsSection handoffs={handoffs} />);

    expect(screen.getByText("October 21, 2026")).toBeInTheDocument();
    expect(screen.getByText("September 1, 2026")).toBeInTheDocument();

    expect(screen.getByText("Grinding noise when braking")).toBeInTheDocument();
    expect(screen.getByText("Check engine light")).toBeInTheDocument();

    expect(screen.getByText("Worn brake pads, Warped rotor")).toBeInTheDocument();
    expect(screen.getByText("Faulty O2 sensor")).toBeInTheDocument();

    expect(screen.getByText("Estimated cost: $150 – $300")).toBeInTheDocument();
    expect(screen.getByText("Estimated cost: $200 – $400")).toBeInTheDocument();

    expect(
      screen.getByText("The pads are likely worn down to the wear indicator.")
    ).toBeInTheDocument();
    expect(screen.getByText("Likely an oxygen sensor fault.")).toBeInTheDocument();
  });

  it("renders the empty state when there are no assessments", () => {
    render(<VehicleAssessmentsSection handoffs={[]} />);

    expect(
      screen.getByText("No assessments have been linked to this vehicle yet.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Talk it through")).not.toBeInTheDocument();
  });

  it("falls back to raw_description when primary_symptom is absent", () => {
    const handoffs = [
      {
        id: "handoff-3",
        snapshot: makeSnapshot({
          symptoms: { raw_description: "Weird smell from the dashboard vents" },
        }),
      },
    ];

    render(<VehicleAssessmentsSection handoffs={handoffs} />);

    expect(
      screen.getByText("Weird smell from the dashboard vents")
    ).toBeInTheDocument();
  });

  it("calls setPendingHandoff with the handoff id when 'Talk it through' is clicked", () => {
    const handoffs = [{ id: "handoff-4", snapshot: makeSnapshot() }];

    render(<VehicleAssessmentsSection handoffs={handoffs} />);

    fireEvent.click(screen.getByText("Talk it through"));

    expect(setPendingHandoff).toHaveBeenCalledWith({ kind: "owned", id: "handoff-4" });
  });
});
