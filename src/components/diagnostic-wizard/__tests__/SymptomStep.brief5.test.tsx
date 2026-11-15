/**
 * Brief 5 — the wizard's small honesties.
 *
 * Item 1: SymptomStep sends the fields the engine already expects
 * (symptom_location, when_it_happens, warning_lights) — the payload handed
 * to diagnose-vehicle, which is the same SymptomData object the wizard
 * stores into the session's assessment snapshot, must carry them populated
 * from the UI. Fields left empty still complete: they are enrichments,
 * not gates.
 *
 * Item 2: an optional codes field, format-validated at the field. A valid
 * code (P0300) reaches the engine payload; an invalid string is rejected
 * with a plain message and the submission does not happen.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SymptomStep from "../steps/SymptomStep";
import type { VehicleData } from "../DiagnosticWizard";

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: invokeMock } },
}));

const VEHICLE: VehicleData = { year: 2019, make: "Mercedes-Benz", model: "GLC300", mileage: 120000 };

const DIAGNOSIS = {
  diagnosis_id: "d1",
  confidence: "medium",
  urgency: "schedule",
  explanation: "Likely an ignition misfire.",
  possible_causes: [],
};

function renderStep(onNext = vi.fn()) {
  render(
    <SymptomStep
      vehicle={VEHICLE}
      sessionId="sess-1"
      onNext={onNext}
      onVehicleInvalid={vi.fn()}
      onBack={vi.fn()}
    />
  );
  return onNext;
}

function fillDescription() {
  fireEvent.change(screen.getByPlaceholderText(/Car won't start/), {
    target: { value: "Engine runs rough and shakes at idle every morning" },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /Get Assessment/ }));
}

function lastInvokeSymptom() {
  expect(invokeMock).toHaveBeenCalled();
  const call = invokeMock.mock.calls[invokeMock.mock.calls.length - 1];
  expect(call[0]).toBe("diagnose-vehicle");
  return call[1].body.symptom;
}

describe("SymptomStep — Brief 5", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invokeMock.mockResolvedValue({ data: DIAGNOSIS, error: null });
  });

  it("Item 1: sends location, when-it-happens, and warning lights populated from the UI", async () => {
    const onNext = renderStep();
    fillDescription();
    fireEvent.click(screen.getByRole("button", { name: "Back of the car" }));
    fireEvent.change(screen.getByPlaceholderText(/Or say it in your own words/), {
      target: { value: "near the tail light" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cold start" }));
    fireEvent.click(screen.getByRole("button", { name: "Braking" }));
    fireEvent.click(screen.getByRole("button", { name: "Check engine" }));
    submit();

    await waitFor(() => expect(onNext).toHaveBeenCalled());
    const symptom = lastInvokeSymptom();
    expect(symptom.symptom_location).toBe("Back of the car: near the tail light");
    expect(symptom.when_it_happens).toBe("Cold start, Braking");
    expect(symptom.warning_lights).toEqual(["Check engine"]);

    // The same object is handed on as the session's symptom record.
    const handedOn = onNext.mock.calls[0][0];
    expect(handedOn.symptom_location).toBe("Back of the car: near the tail light");
    expect(handedOn.when_it_happens).toBe("Cold start, Braking");
    expect(handedOn.warning_lights).toEqual(["Check engine"]);
  });

  it("Item 1: the new fields are enrichments, not gates — an unfilled submission still completes", async () => {
    const onNext = renderStep();
    fillDescription();
    submit();

    await waitFor(() => expect(onNext).toHaveBeenCalled());
    const symptom = lastInvokeSymptom();
    expect(symptom.primary_symptom).toContain("runs rough");
    expect(symptom.symptom_location).toBeUndefined();
    expect(symptom.when_it_happens).toBeUndefined();
    expect(symptom.warning_lights).toBeUndefined();
    expect(symptom.codes).toBeUndefined();
  });

  it("Item 1: 'None' warning light is exclusive", async () => {
    const onNext = renderStep();
    fillDescription();
    fireEvent.click(screen.getByRole("button", { name: "Check engine" }));
    fireEvent.click(screen.getByRole("button", { name: "None" }));
    submit();

    await waitFor(() => expect(onNext).toHaveBeenCalled());
    expect(lastInvokeSymptom().warning_lights).toEqual(["None"]);
  });

  it("Item 2: a valid code reaches the engine payload, normalized", async () => {
    const onNext = renderStep();
    fillDescription();
    fireEvent.change(screen.getByPlaceholderText(/If a scanner or a parts store/), {
      target: { value: "p0300" },
    });
    submit();

    await waitFor(() => expect(onNext).toHaveBeenCalled());
    expect(lastInvokeSymptom().codes).toEqual(["P0300"]);
    expect(onNext.mock.calls[0][0].codes).toEqual(["P0300"]);
  });

  it("Item 2: an invalid code is rejected at the field with a plain message; nothing is submitted", async () => {
    const onNext = renderStep();
    fillDescription();
    fireEvent.change(screen.getByPlaceholderText(/If a scanner or a parts store/), {
      target: { value: "P0300, HELLO" },
    });
    submit();

    await waitFor(() =>
      expect(screen.getByText(/doesn't look like a code/)).toBeInTheDocument()
    );
    expect(screen.getByText(/Codes look like P0300/)).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();

    // Fixing the entry lets the same submission through with the valid code.
    fireEvent.change(screen.getByPlaceholderText(/If a scanner or a parts store/), {
      target: { value: "P0300" },
    });
    submit();
    await waitFor(() => expect(onNext).toHaveBeenCalled());
    expect(lastInvokeSymptom().codes).toEqual(["P0300"]);
  });
});
