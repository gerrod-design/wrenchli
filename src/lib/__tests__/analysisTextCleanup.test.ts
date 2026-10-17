import { describe, it, expect } from "vitest";
import { cleanAnalysisForDisplay } from "../../../supabase/functions/analyze-video-combined/symptomMapping";

describe("cleanAnalysisForDisplay", () => {
  it("strips paired ** markers while keeping the bolded words", () => {
    expect(cleanAnalysisForDisplay("This is **important** advice.")).toBe(
      "This is important advice."
    );
  });

  it("strips a ** section header line", () => {
    expect(cleanAnalysisForDisplay("**What's likely going on:**\nCheck the belt.")).toBe(
      "What's likely going on:\nCheck the belt."
    );
  });

  it("leaves marker-free text byte-identical", () => {
    const text = "Nothing special here, just plain text.\nWith a newline.";
    expect(cleanAnalysisForDisplay(text)).toBe(text);
  });

  it("returns an empty string for an empty string", () => {
    expect(cleanAnalysisForDisplay("")).toBe("");
  });

  it("returns an empty string for text that is only '**'", () => {
    expect(cleanAnalysisForDisplay("**")).toBe("");
  });
});