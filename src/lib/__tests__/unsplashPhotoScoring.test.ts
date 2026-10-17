import { describe, it, expect } from "vitest";
import { scorePhotoCandidate, pickBestPhoto, getVehicleBodyClass, classifyCandidateBody } from "../../../supabase/functions/unsplash-search/scoring";

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

  // The following fixtures are modeled on real Unsplash results observed live for these vehicles.
  it("excludes the GLC Coupe for an SUV record even when scores tie", () => {
    const ctx = { make: "MERCEDES-BENZ", model: "GLC-Class", bodyType: "suv" };
    const candidates = [
      { alt_description: "mercedes-benz glc coupe rear view" },
      { alt_description: "mercedes-benz luxury suv front view" },
    ];
    const result = pickBestPhoto(candidates, ctx);
    expect(result).toBe(candidates[1]);
  });

  it("picks the GLC SUV photo over the GLC Coupe photo", () => {
    const ctx = { make: "MERCEDES-BENZ", model: "GLC-Class", bodyType: "suv" };
    const candidates = [
      { alt_description: "white mercedes-benz glc coupe parked on a city street at night" },
      { alt_description: "dark grey mercedes-benz glc suv front view with diamond grille" },
    ];
    const result = pickBestPhoto(candidates, ctx);
    expect(result).toBe(candidates[1]);
  });

  it("picks the Gran Coupe over the art-wrapped coupe show car for M850i xDrive GC", () => {
    const ctx = { make: "BMW", model: "M850i", trim: "xDrive GC", bodyType: "sedan" };
    const candidates = [
      { alt_description: "blue bmw m850i coupe with colorful art wrap the 8 show car rear view" },
      { alt_description: "black bmw 8 series gran coupe parked on a driveway" },
    ];
    const result = pickBestPhoto(candidates, ctx);
    expect(result).toBe(candidates[1]);
  });

  it("keeps the SQ7 for a Q7 record: body class gates, trim mismatch does not", () => {
    const ctx = { make: "AUDI", model: "Q7", trim: "quattro Premium Plus", bodyType: "suv" };
    const candidates = [
      { alt_description: "black audi a6 sedan front clip" },
      { alt_description: "close up of audi rings logo on a car hood" },
      { alt_description: "black audi sq7 suv side profile" },
    ];
    const result = pickBestPhoto(candidates, ctx);
    expect(result).toBe(candidates[2]);
  });

  it("falls back to best score when no candidate matches the body class", () => {
    const ctx = { make: "AUDI", model: "Q7", bodyType: "suv" };
    const candidates = [
      { alt_description: "silver audi a6 sedan parked on street" },
      { alt_description: "red audi tt coupe on a track" },
    ];
    const result = pickBestPhoto(candidates, ctx);
    expect(result).toBe(candidates[1]);
  });

  it("classifies vehicle and candidate body classes", () => {
    expect(getVehicleBodyClass({ make: "BMW", model: "M850i", trim: "xDrive GC", bodyType: "sedan" })).toBe("gran-coupe");
    expect(getVehicleBodyClass({ make: "MERCEDES-BENZ", model: "GLC-Class", trim: "GLC300 Base-4M", bodyType: "suv" })).toBe("suv");
    expect(getVehicleBodyClass({ make: "AUDI", model: "Q7", bodyType: "SUV/MPV" })).toBe("suv");
    expect(getVehicleBodyClass({ make: "TOYOTA", model: "Camry" })).toBe("unknown");
    expect(classifyCandidateBody({ alt_description: "bmw 8 series gran coupe" })).toBe("gran-coupe");
    expect(classifyCandidateBody({ alt_description: "mercedes-benz glc coupe" })).toBe("coupe");
    expect(classifyCandidateBody({ alt_description: "white audi q7 suv on a road" })).toBe("suv");
    expect(classifyCandidateBody({ alt_description: "close up of audi rings logo on a car hood" })).toBe("unknown");
  });
});
