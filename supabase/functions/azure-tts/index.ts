import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map agent names to Azure Neural voices
// Using conversational-style voices where available for podcast-like delivery
const VOICE_MAP: Record<string, string> = {
  mike:  "en-US-DavisNeural",       // Warm, conversational American male
  sam:   "en-GB-SoniaNeural",       // Polished, confident British female
  jess:  "en-US-JaneNeural",        // Friendly, relatable American female
  kai:   "en-US-JasonNeural",       // Clear, trustworthy American male
  priya: "en-IN-NeerjaNeural",      // Warm, knowledgeable Indian female
};

// Per-agent speaking style (Azure Neural voices support named styles)
// Styles: "chat", "cheerful", "friendly", "customerservice", "calm", etc.
const STYLE_MAP: Record<string, { style: string; styleDegree: string }> = {
  mike:  { style: "chat",            styleDegree: "1.2" },  // Relaxed, podcast host
  sam:   { style: "customerservice",  styleDegree: "0.8" },  // Professional but warm
  jess:  { style: "friendly",        styleDegree: "1.3" },  // Approachable, encouraging
  kai:   { style: "calm",            styleDegree: "1.0" },  // Steady, reassuring
  priya: { style: "chat",            styleDegree: "1.0" },  // Conversational, coaching
};

// Per-agent prosody — slower rates sound more natural and podcast-like
const PROSODY_MAP: Record<string, { rate: string; pitch: string }> = {
  mike:  { rate: "-2%",  pitch: "+0%" },   // Relaxed, natural pace
  sam:   { rate: "+0%",  pitch: "+0%" },    // Natural default
  jess:  { rate: "+3%",  pitch: "+1%" },    // Slightly upbeat energy
  kai:   { rate: "-3%",  pitch: "-1%" },    // Deliberate, trustworthy
  priya: { rate: "+0%",  pitch: "+1%" },    // Warm, engaged
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AZURE_SPEECH_KEY = Deno.env.get("AZURE_SPEECH_KEY");
    const AZURE_SPEECH_REGION = Deno.env.get("AZURE_SPEECH_REGION");

    if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
      return new Response(
        JSON.stringify({ error: "Azure Speech credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, agent } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Text too long (max 5000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const voiceName = VOICE_MAP[agent] || VOICE_MAP.mike;

    // Preprocess dollar amounts so TTS reads them naturally
    // "$1,200" → "1200 dollars", "$700" → "700 dollars"
    let preprocessed = text.replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g, (_match, num) => {
      const plain = num.replace(/,/g, "");
      return `${plain} dollars`;
    });

    // Clean text for SSML (escape XML special chars)
    let cleanText = preprocessed
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

    // Minimal SSML breaks — let the speaking style handle most pacing naturally
    // Only add breaks for longer structural pauses
    cleanText = cleanText.replace(/\s*[—–]\s*/g, ' <break time="120ms"/> ');
    cleanText = cleanText.replace(/\.{3}/g, '<break time="350ms"/>');

    const prosody = PROSODY_MAP[agent] || { rate: "+0%", pitch: "+0%" };
    const styleInfo = STYLE_MAP[agent] || { style: "chat", styleDegree: "1.0" };

    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>
  <voice name='${voiceName}'>
    <mstts:express-as style='${styleInfo.style}' styledegree='${styleInfo.styleDegree}'>
      <prosody rate='${prosody.rate}' pitch='${prosody.pitch}'>${cleanText}</prosody>
    </mstts:express-as>
  </voice>
</speak>`;

    const ttsUrl = `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const response = await fetch(ttsUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssml,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Azure TTS error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Azure TTS failed: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBytes = await response.arrayBuffer();

    return new Response(audioBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("azure-tts error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
