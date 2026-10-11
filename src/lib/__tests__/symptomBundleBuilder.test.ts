import { describe, it, expect } from "vitest";
import {
  buildSenseBundle,
  createEmptyObservations,
  generateDirectedPrompt,
  getCoveredSenses,
  isBundleEmpty,
} from "../symptomBundleBuilder";
import type { SenseObservation } from "@/types/symptom";

function obs(sense: SenseObservation["sense"], descriptors: string[]): SenseObservation {
  return { sense, descriptors };
}

describe("createEmptyObservations", () => {
  it("creates one empty observation per sense", () => {
    const o = createEmptyObservations();
    expect(o.map((x) => x.sense).sort()).toEqual(["FEEL", "HEAR", "SEE", "SMELL"]);
    expect(o.every((x) => x.descriptors.length === 0)).toBe(true);
  });
});

describe("buildSenseBundle", () => {
  it("carries observations, timing, conditions, locations", () => {
    const b = buildSenseBundle(
      [obs("HEAR", ["squealing"])],
      ["started today"],
      ["when braking"],
      ["front"]
    );
    expect(b.observations[0].descriptors).toEqual(["squealing"]);
    expect(b.timing).toEqual(["started today"]);
    expect(b.conditions).toEqual(["when braking"]);
    expect(b.locations).toEqual(["front"]);
  });
});

describe("isBundleEmpty", () => {
  it("true when no descriptors and no free text", () => {
    expect(isBundleEmpty(buildSenseBundle(createEmptyObservations(), [], [], []))).toBe(true);
  });
  it("false when a descriptor is selected", () => {
    expect(
      isBundleEmpty(buildSenseBundle([obs("SMELL", ["burning"])], [], [], []))
    ).toBe(false);
  });
});

describe("getCoveredSenses", () => {
  it("returns only senses with descriptors or free text", () => {
    const b = buildSenseBundle(
      [obs("HEAR", ["grinding"]), obs("SEE", []), obs("SMELL", ["sweet"])],
      [], [], []
    );
    expect(getCoveredSenses(b)).toEqual(["HEAR", "SMELL"]);
  });
});

describe("generateDirectedPrompt", () => {
  it("prioritizes HEAR when multiple senses reported", () => {
    const b = buildSenseBundle(
      [obs("SMELL", ["burning"]), obs("HEAR", ["squealing"]), obs("SEE", ["smoke"])],
      [], [], []
    );
    const prompt = generateDirectedPrompt(b);
    expect(prompt).toContain("while the noise is happening");
  });

  it("uses SEE instruction when only SEE reported", () => {
    const b = buildSenseBundle([obs("SEE", ["smoke"])], [], [], []);
    expect(generateDirectedPrompt(b)).toContain("Point the camera");
  });

  it("uses FEEL instruction when only FEEL reported", () => {
    const b = buildSenseBundle(
      [obs("FEEL", ["vibration in steering wheel"])],
      [], [], []
    );
    expect(generateDirectedPrompt(b)).toContain("Mount the phone");
  });

  it("falls back to generic instruction when bundle is empty", () => {
    const b = buildSenseBundle(createEmptyObservations(), [], [], []);
    expect(generateDirectedPrompt(b)).toContain("Record 10 seconds of the issue");
  });
});
