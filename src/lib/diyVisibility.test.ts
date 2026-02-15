import { describe, it, expect } from "vitest";
import { showDIY } from "./diyVisibility";

describe("showDIY", () => {
  it("returns true when repair cost is below the default threshold", () => {
    expect(showDIY(1500)).toBe(true);
  });

  it("returns false when repair cost meets or exceeds the default threshold", () => {
    expect(showDIY(2000)).toBe(false);
    expect(showDIY(3000)).toBe(false);
  });

  it("uses easy threshold (5000) for easy feasibility", () => {
    expect(showDIY(4999, "easy")).toBe(true);
    expect(showDIY(5000, "easy")).toBe(false);
  });

  it("uses moderate threshold (3000) for moderate feasibility", () => {
    expect(showDIY(2999, "moderate")).toBe(true);
    expect(showDIY(3000, "moderate")).toBe(false);
  });

  it("uses advanced threshold (1500) for advanced feasibility", () => {
    expect(showDIY(1499, "advanced")).toBe(true);
    expect(showDIY(1500, "advanced")).toBe(false);
  });

  it("falls back to default threshold (2000) for unknown feasibility", () => {
    expect(showDIY(1999, "unknown")).toBe(true);
    expect(showDIY(2000, "unknown")).toBe(false);
  });

  it("falls back to default threshold when feasibility is undefined", () => {
    expect(showDIY(1999, undefined)).toBe(true);
    expect(showDIY(2000, undefined)).toBe(false);
  });
});
