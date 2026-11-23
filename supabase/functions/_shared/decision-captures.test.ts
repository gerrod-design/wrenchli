import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildCaptureRow } from "./decision-captures.ts";

// The capture row builder: the storage-terms split (figure stored only
// when the source's terms allow; band stored either way) and the fixed
// reporting bands.

Deno.test("capture stores the figure when the source's terms allow it", () => {
  const row = buildCaptureRow({
    source: "mcp_price_check",
    repairId: "alternator",
    rangeUsd: { low: 445, high: 940 },
    value: {
      figureUsd: 8000,
      source: "validated-feed",
      asOf: "2026-11-22",
      termsBasis: "provider terms permit one dated snapshot per vehicle",
      figureStorageAllowed: true,
    },
  });
  assertEquals(row.value_figure_cents, 800000);
  assertEquals(row.value_source, "validated-feed");
  assertEquals(row.value_as_of, "2026-11-22");
  // Midpoint 692.50 / 8000 = 0.0866 -> under_25.
  assertEquals(row.ratio_band, "under_25");
  assertEquals(row.range_low_cents, 44500);
  assertEquals(row.outcome, "no_decision");
});

Deno.test("capture stores the band only when figure storage is refused", () => {
  const row = buildCaptureRow({
    source: "web_assessment",
    repairId: "catalytic_converter",
    rangeUsd: { low: 645, high: 1675 },
    value: {
      figureUsd: 2000,
      source: "validated-feed",
      asOf: "2026-11-22",
      termsBasis: "provider terms refuse persistent storage",
      figureStorageAllowed: false,
    },
  });
  assertEquals(row.value_figure_cents, null);
  assertEquals(row.value_source, null);
  assertEquals(row.value_as_of, null);
  assertEquals(row.value_terms_basis, null);
  // Midpoint 1160 / 2000 = 0.58 -> 50_100.
  assertEquals(row.ratio_band, "50_100");
});

Deno.test("capture without a value carries no band and no figure", () => {
  const row = buildCaptureRow({
    source: "mcp_price_check",
    repairId: "thermostat",
    rangeUsd: { low: 160, high: 535 },
    outcome: "proceeded",
    confirmedQuoteUsd: 410,
  });
  assertEquals(row.ratio_band, null);
  assertEquals(row.value_figure_cents, null);
  assertEquals(row.confirmed_quote_cents, 41000);
  assertEquals(row.outcome, "proceeded");
});
