import { describe, it, expect } from "vitest";
import { scorePhotoCandidate, pickBestPhoto } from "../../../supabase/functions/unsplash-search/scoring";

describe("unsplash photo scoring", () => {
  it("picks the Q7 SUV photo over the A6 sedan photo", () => {
    const ctx = { make: "AUDI", model: "Q7", bodyType: "suv" };
    const candidates = [
      { alt_description: "silver audi a6 sedan parked on street" },
      { alt_description: "white audi q7 suv on a road" },
    ];
    const result = pickBestPhoto(candidates, ctx);
    expect(result).toBe(candidates[1]);
  });

  it("picks the gran coupe photo over the 2-door coupe photo for M850i xDrive GC", () => {
    const ctx = { make: "BMW", model: "M850i", trim: "xDrive GC", bodyType: "sedan" };
    const candidates = [
      { alt_description: "blue bmw 8 series coupe side view" },
      { alt_description: "grey bmw 8 series gran coupe four door" },
    ];
    const result = pickBestPhoto(candidates, ctx);
    expect(result).toBe(candidates[1]);
  });

  it("falls back to the first candidate when no model match exists", () => {
    const ctx = { make: "FORD", model: "F150" };
    const candidates = [
      { alt_description: "a mountain landscape" },
      { alt_description: "a city street at night" },
    ];
    const result = pickBestPhoto(candidates, ctx);
    expect(result).toBe(candidates[0]);
  });

  it("returns null for empty candidates", () => {
    const ctx = { make: "FORD", model: "F150" };
    expect(pickBestPhoto([], ctx)).toBeNull();
  });

  it("scores a GLC SUV match higher than a generic photo", () => {
    const ctx = { make: "MERCEDES-BENZ", model: "GLC-Class", bodyType: "suv" };
    const glcCandidate = { alt_description: "mercedes-benz glc suv front" };
    const genericCandidate = { alt_description: "generic city street" };
    const glcScore = scorePhotoCandidate(glcCandidate, ctx);
    const genericScore = scorePhotoCandidate(genericCandidate, ctx);
    expect(glcScore).toBeGreaterThan(genericScore);
  });
});