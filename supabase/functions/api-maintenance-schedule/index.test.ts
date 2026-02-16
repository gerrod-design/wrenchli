import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const TEST_API_KEY = "wrli_e2e_maint_schedule_test";

Deno.test("maintenance-schedule returns schedule with upcoming services", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/api-maintenance-schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TEST_API_KEY,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      vehicle: { make: "Toyota", model: "Camry", year: 2019, mileage: 47000 },
      last_services: [
        { type: "oil_change", mileage: 45000 },
        { type: "tire_rotation", mileage: 42000 },
      ],
    }),
  });

  const body = await res.text();
  assertEquals(res.status, 200, `Expected 200, got ${res.status}: ${body}`);

  const data = JSON.parse(body);
  assertEquals(typeof data.vehicle_summary.make, "string");
  assertEquals(data.vehicle_summary.mileage, 47000);
  assertEquals(Array.isArray(data.full_schedule), true);
  assertEquals(data.full_schedule.length > 0, true);
  assertEquals(Array.isArray(data.upcoming_services), true);
  assertEquals(typeof data.summary.total_items, "number");
  assertEquals(typeof data.summary.overdue_count, "number");
  assertEquals(typeof data.summary.estimated_total_cost_low, "number");
  console.log("✅ Full response:", JSON.stringify(data, null, 2));
});

Deno.test("maintenance-schedule adjusts for BMW", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/api-maintenance-schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TEST_API_KEY,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      vehicle: { make: "BMW", model: "3 Series", year: 2021, mileage: 30000 },
    }),
  });

  const body = await res.text();
  assertEquals(res.status, 200);

  const data = JSON.parse(body);
  const oil = data.full_schedule.find((s: any) => s.type === "oil_change");
  assertEquals(oil.interval_miles, 10000, "BMW oil interval should be 10k");
  assertEquals(oil.estimated_cost_low >= 80, true, "BMW oil cost should be higher");
  console.log("✅ BMW adjustments:", JSON.stringify(oil));
});

Deno.test("maintenance-schedule excludes EV items for Tesla", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/api-maintenance-schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TEST_API_KEY,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      vehicle: { make: "Tesla", model: "Model 3", year: 2022, mileage: 25000 },
    }),
  });

  const body = await res.text();
  assertEquals(res.status, 200);

  const data = JSON.parse(body);
  const types = data.full_schedule.map((s: any) => s.type);
  assertEquals(types.includes("oil_change"), false, "Tesla should not have oil_change");
  assertEquals(types.includes("spark_plugs"), false, "Tesla should not have spark_plugs");
  assertEquals(types.includes("serpentine_belt"), false, "Tesla should not have serpentine_belt");
  console.log("✅ Tesla EV schedule:", types);
});

Deno.test("maintenance-schedule rejects missing mileage", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/api-maintenance-schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TEST_API_KEY,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ vehicle: { make: "Toyota" } }),
  });
  const body = await res.text();
  assertEquals(res.status, 400, `Expected 400, got ${res.status}`);
  console.log("✅ Validation:", body);
});

Deno.test("maintenance-schedule rejects missing API key", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/api-maintenance-schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ vehicle: { make: "Toyota", mileage: 50000 } }),
  });
  const body = await res.text();
  assertEquals(res.status, 401);
  console.log("✅ Auth guard:", body);
});
