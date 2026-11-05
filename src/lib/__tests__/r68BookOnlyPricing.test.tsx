/**
 * R-68 book-only pricing — regression coverage.
 *
 * Rule under test: a price is shown ONLY when it comes from the shared
 * price book (supabase/functions/_shared/repair-rates.ts). On a matcher
 * miss the assessment still completes, but every price figure is withheld
 * and surfaces render the honest no-price state.
 *
 * Covers:
 *  1. pinDiagnosisCosts — the pinning unit the main `diagnose` pipeline
 *     applies to every result (miss → stripped + stamped; match → book
 *     figures unchanged).
 *  2. analyzeSymptoms — the public API handler's analysis core
 *     (miss → cost_estimate null + price_status "not_in_book";
 *     match → pinned book figures).
 *  3. DiagnosisCard — the web renderer decision reads rate_source /
 *     price_status (pinned → price; miss → honest state, no price).
 *  4. getPreliminaryCostRange — the loading-state range is derived from
 *     the book, not a client-side table.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
    functions: { invoke: vi.fn() },
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock("@/hooks/useSmartRepairIntel", () => ({
  useSmartRepairIntel: () => ({ data: null, loading: false }),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
  trackPlausibleEvent: vi.fn(),
}));

import {
  findRepairRate,
  rateFigures,
  formatMoneyRange,
  pinDiagnosisCosts,
  RATE_SOURCE_ID,
  NOT_IN_BOOK_MESSAGE,
  type DiagnosisCostFields,
} from "../../../supabase/functions/_shared/repair-rates";
import { analyzeSymptoms } from "../../../supabase/functions/_shared/api-diagnose-analysis";
import DiagnosisCard from "@/components/diagnosis/DiagnosisCard";
import type { Diagnosis } from "@/components/diagnosis/types";
import { getPreliminaryCostRange } from "@/data/preliminaryCostRanges";
import { REPAIR_RATES } from "@/lib/priceBook";

/* ------------------------------------------------------------------ */
/* 1. Main diagnose path — pinDiagnosisCosts                           */
/* ------------------------------------------------------------------ */

function modelDiagnosis(): DiagnosisCostFields & { title: string } {
  return {
    title: "Flux capacitor failure",
    diy_cost: "$900–$1,200",
    shop_parts_cost: "$800–$1,000",
    shop_labor_cost: "$500–$700",
    shop_cost: "$1,300–$1,700",
    diy_time: "2 hours",
    shop_time: "1 day",
  };
}

describe("pinDiagnosisCosts (main diagnose path)", () => {
  it("miss: strips every price, stamps not_in_book, keeps the assessment", () => {
    const d = modelDiagnosis();
    const entry = findRepairRate(d.title);
    expect(entry).toBeNull();

    pinDiagnosisCosts(d, entry);

    expect(d.diy_cost).toBe("");
    expect(d.shop_parts_cost).toBe("");
    expect(d.shop_labor_cost).toBe("");
    expect(d.shop_cost).toBe("");
    expect(d.rate_source).toBeNull();
    expect(d.price_status).toBe("not_in_book");
    // The assessment itself is untouched.
    expect(d.title).toBe("Flux capacitor failure");
  });

  it("match: replaces figures with the book figures and stamps rate_source", () => {
    const d = { ...modelDiagnosis(), title: "Brake Pads Replacement" };
    const entry = findRepairRate(d.title);
    expect(entry).not.toBeNull();

    pinDiagnosisCosts(d, entry);
    const figures = rateFigures(entry!);

    expect(d.shop_parts_cost).toBe(formatMoneyRange(figures.shopParts));
    expect(d.shop_labor_cost).toBe(formatMoneyRange(figures.shopLabor));
    expect(d.shop_cost).toBe(formatMoneyRange(figures.shopTotal));
    expect(d.rate_source).toBe(RATE_SOURCE_ID);
    expect(d.price_status).toBe("book");
  });
});

/* ------------------------------------------------------------------ */
/* 2. Public API handler — analyzeSymptoms                             */
/* ------------------------------------------------------------------ */

