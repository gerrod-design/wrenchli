import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Round 14.7 — COPY CHECK-compliant v2 prompt.
// Source: /mnt/documents/analyze-video-combined-prompt-v2.md
// Operates under the documented Native Audio Analysis Exception
// (wrenchli-ENGINEERING.md, Round 14.6.1).
const SYSTEM_PROMPT = `You are Mike, a knowledgeable vehicle advisor at Wrenchli. You've just received a video submission from a customer — both visual frames captured from the video AND the audio track.

Wrenchli does symptom assessment, not diagnosis. NEVER use the words "diagnose," "diagnosis," "diagnoses," "diagnosing," or "diagnosed" in your response. Use "assessment," "what's likely going on," "likely causes," "what we're seeing," and "what we're hearing" instead. This is a brand and legal discipline — Wrenchli is not a licensed mechanic, and the language must reflect that.

Analyze BOTH the visual and audio components together to provide a unified symptom assessment:

**Visual Analysis:**
- Examine each frame for damage, wear, leaks, corrosion, or other visible issues
- Note any specific components visible and their condition
- Look for clues across frames that tell a story (progression, different angles)

**Audio Analysis:**
- Listen to the audio track for any characteristic sounds (clicking, grinding, squealing, knocking, rattling, hissing)
- Identify the rhythm, frequency, and intensity of any noises
- Determine if the sound correlates with what you see in the frames

**Combined Assessment:**
- Correlate visual and audio findings — this is where the real value is
- Example: visible belt wear + squealing sound = belt replacement likely needed
- Example: exhaust corrosion + rhythmic ticking = exhaust leak at visible damage point

Provide:

1. What you SEE (1-2 sentences)
2. What you HEAR (1-2 sentences) — or note if the audio is mostly ambient/unhelpful
3. Combined assessment (2-3 sentences connecting visual + audio)
4. Urgency level and recommended next step

Keep it conversational, like talking to a friend. Be specific about what you observe in each modality.

If the audio is mostly silence, wind, or ambient noise, say so and focus on the visual analysis. Don't make up sounds you don't hear.`;

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);
  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const vehicleContext = formData.get("vehicle_context") as string | null;

    // Frames arrive as multiple "frame" fields (File entries)
    const frameEntries = formData.getAll("frame").filter((v) => v instanceof File) as File[];

    if (frameEntries.length === 0 && !audioFile) {
      return new Response(JSON.stringify({ error: "No frames or audio provided" }), {
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

    const userContent: any[] = [];

    // Add image frames
    for (const frame of frameEntries) {
      const bytes = await frame.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
      const mt = frame.type || "image/jpeg";
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${mt};base64,${b64}` },
      });
    }

    // Add audio
    if (audioFile) {
      const audioBytes = await audioFile.arrayBuffer();
      const b64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBytes)));
      const mt = audioFile.type || "audio/wav";
      userContent.push({
        type: "input_audio",
        input_audio: {
          data: b64Audio,
          format: mt.includes("wav") ? "wav" : "mp3",
        },
      });
    }

    let promptText = "The customer uploaded a video of their vehicle issue.";
    if (frameEntries.length > 0 && audioFile) {
      promptText += ` I've extracted ${frameEntries.length} key frames and the audio track from their video. Please analyze both what you SEE in the frames and what you HEAR in the audio, then provide a combined symptom assessment.`;
    } else if (frameEntries.length > 0) {
      promptText += ` I've extracted ${frameEntries.length} key frames. The video had no usable audio track. Please analyze the visual frames and tell them what's likely going on.`;
    } else {
      promptText += " I've extracted the audio track. Please listen and tell them what's likely going on.";
    }
    if (vehicleContext) promptText += ` Vehicle: ${vehicleContext}.`;
    userContent.push({ type: "text", text: promptText });

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
          { role: "user", content: userContent },
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

      return new Response(JSON.stringify({ error: "Failed to analyze video" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const analysis = result.choices?.[0]?.message?.content ||
      "I couldn't make out enough from that video. Could you try uploading again with clearer footage of the area you're concerned about?";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-video-combined error:", err);
    return new Response(JSON.stringify({ error: "Internal error processing video" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
