import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SymptomResults } from "../SymptomResults";
import type { SymptomAnalysisResponse } from "@/types/symptom";

/**
 * Regression test for the zero-media (bundle-only) crash.
 *
 * The object below is the exact response shape returned by
 * analyze-video-combined in symptom mode (edge function source,
 * symptom-mode return block) for a smell-first submission with no
 * video: frameCount 0, hasAudio false. The assessment field is the
 * `urgency` number — there is no `urgencyTier` field in the payload.
 * In the fixed symptom-mode contract, videoInsights is null when no
 * media (frames/audio) was submitted, so the client treats it as
 * absent (undefined here, since null and undefined are both falsy).
 */
const zeroMediaSmellResult: SymptomAnalysisResponse = {
  urgency: 2,
  urgencyReason: "A sweet smell can point to a coolant leak; get it checked soon.",
  systemAreas: ["engine", "cooling"],
  shopLanguageSummary: "Customer reports a sweet smell and normal feel.",
  preliminaryAssessment:
    "A sweet smell often points to coolant. Check the coolant level and look for leaks.",
  videoInsights: undefined,
  sensesCovered: ["SMELL", "FEEL"],
  frameCount: 0,
  hasAudio: false,
};

describe("SymptomResults — zero-media symptom response", () => {
  it("renders the assessment for a bundle-only (no video) result without crashing", () => {
    render(<SymptomResults result={zeroMediaSmellResult} onClose={() => {}} />);

    expect(screen.getByText("Preliminary Assessment")).toBeInTheDocument();
    expect(screen.getByText(/Get it checked this week/)).toBeInTheDocument();
    // With no media submitted, the assessment text must render exactly
    // once, and the video-insights section must not render at all.
    expect(
      screen.getAllByText(/sweet smell often points to coolant/i).length
    ).toBe(1);
    expect(screen.queryByText("What we found in your video")).not.toBeInTheDocument();
  });

  it("renders the tier-3 do-not-drive state from the same response shape", () => {
    const tier3: SymptomAnalysisResponse = {
      ...zeroMediaSmellResult,
      urgency: 3,
      sensesCovered: ["SMELL"],
    };
    render(<SymptomResults result={tier3} onClose={() => {}} />);

    // Badge label + alert-box heading both carry the tier-3 wording.
    expect(screen.getAllByText(/Don't drive it/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders a with-video symptom result (frameCount > 0) from the same shape", () => {
    const withVideo: SymptomAnalysisResponse = {
      ...zeroMediaSmellResult,
      urgency: 1,
      frameCount: 4,
      hasAudio: true,
      sensesCovered: ["SEE", "HEAR", "SMELL", "FEEL"],
      videoInsights: "In your video we can see steam rising from the engine bay.",
    };
    render(<SymptomResults result={withVideo} onClose={() => {}} />);

    expect(screen.getByText(/Looks safe to drive/)).toBeInTheDocument();
    expect(screen.getByText("What we found in your video")).toBeInTheDocument();
    expect(
      screen.getByText("In your video we can see steam rising from the engine bay.")
    ).toBeInTheDocument();
  });

  it("calls onClose from the Close button", () => {
    const onClose = vi.fn();
    render(<SymptomResults result={zeroMediaSmellResult} onClose={onClose} />);
    // The header X (aria-label "Close") and the footer Close button share
    // an accessible name; both invoke onClose.
    screen.getAllByRole("button", { name: "Close" })[0].click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
