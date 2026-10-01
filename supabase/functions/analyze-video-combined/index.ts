import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

// Native Gemini API — Lovable AI gateway dependency removed permanently.
// Frames now accepted two ways (backward compatible):
//   1. multipart "frame" File entries (legacy)
//   2. "frame_urls" — JSON array of signed Supabase storage URLs (what ChatBot/InlineChatWidget send)
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_FRAMES = 8;

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

    // Frames arrive either as multipart "frame" File entries (legacy)
    // or as "frame_urls" (JSON array of signed storage URLs — what the chat UI sends).
    const frameEntries = formData.getAll("frame").filter((v) => v instanceof File) as File[];
    let frameUrls: string[] = [];
    const frameUrlsRaw = formData.get("frame_urls");
    if (typeof frameUrlsRaw === "string" && frameUrlsRaw.trim()) {
      try {
        const parsed = JSON.parse(frameUrlsRaw);
        if (Array.isArray(parsed)) frameUrls = parsed.filter((u) => typeof u === "string" && u.startsWith("http"));
      } catch {
        // malformed JSON — ignore, fall through to the 400 below if nothing usable
      }
    }

    // Fetch remote frames server-side into memory (base64).
    const fetchedFrames: { mime: string; b64: string }[] = [];
    for (const url of frameUrls.slice(0, MAX_FRAMES - frameEntries.length)) {
      try {
        // Bound each frame download: a stalled storage fetch must not hang
        // the whole analysis.
        const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
        if (!r.ok) {
          console.error("[analyze-video-combined] frame fetch failed:", r.status, url.slice(0, 80));
          continue;
        }
        const bytes = new Uint8Array(await r.arrayBuffer());
        if (bytes.length === 0) continue;
        const mime = (r.headers.get("content-type") || "image/jpeg").split(";")[0].trim() || "image/jpeg";
        fetchedFrames.push({ mime, b64: base64Encode(bytes) });
      } catch (e) {
        console.error("[analyze-video-combined] frame fetch error:", e instanceof Error ? e.message : String(e));
      }
    }

    // Audio presence: provided AND non-trivial. WAV PCM gets a deterministic
    // silence gate; other formats just need a plausible size.
    let hasUsableAudio = false;
    let audioB64: string | null = null;
    let audioMime: string | null = null;
    if (audioFile && audioFile.size > 0) {
      const audioBytes = new Uint8Array(await audioFile.arrayBuffer());
      const rawMime = audioFile.type || "audio/wav";
      const mime = rawMime.split(";")[0].trim() || "audio/wav";
      let nonTrivial = audioBytes.length > 1024;
      if (nonTrivial && (mime === "audio/wav" || mime === "audio/wave" || mime === "audio/x-wav")) {
        const rmsDbfs = computeWavRmsDbfs(audioBytes);
        console.log("[analyze-video-combined] wav rms dBFS:", rmsDbfs);
        if (rmsDbfs !== null && rmsDbfs < -50) nonTrivial = false;
      }
      if (nonTrivial) {
        hasUsableAudio = true;
        audioB64 = base64Encode(audioBytes);
        audioMime = mime;
      }
    }

    const frameCount = frameEntries.length + fetchedFrames.length;
    if (frameCount === 0 && !hasUsableAudio) {
      return new Response(JSON.stringify({ error: "No frames or audio provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parts: any[] = [];

    // Legacy multipart frame files
    for (const frame of frameEntries.slice(0, MAX_FRAMES)) {
      const bytes = new Uint8Array(await frame.arrayBuffer());
      if (bytes.length === 0) continue;
      const mt = (frame.type || "image/jpeg").split(";")[0].trim() || "image/jpeg";
      parts.push({ inline_data: { mime_type: mt, data: base64Encode(bytes) } });
    }
    // Fetched frame URLs
    for (const f of fetchedFrames) {
      parts.push({ inline_data: { mime_type: f.mime, data: f.b64 } });
    }
    const analyzedFrameCount = parts.filter((p) => p.inline_data?.mime_type?.startsWith("image/")).length;

    if (hasUsableAudio && audioB64 && audioMime) {
      parts.push({ inline_data: { mime_type: audioMime, data: audioB64 } });
    }

    let promptText = "The customer uploaded a video of their vehicle issue.";
    if (analyzedFrameCount > 0 && hasUsableAudio) {
      promptText += ` I've extracted ${analyzedFrameCount} key frames and the audio track from their video. Please analyze both what you SEE in the frames and what you HEAR in the audio, then provide a combined symptom assessment.`;
    } else if (analyzedFrameCount > 0) {
      promptText += ` I've extracted ${analyzedFrameCount} key frames. The video had no usable audio track. Please analyze the visual frames and tell them what's likely going on.`;
    } else {
      promptText += " I've extracted the audio track. Please listen and tell them what's likely going on.";
    }
    if (vehicleContext) promptText += ` Vehicle: ${vehicleContext}.`;
    parts.push({ text: promptText });

    // Call Gemini with one automatic retry on transient failures (rate limit /
    // server overload / network blip). A single video analysis should not die
    // on one flaky upstream response.
    const geminiBody = JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    let response: Response | null = null;
    let lastStatus = 0;
    let lastErrText = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const resp = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: geminiBody,
          signal: AbortSignal.timeout(120_000),
        });
        lastStatus = resp.status;
        if (resp.ok) {
          response = resp;
          break;
        }
        lastErrText = (await resp.text()).slice(0, 300);
        console.error(`Gemini API error (attempt ${attempt + 1}):`, resp.status, lastErrText);
        // Retry only transient statuses; 4xx (other than 429) is deterministic.
        if (resp.status !== 429 && resp.status < 500) break;
      } catch (e) {
        lastErrText = e instanceof Error ? e.message : String(e);
        console.error(`Gemini fetch failed (attempt ${attempt + 1}):`, lastErrText);
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 2500));
    }

    if (!response) {
      const detail = `gemini_unavailable status=${lastStatus} ${lastErrText.slice(0, 200)}`;
      console.error("[analyze-video-combined]", detail);
      return new Response(JSON.stringify({ error: "Failed to analyze video", detail }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const analysis = result?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p?.text ?? "")
      .join("")
      .trim() ||
      "I couldn't make out enough from that video. Could you try uploading again with clearer footage of the area you're concerned about?";

    return new Response(JSON.stringify({
      analysis,
      has_audio: hasUsableAudio,
      frame_count: analyzedFrameCount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("analyze-video-combined error:", detail, err instanceof Error ? err.stack : "");
    return new Response(JSON.stringify({ error: "Internal error processing video", detail }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/** Chunked base64 encoding — avoids call-stack overflow on large frames/audio. */
function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Compute RMS amplitude in dBFS for a 16-bit PCM WAV byte stream.
 * Returns null if the buffer isn't a parseable PCM16 WAV.
 */
function computeWavRmsDbfs(bytes: Uint8Array): number | null {
  if (bytes.length < 44) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const wave = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (riff !== "RIFF" || wave !== "WAVE") return null;
  let offset = 12;
  let dataStart = -1;
  let dataLen = 0;
  let audioFormat = 1;
  let bitsPerSample = 16;
  while (offset + 8 <= bytes.length) {
    const id = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    const size = view.getUint32(offset + 4, true);
    if (id === "fmt ") {
      audioFormat = view.getUint16(offset + 8, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    } else if (id === "data") {
      dataStart = offset + 8;
      dataLen = size;
      break;
    }
    offset += 8 + size + (size % 2);
  }
  if (dataStart < 0 || audioFormat !== 1 || bitsPerSample !== 16 || dataLen < 2) return null;
  const n = Math.min(Math.floor(dataLen / 2), Math.floor((bytes.length - dataStart) / 2));
  if (n <= 0) return null;
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const s = view.getInt16(dataStart + i * 2, true) / 32768;
    sumSq += s * s;
  }
  const rms = Math.sqrt(sumSq / n);
  if (rms <= 0) return -Infinity;
  return 20 * Math.log10(rms);
}
