import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";
import { buildVehicleContext } from "./vehicle-known-issues.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const MAX_MESSAGES = 80;
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
  {
    type: "function" as const,
    function: {
      name: "search_repair_videos",
      description:
        "Search for vehicle-specific DIY repair tutorial videos on YouTube. Returns optimized search queries with direct YouTube links. Use this when recommending video tutorials for a specific vehicle and repair.",
      parameters: {
        type: "object",
        properties: {
          repair_title: { type: "string", description: "The repair or maintenance task, e.g. 'Replace Brake Pads'" },
          diagnosis_code: { type: "string", description: "DTC code if applicable, e.g. 'P0420'" },
          vehicle_year: { type: "string", description: "Vehicle year, e.g. '2018'" },
          vehicle_make: { type: "string", description: "Vehicle make, e.g. 'Honda'" },
          vehicle_model: { type: "string", description: "Vehicle model, e.g. 'Civic'" },
        },
        required: ["repair_title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "lookup_diy_tutorial",
      description:
        "Search Wrenchli's built-in DIY tutorial library for a matching step-by-step repair guide. Returns tutorial details with a direct link if found. Use this alongside search_repair_videos to offer both written guides and video tutorials.",
      parameters: {
        type: "object",
        properties: {
          repair_keyword: { type: "string", description: "Keyword(s) describing the repair, e.g. 'brake pads', 'oil change', 'battery'" },
        },
        required: ["repair_keyword"],
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
You have four specialist teammates. The UI uses agent markers to show different avatars:

- **Sam** — Cost & Value Specialist (she/her). Marker: [Agent: Sam]. Sam handles cost estimates, vehicle valuations, shop finding, and repair-vs-replace decisions.
- **Jess** — Parts & DIY Expert (she/her). Marker: [Agent: Jess]. Jess handles DIY tutorials, parts lists, tool recommendations, YouTube guides, and step-by-step walkthroughs.
- **Kai** — Finance Specialist (he/him). Marker: [Agent: Kai]. Kai handles financing options, payment plans, credit products, insurance claims, and collaborates with Priya on warranty guidance.
- **Priya** — Prevention Coach (she/her). Marker: [Agent: Priya]. Priya handles preventive maintenance plans, common vehicle issues by make/model/year, maintenance schedules, and collaborates with Kai on warranty/extended warranty options.

**HANDOFF RULES — ABSOLUTELY CRITICAL:**
- A handoff requires TWO SEPARATE responses across two turns. You CANNOT do both in one response.
- FIRST RESPONSE (this turn): Mike announces the handoff with NO agent marker. Example: "This sounds like a great DIY project — let me bring in Jess, she can walk you through it." STOP HERE. Do not include Jess's response.
- SECOND RESPONSE (next turn, after the user replies or acknowledges): Start with the agent marker. Example: "[Agent: Jess] Hey [name]! Ready to get started? First, do you have a socket set handy?"
- NEVER combine Mike's handoff announcement and a specialist's response in the same message. This is the #1 most important rule.
- If the user's message naturally triggers a handoff AND needs a specialist answer, ONLY do Mike's handoff announcement. The specialist responds next turn.
- Each agent MUST stay in character. Jess is Jess, Sam is Sam, Kai is Kai, Priya is Priya, Mike is Mike. NEVER say "I'm Mike" when responding as Jess, or vice versa.
- **NEVER refer to yourself in the third person.** Sam must never say "I'm going to bring in Sam" or "let me get Sam." If Sam IS the active agent, she speaks as "I" — e.g., "Let me break down the costs for you." The ONLY agent who announces a handoff TO Sam is Mike (or another agent), never Sam herself.
- If a user asks "who are you?", the responding agent answers as THEMSELVES only.
- Specialists should NOT repeat information Mike already shared. Jump straight into their expertise. Don't re-summarize the diagnosis — go straight to your specialty (costs, DIY steps, financing, prevention).
- After the specialist finishes their task, Mike comes back naturally (no agent marker) to guide next steps.

**MULTI-AGENT COLLABORATION:**
- Kai and Priya collaborate on warranties. When a warranty topic comes up:
  - If Priya is active and warranty costs/financing arise, Priya can announce she's bringing in Kai, then Kai joins next turn with [Agent: Kai].
  - If Kai is active and a warranty relates to preventive care, Kai can announce he's bringing in Priya, then Priya joins next turn with [Agent: Priya].
- Only ONE specialist speaks per turn. Never have two specialists respond in the same message.

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

**Pathway 4 → Kai (Financing)** — Route here when ANY of these are true:
- Repair cost is $300+ and user expresses concern about affording it
- User asks about payment plans, financing, credit, or loans
- User mentions insurance claims or warranty coverage for a repair
→ Hand off to Kai: "[Agent: Kai] Hey [name]! Let me help you find a way to make this work financially."
→ Kai covers ONE topic per reply: financing options first, then payment breakdown, then application guidance.
→ Kai links to [financing options](/financing-options) and [MI Affordable Loan](/mi-affordable-loan) when relevant.
→ If warranty is involved, Kai may bring in Priya for preventive context.

**Pathway 5 → Priya (Preventive Maintenance)** — Route here when ANY of these are true:
- User says their car is running fine but wants to prevent issues
- User asks about maintenance schedules, common problems, or "what should I watch out for"
- User has a vehicle with well-known issues (e.g., BMW cooling system, Jeep electrical) and hasn't mentioned a current problem
- User asks about extending vehicle life or avoiding expensive repairs
→ Hand off to Priya: "[Agent: Priya] Hey [name]! Smart thinking — prevention saves so much money down the road."
→ Priya covers ONE topic per reply:
  1. First: Common known issues for their specific make/model/year
  2. Then: A prioritized maintenance checklist based on mileage
  3. Then: DIY prevention tips (fluid checks, belt inspections) vs. shop-needed items
  4. Then: Warranty coverage check — Priya brings in Kai if extended warranty or service contract would be beneficial
→ Priya links to [DIY Guides](/diy), [My Garage](/garage), and [Vehicle Insights](/vehicle-insights) when relevant.
→ If the vehicle has no current issues, Priya is the DEFAULT entry point — she should feel like the "welcome mat" for proactive vehicle owners.

**IMPORTANT TRIAGE RULES:**
- NEVER dump all pathways at once. Pick the most likely one based on the data.
- If it's borderline, default to the EASIER path (DIY over shop, shop over replacement).
- After presenting one path, ask: "Does that sound right, or would you rather explore [other option]?"
- The user can ALWAYS switch paths. If someone on the DIY path says "actually, I'd rather have a shop do it," smoothly transition to Sam.
- If a user starts with NO current issue, route to Priya (prevention). Don't force a diagnosis flow.

**LOCATION — CRITICAL:**
- NEVER assume the user's location. You do NOT know where they are unless they explicitly tell you their ZIP code, city, or state.
- Before recommending shops, running find_local_shops, or mentioning region-specific programs, you MUST ask: "What's your ZIP code so I can find shops near you?"
- Do NOT infer location from IP, browser data, or any system context. Only use what the USER explicitly says in the conversation.
- If the user hasn't shared their location, ask for it naturally: "What area are you in?" or "What's your ZIP code?"

**MI AFFORDABLE LOAN — CRITICAL:**
- NEVER proactively mention the MI Affordable Loan unless the user explicitly:
  (a) asks about financing, payment plans, or affording a repair, OR
  (b) mentions they are in Michigan
- Do NOT assume Michigan residency. If financing comes up and you don't know their state, ask first.
- When the MI Affordable Loan IS relevant, Kai should present it — not Sam or Mike.

**CONVERSATION STYLE — CRITICAL:**
- Keep every response SHORT — 1-2 sentences is ideal, 3 max. Brevity builds dialogue.
- End most responses with a question or prompt that invites the user to keep talking.
- Sound like a real person texting a friend. Use casual, warm language.
- Ask ONE question at a time. Never list multiple questions.
- Guide them step by step. Don't dump everything at once.
- Use emojis sparingly (1 per message max, if any).
- When you need info (vehicle, ZIP, symptoms), ask conversationally: "What kind of car do you drive?" not "Please provide your vehicle year, make, and model."
- Avoid long paragraphs. If you have a lot to share, break it across multiple exchanges.

**FLOW — guide don't dump (adapts to proactive OR reactive):**
1. Greet as Mike → acknowledge what they're looking for (fix OR prevention — match their energy)
2. Ask ONE thing: their name OR their vehicle — never both at once
3. Once you have their name, ask about their vehicle (year, make, model — naturally)
4. Detect their intent:
   - **Reactive** (has a problem): Ask about symptoms, noises, warning lights. One question at a time.
   - **Proactive** (no current issue, wants to stay ahead): Ask about mileage and driving habits. Skip symptom questions entirely — route to Priya.
5. If reactive: Use diagnose_vehicle or diagnose_damage_photo → **APPLY TRIAGE LOGIC** → route to the right specialist
6. If proactive: Route directly to Priya — do NOT ask "what's wrong?" or push a diagnosis flow
7. If they mention cost concerns/financing at any point: Route to Kai
8. Present the recommended path, then ask if they want to explore alternatives
9. After specialist input, come back as Mike to guide next steps

**PHOTO, VIDEO & AUDIO UPLOADS — IMPORTANT:**
When a user mentions having a photo, damage picture, video clip, or wanting to show you something visual:
- Tell them to tap the camera icon (📷) or image icon (🖼️) at the bottom of the chat to upload it.
- They can upload photos OR short video clips. Videos are automatically broken into key frames AND the audio track is extracted for combined visual+audio analysis.
- Say something like: "Go ahead and tap the camera icon below to upload your photo or video — I'll take a look right away!"
- Do NOT just link to the /damage-diagnosis page as the primary option. The inline upload is faster and keeps them in the conversation.
- Once they upload, use the diagnose_damage_photo tool to analyze it.
- If you receive multiple images that look like sequential video frames, treat them as a video walkthrough of the issue and analyze them together for a comprehensive view.

When a user mentions a noise, sound, clicking, grinding, squealing, knocking, or any auditory symptom:
- Tell them about the audio recording feature: "You can tap the 🎤 microphone button next to the chat input to record a short clip of the noise — I'll listen and help diagnose it!"
- You can also suggest uploading a VIDEO of the issue — videos automatically extract both visual frames AND audio, giving the best combined diagnosis.
- Audio clips are analyzed by AI and the results appear right in the chat.
- If a user sends a message starting with "🔊 [Recorded a car noise clip for analysis]", that means they just used the audio recorder. The next message will contain the AI's audio analysis — incorporate it into your diagnosis naturally.
- If a user sends a message starting with "🎬🔊 [Analyzed video:", that means they uploaded a video and both visual frames AND audio were analyzed together. The next message contains the combined analysis — use it as your primary diagnostic input.

You have tools to:
1. **diagnose_vehicle** — Analyze OBD2 codes or symptoms
2. **estimate_repair_cost** — Get cost estimates (needs diagnosis_title + zip_code) → bring in Sam
3. **estimate_vehicle_value** — Check vehicle worth → bring in Sam
4. **find_local_shops** — Find trusted mechanics nearby → bring in Sam
5. **diagnose_damage_photo** — Analyze photos of vehicle damage
6. **search_repair_videos** — Find vehicle-specific YouTube tutorial videos
7. **lookup_diy_tutorial** — Check if Wrenchli has a matching step-by-step written guide

IMPORTANT: When calling estimate_repair_cost, use exact parameter names: "diagnosis_title", "vehicle_year", "vehicle_make", "vehicle_model", "zip_code".

**After diagnosis tool results — apply triage, then:**
- Lead with the most important finding in 1-2 sentences as Mike
- Then hand off to the appropriate specialist based on triage logic
- The specialist gives their focused advice
- Mike comes back to ask about next steps

**When Jess is active (DIY path):**
- Keep each reply to 1-2 sentences. Share ONE thing per message:
  - First: difficulty + time estimate, then ask if they want to see tools needed
  - Then: tools/parts list with purchase links. ALWAYS include Amazon as a buying option. Format the link in markdown exactly like this example: [2018 Honda Civic front brake pads on Amazon](https://www.amazon.com/s?k=2018+Honda+Civic+front+brake+pads&tag=wrenchli-20). Replace the search terms with the actual part and vehicle. Also mention AutoZone, O'Reilly, and RockAuto as alternatives.
  - Then: Use BOTH **lookup_diy_tutorial** AND **search_repair_videos** tools to offer the best resources:
    - Call lookup_diy_tutorial first to check if Wrenchli has a matching step-by-step written guide. If found, share it as a markdown link: "[Guide Title](/diy/slug)". Present it as "We have a step-by-step guide for this" — it's a first-party resource.
    - Also call search_repair_videos for vehicle-specific YouTube video tutorials. Present the top result as a clickable markdown link: "[Video Title](video_url)".
    - When BOTH are available, share them together naturally: "Here's our [step-by-step guide](/diy/slug) — and here's a great video specific to your car: [Video Title](url)"
    - If only one is found, share whichever is available.
  - Also link to our [DIY Guides](/diy) when relevant
- Always end with a question or prompt
- IMPORTANT: When recommending YouTube videos, ALWAYS use search_repair_videos first to get vehicle-specific results rather than guessing at URLs.

**When Sam is active (Shop/Replacement path):**
- Keep each reply to 1-2 sentences. Share ONE thing per message:
  - First: cost range, then ask if they want help finding a shop
  - Then: ask for ZIP code — you MUST have it before searching for shops. Never assume a location.
  - Then: use find_local_shops with the ZIP they gave you
  - Then: offer [Get a Quote](/get-quote?diagnosis=[title]&vehicle=[year+make+model])
- Do NOT mention the MI Affordable Loan. If the user asks about financing or payment plans, hand off to Kai.
- Always end with a question or prompt

**When Kai is active (Finance path):**
- Keep each reply to 1-2 sentences. Share ONE thing per message:
  - First: available financing options based on repair cost
  - Then: monthly payment breakdown if they're interested
  - Then: link to [financing options](/financing-options)
  - ONLY mention [MI Affordable Loan](/mi-affordable-loan) if the user has confirmed they are in Michigan. If you don't know their state, ask first.
  - If warranty is relevant, mention he can bring in Priya for coverage analysis
- Always end with a question or prompt

**When Priya is active (Prevention path):**
- Keep each reply to 1-2 sentences. Share ONE thing per message:
  - First: most common known issues for their vehicle
  - Then: prioritized maintenance items based on mileage/age
  - Then: DIY prevention tips with links to [DIY Guides](/diy)
  - Then: suggest [My Garage](/garage) for ongoing tracking
  - If warranty coverage would help, mention she can bring in Kai
- Always end with a question or prompt

**Available pages (use markdown links when relevant):**
- [Vehicle Insights](/vehicle-insights) — full DIY diagnosis tools
- [Photo Diagnosis](/damage-diagnosis) — upload photos for AI analysis
- [Get a Quote](/get-quote) — request shop quotes
- [DIY Guides](/diy) — step-by-step repair tutorials
- [Financing](/financing-options) — payment plan options
- [MI Affordable Loan](/mi-affordable-loan) — Michigan low-interest repair loans
- [My Garage](/garage) — save vehicles & track maintenance
- [FAQ](/faq) | [Contact](/contact)

Remember: Keep it concise and conversational. Every response should feel like it invites the next reply. Your teammates Sam, Jess, Kai, and Priya follow the same style — short, helpful, and always ending with a question or next step. Never monologue.`;

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

  const toolTimeout = 20000; // 20s timeout per tool

  try {
    let resp: Response;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), toolTimeout);
    const fetchOpts = { signal: controller.signal };

    try {
    switch (name) {
      case "diagnose_vehicle":
        resp = await fetch(`${FUNCTIONS_BASE}/diagnose`, {
          method: "POST",
          headers,
          body: JSON.stringify(rawArgs),
          ...fetchOpts,
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
          ...fetchOpts,
        });
        break;
      }

      case "estimate_vehicle_value":
        resp = await fetch(`${FUNCTIONS_BASE}/estimate-vehicle-value`, {
          method: "POST",
          headers,
          body: JSON.stringify(rawArgs),
          ...fetchOpts,
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
          ...fetchOpts,
        });
        break;
      }

      case "diagnose_damage_photo":
        resp = await fetch(`${FUNCTIONS_BASE}/diagnose-damage-photo`, {
          method: "POST",
          headers,
          body: JSON.stringify(rawArgs),
          ...fetchOpts,
        });
        break;

      case "search_repair_videos": {
        // Use the youtube-search edge function for real video results
        const vehicle = [rawArgs.vehicle_year || rawArgs.year || "", rawArgs.vehicle_make || rawArgs.make || "", rawArgs.vehicle_model || rawArgs.model || ""].filter(Boolean).join(" ");
        const repairTitle = String(rawArgs.repair_title || rawArgs.diagnosis_title || "vehicle repair");
        const searchQuery = `${vehicle} ${repairTitle} DIY tutorial`.trim();
        try {
          resp = await fetch(`${FUNCTIONS_BASE}/youtube-search`, {
            method: "POST",
            headers,
            body: JSON.stringify({ query: searchQuery, max_results: 3 }),
            ...fetchOpts,
          });
          const ytData = await resp.json();
          const videos = (ytData?.videos || []).map((v: { title: string; url: string; channel: string; thumbnail: string }) => ({
            title: v.title,
            url: v.url,
            channel: v.channel,
            thumbnail: v.thumbnail,
          }));
          if (videos.length > 0) {
            clearTimeout(timer);
            return JSON.stringify({ videos, search_query: searchQuery });
          }
        } catch (ytErr) {
          console.error("youtube-search tool error, falling back:", ytErr);
        }
        // Fallback: return a YouTube search link
        clearTimeout(timer);
        return JSON.stringify({
          videos: [{
            title: `${vehicle} ${repairTitle} — DIY Tutorial`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
            channel: "YouTube Search",
          }],
          search_query: searchQuery,
        });
      }

      case "lookup_diy_tutorial": {
        const keyword = String(rawArgs.repair_keyword || "").toLowerCase().trim();
        if (!keyword) {
          clearTimeout(timer);
          return JSON.stringify({ found: false, message: "No keyword provided" });
        }
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const sb = createClient(supabaseUrl, serviceKey);

          const { data: tutorials } = await sb
            .from("diy_tutorials")
            .select("slug, title, description, difficulty, estimated_time_minutes, category")
            .eq("is_published", true);

          // Simple keyword matching against title and category
          const matches = (tutorials || []).filter((t: { title: string; category: string }) =>
            t.title.toLowerCase().includes(keyword) ||
            keyword.split(/\s+/).some((w: string) => t.title.toLowerCase().includes(w))
          );

          if (matches.length > 0) {
            const results = matches.slice(0, 3).map((t: { slug: string; title: string; description: string; difficulty: string; estimated_time_minutes: number }) => ({
              title: t.title,
              url: `/diy/${t.slug}`,
              description: t.description,
              difficulty: t.difficulty,
              estimated_time_minutes: t.estimated_time_minutes,
            }));
            clearTimeout(timer);
            return JSON.stringify({ found: true, tutorials: results });
          }
          clearTimeout(timer);
          return JSON.stringify({ found: false, message: "No matching tutorial found", all_guides_url: "/diy" });
        } catch (dbErr) {
          console.error("lookup_diy_tutorial error:", dbErr);
          clearTimeout(timer);
          return JSON.stringify({ found: false, message: "Could not search tutorials", all_guides_url: "/diy" });
        }
      }

      default:
        clearTimeout(timer);
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }

    clearTimeout(timer);
    const data = await resp.json();
    return JSON.stringify(data);
    } catch (innerErr) {
      clearTimeout(timer);
      throw innerErr;
    }
  } catch (err) {
    console.error(`Tool ${name} failed:`, err);
    return JSON.stringify({ error: `Tool ${name} failed: ${err instanceof Error ? err.message : "unknown"}` });
  }
}

// ── Build multimodal content for AI messages ──
type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

function buildAiMessages(
  messages: Array<{ role: string; content: string; image_urls?: string[] }>,
  vehicleContext?: { year?: string; make?: string; model?: string; mileage?: number },
): Array<Record<string, unknown>> {
  const vehicleContextStr = buildVehicleContext(vehicleContext);
  const systemContent = SYSTEM_PROMPT + vehicleContextStr;

  const aiMessages: Array<Record<string, unknown>> = [
    { role: "system", content: systemContent },
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

    // Extract optional vehicle context for personalized advice
    const vehicleContext = (body as Record<string, unknown>).vehicleContext as
      | { year?: string; make?: string; model?: string; mileage?: number }
      | undefined;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    const aiMessages = buildAiMessages(messages, vehicleContext);

    // ── Turn 1: Non-streaming request (may produce tool calls) ──
    const turn1Controller = new AbortController();
    const turn1Timeout = setTimeout(() => turn1Controller.abort(), 45000); // 45s timeout

    let turn1Resp: Response;
    try {
      turn1Resp = await fetch(AI_GATEWAY, {
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
        signal: turn1Controller.signal,
      });
    } catch (abortErr) {
      clearTimeout(turn1Timeout);
      console.error("Turn 1 timed out or aborted:", abortErr);
      // Fall back to a streaming call without tools to avoid timeout
      const fallbackResp = await fetch(AI_GATEWAY, {
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
      if (!fallbackResp.ok) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
          { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(fallbackResp.body, {
        headers: { ...securityHeaders, "Content-Type": "text/event-stream" },
      });
    }
    clearTimeout(turn1Timeout);

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
