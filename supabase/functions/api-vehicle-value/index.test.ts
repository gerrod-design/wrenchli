import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

// Pre-seeded test key: "wrli_e2e_vehicle_value_test"
// Its SHA-256 hash is inserted into api_keys before running tests
const TEST_API_KEY = "wrli_e2e_vehicle_value_test";

Deno.test("vehicle-value returns valuation with repair analysis", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/api-vehicle-value`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TEST_API_KEY,
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({
      vehicle: { year: 2020, make: "Toyota", model: "Camry", mileage: 45000, zipCode: "90210" },
      repair_cost: 1500,
    }),
  });

  const body = await res.text();
  assertEquals(res.status, 200, `Expected 200, got ${res.status}: ${body}`);

  const data = JSON.parse(body);
  assertEquals(typeof data.current_value, "number");
  assertEquals(data.current_value > 0, true, "Value should be positive");
  assertEquals(typeof data.confidence, "number");
  assertEquals(typeof data.value_breakdown.base_msrp, "number");
  assertEquals(data.value_breakdown.base_msrp, 24095); // Toyota Camry 2020
  assertEquals(typeof data.market_analysis.trend, "string");
  assertEquals(typeof data.market_analysis.trade_vs_repair.repair_percentage, "number");
  assertEquals(typeof data.market_analysis.trade_vs_repair.recommendation, "string");
  assertEquals(typeof data.wrenchli_services.detailed_analysis_url, "string");

  console.log("✅ Full response:", JSON.stringify(data, null, 2));
});

Deno.test("vehicle-value rejects missing mileage", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/api-vehicle-value`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TEST_API_KEY,
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({ vehicle: { year: 2020, make: "Toyota", model: "Camry" } }),
  });
  const body = await res.text();
  assertEquals(res.status, 400, `Expected 400, got ${res.status}`);
  console.log("✅ Validation:", body);
});

Deno.test("vehicle-value without repair_cost omits trade analysis", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/api-vehicle-value`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TEST_API_KEY,
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({ vehicle: { year: 2018, make: "Honda", model: "Civic", mileage: 85000 } }),
  });
  const body = await res.text();
  assertEquals(res.status, 200);
  const data = JSON.parse(body);
  assertEquals(data.market_analysis.trade_vs_repair, undefined);
  assertEquals(data.current_value > 0, true);
  console.log("✅ No-repair:", JSON.stringify(data, null, 2));
});

Deno.test("vehicle-value rejects missing API key", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/api-vehicle-value`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": ANON_KEY },
    body: JSON.stringify({ vehicle: { year: 2020, make: "Toyota", model: "Camry", mileage: 50000 } }),
  });
  const body = await res.text();
  assertEquals(res.status, 401);
  console.log("✅ Auth guard:", body);
});
