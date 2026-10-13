#!/usr/bin/env node
/**
 * scripts/smoke-production.mjs
 *
 * Dependency-free, read-only smoke test for the canonical production
 * Supabase backend. Runs a normal 2-message chat session (synthetic
 * content) and verifies the pipeline is live and behaving correctly.
 *
 * The chat function answers with an SSE stream of
 *   data: {"choices":[{"delta":{"content":"..."}}]}
 * lines ending in `data: [DONE]` — parse accordingly (with a plain-JSON
 * fallback in case the response mode ever changes).
 *
 * Required env vars:
 *   SUPABASE_URL        e.g. https://aunrktvltmyrxtdygykt.supabase.co
 *   SUPABASE_ANON_KEY   the project's anon/publishable key (never hard-coded)
 * Optional:
 *   CHAT_FUNCTION_NAME   defaults to "chat"
 *
 * Exit code 0 = pass. Non-zero = fail, with a clear message on stderr.
 */

const EXPECTED_HOST = "aunrktvltmyrxtdygykt.supabase.co";

class SmokeFailure extends Error {}

function fail(msg) {
  throw new SmokeFailure(msg);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function extractReply(text) {
  // SSE stream path.
  if (text.includes("data:")) {
    let out = "";
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") break;
      try {
        const chunk = JSON.parse(payload);
        const delta = chunk?.choices?.[0]?.delta?.content;
        if (typeof delta === "string") out += delta;
      } catch {
        // Non-JSON data line (e.g. an error event) — skip.
      }
    }
    if (out) return out;
  }
  // Plain-JSON fallback.
  try {
    const data = JSON.parse(text);
    return (
      data.reply ??
      data.message ??
      data.content ??
      (data.choices && data.choices[0]?.message?.content) ??
      ""
    );
  } catch {
    return "";
  }
}

async function callChat(endpoint, anonKey, messages) {
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ messages }),
    });
  } catch (err) {
    fail(`Network error calling ${endpoint}: ${err.message}`);
  }

  const text = await res.text();

  if (!res.ok) {
    fail(
      `Chat function returned HTTP ${res.status} ${res.statusText}. ` +
        `Body: ${text.slice(0, 500)}`
    );
  }

  const reply = extractReply(text);
  if (!reply || typeof reply !== "string") {
    fail(
      `Chat function response had no usable reply text. ` +
        `Raw: ${text.slice(0, 500)}`
    );
  }
  return reply;
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const FN_NAME = process.env.CHAT_FUNCTION_NAME || "chat";

  if (!SUPABASE_URL) fail("SUPABASE_URL is not set.");
  if (!ANON_KEY) fail("SUPABASE_ANON_KEY is not set.");

  let host;
  try {
    host = new URL(SUPABASE_URL).host;
  } catch {
    fail(`SUPABASE_URL is not a valid URL: ${SUPABASE_URL}`);
  }

  if (host !== EXPECTED_HOST) {
    fail(
      `SUPABASE_URL host is "${host}", expected canonical production host ` +
        `"${EXPECTED_HOST}". Refusing to smoke-test the wrong project.`
    );
  }

  const endpoint = `${SUPABASE_URL}/functions/v1/${FN_NAME}`;
  console.log(`Running production smoke test against ${endpoint}`);

  // (a) the chat function answers at all.
  const turn1 = [
    {
      role: "user",
      content: "My 2018 Honda Civic is making a squealing noise when I brake.",
    },
  ];
  const reply1 = await callChat(endpoint, ANON_KEY, turn1);
  if (reply1.trim().length === 0) {
    fail("First turn produced an empty reply — chat function is not answering.");
  }
  ok(`Chat function answered turn 1 (${reply1.length} chars).`);

  // (b) 2-message Denise-style probe: follow-up details + mileage should
  // converge on a preliminary assessment.
  const turn2 = [
    ...turn1,
    { role: "assistant", content: reply1 },
    {
      role: "user",
      content:
        "It only squeals when I'm braking at low speed, started about two " +
        "weeks ago, and the car has 62,000 miles on it. No grinding noise, " +
        "no vibration.",
    },
  ];
  const reply2 = await callChat(endpoint, ANON_KEY, turn2);

  if (!reply2.toLowerCase().includes("preliminary assessment")) {
    fail(
      `Second turn reply did not contain "preliminary assessment". ` +
        `Reply was: ${reply2.slice(0, 500)}`
    );
  }
  ok('Second turn reply contains "preliminary assessment".');

  console.log(
    "SMOKE PASS: production chat pipeline is live and responding correctly."
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    if (err instanceof SmokeFailure) {
      console.error(`SMOKE FAIL: ${err.message}`);
    } else {
      console.error(`SMOKE FAIL (unexpected error): ${err.stack || err.message}`);
    }
    process.exit(1);
  });
