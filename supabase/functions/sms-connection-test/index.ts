import { corsHeaders } from "@supabase/supabase-js/cors";

// Tests SMS connection credentials during shop onboarding

interface TestRequest {
  provider: string;
  api_key: string;
  location_id?: string;
}

async function testTekmetric(apiKey: string, locationId?: string): Promise<{ connected: boolean; shop_name: string; error?: string }> {
  try {
    const url = locationId
      ? `https://shop.tekmetric.com/api/v1/shops/${locationId}`
      : "https://shop.tekmetric.com/api/v1/shops";
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      return { connected: false, shop_name: "", error: `Authentication failed (${res.status}). Check your API key.` };
    }
    const data = await res.json();
    const shopName = locationId
      ? data?.name || data?.shopName || "Connected"
      : data?.content?.[0]?.name || "Connected";
    return { connected: true, shop_name: shopName };
  } catch (err: unknown) {
    return { connected: false, shop_name: "", error: err instanceof Error ? err.message : "Network error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { provider, api_key, location_id }: TestRequest = await req.json();
    if (!provider || !api_key) {
      return new Response(JSON.stringify({ error: "provider and api_key required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: { connected: boolean; shop_name: string; error?: string };

    switch (provider) {
      case "tekmetric":
        result = await testTekmetric(api_key, location_id);
        break;
      case "mitchell1":
      case "autoleap":
      case "shopware":
      case "protractor":
      case "rowriter":
      case "fullbay":
      case "napatracs":
        result = { connected: false, shop_name: "", error: `${provider} integration coming soon. Use CSV option for now.` };
        break;
      case "csv":
        result = { connected: true, shop_name: "CSV Export Mode" };
        break;
      default:
        result = { connected: false, shop_name: "", error: `Unknown provider: ${provider}` };
    }

    return new Response(JSON.stringify(result), {
      status: result.connected ? 200 : 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
