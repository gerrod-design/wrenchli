import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

// Native Gemini API — required because Lovable AI Gateway's OpenAI-compatible
// /chat/completions endpoint silently drops Gemini's `inlineData` audio parts,
// which caused Mike to hallucinate generic "ticking → valve train" answers
// regardless of what the user actually recorded.
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are Mike, a knowledgeable vehicle advisor at Wrenchli. A customer recorded an audio clip of a noise their car is making. The audio is attached as inline data in the user message.

Wrenchli does symptom assessment, not diagnosis. NEVER use the words "diagnose," "diagnosis," "diagnoses," "diagnosing," or "diagnosed." Use "what's likely going on," "likely causes," "what we're hearing," "assessment results."

CRITICAL ANTI-HALLUCINATION RULES — read carefully:

1. Begin your response with ONE sentence describing the literal acoustic features you actually hear in this specific clip: pitch (low / mid / high), rhythm (steady, intermittent, random, rises with RPM), texture (metallic, dull, hissing, scraping, whining, grinding, squealing, knocking, clicking), and whether it changes across the clip.

2. REFUSE TO GUESS in any of these cases — this is the correct, expected answer, not a failure:
   - The clip is silent or near-silent.
   - You only hear a featureless low hum, white noise, ambient room tone, microphone rumble, wind, breathing, or background chatter.
   - You hear a steady electronic beep, alarm tone, or pure sine wave with no mechanical character.
   - The clip is under 1 second, distorted, clipped, or the engine is clearly off.
   - You cannot identify a DISTINCT mechanical character (no scrape, grind, knock, squeal, click, tick, whine, rattle, hiss-from-leak, etc.).
   When refusing: say in one or two sentences what you actually hear (or don't hear), explain you can't make a confident assessment from it, and ask the user to re-record closer to the source with the engine running and the suspected noise active. Then STOP. Do NOT name ANY component (wheel bearing, valve train, oil, timing chain, exhaust, transfer case, tires, differential, transmission, sensor, warning chime, etc.). Do NOT list possible causes. Do NOT speculate.

3. ONLY after you have heard a DISTINCT mechanical sound with clear character, name 2–3 likely causes ranked by likelihood, give an urgency level (drive immediately to a shop / schedule soon / monitor), and say whether the customer can investigate it themselves.

4. Keep the whole response short and conversational — like talking to a friend. End with one follow-up question only when you gave a real assessment.

Refusing to guess is the correct answer when the audio is unclear or non-mechanical. A good refusal is a WIN. Padding with generic causes is a FAILURE.`;

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);
  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  try {
    const incomingContentType = req.headers.get("content-type");
    console.log("[analyze-car-audio] incoming request:", { contentType: incomingContentType });

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const vehicleContext = formData.get("vehicle_context") as string | null;

    console.log("[analyze-car-audio] diagnostic:", {
      contentType: incomingContentType,
      audioType: audioFile?.type,
      audioSize: audioFile?.size,
    });

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Audio analysis not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Base64-encode the audio in 32KB chunks to avoid call-stack overflow on large mobile recordings.
    const audioBytes = await audioFile.arrayBuffer();
    const bytes = new Uint8Array(audioBytes);
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
    }
    const base64Audio = btoa(binary);

    // Gemini wants the base mime type, not a codec-qualified one.
    // e.g. "audio/webm;codecs=opus" -> "audio/webm"
    const rawMime = audioFile.type || "audio/webm";
    const mimeType = rawMime.split(";")[0].trim() || "audio/webm";

    const promptText = `The customer recorded this audio clip of a noise their car is making.${vehicleContext ? ` Vehicle: ${vehicleContext}.` : ""} Follow the acoustic-description rules in your system instruction. If you cannot clearly hear a distinct mechanical sound, refuse and ask them to re-record — do not list generic causes.`;

    console.log("[analyze-car-audio] calling Gemini native:", {
      model: GEMINI_MODEL,
      mimeType,
      sizeKB: Math.round(bytes.length / 1024),
    });

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Audio } },
              { text: promptText },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402 || response.status === 403) {
        return new Response(JSON.stringify({ error: "Audio analysis temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to analyze audio", detail: errText.slice(0, 500) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const analysis = result?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p?.text ?? "")
      .join("")
      .trim() ||
      "I couldn't make out a clear noise from that recording. Could you try recording again, a bit closer to where the sound is coming from, with the engine running?";

    console.log("[analyze-car-audio] success:", { chars: analysis.length });

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("analyze-car-audio error:", detail, err instanceof Error ? err.stack : "");
    return new Response(JSON.stringify({ error: "Internal error processing audio", detail }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
