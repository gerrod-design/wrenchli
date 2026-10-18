import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { computeUrgency, mapToSystemAreas, generateShopSummary, cleanAnalysisForDisplay, type SenseBundle } from "./symptomMapping.ts";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

// Round 14.7 — COPY CHECK-compliant v2 prompt.
// Source: /mnt/documents/analyze-video-combined-prompt-v2.md
// Operates under the documented Native Audio Analysis Exception
// (wrenchli-ENGINEERING.md, Round 14.6.1).
const SYSTEM_PROMPT = `You are Aiden, a knowledgeable vehicle advisor at Wrenchli. You've just received a video submission from a customer — both visual frames captured from the video AND the audio track.

Wrenchli does symptom assessment, not diagnosis. NEVER use the words "diagnose," "diagnosis," "diagnoses," "diagnosing," or "diagnosed" in your response. Use "assessment," "what's likely going on," "likely causes," "what we're seeing," and "what we're hearing" instead. This is a brand and legal discipline — Wrenchli is not a licensed mechanic, and the language must reflect that.

Write in plain text only. Do not use markdown formatting of any kind — no ** bold, no headings with #, no backticks. Your answer is displayed exactly as written.

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

function encodeBase64Safe(buffer: Uint8Array): string {
  let result = "";
  const chunkSize = 8192;
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.slice(i, i + chunkSize);
    result += String.fromCharCode(...chunk);
  }
  return btoa(result);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);
  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return new Response(
      JSON.stringify({ error: "Expected multipart form data with an audio file, frame_urls, or a symptom sense_bundle." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const audioFile = formData.get("audio") as File | null;
    const vehicleContext = formData.get("vehicle_context") as string | null;
    // Symptom mode (five-senses intake). Absent = damage mode (backward-compatible).
    const analysisMode = (formData.get("analysis_mode") as string) || "damage";
    const senseBundleRaw = formData.get("sense_bundle") as string | null;

    // Parse frame_urls as JSON array and fetch each URL once
    let frameEntries: { bytes: ArrayBuffer; mimeType: string }[] = [];
    const frameUrlsRaw = formData.get("frame_urls") as string | null;
    if (frameUrlsRaw) {
      try {
        const parsed = JSON.parse(frameUrlsRaw);
        if (Array.isArray(parsed)) {
          for (let i = 0; i < Math.min(parsed.length, 8); i++) {
            const frameUrl = parsed[i];
            if (typeof frameUrl === "string") {
              try {
                const frameResponse = await fetch(frameUrl);
                if (frameResponse.ok) {
                  const contentType = frameResponse.headers.get("content-type") || "image/jpeg";
                  const mimeType = contentType.split(";")[0].trim();
                  const bytes = await frameResponse.arrayBuffer();
                  frameEntries.push({
                    bytes,
                    mimeType,
                  });
                }
              } catch {
                // Skip individual fetch failures
              }
            }
          }
        }
      } catch {
        // Unparseable JSON — zero frames
      }
    }

    // Symptom mode: parse the sense bundle up front. A valid bundle (at
    // least one observation with descriptors or free text) makes a
    // zero-media submission acceptable — the smell-first / feel-first
    // paths may have no video at all. Damage mode never parses a bundle,
    // so its behavior is unchanged.
    let senseBundle: SenseBundle | null = null;
    let hasObservations = false;
    if (analysisMode === "symptom" && senseBundleRaw) {
      try {
        senseBundle = JSON.parse(senseBundleRaw) as SenseBundle;
        if (!Array.isArray(senseBundle.observations)) {
          // Malformed bundle — treat as absent (matches prior fallback).
          senseBundle = null;
        } else {
          hasObservations = senseBundle.observations.some(
            (o) => (o.descriptors && o.descriptors.length > 0) ||
              (o.freeText && o.freeText.trim().length > 0)
          );
        }
      } catch {
        senseBundle = null;
      }
    }

    if (frameEntries.length === 0 && !audioFile && !hasObservations) {
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

    // Add image frames from stored bytes
    for (const frame of frameEntries) {
      const b64 = encodeBase64Safe(new Uint8Array(frame.bytes));
      parts.push({
        inlineData: {
          mimeType: frame.mimeType,
          data: b64,
        },
      });
    }

    // Add audio
    if (audioFile) {
      const audioBytes = await audioFile.arrayBuffer();
      const b64Audio = encodeBase64Safe(new Uint8Array(audioBytes));
      const mt = audioFile.type || "audio/wav";
      parts.push({
        inlineData: {
          mimeType: mt,
          data: b64Audio,
        },
      });
    }

    let promptText = "The customer uploaded a video of their vehicle issue.";
    if (frameEntries.length > 0 && audioFile) {
      promptText += ` I've extracted ${frameEntries.length} key frames and the audio track from their video. Please analyze both what you SEE in the frames and what you HEAR in the audio, then provide a combined symptom assessment.`;
    } else if (frameEntries.length > 0) {
      promptText += ` I've extracted ${frameEntries.length} key frames. The video had no usable audio track. Please analyze the visual frames and tell them what's likely going on.`;
    } else if (audioFile) {
      promptText += " I've extracted the audio track. Please listen and tell them what's likely going on.";
    } else {
      // Zero-media symptom submission (bundle-only): no video was provided.
      promptText = "The customer is reporting a vehicle issue through their senses and did not provide a video. Base your assessment only on the observations they reported — do not claim to have seen or heard anything.";
    }
    if (vehicleContext) promptText += ` Vehicle: ${vehicleContext}.`;

    // Symptom mode: weight driver observations as first-class signals.
    // (Bundle was parsed earlier, before the media check.)
    if (senseBundle) {
      const obsLines: string[] = [];
      for (const obs of senseBundle.observations) {
        if (obs.descriptors.length > 0) {
          obsLines.push(`- ${obs.sense}: ${obs.descriptors.join(", ")}${obs.freeText ? ` (also: ${obs.freeText})` : ""}`);
        } else if (obs.freeText && obs.freeText.trim()) {
          obsLines.push(`- ${obs.sense}: ${obs.freeText.trim()}`);
        }
      }
      if (obsLines.length > 0) {
        const hasMedia = frameEntries.length > 0 || !!audioFile;
        let bundleText = (hasMedia
          ? "\n\nDriver observations (treat as first-class signals alongside what you see and hear):\n"
          : "\n\nDriver observations (treat as first-class signals):\n") + obsLines.join("\n");
        if (senseBundle.timing.length > 0) bundleText += `\nTiming: ${senseBundle.timing.join(", ")}`;
        if (senseBundle.conditions.length > 0) bundleText += `\nWhen it happens: ${senseBundle.conditions.join(", ")}`;
        if (senseBundle.locations.length > 0) bundleText += `\nLocation: ${senseBundle.locations.join(", ")}`;
        bundleText += hasMedia
          ? "\nReference these observed descriptors in your assessment where they correlate with the video/audio."
          : "\nBase your assessment on these observations.";
        promptText += bundleText;
      }
    }
    parts.push({ text: promptText });

    // Retry transient Gemini failures (429/503) with exponential backoff —
    // video analysis is a core feature and must not fail on a momentary spike.
    let response: Response | null = null;
    let status = 0;
    for (let attempt = 1; attempt <= 3; attempt++) {
      response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "x-goog-api-key": GEMINI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              parts,
            },
          ],
        }),
      });
      status = response.status;
      if (response.ok) break;
      const errText = await response.text();
      console.error(`Gemini API error (attempt ${attempt}/3):`, status, errText.slice(0, 200));
      const retryable = status === 429 || status === 503;
      if (!retryable || attempt === 3) break;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }

    if (!response || !response.ok) {
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to analyze video" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const analysis = result.candidates?.[0]?.content?.parts
      ?.map((part: any) => part.text)
      .filter((text: any) => text)
      .join("") ||
      (frameEntries.length === 0 && !audioFile
        ? "I couldn't put together an assessment from that report. Could you add a few more details about what you're noticing?"
        : "I couldn't make out enough from that video. Could you try uploading again with clearer footage of the area you're concerned about?");

    // Symptom mode: return structured bundle-mapped response.
    if (analysisMode === "symptom" && senseBundle) {
      const { tier, reason } = computeUrgency(senseBundle);
      const systemAreas = mapToSystemAreas(senseBundle);
      const sensesCovered = senseBundle.observations
        .filter((o) => o.descriptors.length > 0 || (o.freeText && o.freeText.trim()))
        .map((o) => o.sense);
      const displayAnalysis = cleanAnalysisForDisplay(analysis);
      const hasMedia = frameEntries.length > 0 || !!audioFile;
      return new Response(JSON.stringify({
        urgency: tier,
        urgencyReason: reason ?? null,
        systemAreas,
        shopLanguageSummary: generateShopSummary(senseBundle, systemAreas),
        preliminaryAssessment: displayAnalysis,
        videoInsights: hasMedia ? displayAnalysis : null,
        sensesCovered,
        frameCount: frameEntries.length,
        hasAudio: !!audioFile,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      analysis,
      has_audio: !!audioFile,
      frame_count: frameEntries.length,
    }), {
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