describe("analyzeSymptoms (public API handler)", () => {
  const vehicle = { year: 2020, make: "Honda", model: "Accord" };

  it("miss: unrecognized symptoms return no price and price_status not_in_book", () => {
    const result = analyzeSymptoms(["the car feels sad on tuesdays"], vehicle);
    expect(result.cost_estimate).toBeNull();
    expect(result.price_status).toBe("not_in_book");
    expect(result.rate_source).toBeUndefined();
    // Assessment still completes.
    expect(result.issue).toBeTruthy();
    expect(result.action).toBeTruthy();
  });

  it("miss: a bucket spanning several repairs (overheating) shows no price", () => {
    const result = analyzeSymptoms(["engine is overheating and steaming"], vehicle);
    expect(result.issue).toBe("Engine Overheating");
    expect(result.cost_estimate).toBeNull();
    expect(result.price_status).toBe("not_in_book");
  });

  it("match: brake symptoms are pinned to the book's brake-pads figures", () => {
    const result = analyzeSymptoms(["grinding noise when braking"], vehicle);
    const entry = findRepairRate("Brake Pads Replacement");
    expect(entry).not.toBeNull();
    const figures = rateFigures(entry!);

    expect(result.price_status).toBe("book");
    expect(result.rate_source).toBe(RATE_SOURCE_ID);
    expect(result.cost_estimate).toEqual({
      min: figures.shopTotal[0],
      max: figures.shopTotal[1],
    });
  });
});

/* ------------------------------------------------------------------ */
/* 3. DiagnosisCard renderer decision                                  */
/* ------------------------------------------------------------------ */

function baseDiagnosis(overrides: Partial<Diagnosis>): Diagnosis {
  return {
    title: "Worn Brake Pads",
    code: "",
    urgency: "high",
    whats_happening: "The pads are worn to the backing plate.",
    common_causes: ["Worn brake pads"],
    diy_feasibility: "advanced",
    diy_cost: "",
    shop_cost: "",
    ...overrides,
  };
}

describe("DiagnosisCard (renderer)", () => {
  it("miss: renders the honest state and no price figures", () => {
    render(
      <DiagnosisCard
        diagnosis={baseDiagnosis({
          price_status: "not_in_book",
          rate_source: null,
        })}
        vehicle="2020 Honda Accord"
      />
    );
    expect(screen.getByText(NOT_IN_BOOK_MESSAGE)).toBeTruthy();
    expect(screen.queryByText(/Estimated total:/)).toBeNull();
  });

  it("match: renders the pinned book figures", () => {
    const entry = findRepairRate("Brake Pads Replacement")!;
    const figures = rateFigures(entry);
    const shopCost = formatMoneyRange(figures.shopTotal);
    render(
      <DiagnosisCard
        diagnosis={baseDiagnosis({
          diy_cost: figures.diyParts ? formatMoneyRange(figures.diyParts) : "",
          shop_parts_cost: formatMoneyRange(figures.shopParts),
          shop_labor_cost: formatMoneyRange(figures.shopLabor),
          shop_cost: shopCost,
          shop_time: entry.shopTime,
          price_status: "book",
          rate_source: RATE_SOURCE_ID,
        })}
        vehicle="2020 Honda Accord"
      />
    );
    expect(screen.getByText(/Estimated total:/)).toBeTruthy();
    expect(screen.getByText(shopCost)).toBeTruthy();
    expect(screen.queryByText(NOT_IN_BOOK_MESSAGE)).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* 4. Preliminary (loading-state) range comes from the book            */
/* ------------------------------------------------------------------ */

describe("getPreliminaryCostRange", () => {
  it("brake symptoms return the range spanned by the book's brake entries", () => {
    const range = getPreliminaryCostRange("grinding noise when I brake");
    expect(range).not.toBeNull();
    expect(range!.category).toBe("Brake repair");

    const brakeTotals = REPAIR_RATES.filter((e) =>
      e.label.toLowerCase().includes("brake")
    ).map((e) => rateFigures(e).shopTotal);
    expect(brakeTotals.length).toBeGreaterThan(0);
    expect(range!.low).toBe(Math.min(...brakeTotals.map((t) => t[0])));
    expect(range!.high).toBe(Math.max(...brakeTotals.map((t) => t[1])));
  });

  it("unmatched symptom text returns null (no invented range)", () => {
    expect(getPreliminaryCostRange("the car feels sad on tuesdays")).toBeNull();
    expect(getPreliminaryCostRange("")).toBeNull();
  });
});
