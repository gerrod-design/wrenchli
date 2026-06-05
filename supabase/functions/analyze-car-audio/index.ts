import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Round 14.6 — COPY CHECK-compliant v2 prompt.
// Source: /mnt/documents/analyze-car-audio-prompt-v2.md
const SYSTEM_PROMPT = `You are Mike, a knowledgeable vehicle advisor at Wrenchli. You've just listened to an audio recording of a car noise that a customer recorded. The audio file is attached to the user's message.

Wrenchli does symptom assessment, not diagnosis. NEVER use the words "diagnose," "diagnosis," "diagnoses," "diagnosing," or "diagnosed" in your response. Use language like "what's likely going on," "likely causes," "what we're hearing," and "assessment results" instead. This is a brand and legal discipline — Wrenchli is not a licensed mechanic, and the language must reflect that.

Listen to the attached audio and tell the customer:

1. What the noise likely is (be specific about the type of sound — clicking, grinding, squealing, knocking, etc.)
2. The most probable causes (2-3 possibilities ranked by likelihood)
3. Urgency level (drive immediately to a shop, schedule soon, or monitor)
4. Whether this is something they can investigate themselves

Keep your response SHORT — 2-3 sentences max. Sound conversational, like you're talking to a friend. End with a follow-up question.

If the recording is mostly silence or unintelligible, say so honestly and suggest they try recording closer to the source of the noise.`;

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);
  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const vehicleContext = formData.get("vehicle_context") as string | null;

    console.log("[analyze-car-audio] diagnostic:", {
      contentType: req.headers.get("content-type"),
      audioType: audioFile?.type,
      audioSize: audioFile?.size,
    });

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert audio to base64 (chunked to avoid call-stack overflow on large mobile recordings)
    const audioBytes = await audioFile.arrayBuffer();
    const bytes = new Uint8Array(audioBytes);
    let binary = "";
    const CHUNK = 0x8000; // 32KB chunks
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
    }
    const base64Audio = btoa(binary);
    const mimeType = (audioFile.type || "audio/wav").toLowerCase();

    // Prefer client-produced WAV, but pass through native mobile formats with the
    // correct token instead of mislabeled audio or a hard 415.
    let format: string;
    if (mimeType.includes("wav")) format = "wav";
    else if (mimeType.includes("mpeg") || mimeType.includes("mp3")) format = "mp3";
    else if (mimeType.includes("webm")) format = "webm";
    else if (mimeType.includes("ogg")) format = "ogg";
    else if (mimeType.includes("mp4") || mimeType.includes("m4a") || mimeType.includes("aac")) format = "mp4";
    else if (mimeType.includes("flac")) format = "flac";
    else {
      console.error("Unsupported audio format:", mimeType);
      return new Response(JSON.stringify({ error: "This recording format could not be converted. Please try recording again." }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const promptText = `The customer recorded this audio clip of a noise their car is making.${vehicleContext ? ` Vehicle: ${vehicleContext}.` : ""} Please listen and tell them what's likely going on with their vehicle.`;

    console.log("[analyze-car-audio] sending supported audio:", { mimeType, format, sizeKB: Math.round(bytes.length / 1024) });

    const response = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: [
            { type: "input_audio", input_audio: { data: base64Audio, format } },
            { type: "text", text: promptText },
          ] },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
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
    const analysis = result.choices?.[0]?.message?.content ||
      "I couldn't make out a clear noise from that recording. Could you try recording again, a bit closer to where the sound is coming from?";

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
