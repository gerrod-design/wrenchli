/**
 * Brief 5, Item 2 — OBD code format validation for the wizard.
 *
 * Codes are P/B/C/U followed by 4 characters. A valid code reaches the
 * engine payload; an invalid string is rejected at the field and never
 * reaches it.
 */
import { describe, it, expect } from "vitest";
import { isValidDiagnosticCode, parseDiagnosticCodes } from "../codes";

describe("isValidDiagnosticCode", () => {
  it("accepts standard codes", () => {
    expect(isValidDiagnosticCode("P0300")).toBe(true);
    expect(isValidDiagnosticCode("U0100")).toBe(true);
    expect(isValidDiagnosticCode("B1234")).toBe(true);
    expect(isValidDiagnosticCode("C0561")).toBe(true);
    expect(isValidDiagnosticCode("P0A80")).toBe(true);
  });

  it("accepts lowercase entry (normalized by the parser)", () => {
    expect(isValidDiagnosticCode("p0300")).toBe(true);
  });

  it("rejects non-codes", () => {
    expect(isValidDiagnosticCode("HELLO")).toBe(false);
    expect(isValidDiagnosticCode("P030")).toBe(false);
    expect(isValidDiagnosticCode("P03000")).toBe(false);
    expect(isValidDiagnosticCode("X0300")).toBe(false);
    expect(isValidDiagnosticCode("0300")).toBe(false);
    expect(isValidDiagnosticCode("")).toBe(false);
  });
});

describe("parseDiagnosticCodes", () => {
  it("splits a mixed entry into valid codes and invalid tokens", () => {
    const parsed = parseDiagnosticCodes("P0300, HELLO");
    expect(parsed.codes).toEqual(["P0300"]);
    expect(parsed.invalid).toEqual(["HELLO"]);
  });

  it("normalizes case, accepts comma/space/semicolon separators, de-dupes", () => {
    const parsed = parseDiagnosticCodes("p0300 P0301;u0100  p0300");
    expect(parsed.codes).toEqual(["P0300", "P0301", "U0100"]);
    expect(parsed.invalid).toEqual([]);
  });

  it("empty input yields no codes and no invalid tokens", () => {
    expect(parseDiagnosticCodes("")).toEqual({ codes: [], invalid: [] });
    expect(parseDiagnosticCodes("   ")).toEqual({ codes: [], invalid: [] });
  });
});
