/**
 * Brief 5 — engine-side honesties, pinned at the function source
 * (edge functions are Deno modules and cannot be imported into vitest;
 * the house pattern for them is source assertion, as in R-72).
 *
 * Item 2 (engine half): diagnose-vehicle accepts `codes` on its symptom
 * payload and puts them in the prompt the model reasons over.
 *
 * Item 3: agent-diagnose's dead repair_outcomes match-rate readout is
 * retired — no read of the table, no historical-data construction, and no
 * network-rate line in the prompt. (The table's other readers —
 * agent-rank-shops, ShopBenchmarks, ShopRevenue — are shop-side surfaces,
 * out of Brief 5's scope, recorded as a follow-on for Gerrod's ruling.)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const agentDiagnose = readFileSync(
  resolve(__dirname, "../../../supabase/functions/agent-diagnose/index.ts"),
  "utf8"
);
const diagnoseVehicle = readFileSync(
  resolve(__dirname, "../../../supabase/functions/diagnose-vehicle/index.ts"),
  "utf8"
);

describe("Brief 5, Item 3 — agent-diagnose retired the dead match-rate readout", () => {
  it("contains no read of the repair_outcomes table", () => {
    expect(agentDiagnose).not.toMatch(/rest\/v1\/repair_outcomes/);
    expect(agentDiagnose).not.toMatch(/from\(["']repair_outcomes["']\)/);
  });

  it("contains no historical-data construction", () => {
    expect(agentDiagnose).not.toContain("historicalData");
    expect(agentDiagnose).not.toContain("historicalLine");
    expect(agentDiagnose).not.toContain("historical_total_cases");
    expect(agentDiagnose).not.toContain("historical_success_rate");
  });

  it("contains no network-rate line for the prompt", () => {
    expect(agentDiagnose).not.toContain("Historical network data");
    expect(agentDiagnose).not.toContain("assessment match rate");
    expect(agentDiagnose).not.toContain("success statistic");
  });

  it("records the retirement and its reason in the source", () => {
    expect(agentDiagnose).toContain("RETIRED");
    expect(agentDiagnose).toContain("Brief 5, Item 3");
  });
});

describe("Brief 5, Item 2 — diagnose-vehicle carries owner codes into the prompt", () => {
  it("accepts codes on the symptom payload", () => {
    expect(diagnoseVehicle).toMatch(/codes\?: string\[\]/);
  });

  it("includes the codes in the user message the model reasons over", () => {
    expect(diagnoseVehicle).toContain("Fault codes reported by the owner");
    expect(diagnoseVehicle).toMatch(/symptom\.codes\?\.length/);
  });
});
