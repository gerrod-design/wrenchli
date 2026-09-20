import { describe, it, expect } from "vitest";
import { showDIY, isDIYEligibleCause, isSafetyCriticalCause } from "./diyVisibility";

describe("showDIY", () => {
  it("returns true when urgency is monitor and a cause is easy", () => {
    expect(showDIY("monitor", [{ diy_difficulty: "easy" }])).toBe(true);
  });

  it("returns true when urgency is schedule and a cause is moderate", () => {
    expect(showDIY("schedule", [{ diy_difficulty: "moderate" }])).toBe(true);
  });

  it("returns true when at least one cause is DIY-eligible among mixed causes", () => {
    expect(
      showDIY("monitor", [
        { diy_difficulty: "professional_only" },
        { diy_difficulty: "easy" },
      ])
    ).toBe(true);
  });

  it("returns false when urgency is immediate", () => {
    expect(showDIY("immediate", [{ diy_difficulty: "easy" }])).toBe(false);
  });

  it("returns false when urgency is soon", () => {
    expect(showDIY("soon", [{ diy_difficulty: "easy" }])).toBe(false);
  });

  it("returns false when all causes are professional_only", () => {
    expect(
      showDIY("monitor", [
        { diy_difficulty: "professional_only" },
        { diy_difficulty: "professional_only" },
      ])
    ).toBe(false);
  });

  it("returns false when urgency is null", () => {
    expect(showDIY(null, [{ diy_difficulty: "easy" }])).toBe(false);
  });

  it("returns false when urgency is undefined", () => {
    expect(showDIY(undefined, [{ diy_difficulty: "easy" }])).toBe(false);
  });

  it("returns false when causes array is empty", () => {
    expect(showDIY("monitor", [])).toBe(false);
  });

  it("returns true for a DIY-friendly air filter even when a fuel-system cause is in the differential", () => {
    // Regression: the old all-causes safety veto suppressed the DIY card and
    // outcome prompt for the whole diagnosis when any alternative cause was
    // safety-critical, contradicting the per-cause "DIY Friendly" badge.
    expect(
      showDIY("monitor", [
        { name: "Dirty/clogged engine air filter", diy_difficulty: "easy" },
        { name: "Clogged fuel injectors", diy_difficulty: "professional_only" },
      ])
    ).toBe(true);
  });

  it("never treats a safety-critical cause as DIY-eligible, even if mislabeled easy", () => {
    expect(
      showDIY("monitor", [
        { name: "Worn brake pads", diy_difficulty: "easy" },
      ])
    ).toBe(false);
    expect(
      isDIYEligibleCause({ name: "Worn brake pads", diy_difficulty: "easy" })
    ).toBe(false);
  });

  it("excludes safety-critical causes when picking the DIY-eligible cause", () => {
    const causes = [
      { name: "Worn brake pads", diy_difficulty: "easy" as const },
      { name: "Dirty/clogged engine air filter", diy_difficulty: "easy" as const },
    ];
    expect(causes.find(isDIYEligibleCause)?.name).toBe(
      "Dirty/clogged engine air filter"
    );
  });
});

describe("isSafetyCriticalCause", () => {
  it("matches brakes, steering, airbags, and fuel system names", () => {
    expect(isSafetyCriticalCause("Worn brake pads")).toBe(true);
    expect(isSafetyCriticalCause("Power steering fluid leak")).toBe(true);
    expect(isSafetyCriticalCause("Faulty airbag sensor")).toBe(true);
    expect(isSafetyCriticalCause("Clogged fuel injectors")).toBe(true);
  });

  it("does not match ordinary causes", () => {
    expect(isSafetyCriticalCause("Dirty/clogged engine air filter")).toBe(false);
    expect(isSafetyCriticalCause("Worn serpentine belt")).toBe(false);
  });

  it("handles null and undefined", () => {
    expect(isSafetyCriticalCause(null)).toBe(false);
    expect(isSafetyCriticalCause(undefined)).toBe(false);
  });
});
