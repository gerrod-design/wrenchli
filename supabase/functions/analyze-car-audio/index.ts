import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are Mike, a master automotive diagnostician at Wrenchli. You've just listened to an audio recording of a car noise that a customer recorded. The audio has been transcribed for you below.

Analyze the transcribed audio and provide:
1. What the noise likely is (be specific about the type of sound — clicking, grinding, squealing, knocking, etc.)
2. The most probable causes (2-3 possibilities ranked by likelihood)
3. Urgency level (drive immediately to a shop, schedule soon, or monitor)
4. Whether this is something they can investigate themselves

Keep your response SHORT — 2-3 sentences max. Sound conversational, like you're talking to a friend. End with a follow-up question.

If the transcription is mostly silence or unintelligible, say so honestly and suggest they try recording closer to the source of the noise.`;

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  const optionsResp = handleCorsOptions(req, corsHeaders);
  if (optionsResp) return optionsResp;

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const vehicleContext = formData.get("vehicle_context") as string | null;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Whisper transcription service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-20250514";
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "Assessment service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Transcribe with OpenAI Whisper
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, audioFile.name || "car-noise.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("prompt", "Car engine noise, vehicle sound recording, mechanical noise diagnosis");

    const whisperResp = await fetch(WHISPER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: whisperForm,
    });

    if (!whisperResp.ok) {
      const errText = await whisperResp.text();
      console.error("Whisper error:", whisperResp.status, errText);
      return new Response(JSON.stringify({ error: "Failed to transcribe audio" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const whisperResult = await whisperResp.json();
    const transcript = whisperResult.text || "";

    console.log("Whisper transcript length:", transcript.length);

    // Step 2: Send transcript to Claude for assessment
    const userMessage = `Here is a transcription of a car noise recording the customer submitted:\n\n"${transcript}"\n\n${
      vehicleContext ? `Vehicle: ${vehicleContext}.\n\n` : ""
    }Based on this transcription, analyze the sound and provide your diagnosis.`;

    const claudeResp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!claudeResp.ok) {
      const errText = await claudeResp.text();
      console.error("Anthropic error:", claudeResp.status, errText);
      return new Response(JSON.stringify({ error: "Failed to analyze audio" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const claudeResult = await claudeResp.json();
    const analysis =
      claudeResult.content?.[0]?.text ||
      "I couldn't make out a clear noise from that recording. Could you try recording again, a bit closer to where the sound is coming from?";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-car-audio error:", err);
    return new Response(JSON.stringify({ error: "Internal error processing audio" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
