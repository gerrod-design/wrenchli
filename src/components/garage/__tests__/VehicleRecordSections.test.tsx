import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VehicleRecordSections } from "../VehicleRecordSections";
import { CORE_BASELINE_CHECKS } from "@/lib/garageRecord";
import type { VehicleConditionCheck, WeakPointCheck } from "@/types/garageRecord";

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

const checks: VehicleConditionCheck[] = CORE_BASELINE_CHECKS.map((definition, index) => ({
  id: `check-${definition.key}`,
  vehicle_id: "vehicle-1",
  owner_user_id: "user-1",
  check_key: definition.key,
  label: definition.label,
  category: "condition_check",
  sense: definition.sense,
  status: index === 0 ? "checked_ok" : "not_checked",
  last_checked_at: index === 0 ? "2026-10-12T12:00:00.000Z" : null,
  last_source_type: index === 0 ? "owner" : null,
  last_source_name: index === 0 ? "Owner Name" : null,
  evidence_media: index === 0 ? [{ bucket: "garage-vehicle-media", path: "user/vehicle/odometer.jpg" }] : [],
  updated_at: "2026-10-12T12:00:00.000Z",
}));

describe("VehicleRecordSections", () => {
  it("renders two separate layer sections, coverage only, and a cited weak-point check", () => {
    render(
      <VehicleRecordSections
        timeline={[]}
        coreChecks={checks}
        currentChecks={checks}
        weakPoints={[weakPoint]}
        recalls={[]}
        documents={[]}
        baselines={[]}
        sharePermissionCount={0}
        onOpenDocument={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByRole("heading", { name: "Reported History" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Observed Condition" })).toBeInTheDocument();
    expect(screen.getByText(/Reported history only includes what was reported/)).toBeInTheDocument();
    expect(screen.getByText("Baseline: 1 of 10 core checks captured")).toBeInTheDocument();
    expect(screen.getAllByText("Not yet checked").length).toBeGreaterThan(0);
    expect(screen.getByText("Rear wheel wells — dampness and corrosion")).toBeInTheDocument();
    expect(screen.getByText("Documented X253 rear water-intrusion pattern")).toBeInTheDocument();
    expect(screen.getByText(/Sharing is off by default/)).toBeInTheDocument();
    expect(document.body.textContent?.toLowerCase()).not.toContain("condition score");
  });
});
