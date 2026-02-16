import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const TEST_API_KEY = "wrli_e2e_providers_test";
const BASE = `${SUPABASE_URL}/functions/v1/api-providers`;

const headers = { "x-api-key": TEST_API_KEY, apikey: ANON_KEY };

/* ── Helper ── */
async function fetchProviders(query: string) {
  const res = await fetch(`${BASE}?${query}`, { headers });
  const body = await res.text();
  return { res, body, data: JSON.parse(body) };
}

/* ══════════════════════════════════════════
   Location coverage — all 13 metro areas
   ══════════════════════════════════════════ */

const locationTests: { label: string; zip: string; city: string; minCount: number }[] = [
  { label: "Warren",           zip: "48091", city: "Warren",           minCount: 2 },
  { label: "Birmingham",       zip: "48009", city: "Birmingham",       minCount: 2 },
  { label: "Troy",             zip: "48084", city: "Troy",             minCount: 2 },
  { label: "Sterling Heights", zip: "48315", city: "Sterling Heights", minCount: 1 },
  { label: "Ann Arbor",        zip: "48104", city: "Ann Arbor",        minCount: 2 },
  { label: "Dearborn",         zip: "48124", city: "Dearborn",         minCount: 3 },
  { label: "Livonia",          zip: "48150", city: "Livonia",          minCount: 3 },
  { label: "Detroit",          zip: "48201", city: "Detroit",          minCount: 3 },
  { label: "Southfield",       zip: "48075", city: "Southfield",      minCount: 3 },
  { label: "Royal Oak",        zip: "48067", city: "Royal Oak",       minCount: 3 },
  { label: "Farmington Hills", zip: "48334", city: "Farmington Hills",minCount: 3 },
  { label: "Novi",             zip: "48375", city: "Novi",            minCount: 3 },
  { label: "Canton",           zip: "48187", city: "Canton",          minCount: 3 },
];

for (const t of locationTests) {
  Deno.test(`location: ${t.label} (${t.zip}) returns providers`, async () => {
    const { res, data } = await fetchProviders(`location=${t.zip}`);
    assertEquals(res.status, 200);
    assertEquals(data.providers.length >= t.minCount, true,
      `Expected ≥${t.minCount} providers for ${t.label}, got ${data.providers.length}`);
    for (const p of data.providers) {
      assertEquals(p.address.includes(t.city), true,
        `Expected ${t.city} address, got: ${p.address}`);
    }
    assertEquals(data.search_params.location, t.zip);
    console.log(`✅ ${t.label}: ${data.providers.length} providers`);
  });
}

/* ── City-name lookup (not just ZIP) ── */
Deno.test("location: city name 'Birmingham' works", async () => {
  const { res, data } = await fetchProviders("location=Birmingham");
  assertEquals(res.status, 200);
  assertEquals(data.providers.length >= 2, true);
  console.log(`✅ City name lookup: ${data.providers.length} providers`);
});

/* ══════════════════════════════════════
   Price tier filtering
   ══════════════════════════════════════ */

Deno.test("filter: price_range=budget returns only budget", async () => {
  const { res, data } = await fetchProviders("location=48124&price_range=budget");
  assertEquals(res.status, 200);
  for (const p of data.providers) {
    assertEquals(p.price_tier, "budget", `Expected budget: ${p.name}`);
  }
  console.log(`✅ Budget filter (Dearborn): ${data.providers.length} providers`);
});

Deno.test("filter: price_range=premium returns only premium", async () => {
  const { res, data } = await fetchProviders("location=48150&price_range=premium");
  assertEquals(res.status, 200);
  for (const p of data.providers) {
    assertEquals(p.price_tier, "premium", `Expected premium: ${p.name}`);
  }
  console.log(`✅ Premium filter (Livonia): ${data.providers.length} providers`);
});

Deno.test("filter: price_range=mid returns only mid", async () => {
  const { res, data } = await fetchProviders("location=48084&price_range=mid");
  assertEquals(res.status, 200);
  for (const p of data.providers) {
    assertEquals(p.price_tier, "mid", `Expected mid: ${p.name}`);
  }
  console.log(`✅ Mid filter (Troy): ${data.providers.length} providers`);
});

/* ══════════════════════════════════════
   Luxury vehicle sorting
   ══════════════════════════════════════ */

const luxuryTests = [
  { make: "BMW",          location: "48009", label: "Birmingham" },
  { make: "Audi",         location: "48334", label: "Farmington Hills" },
  { make: "Mercedes-Benz",location: "48075", label: "Southfield" },
];

for (const t of luxuryTests) {
  Deno.test(`luxury sort: ${t.make} in ${t.label} prioritizes specialist`, async () => {
    const { res, data } = await fetchProviders(`location=${t.location}&vehicle_make=${t.make}`);
    assertEquals(res.status, 200);
    assertEquals(data.providers.length > 0, true);
    const first = data.providers[0];
    const isSpecialist = first.specialties.includes("european") || first.specialties.includes("luxury");
    assertEquals(isSpecialist, true, `First provider should be specialist: ${first.name}`);
    console.log(`✅ ${t.make} specialist (${t.label}): ${first.name}`);
  });
}

/* ══════════════════════════════════════
   Validation & security guards
   ══════════════════════════════════════ */

Deno.test("validation: missing location returns 400", async () => {
  const res = await fetch(BASE, { headers });
  const body = await res.text();
  assertEquals(res.status, 400);
  console.log("✅ Validation:", body);
});

Deno.test("auth: missing API key returns 401", async () => {
  const res = await fetch(`${BASE}?location=48091`, {
    headers: { apikey: ANON_KEY },
  });
  const body = await res.text();
  assertEquals(res.status, 401);
  console.log("✅ Auth guard:", body);
});

Deno.test("method: POST returns 405", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ location: "48091" }),
  });
  const body = await res.text();
  assertEquals(res.status, 405);
  console.log("✅ Method guard:", body);
});

/* ── Response structure ── */
Deno.test("response: includes wrenchli_services links", async () => {
  const { data } = await fetchProviders("location=48091");
  assertEquals(typeof data.wrenchli_services.compare_quotes_url, "string");
  assertEquals(typeof data.wrenchli_services.book_service_url, "string");
  assertEquals(typeof data.wrenchli_services.get_more_options_url, "string");
  console.log("✅ Response structure verified");
});
