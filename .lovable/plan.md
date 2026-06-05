## Goal
Confirm the rotated `GEMINI_API_KEY` unblocks `analyze-car-audio` and the hardened prompt prevents hallucination.

## Steps
1. Generate two test WAV clips in `/tmp`:
   - `silent.wav` — 2s of silence
   - `squeal.wav` — 2s 2kHz sine (high-pitched continuous tone)
2. Base64-encode each and POST to the deployed `analyze-car-audio` edge function via `supabase--curl_edge_functions`.
3. Validate responses:
   - **Silent clip** → Mike refuses ("I can't make out a clear noise, please re-record…"), no fabricated cause.
   - **Squeal clip** → described as "high-pitched continuous tone" (not "ticking"), with 2–3 plausible causes (e.g. belt, bearing), no generic filler.
4. Report both raw responses back so you can see hallucination is gone.
5. If either response still hallucinates, tighten the system prompt further and redeploy. If 403 persists, the new key was also flagged — fall back to Lovable AI Gateway path.

## No code changes expected
This is a verification run only. The edge function and hardened prompt are already deployed.