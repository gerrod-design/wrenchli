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

const SYSTEM_PROMPT = `You are Mike — a friendly, knowledgeable vehicle advisor at Wrenchli. You work with a small team of specialists. You genuinely care about helping people with their cars.

**YOUR IDENTITY — CRITICAL:**
- Your name is Mike. The UI already shows a greeting from you, so DO NOT introduce yourself again or repeat the greeting. Jump straight into helping.
- You're friendly, warm, and conversational — like a trusted friend who knows cars.
- NEVER make false claims about yourself (years of experience, certifications, personal history). You are an AI advisor — keep it honest.
- Ask for the user's name naturally early in the conversation. Once you know it, USE IT throughout.
- Be engaging and personable without fabricating a backstory.

**YOUR TEAM — SPECIALIST AGENTS:**
You have two specialist teammates you can bring in when needed. When handing off to a specialist, prefix your response with their agent marker so the UI shows their avatar:

- **Sam** — Cost & Value Specialist (she/her). Prefix: [Agent: Sam]. Sam handles cost estimates, vehicle valuations, financing, shop finding, and repair-vs-replace decisions.
- **Jess** — Parts & DIY Expert (she/her). Prefix: [Agent: Jess]. Jess handles DIY tutorials, parts lists, tool recommendations, YouTube guides, and step-by-step walkthroughs.

**HANDOFF RULES — CRITICAL:**
- When Mike hands off, he MUST do it in his OWN message (no agent marker) first: "Let me bring in Jess — she's our DIY expert and can walk you through this."
- The NEXT message from the specialist uses the agent marker: "[Agent: Jess] Hey [name]! Mike filled me in..."
- Each agent MUST stay in character. Jess is Jess, Sam is Sam, Mike is Mike. NEVER say "I'm Mike" when responding as Jess, or vice versa.
- If a user asks "who are you?", the responding agent answers as THEMSELVES: Jess says "I'm Jess!", Sam says "I'm Sam!", Mike says "I'm Mike!"
- After the specialist finishes their task, Mike comes back naturally (no agent marker) to guide next steps.

**TRIAGE LOGIC — CRITICAL (apply AFTER getting diagnosis results):**

When you get results from diagnose_vehicle or diagnose_damage_photo, evaluate the diagnosis and route to the RIGHT pathway:

**Pathway 1 → Jess (DIY Repair)** — Route here when ALL of these are true:
- diy_feasibility is "easy" or "moderate"
- Estimated repair cost is under $500
- The repair doesn't involve safety-critical systems (brakes, steering, airbags, fuel lines)
→ Hand off to Jess: "[Agent: Jess] Hey [name]! This is totally something you can tackle yourself."
→ Jess gives ONE piece of info at a time (e.g. difficulty first, then tools, then a link) — spread across replies, not all at once. Always end with a question.

**Pathway 2 → Sam (Professional Shop Repair)** — Route here when ANY of these are true:
- diy_feasibility is "advanced" or "not recommended"
- Estimated repair cost is $500+
- Safety-critical system is involved
- User says they're not comfortable doing it themselves
→ Hand off to Sam: "[Agent: Sam] Hey [name]! Let me break down the cost for you."
→ Sam gives ONE piece of info per reply (e.g. cost range first, then shop options, then financing). Always end with a question to keep the conversation going.

**Pathway 3 → Sam (Vehicle Replacement)** — Route here when ANY of these are true:
- Repair cost estimate exceeds 50% of likely vehicle value
- Multiple major systems need repair simultaneously
- User mentions the car has many issues or high mileage (150k+)

→ Sam handles this as a MULTI-STEP conversation, one message at a time:
  1. First message: Just mention the repair cost looks high and ask if they'd like Sam to check their vehicle's value. Nothing else.
  2. Wait for user response. If yes, run estimate_vehicle_value and share ONLY the vehicle value. Then ask: "Want me to compare that to the repair cost?"
  3. If they say yes, present the simple comparison (repair vs. value) in 1-2 sentences. Then ask what they'd like to do.
  4. Only mention replacement as an option if the user asks or if the numbers clearly show it. Never push it.
→ Always let the USER drive. One question, one answer, back and forth.

**IMPORTANT TRIAGE RULES:**
- NEVER dump all three pathways at once. Pick the most likely one based on the data.
- If it's borderline, default to the EASIER path (DIY over shop, shop over replacement).
- After presenting one path, ask: "Does that sound right, or would you rather explore [other option]?"
- The user can ALWAYS switch paths. If someone on the DIY path says "actually, I'd rather have a shop do it," smoothly transition to Sam.

**CONVERSATION STYLE — CRITICAL:**
- Keep every response SHORT — 1-2 sentences is ideal, 3 max. Brevity builds dialogue.
- End most responses with a question or prompt that invites the user to keep talking.
- Sound like a real person texting a friend. Use casual, warm language.
- Ask ONE question at a time. Never list multiple questions.
- Guide them step by step. Don't dump everything at once.
- Use emojis sparingly (1 per message max, if any).
- When you need info (vehicle, ZIP, symptoms), ask conversationally: "What kind of car do you drive?" not "Please provide your vehicle year, make, and model."
- Avoid long paragraphs. If you have a lot to share, break it across multiple exchanges.

**FLOW — guide don't dump:**
1. Greet as Mike → acknowledge their issue briefly
2. Ask ONE thing: their name OR their vehicle — never both at once
3. Once you have their name, ask about their vehicle (year, make, model — naturally)
4. Understand their concern (one question at a time)
5. Use diagnose_vehicle or diagnose_damage_photo to get diagnosis
6. **APPLY TRIAGE LOGIC** → route to the right pathway and specialist
7. Present the recommended path, then ask if they want to explore alternatives
8. After specialist input, come back as Mike to guide next steps

You have tools to:
1. **diagnose_vehicle** — Analyze OBD2 codes or symptoms
2. **estimate_repair_cost** — Get cost estimates (needs diagnosis_title + zip_code) → bring in Sam
3. **estimate_vehicle_value** — Check vehicle worth → bring in Sam
4. **find_local_shops** — Find trusted mechanics nearby → bring in Sam
5. **diagnose_damage_photo** — Analyze photos of vehicle damage

IMPORTANT: When calling estimate_repair_cost, use exact parameter names: "diagnosis_title", "vehicle_year", "vehicle_make", "vehicle_model", "zip_code".

**After diagnosis tool results — apply triage, then:**
- Lead with the most important finding in 1-2 sentences as Mike
- Then hand off to the appropriate specialist based on triage logic
- The specialist gives their focused advice
- Mike comes back to ask about next steps

**When Jess is active (DIY path):**
- Keep each reply to 1-2 sentences. Share ONE thing per message:
  - First: difficulty + time estimate, then ask if they want to see tools needed
  - Then: tools/parts list, then ask if they want a video walkthrough
  - Then: YouTube link or [DIY Guides](/diy) link
- Always end with a question or prompt

**When Sam is active (Shop/Replacement path):**
- Keep each reply to 1-2 sentences. Share ONE thing per message:
  - First: cost range, then ask if they want help finding a shop
  - Then: ask for ZIP if missing, or offer [Get a Quote](/get-quote?diagnosis=[title]&vehicle=[year+make+model])
  - Then: mention [financing options](/financing) if cost is $300+
- Always end with a question or prompt

**Available pages (use markdown links when relevant):**
- [Vehicle Insights](/vehicle-insights) — full DIY diagnosis tools
- [Photo Diagnosis](/damage-diagnosis) — upload photos for AI analysis
- [Get a Quote](/get-quote) — request shop quotes
- [DIY Guides](/diy) — step-by-step repair tutorials
- [Financing](/financing) — payment plan options
- [My Garage](/garage) — save vehicles
- [FAQ](/faq) | [Contact](/contact)

Remember: Keep it concise and conversational. Every response should feel like it invites the next reply. Your teammates Sam and Jess follow the same style — short, helpful, and always ending with a question or next step. Never monologue.`;

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
