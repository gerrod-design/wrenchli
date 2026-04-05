import { describe, it, expect } from "vitest";
import { showDIY } from "./diyVisibility";

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
});
