import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 8000;
const MAX_IMAGE_URLS = 5;
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const FUNCTIONS_BASE = Deno.env.get("SUPABASE_URL") + "/functions/v1";

// ── Tool definitions ──
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
          symptom: { type: "string", description: "Plain-language symptom description" },
          year: { type: "string", description: "Vehicle year" },
          make: { type: "string", description: "Vehicle make" },
          model: { type: "string", description: "Vehicle model" },
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
        "Estimate professional repair costs. Returns cost range, parts/labor breakdown, and regional notes.",
      parameters: {
        type: "object",
        properties: {
          diagnosis_title: { type: "string", description: "The repair/diagnosis title, e.g. 'Faulty Catalytic Converter' or 'Worn Brake Pads'. This field is REQUIRED." },
          diagnosis_code: { type: "string", description: "DTC code if applicable, e.g. 'P0420'" },
          vehicle_year: { type: "string", description: "Vehicle year, e.g. '2018'" },
          vehicle_make: { type: "string", description: "Vehicle make, e.g. 'Ford'" },
          vehicle_model: { type: "string", description: "Vehicle model, e.g. 'F-150'" },
          zip_code: { type: "string", description: "Customer ZIP code for regional pricing. REQUIRED." },
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
        "Estimate current fair market value. Returns private-party, trade-in, and dealer retail ranges.",
      parameters: {
        type: "object",
        properties: {
          year: { type: "number", description: "Vehicle year" },
          make: { type: "string", description: "Vehicle make" },
          model: { type: "string", description: "Vehicle model" },
          trim: { type: "string", description: "Vehicle trim" },
          mileage: { type: "number", description: "Current mileage" },
          zipCode: { type: "string", description: "ZIP code" },
          condition: { type: "string", description: "Condition: excellent, good, average, fair, poor" },
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
        "Find trusted local auto repair shops near a location.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "ZIP code or city name" },
          service_type: { type: "string", description: "Service needed, e.g. 'brakes', 'oil change'" },
          vehicle_make: { type: "string", description: "Vehicle make for specialty matching" },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "diagnose_damage_photo",
      description:
        "Analyze vehicle damage from photos. Returns damage type, severity, affected area, repair options with cost estimates, and safety concerns. Use when the user sends photos of vehicle damage.",
      parameters: {
        type: "object",
        properties: {
          image_urls: {
            type: "array",
            items: { type: "string" },
            description: "Array of image URLs showing vehicle damage",
          },
          vehicle_info: { type: "string", description: "Vehicle description, e.g. '2022 Jeep Grand Cherokee'" },
        },
        required: ["image_urls"],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are Wrenchli's friendly AI assistant with access to powerful automotive tools. Wrenchli connects vehicle owners with trusted local auto repair shops.

You have tools to:
1. **diagnose_vehicle** — Analyze OBD2 codes or symptoms to identify car problems
2. **estimate_repair_cost** — Get cost estimates for repairs (needs diagnosis_title + zip_code)
3. **estimate_vehicle_value** — Check what a vehicle is worth
4. **find_local_shops** — Find trusted mechanics nearby
5. **diagnose_damage_photo** — Analyze photos of vehicle damage to identify issues, severity, and repair options

IMPORTANT: When calling estimate_repair_cost, you MUST use the exact parameter names: "diagnosis_title" (not "diagnosis"), "vehicle_year" (not "year"), "vehicle_make" (not "make"), "vehicle_model" (not "model"), and "zip_code".

**When to use tools:**
- User describes a car problem, noise, warning light, or DTC code → use diagnose_vehicle
- User asks "how much will it cost to fix…" → use estimate_repair_cost (ask for ZIP if not provided)
- User asks "what's my car worth" or "should I repair or replace" → use estimate_vehicle_value
- User asks for shops, mechanics, or where to get service → use find_local_shops
- User sends photos of vehicle damage → use diagnose_damage_photo with the image URLs from the message
- You can call multiple tools at once if the question needs both diagnosis AND cost estimate.

**When user sends images:**
- Look at the user message content for image_url entries — these are photos the user attached
- Extract the URLs and pass them to diagnose_damage_photo
- If the user mentions their vehicle, also pass vehicle_info

**After getting tool results, always:**
- Summarize the key findings in plain language
- Include relevant links to Wrenchli pages for next steps

**DIY REPAIR SECTION — IMPORTANT:**
When presenting a diagnosis result, ALWAYS include a "Your Options" section with TWO paths:

1. **🔧 Fix It Yourself (DIY)** — Include when diy_feasibility is "easy" or "moderate":
   - State the difficulty level (🟢 Easy / 🟡 Moderate / 🔴 Advanced)
   - Show the DIY cost estimate
   - Provide YouTube tutorial search links. Build them as: https://www.youtube.com/results?search_query= followed by the URL-encoded search terms. Provide 2-3 variations:
     * "[repair title] [vehicle year make model] DIY tutorial"
     * "How to [repair action] [vehicle year make model]"
    - Provide parts ordering links for common retailers. Build search URLs:
      * AutoZone: https://www.autozone.com/searchresult?searchText=[part+vehicle]
      * O'Reilly: https://www.oreillyauto.com/shop/b/[part+vehicle]
      * Advance Auto Parts: https://shop.advanceautoparts.com/web/PartSearchCmd?storeId=10151&searchTerm=[part+vehicle]
      * RockAuto: https://www.rockauto.com/en/catalog/?a=[part+vehicle]
      * NAPA: https://www.napaonline.com/search?text=[part+vehicle]
      * Amazon: https://www.amazon.com/s?k=[part+vehicle]&tag=wrenchli20-20
   - Link to the full DIY diagnosis page: [🔧 Full DIY Guide & Tools](/vehicle-insights?symptom=[url-encoded-symptom]&year=[year]&make=[make]&model=[model])

2. **👨‍🔧 Get It Fixed Professionally** — Always include:
   - Show the professional repair cost estimate
   - Link to [Get a Quote](/get-quote?diagnosis=[title]&vehicle=[year+make+model])

For "advanced" difficulty repairs, show the professional path as RECOMMENDED and include a warning that DIY is risky. Still show the DIY info but note it requires specialized tools/experience.

**Available pages (use markdown links):**
- [Vehicle Insights / DIY Diagnosis](/vehicle-insights) — enter symptoms or codes for full DIY tools
- [Photo Damage Diagnosis](/damage-diagnosis) — upload photos for AI analysis
- [Get a Quote](/get-quote) — request repair quotes from local shops
- [My Garage](/garage) — save and manage vehicles
- [For Car Owners](/for-car-owners) — how Wrenchli helps owners
- [For Repair Shops](/for-shops) — info for shops wanting to join
- [About Us](/about) | [FAQ](/faq) | [Contact](/contact)

Keep answers concise, helpful, and friendly. If you can answer without a tool (general advice, navigation), just answer directly.`;

// ── Execute a tool call ──
async function executeTool(
  name: string,
  rawArgs: Record<string, unknown>,
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
          body: JSON.stringify(rawArgs),
        });
        break;

      case "estimate_repair_cost": {
        const args: Record<string, unknown> = { ...rawArgs };
        if (args.diagnosis && !args.diagnosis_title) {
          args.diagnosis_title = args.diagnosis;
          delete args.diagnosis;
        }
        if (args.year && !args.vehicle_year) {
          args.vehicle_year = String(args.year);
          delete args.year;
        }
        if (args.make && !args.vehicle_make) {
          args.vehicle_make = args.make;
          delete args.make;
        }
        if (args.model && !args.vehicle_model) {
          args.vehicle_model = args.model;
          delete args.model;
        }
        resp = await fetch(`${FUNCTIONS_BASE}/estimate-repair`, {
          method: "POST",
          headers,
          body: JSON.stringify(args),
        });
        break;
      }

      case "estimate_vehicle_value":
        resp = await fetch(`${FUNCTIONS_BASE}/estimate-vehicle-value`, {
          method: "POST",
          headers,
          body: JSON.stringify(rawArgs),
        });
        break;

      case "find_local_shops": {
        const params = new URLSearchParams();
        if (rawArgs.location) params.set("location", String(rawArgs.location));
        if (rawArgs.service_type) params.set("service_type", String(rawArgs.service_type));
        if (rawArgs.vehicle_make) params.set("vehicle_make", String(rawArgs.vehicle_make));
        resp = await fetch(`${FUNCTIONS_BASE}/vehicle-search?${params}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${anonKey}` },
        });
        break;
      }

      case "diagnose_damage_photo":
        resp = await fetch(`${FUNCTIONS_BASE}/diagnose-damage-photo`, {
          method: "POST",
          headers,
          body: JSON.stringify(rawArgs),
        });
        break;

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

// ── Build multimodal content for AI messages ──
type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

function buildAiMessages(
  messages: Array<{ role: string; content: string; image_urls?: string[] }>
): Array<Record<string, unknown>> {
  const aiMessages: Array<Record<string, unknown>> = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  for (const msg of messages) {
    if (msg.role === "user" && msg.image_urls && msg.image_urls.length > 0) {
      // Multimodal message with text + images
      const parts: ContentPart[] = [];
      if (msg.content) {
        parts.push({ type: "text", text: msg.content });
      }
      for (const url of msg.image_urls) {
        parts.push({ type: "image_url", image_url: { url } });
      }
      aiMessages.push({ role: "user", content: parts });
    } else {
      aiMessages.push({ role: msg.role, content: msg.content });
    }
  }

  return aiMessages;
}

// ── Validate incoming messages ──
function validateMessages(
  rawMessages: unknown[],
  securityHeaders: Record<string, string>,
): Array<{ role: string; content: string; image_urls?: string[] }> | Response {
  if (rawMessages.length === 0 || rawMessages.length > MAX_MESSAGES) {
    return new Response(
      JSON.stringify({ error: `Messages array must have 1-${MAX_MESSAGES} items` }),
      { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } },
    );
  }

  const validRoles = new Set(["user", "assistant"]);
  const messages: Array<{ role: string; content: string; image_urls?: string[] }> = [];

  for (const msg of rawMessages) {
    if (!msg || typeof msg !== "object") {
      return new Response(
        JSON.stringify({ error: "Each message must be an object" }),
        { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    const m = msg as Record<string, unknown>;
    const role = m.role;
    const content = m.content;
    const image_urls = m.image_urls;

    if (typeof role !== "string" || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Each message must have role and content strings" }),
        { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!validRoles.has(role)) {
      return new Response(
        JSON.stringify({ error: "Message role must be 'user' or 'assistant'" }),
        { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message content must be under ${MAX_CONTENT_LENGTH} characters` }),
        { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate image_urls if present
    let validatedImageUrls: string[] | undefined;
    if (Array.isArray(image_urls)) {
      validatedImageUrls = image_urls
        .filter((u): u is string => typeof u === "string" && u.startsWith("http"))
        .slice(0, MAX_IMAGE_URLS);
    }

    // Allow empty content if images are present
    if (content.length === 0 && (!validatedImageUrls || validatedImageUrls.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Message must have content or images" }),
        { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    messages.push({
      role,
      content,
      ...(validatedImageUrls && validatedImageUrls.length > 0 ? { image_urls: validatedImageUrls } : {}),
    });
  }
  return messages;
}

// ── Main handler ──
Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  // Rate limiting
  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.STRICT);
  const rlHeaders = getRateLimitHeaders(RATE_LIMITS.STRICT.maxRequests, rateResult.remaining, rateResult.resetTime);

  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
      { status: 429, headers: { ...securityHeaders, ...rlHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!body || typeof body !== "object" || !Array.isArray((body as Record<string, unknown>).messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    const validated = validateMessages((body as Record<string, unknown>).messages as unknown[], securityHeaders);
    if (validated instanceof Response) return validated;
    const messages = validated;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    const aiMessages = buildAiMessages(messages);

    // ── Turn 1: Non-streaming request (may produce tool calls) ──
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
        stream: false,
      }),
    });

    if (!turn1Resp.ok) {
      const status = turn1Resp.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...securityHeaders, "Content-Type": "application/json" } },
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...securityHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await turn1Resp.text();
      console.error("AI gateway error (turn 1):", status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    let turn1Data;
    try {
      turn1Data = await turn1Resp.json();
    } catch (e) {
      console.error("Failed to parse Turn 1 JSON:", e);
      return new Response(
        JSON.stringify({ error: "Failed to process AI response" }),
        { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    const assistantMsg = turn1Data.choices?.[0]?.message;

    // ── No tool calls: return content directly as SSE stream ──
    if (!assistantMsg?.tool_calls || assistantMsg.tool_calls.length === 0) {
      const content = assistantMsg?.content || "I'm sorry, I couldn't generate a response. Please try again.";
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const chunk = JSON.stringify({
            choices: [{ delta: { role: "assistant", content } }],
          });
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { ...securityHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ── Execute tool calls in parallel ──
    const toolCalls = assistantMsg.tool_calls;
    console.log("Tool calls:", JSON.stringify(toolCalls.map((tc: { function: { name: string } }) => tc.function.name)));

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

    // ── Turn 2: Send tool results, stream final text answer ──
    const cleanAssistantMsg = {
      role: "assistant",
      content: assistantMsg.content || "",
      tool_calls: assistantMsg.tool_calls,
    };

    const turn2Messages = [
      ...aiMessages,
      cleanAssistantMsg,
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
        { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(turn2Resp.body, {
      headers: { ...securityHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } },
    );
  }
});
