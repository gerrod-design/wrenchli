import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const AI_GATEWAY = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are Mike, a master automotive diagnostician at Wrenchli. You've just received a video submission from a customer — both visual frames captured from the video AND the audio track.

Analyze BOTH the visual and audio components together to provide a unified diagnosis:

**Visual Analysis:**
- Examine each frame for damage, wear, leaks, corrosion, or other visible issues
- Note any specific components visible and their condition
- Look for clues across frames that tell a story (progression, different angles)

**Audio Analysis:**
- Listen to the audio track for any characteristic sounds (clicking, grinding, squealing, knocking, rattling, hissing)
- Identify the rhythm, frequency, and intensity of any noises
- Determine if the sound correlates with what you see in the frames

**Combined Diagnosis:**
- Correlate visual and audio findings — this is where the real value is
- Example: visible belt wear + squealing sound = belt replacement needed
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
    const frameUrlsRaw = formData.get("frame_urls") as string | null;
    const vehicleContext = formData.get("vehicle_context") as string | null;

    const frameUrls: string[] = frameUrlsRaw ? JSON.parse(frameUrlsRaw) : [];

    if (!audioFile && frameUrls.length === 0) {
      return new Response(JSON.stringify({ error: "No audio or frames provided" }), {
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

    // Build multimodal content parts
    const userContent: any[] = [];

    // Add image frames
    for (const url of frameUrls) {
      userContent.push({
        type: "image_url",
        image_url: { url },
      });
    }

    // Add audio if present
    if (audioFile) {
      const audioBytes = await audioFile.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBytes)));
      const mimeType = audioFile.type || "audio/wav";

      userContent.push({
        type: "input_audio",
        input_audio: {
          data: base64Audio,
          format: mimeType.includes("wav") ? "wav" : "mp3",
        },
      });
    }

    // Add text prompt
    const hasAudio = !!audioFile;
    const hasFrames = frameUrls.length > 0;
    let promptText = "The customer uploaded a video of their vehicle issue.";
    if (hasFrames && hasAudio) {
      promptText += ` I've extracted ${frameUrls.length} key frames and the audio track from their video.`;
      promptText += " Please analyze both what you SEE in the frames and what you HEAR in the audio, then provide a combined diagnosis.";
    } else if (hasFrames) {
      promptText += ` I've extracted ${frameUrls.length} key frames. The video had no usable audio track.`;
      promptText += " Please analyze the visual frames and provide your diagnosis.";
    } else if (hasAudio) {
      promptText += " I've extracted the audio track. Please listen and provide your diagnosis.";
    }
    if (vehicleContext) {
      promptText += ` Vehicle: ${vehicleContext}.`;
    }

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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to analyze video" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const analysis = result.choices?.[0]?.message?.content ||
      "I couldn't get a clear read from that video. Could you try again with better lighting or closer to the issue?";

    return new Response(JSON.stringify({ analysis, has_audio: hasAudio, frame_count: frameUrls.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-video-combined error:", err);
    return new Response(JSON.stringify({ error: "Internal error processing video" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
