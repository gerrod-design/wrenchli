// Client helpers for the /for-shops/talk inbound page (Option B inbound
// layer, build spec 2026-11-02). Talks to the shop-talk and
// shop-booking-request edge functions. The single config source stays
// server-side (supabase/functions/_shared/shop-talk-config.ts); the page
// fetches the public slice (greeting, windows, pending notice) at runtime.

export interface ShopTalkWindow {
  id: string;
  label: string;
}

export interface ShopTalkPublicConfig {
  greeting: string;
  windows: ShopTalkWindow[];
  bookingPendingNotice: string;
}

export interface ShopTalkMessage {
  role: "user" | "assistant";
  content: string;
}

export interface BookingRequestInput {
  contactName: string;
  shopName: string;
  contactPhone?: string;
  contactEmail?: string;
  preferredWindows: string[];
  notes?: string;
  conversationId?: string | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

function functionHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: PUBLISHABLE_KEY,
    Authorization: `Bearer ${PUBLISHABLE_KEY}`,
  };
}

async function readJson(resp: Response): Promise<Record<string, unknown>> {
  try {
    return (await resp.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Public config (greeting, appointment windows, pending notice). */
export async function fetchShopTalkConfig(): Promise<ShopTalkPublicConfig> {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/shop-talk`, {
    method: "GET",
    headers: functionHeaders(),
  });
  if (!resp.ok) throw new Error(`shop-talk config failed: ${resp.status}`);
  const data = await readJson(resp);
  return {
    greeting: String(data.greeting ?? ""),
    windows: Array.isArray(data.windows)
      ? (data.windows as ShopTalkWindow[])
      : [],
    bookingPendingNotice: String(data.bookingPendingNotice ?? ""),
  };
}

/** One assistant turn. Returns the (guard-filtered) reply text. */
export async function sendShopTalkMessage(
  messages: ShopTalkMessage[],
  conversationId: string,
): Promise<string> {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/shop-talk`, {
    method: "POST",
    headers: functionHeaders(),
    body: JSON.stringify({ messages, conversationId }),
  });
  const data = await readJson(resp);
  if (!resp.ok || typeof data.reply !== "string") {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "The assistant is unavailable right now.",
    );
  }
  return data.reply;
}

/** Submit a booking request. Resolves with the PENDING status on success. */
export async function submitShopBookingRequest(
  input: BookingRequestInput,
): Promise<{ status: string; requestId: string }> {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/shop-booking-request`, {
    method: "POST",
    headers: functionHeaders(),
    body: JSON.stringify(input),
  });
  const data = await readJson(resp);
  if (!resp.ok || data.success !== true) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "We could not save your request. Please try again.",
    );
  }
  return { status: String(data.status ?? "PENDING"), requestId: String(data.requestId ?? "") };
}
