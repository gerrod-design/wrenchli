const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const FUNCTIONS_BASE = Deno.env.get("SUPABASE_URL") + "/functions/v1";

// ── Tool definitions the AI model can call ──
const tools = [
  {
    type: "function" as const,
    function: {
      name: "diagnose_vehicle",
      description:
        "Diagnose a vehicle issue using OBD2 codes or symptom descriptions. Returns structured diagnosis with urgency, causes, costs, and DIY feasibility.",
      parameters: {
        type: "object",
        properties: {
          codes: { type: "string", description: "OBD2 diagnostic trouble codes, e.g. 'P0420 P0171'" },
          symptom: { type: "string", description: "Plain-language symptom description, e.g. 'car makes grinding noise when braking'" },
          year: { type: "string", description: "Vehicle year, e.g. '2018'" },
          make: { type: "string", description: "Vehicle make, e.g. 'Honda'" },
          model: { type: "string", description: "Vehicle model, e.g. 'Accord'" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "estimate_repair_cost",
      description:
        "Estimate professional repair costs for a diagnosed issue. Requires a diagnosis title and ZIP code. Returns cost range, parts/labor breakdown, and regional notes.",
      parameters: {
        type: "object",
        properties: {
          diagnosis_title: { type: "string", description: "The repair/diagnosis title, e.g. 'Worn Brake Pads'" },
          diagnosis_code: { type: "string", description: "DTC code if applicable" },
          vehicle_year: { type: "string" },
          vehicle_make: { type: "string" },
          vehicle_model: { type: "string" },
          zip_code: { type: "string", description: "Customer ZIP code for regional pricing" },
        },
        required: ["diagnosis_title", "zip_code"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "estimate_vehicle_value",
      description:
        "Estimate the current fair market value of a vehicle. Returns private-party, trade-in, and dealer retail ranges.",
      parameters: {
        type: "object",
        properties: {
          year: { type: "number", description: "Vehicle year" },
          make: { type: "string" },
          model: { type: "string" },
          trim: { type: "string" },
          mileage: { type: "number", description: "Current mileage" },
          zipCode: { type: "string" },
          condition: { type: "string", description: "Vehicle condition: excellent, good, average, fair, poor" },
        },
        required: ["year", "make", "model", "mileage"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "find_local_shops",
      description:
        "Find trusted local auto repair shops near a location. Returns shop names, ratings, specialties, and pricing tiers.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "ZIP code or city name" },
          service_type: { type: "string", description: "Type of service needed, e.g. 'brakes', 'oil change', 'general'" },
          vehicle_make: { type: "string", description: "Vehicle make for specialty matching" },
        },
        required: ["location"],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are Wrenchli's friendly AI assistant with access to powerful automotive tools. Wrenchli connects vehicle owners with trusted local auto repair shops.

You have tools to:
1. **diagnose_vehicle** — Analyze OBD2 codes or symptoms to identify car problems
2. **estimate_repair_cost** — Get cost estimates for repairs (needs a diagnosis + ZIP code)
3. **estimate_vehicle_value** — Check what a vehicle is worth
4. **find_local_shops** — Find trusted mechanics nearby

**When to use tools:**
- User describes a car problem, noise, warning light, or DTC code → use diagnose_vehicle
- User asks "how much will it cost to fix…" → use estimate_repair_cost (ask for ZIP if not provided)
- User asks "what's my car worth" or "should I repair or replace" → use estimate_vehicle_value
- User asks for shops, mechanics, or where to get service → use find_local_shops

**After getting tool results, always:**
- Summarize the key findings in plain language
- Include relevant links to Wrenchli pages for next steps

**Available pages (use markdown links):**
- [Vehicle Insights / DIY Diagnosis](/vehicle-insights) — enter symptoms or codes
- [Get a Quote](/get-quote) — request repair quotes from local shops
- [My Garage](/garage) — save and manage vehicles
- [For Car Owners](/for-car-owners) — how Wrenchli helps owners
- [For Repair Shops](/for-shops) — info for shops wanting to join
- [About Us](/about) | [FAQ](/faq) | [Contact](/contact)

Keep answers concise, helpful, and friendly. If you can answer without a tool (general advice, navigation), just answer directly. If you don't know something specific, suggest the [Contact page](/contact).`;

// ── Execute a tool call by hitting the corresponding edge function ──
async function executeTool(
  name: string,
  args: Record<string, unknown>,
  anonKey: string,
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${anonKey}`,
  };

  try {
    let resp: Response;

    switch (name) {
      case "diagnose_vehicle":
        resp = await fetch(`${FUNCTIONS_BASE}/diagnose`, {
          method: "POST",
          headers,
          body: JSON.stringify(args),
        });
        break;

      case "estimate_repair_cost":
        resp = await fetch(`${FUNCTIONS_BASE}/estimate-repair`, {
          method: "POST",
          headers,
          body: JSON.stringify(args),
        });
        break;

      case "estimate_vehicle_value":
        resp = await fetch(`${FUNCTIONS_BASE}/estimate-vehicle-value`, {
          method: "POST",
          headers,
          body: JSON.stringify(args),
        });
        break;

      case "find_local_shops": {
        const params = new URLSearchParams();
        if (args.location) params.set("location", String(args.location));
        if (args.service_type) params.set("service_type", String(args.service_type));
        if (args.vehicle_make) params.set("vehicle_make", String(args.vehicle_make));
        // Call the internal provider-search directly (no API key needed for internal call)
        // We call the diagnose-style internal function instead of the api-providers which requires x-api-key
        resp = await fetch(`${FUNCTIONS_BASE}/vehicle-search?${params}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${anonKey}` },
        });
        break;
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }

    const data = await resp.json();
    return JSON.stringify(data);
  } catch (err) {
    console.error(`Tool ${name} failed:`, err);
    return JSON.stringify({ error: `Tool ${name} failed: ${err instanceof Error ? err.message : "unknown"}` });
  }
}

// ── Validate incoming messages ──
function validateMessages(rawMessages: unknown[]): { role: string; content: string }[] | Response {
  if (rawMessages.length === 0 || rawMessages.length > MAX_MESSAGES) {
    return new Response(
      JSON.stringify({ error: `Messages array must have 1-${MAX_MESSAGES} items` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const validRoles = new Set(["user", "assistant"]);
  const messages: { role: string; content: string }[] = [];

  for (const msg of rawMessages) {
    if (
      !msg || typeof msg !== "object" ||
      typeof (msg as Record<string, unknown>).role !== "string" ||
      typeof (msg as Record<string, unknown>).content !== "string"
    ) {
      return new Response(
        JSON.stringify({ error: "Each message must have role and content strings" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { role, content } = msg as { role: string; content: string };
    if (!validRoles.has(role)) {
      return new Response(
        JSON.stringify({ error: "Message role must be 'user' or 'assistant'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (content.length === 0 || content.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message content must be 1-${MAX_CONTENT_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    messages.push({ role, content });
  }
  return messages;
}

// ── Main handler ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!body || typeof body !== "object" || !Array.isArray((body as Record<string, unknown>).messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const validated = validateMessages((body as Record<string, unknown>).messages as unknown[]);
    if (validated instanceof Response) return validated;
    const messages = validated;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    // Build conversation for the AI
    const aiMessages: Array<Record<string, unknown>> = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // ── Turn 1: Ask model (may produce tool calls) ──
    const turn1Resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: aiMessages,
        tools,
        tool_choice: "auto",
      }),
    });

    if (!turn1Resp.ok) {
      const status = turn1Resp.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await turn1Resp.text();
      console.error("AI gateway error (turn 1):", status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const turn1Data = await turn1Resp.json();
    const assistantMsg = turn1Data.choices?.[0]?.message;

    // If no tool calls, stream the response directly (re-request with stream: true)
    if (!assistantMsg?.tool_calls || assistantMsg.tool_calls.length === 0) {
      // Simple case: no tools needed — re-request with streaming
      const streamResp = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: aiMessages,
          stream: true,
        }),
      });

      if (!streamResp.ok) {
        return new Response(
          JSON.stringify({ error: "AI service error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(streamResp.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ── Execute tool calls in parallel ──
    const toolCalls = assistantMsg.tool_calls;
    const toolResults = await Promise.all(
      toolCalls.map(async (tc: { id: string; function: { name: string; arguments: string } }) => {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = {};
        }
        const result = await executeTool(tc.function.name, args, anonKey);
        return {
          role: "tool" as const,
          tool_call_id: tc.id,
          content: result,
        };
      }),
    );

    // ── Turn 2: Send tool results back, stream final answer ──
    const turn2Messages = [
      ...aiMessages,
      assistantMsg,
      ...toolResults,
    ];

    const turn2Resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: turn2Messages,
        stream: true,
      }),
    });

    if (!turn2Resp.ok) {
      const t = await turn2Resp.text();
      console.error("AI gateway error (turn 2):", turn2Resp.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(turn2Resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
