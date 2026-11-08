import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  buildShopTalkSystemPrompt,
  getPublicShopTalkConfig,
} from "../_shared/shop-talk-config.ts";
import { enforceShopBoundary } from "./boundary-guard.ts";

// Shop-prospect assistant for /for-shops/talk (Option B inbound layer,
// build spec 2026-11-02). SEPARATE configuration from the consumer chat
// function: its own system prompt and knowledge text, drawn only from
// _shared/shop-talk-config.ts. The consumer Aiden prompt is not used or
// altered here.
//
// Condition 2 enforcement: the model reply is buffered in full and passed
// through the boundary guard before anything is returned. A violating
// reply is replaced whole with the config fallback line.
// Condition 4: every conversation transcript is logged to
// shop_talk_conversations under the service role.

const MAX_MESSAGES = 40;
const MAX_CONTENT_LENGTH = 4000;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function validateMessages(
  raw: unknown,
  headers: Record<string, string>,
): ChatMessage[] | Response {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) {
    return jsonResponse(
      { error: `Messages array must have 1-${MAX_MESSAGES} items` },
      400,
      headers,
    );
  }
  const messages: ChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return jsonResponse({ error: "Each message must be an object" }, 400, headers);
    }
    const m = item as Record<string, unknown>;
    if (
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string" ||
      m.content.length === 0 ||
      m.content.length > MAX_CONTENT_LENGTH
    ) {
      return jsonResponse(
        { error: "Each message needs a role of 'user' or 'assistant' and content under 4000 characters" },
        400,
        headers,
      );
    }
    messages.push({ role: m.role, content: m.content });
  }
  return messages;
}

async function logConversation(
  conversationId: string,
  transcript: ChatMessage[],
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) return;
    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
    const { error } = await sb.from("shop_talk_conversations").upsert(
      {
        id: conversationId,
        transcript,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) console.error("shop-talk transcript log failed:", error.message);
  } catch (err) {
    console.error("shop-talk transcript log failed:", err);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  // Public config for the /for-shops/talk page (windows, greeting, notice).
  if (req.method === "GET") {
    return jsonResponse(
      { ...getPublicShopTalkConfig() },
      200,
      securityHeaders,
    );
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, securityHeaders);
  }

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.STRICT);
  const rlHeaders = getRateLimitHeaders(
    RATE_LIMITS.STRICT.maxRequests,
    rateResult.remaining,
    rateResult.resetTime,
  );
  if (!rateResult.allowed) {
    return jsonResponse(
      { error: "Rate limit exceeded. Please try again shortly." },
      429,
      { ...securityHeaders, ...rlHeaders },
    );
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400, securityHeaders);
    }
    const reqBody = (body ?? {}) as Record<string, unknown>;

    const validated = validateMessages(reqBody.messages, securityHeaders);
    if (validated instanceof Response) return validated;
    const messages = validated;

    const conversationId =
      typeof reqBody.conversationId === "string" && UUID_PATTERN.test(reqBody.conversationId)
        ? reqBody.conversationId
        : crypto.randomUUID();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    let replyText = "";
    try {
      const resp = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: buildShopTalkSystemPrompt(),
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        console.error("shop-talk Anthropic error:", resp.status);
        return jsonResponse(
          { error: "The assistant is unavailable right now. Please use the booking form instead." },
          502,
          securityHeaders,
        );
      }
      const data = await resp.json();
      const blocks = Array.isArray(data?.content) ? data.content : [];
      replyText = blocks
        .filter((b: { type?: string }) => b?.type === "text")
        .map((b: { text?: string }) => b.text ?? "")
        .join("")
        .trim();
    } finally {
      clearTimeout(timeout);
    }

    if (!replyText) {
      return jsonResponse(
        { error: "The assistant is unavailable right now. Please use the booking form instead." },
        502,
        securityHeaders,
      );
    }

    // Condition 2: boundary enforcement on the full reply, before return.
    const guarded = enforceShopBoundary(replyText);
    if (guarded.violations.length > 0) {
      console.warn(
        `shop-talk boundary guard replaced a reply (conversation ${conversationId}):`,
        guarded.violations.join(", "),
      );
    }

    // Condition 4: log the conversation as actually delivered (post-guard).
    const transcript: ChatMessage[] = [
      ...messages,
      { role: "assistant", content: guarded.text },
    ];
    await logConversation(conversationId, transcript);

    return jsonResponse(
      { reply: guarded.text, conversationId },
      200,
      securityHeaders,
    );
  } catch (err) {
    console.error("shop-talk error:", err);
    return jsonResponse(
      { error: "The assistant is unavailable right now. Please use the booking form instead." },
      500,
      securityHeaders,
    );
  }
});
