/**
 * Unit tests for the repair-financing client library.
 *
 * Covers the pure rules (ceiling, banding, terms) and sentinel (c):
 * the partner-facing payload carries no PII. The payload builder is
 * handed a customer record planted with sentinel identity values;
 * none of the values, and none of the identity keys, may appear in
 * the payload — the payload is exactly { token, amount_band,
 * repair_category }.
 */
import { describe, expect, it } from "vitest";
import {
  FINANCING_APR_CEILING,
  amountBandFor,
  buildPartnerPayload,
  buildPartnerUrl,
  partnerExclusionReason,
  partnerQualifies,
  partnerTermsLine,
} from "../financing";

describe("financing ceiling rule", () => {
  it("qualifies a true 0% tier", () => {
    expect(partnerQualifies({ zero_percent_tier: true, apr_percent: null })).toBe(true);
  });

  it("qualifies exactly at the ceiling and rejects above it", () => {
    expect(
      partnerQualifies({ zero_percent_tier: false, apr_percent: FINANCING_APR_CEILING }),
    ).toBe(true);
    expect(partnerQualifies({ zero_percent_tier: false, apr_percent: 24.01 })).toBe(false);
    expect(partnerQualifies({ zero_percent_tier: false, apr_percent: 32 })).toBe(false);
  });

  it("rejects a partner with no terms at all", () => {
    expect(partnerQualifies({ zero_percent_tier: false, apr_percent: null })).toBe(false);
  });

  it("names the exclusion reason instead of filtering silently", () => {
    expect(
      partnerExclusionReason({ zero_percent_tier: false, apr_percent: 32 }),
    ).toContain("32% APR exceeds the 24% APR ceiling");
    expect(
      partnerExclusionReason({ zero_percent_tier: false, apr_percent: 12 }),
    ).toBeNull();
  });
});

describe("financing amount banding", () => {
  it("bands at the same boundaries as the SQL function", () => {
    expect(amountBandFor(0)).toBe("under_250");
    expect(amountBandFor(24999)).toBe("under_250");
    expect(amountBandFor(25000)).toBe("250_500");
    expect(amountBandFor(49999)).toBe("250_500");
    expect(amountBandFor(50000)).toBe("500_1000");
    expect(amountBandFor(99999)).toBe("500_1000");
    expect(amountBandFor(100000)).toBe("1000_2000");
    expect(amountBandFor(199999)).toBe("1000_2000");
    expect(amountBandFor(200000)).toBe("2000_plus");
    expect(amountBandFor(null)).toBe("under_250");
  });
});

describe("sentinel (c): partner payload carries no PII", () => {
  const SENTINELS = {
    name: "SENTINEL_NAME_ZQ",
    full_name: "SENTINEL_NAME_ZQ",
    email: "sentinel-zq@example.com",
    phone: "555-013-4477",
    address: "1 Sentinel Way, Detroit, MI",
  };

  it("contains exactly token, amount_band, and repair_category", () => {
    const payload = buildPartnerPayload({
      token: "tok_abc123",
      amountCents: 85000,
      repairCategory: "Brake repair",
      customer: { ...SENTINELS, user_id: "user-1" },
    });
    expect(Object.keys(payload).sort()).toEqual([
      "amount_band",
      "repair_category",
      "token",
    ]);
    expect(payload).toEqual({
      token: "tok_abc123",
      amount_band: "500_1000",
      repair_category: "Brake repair",
    });
  });

  it("leaks no sentinel value into the serialized payload", () => {
    const payload = buildPartnerPayload({
      token: "tok_abc123",
      amountCents: 85000,
      repairCategory: "Brake repair",
      customer: { ...SENTINELS },
    });
    const serialized = JSON.stringify(payload);
    for (const value of Object.values(SENTINELS)) {
      expect(serialized).not.toContain(value);
    }
    for (const key of ["name", "full_name", "email", "phone", "address"]) {
      expect(serialized.toLowerCase()).not.toContain(`"${key}"`);
    }
  });
});

describe("financing link-out and terms", () => {
  it("substitutes the token into the partner URL template", () => {
    expect(buildPartnerUrl("https://partner.example/apply?ref={token}", "tok1")).toBe(
      "https://partner.example/apply?ref=tok1",
    );
  });

  it("renders plain-language terms", () => {
    expect(
      partnerTermsLine({ zero_percent_tier: true, apr_percent: null, term_months: 12 }),
    ).toBe("0% APR tier · 12 months");
    expect(
      partnerTermsLine({ zero_percent_tier: false, apr_percent: 11.99, term_months: null }),
    ).toBe("11.99% APR");
  });
});
