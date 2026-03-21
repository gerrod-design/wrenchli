import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 8000;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-2.0-flash-exp";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const FUNCTIONS_BASE = Deno.env.get("SUPABASE_URL") + "/functions/v1";

const tools = [
  {
    name: "diagnose_vehicle",
    description:
      "Diagnose a vehicle issue using OBD2 codes or symptom descriptions. Returns structured diagnosis with urgency, causes, costs, and DIY feasibility.",
    parameters: {
      type: "OBJECT",
      properties: {
        codes: { type: "STRING", description: "OBD2 diagnostic trouble codes, e.g. 'P0420 P0171'" },
        symptom: { type: "STRING", description: "Plain-language symptom description" },
        year: { type: "STRING", description: "Vehicle year" },
        make: { type: "STRING", description: "Vehicle make" },
        model: { type: "STRING", description: "Vehicle model" },
      },
      required: [],
    },
  },
  {
    name: "estimate_repair_cost",
    description:
      "Estimate professional repair costs. Returns cost range, parts/labor breakdown, and regional notes.",
    parameters: {
      type: "OBJECT",
      properties: {
        diagnosis_title: { type: "STRING", description: "The repair/diagnosis title (REQUIRED)" },
        diagnosis_code: { type: "STRING", description: "DTC code if applicable" },
        vehicle_year: { type: "STRING", description: "Vehicle year" },
        vehicle_make: { type: "STRING", description: "Vehicle make" },
        vehicle_model: { type: "STRING", description: "Vehicle model" },
        zip_code: { type: "STRING", description: "Customer ZIP code (REQUIRED)" },
      },
      required: ["diagnosis_title", "zip_code"],
    },
  },
  {
    name: "estimate_vehicle_value",
    description:
      "Estimate current fair market value. Returns private-party, trade-in, and dealer retail ranges.",
    parameters: {
      type: "OBJECT",
      properties: {
        year: { type: "NUMBER", description: "Vehicle year" },
        make: { type: "STRING", description: "Vehicle make" },
        model: { type: "STRING", description: "Vehicle model" },
        trim: { type: "STRING", description: "Vehicle trim" },
        mileage: { type: "NUMBER", description: "Current mileage" },
        zipCode: { type: "STRING", description: "ZIP code" },
        condition: { type: "STRING", description: "Condition: excellent, good, average, fair, poor" },
      },
      required: ["year", "make", "model", "mileage"],
    },
  },
  {
    name: "find_local_shops",
    description:
      "Find trusted local auto repair shops near a location.",
    parameters: {
      type: "OBJECT",
      properties: {
        location: { type: "STRING", description: "ZIP code or city name" },
        service_type: { type: "STRING", description: "Service needed" },
        vehicle_make: { type: "STRING", description: "Vehicle make for specialty matching" },
      },
      required: ["location"],
    },
  },
];

const SYSTEM_INSTRUCTION = `You are Wrenchli's friendly AI assistant with access to powerful automotive tools. Wrenchli connects vehicle owners with trusted local auto repair shops.

You have tools to:
1. **diagnose_vehicle** — Analyze OBD2 codes or symptoms to identify car problems
2. **estimate_repair_cost** — Get cost estimates for repairs (needs diagnosis_title + zip_code)
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
- [Vehicle Insights / DIY Diagnosis](/vehicle-insights)
- [Get a Quote](/get-quote)
- [My Garage](/garage)
- [For Car Owners](/for-car-owners)
- [For Repair Shops](/for-shops)
- [About Us](/about) | [FAQ](/faq) | [Contact](/contact)

Keep answers concise, helpful, and friendly.`;

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

function validateMessages(rawMessages: unknown[], secHeaders: Record<string, string>): { role: string; content: string }[] | Response {
  if (rawMessages.length === 0 || rawMessages.length > MAX_MESSAGES) {
    return new Response(
      JSON.stringify({ error: `Messages array must have 1-${MAX_MESSAGES} items` }),
      { status: 400, headers: { ...secHeaders, "Content-Type": "application/json" } },
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
        { status: 400, headers: { ...secHeaders, "Content-Type": "application/json" } },
      );
    }
    const { role, content } = msg as { role: string; content: string };
    if (!validRoles.has(role)) {
      return new Response(
        JSON.stringify({ error: "Message role must be 'user' or 'assistant'" }),
        { status: 400, headers: { ...secHeaders, "Content-Type": "application/json" } },
      );
    }
    if (content.length === 0 || content.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message content must be 1-${MAX_CONTENT_LENGTH} characters` }),
        { status: 400, headers: { ...secHeaders, "Content-Type": "application/json" } },
      );
    }
    messages.push({ role, content });
  }
  return messages;
}

function toGeminiMessages(messages: { role: string; content: string }[]) {
  return messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  // Rate limiting
  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.STRICT);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
      {
        status: 429,
        headers: {
          ...securityHeaders,
          ...getRateLimitHeaders(RATE_LIMITS.STRICT.maxRequests, rateResult.remaining, rateResult.resetTime),
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

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

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const geminiMessages = toGeminiMessages(messages);

    const turn1Body = {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: geminiMessages,
      tools: [{ functionDeclarations: tools }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    const turn1Resp = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(turn1Body),
    });

    if (!turn1Resp.ok) {
      const t = await turn1Resp.text();
      console.error("Gemini API error (turn 1):", turn1Resp.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    const turn1Data = await turn1Resp.json();
    const candidate = turn1Data.candidates?.[0];
    const content = candidate?.content;

    const functionCalls = content?.parts?.filter((p: { functionCall?: unknown }) => p.functionCall) || [];

    if (functionCalls.length === 0) {
      const textParts = content?.parts?.filter((p: { text?: string }) => p.text) || [];
      const text = textParts.map((p: { text: string }) => p.text).join("") || 
                   "I'm sorry, I couldn't generate a response. Please try again.";
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const chunk = JSON.stringify({
            choices: [{ delta: { role: "assistant", content: text } }],
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

    console.log("Function calls:", JSON.stringify(functionCalls.map((fc: { functionCall: { name: string } }) => fc.functionCall.name)));

    const functionResponses = await Promise.all(
      functionCalls.map(async (fc: { functionCall: { name: string; args: Record<string, unknown> } }) => {
        const { name, args } = fc.functionCall;
        const result = await executeTool(name, args || {}, anonKey);
        return {
          functionResponse: {
            name,
            response: { result },
          },
        };
      }),
    );

    const turn2Contents = [
      ...geminiMessages,
      { role: "model", parts: functionCalls },
      { role: "user", parts: functionResponses },
    ];

    const turn2Body = {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: turn2Contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    const turn2Resp = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(turn2Body),
    });

    if (!turn2Resp.ok) {
      const t = await turn2Resp.text();
      console.error("Gemini API error (turn 2):", turn2Resp.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    const turn2Data = await turn2Resp.json();
    const finalCandidate = turn2Data.candidates?.[0];
    const finalParts = finalCandidate?.content?.parts?.filter((p: { text?: string }) => p.text) || [];
    const finalText = finalParts.map((p: { text: string }) => p.text).join("") || 
                      "I couldn't process the results. Please try again.";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const chunk = JSON.stringify({
          choices: [{ delta: { role: "assistant", content: finalText } }],
        });
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...securityHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-gemini error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } },
    );
  }
});
