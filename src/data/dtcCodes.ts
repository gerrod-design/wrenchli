/**
 * dtcCodes.ts
 * ---------------------------------------------------------------------------
 * Web-side entry point for the shared trouble-code library. The data
 * itself lives with the edge functions (supabase/functions/_shared/
 * dtc-codes.ts) so the web app and the MCP code lookup tool read the
 * SAME library, the same way src/lib/priceBook.ts fronts the shared
 * price book. Import from here in web code, as before.
 * ---------------------------------------------------------------------------
 */
export {
  dtcDatabase,
  parseDtcCodes,
  getDtcEntry,
  getDtcDescription,
  isValidDtcPattern,
  DTC_REPAIR_MAP,
  getDtcRepairId,
} from "../../supabase/functions/_shared/dtc-codes";
export type {
  DtcUrgency,
  DtcDiyFeasibility,
  DtcCategory,
  DtcEntry,
} from "../../supabase/functions/_shared/dtc-codes";
