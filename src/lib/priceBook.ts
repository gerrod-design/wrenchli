/**
 * priceBook.ts
 * ---------------------------------------------------------------------------
 * R-68 (book-only pricing): the web client reads the SAME shared price book
 * the edge functions use (supabase/functions/_shared/repair-rates.ts), so a
 * price can only ever be displayed when it comes from the book. Client-side
 * tables (symptom library, preliminary ranges) consult this module instead
 * of carrying their own invented figures.
 *
 * The renderer decision everywhere is: pinned (rate_source set /
 * price_status "book") → show the price; absent or "not_in_book" → render
 * NOT_IN_BOOK_MESSAGE and no price.
 * ---------------------------------------------------------------------------
 */
export {
  findRepairRate,
  rateFigures,
  formatMoneyRange,
  REPAIR_RATES,
  RATE_SOURCE_ID,
  PRICE_STATUS_BOOK,
  PRICE_STATUS_NOT_IN_BOOK,
  NOT_IN_BOOK_MESSAGE,
} from "../../supabase/functions/_shared/repair-rates";
export type { PriceStatus } from "../../supabase/functions/_shared/repair-rates";

/** True only when a result was priced from the book. Absent signal = not priced. */
export function isBookPriced(result: {
  rate_source?: string | null;
  price_status?: string | null;
}): boolean {
  return result.price_status === "book" || Boolean(result.rate_source);
}
