import type { Msg } from "./types";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const MAX_MESSAGES_TO_SEND = 60;
// How long to wait for the chat endpoint to answer at all.
const FETCH_TIMEOUT_MS = 90_000;
// How long to go without receiving any bytes mid-stream before giving up.
const IDLE_TIMEOUT_MS = 30_000;
// Initial attempt plus one automatic retry on transport failures.
const MAX_ATTEMPTS = 2;

export interface StreamErrorInfo {
  /** "transport" = the connection failed (retryable); "content" = the backend answered with an error. */
  kind: "transport" | "content";
}

/** A connection-level failure: dropped stream, stall, or timeout. Safe to retry. */
class TransportError extends Error {}

/** Read one chunk, failing as a TransportError if nothing arrives in time. */
function readWithTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  ms: number,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new TransportError("The connection stalled. Please try again.")),
      ms,
    );
    reader.read().then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      () => {
        clearTimeout(timer);
        reject(new TransportError("The connection was interrupted. Please try again."));
      },
    );
  });
}

export async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
  onRetry,
  vehicleContext,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (msg: string, info?: StreamErrorInfo) => void;
  /** Called before an automatic retry so the caller can discard partial output. */
  onRetry?: () => void;
  vehicleContext?: { year?: string; make?: string; model?: string; mileage?: number };
}) {
  // Keep only the most recent messages to stay within API limits
  const trimmedMessages = messages.length > MAX_MESSAGES_TO_SEND
    ? messages.slice(-MAX_MESSAGES_TO_SEND)
    : messages;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await runAttempt();
      onDone();
      return;
    } catch (e) {
      const transport = e instanceof TransportError;
      if (transport && attempt < MAX_ATTEMPTS) {
        console.warn(`[ChatBot] chat stream failed (attempt ${attempt}), retrying automatically…`);
        onRetry?.();
        continue;
      }
      const msg = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      console.error("[ChatBot] Chat failed:", msg);
      onError(msg, { kind: transport ? "transport" : "content" });
      return;
    }
  }

  async function runAttempt(): Promise<void> {
    const fetchController = new AbortController();
    const fetchTimer = setTimeout(() => fetchController.abort(), FETCH_TIMEOUT_MS);

    let resp: Response;
    try {
      resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: trimmedMessages, vehicleContext }),
        signal: fetchController.signal,
      });
    } catch (e) {
      throw new TransportError(
        e instanceof DOMException && e.name === "AbortError"
          ? "The reply is taking too long. Please try again."
          : "Couldn't reach the chat service. Please check your connection and try again.",
      );
    } finally {
      clearTimeout(fetchTimer);
    }

    console.log("[ChatBot] Chat response status:", resp.status);

    if (!resp.ok) {
      // The backend answered with an error — surface its message, don't retry.
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || "Something went wrong. Please try again.");
    }

    if (!resp.body) {
      throw new TransportError("No response received.");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let done = false;
    let lastDataAt = Date.now();
    let finishedCleanly = false;

    try {
      while (!done) {
        const elapsed = Date.now() - lastDataAt;
        if (elapsed >= IDLE_TIMEOUT_MS) {
          throw new TransportError("The connection stalled. Please try again.");
        }
        const { done: rd, value } = await readWithTimeout(reader, IDLE_TIMEOUT_MS - elapsed);
        if (rd) break;
        if (value && value.length > 0) lastDataAt = Date.now();
        buf += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          let parsed: { choices?: Array<{ delta?: { content?: string } }>; error?: string };
          try {
            parsed = JSON.parse(json);
          } catch {
            // JSON split across chunks — put the line back and wait for more data.
            buf = line + "\n" + buf;
            break;
          }
          // Graceful error frame from the backend (upstream hiccup mid-stream).
          if (parsed.error) {
            throw new TransportError("The reply was interrupted. Please try again.");
          }
          const c = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (c) onDelta(c);
        }
      }
      finishedCleanly = true;
    } finally {
      if (!finishedCleanly) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
      } else {
        reader.releaseLock();
      }
    }
  }
}
