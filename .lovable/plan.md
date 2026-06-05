## The concern is valid

The screenshots show the textbook hallucination signature:
- Every recording returns "rhythmic clicking/ticking"
- Causes are always the same 3–4: valve train, low oil, timing chain/belt, exhaust leak
- Urgency is always "schedule soon"

Logs confirm audio is uploaded correctly (`audio/webm;codecs=opus`, ~750KB). So the audio is leaving the phone — but the model's answers don't vary with the audio. Root cause is almost certainly that **Lovable AI Gateway's OpenAI-compatible `/chat/completions` endpoint does not forward Gemini's native `inlineData` content part**. The OpenAI chat schema only knows `text`, `image_url`, and `input_audio`. `inlineData` is silently stripped, leaving Gemini with only the text prompt — which itself names "clicking, grinding, squealing, knocking" as examples. The model dutifully picks one and confabulates causes.

## Plan

### 1. Prove the failure mode (controlled test)
Before changing code, run two `curl` tests against the deployed `analyze-car-audio` function:
- A 2-second silent WAV
- A clearly distinct clip (e.g. a high-pitched squeal recorded from a phone speaker)

If both responses still describe "rhythmic ticking, likely valve train / low oil," the audio isn't being heard. Log results so we have a clear before/after.

### 2. Switch the audio call to Gemini's native API
- Use `GEMINI_API_KEY` (already in secrets) instead of `LOVABLE_API_KEY` for this one function.
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=...`
- Request body uses Gemini's native shape, which actually supports audio:
  ```json
  {
    "system_instruction": { "parts": [{ "text": SYSTEM_PROMPT }] },
    "contents": [{
      "role": "user",
      "parts": [
        { "inline_data": { "mime_type": "audio/webm", "data": "<base64>" } },
        { "text": "<promptText>" }
      ]
    }]
  }
  ```
- Strip codec suffix from the mime type (`audio/webm;codecs=opus` → `audio/webm`) — Gemini wants the base type.
- Map iOS `audio/mp4` straight through (Gemini accepts it natively).
- Preserve all existing CORS, error-status handling (429/402/500), and response shape so the frontend doesn't change.

### 3. Harden the prompt against hallucination
Replace the current prompt with one that forces grounding in what was actually heard:

> Before naming any causes, describe the literal acoustic features you hear in this clip in one sentence: pitch (low/mid/high), rhythm (steady, intermittent, random), texture (metallic, dull, hissing, scraping), and whether it changes over the clip. If the clip is silent, too short, too distorted, or you cannot identify a distinct mechanical sound, say so honestly and ask the user to re-record closer to the source — do NOT speculate on causes. Only after the acoustic description, name 2–3 likely causes ranked by likelihood…

This makes hallucination visible: if the model can't hear, it has to say so instead of jumping to "ticking → valve train."

Confidence-labeling decision (you asked what the team recommends): **refuse low-confidence cases rather than label them.** "Schedule soon for valve train issues" with a confidence badge is still actionable misinformation in an automotive safety context. Honest refusal protects the brand promise ("knowledgeable neighbor") and the Wrenchli-isn't-a-mechanic legal posture far better than a hedged guess.

### 4. Re-run the controlled test
Same two clips. Expected:
- Silent clip → "I can't make out a clear noise — try recording again closer to the source."
- Distinct squeal → acoustic description names "high-pitched continuous squeal," causes shift to belt/brake territory (not ticking).

If both pass, the fix is confirmed. If the silent clip still gets a confident answer, the audio still isn't reaching the model and we escalate (e.g. transcode to WAV server-side, or fall back to text-only "describe the sound" flow).

### 5. Files touched
- `supabase/functions/analyze-car-audio/index.ts` — swap to native Gemini call + new prompt. No frontend or other function changes.

### Out of scope
- No changes to `AudioRecordButton`, `useAudioRecorder`, or any UI.
- No changes to Mike's persona, agent routing, or other AI endpoints.
- No new secrets (using existing `GEMINI_API_KEY`).
