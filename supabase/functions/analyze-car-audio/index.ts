import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert audio to base64 for Gemini (which supports inline audio)
    const audioBytes = await audioFile.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBytes)));

    // Determine mime type
    const mimeType = audioFile.type || "audio/webm";

    const userContent: any[] = [
      {
        type: "input_audio",
        input_audio: {
          data: base64Audio,
          format: mimeType.includes("wav") ? "wav" : "mp3",
        },
      },
      {
        type: "text",
        text: `The customer recorded this audio clip of a noise their car is making.${
          vehicleContext ? ` Vehicle: ${vehicleContext}.` : ""
        } Please listen and analyze what you hear. Describe the sound and provide your diagnosis.`,
      },
    ];

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
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to analyze audio" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const analysis = result.choices?.[0]?.message?.content || "I couldn't make out a clear noise from that recording. Could you try recording again, a bit closer to where the sound is coming from?";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-car-audio error:", err);
    return new Response(JSON.stringify({ error: "Internal error processing audio" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
