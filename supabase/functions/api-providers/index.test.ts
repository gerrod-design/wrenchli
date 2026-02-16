import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const TEST_API_KEY = "wrli_e2e_providers_test";
const BASE = `${SUPABASE_URL}/functions/v1/api-providers`;

Deno.test("providers returns results for Warren ZIP", async () => {
  const res = await fetch(`${BASE}?location=48091`, {
    headers: { "x-api-key": TEST_API_KEY, apikey: ANON_KEY },
  });
  const body = await res.text();
  assertEquals(res.status, 200, `Expected 200, got ${res.status}: ${body}`);
  const data = JSON.parse(body);
  assertEquals(data.providers.length > 0, true, "Should have providers");
  assertEquals(data.search_params.location, "48091");
  assertEquals(data.search_params.service_type, "general");
  assertEquals(typeof data.wrenchli_services.compare_quotes_url, "string");
  // All returned providers should be Warren
  for (const p of data.providers) {
    assertEquals(p.address.includes("Warren"), true, `Expected Warren address: ${p.address}`);
  }
  console.log("✅ Warren:", data.providers.length, "providers");
});

Deno.test("providers filters by price_range=budget", async () => {
  const res = await fetch(`${BASE}?location=48104&price_range=budget`, {
    headers: { "x-api-key": TEST_API_KEY, apikey: ANON_KEY },
  });
  const body = await res.text();
  assertEquals(res.status, 200);
  const data = JSON.parse(body);
  for (const p of data.providers) {
    assertEquals(p.price_tier, "budget", `Expected budget tier: ${p.name}`);
  }
  console.log("✅ Budget filter:", data.providers.length, "providers");
});

Deno.test("providers prioritizes European specialists for BMW", async () => {
  const res = await fetch(`${BASE}?location=Birmingham&vehicle_make=BMW`, {
    headers: { "x-api-key": TEST_API_KEY, apikey: ANON_KEY },
  });
  const body = await res.text();
  assertEquals(res.status, 200);
  const data = JSON.parse(body);
  assertEquals(data.providers.length > 0, true);
  const first = data.providers[0];
  const isSpecialist = first.specialties.includes("european") || first.specialties.includes("luxury");
  assertEquals(isSpecialist, true, `First provider should be specialist: ${first.name}`);
  console.log("✅ BMW specialist:", first.name);
});

Deno.test("providers returns 400 for missing location", async () => {
  const res = await fetch(BASE, {
    headers: { "x-api-key": TEST_API_KEY, apikey: ANON_KEY },
  });
  const body = await res.text();
  assertEquals(res.status, 400);
  console.log("✅ Validation:", body);
});

Deno.test("providers rejects missing API key", async () => {
  const res = await fetch(`${BASE}?location=48091`, {
    headers: { apikey: ANON_KEY },
  });
  const body = await res.text();
  assertEquals(res.status, 401);
  console.log("✅ Auth guard:", body);
});

Deno.test("providers rejects POST method", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "x-api-key": TEST_API_KEY, apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ location: "48091" }),
  });
  const body = await res.text();
  assertEquals(res.status, 405);
  console.log("✅ Method guard:", body);
});
