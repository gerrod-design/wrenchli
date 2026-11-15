/**
 * Repair financing — partner surface (client side).
 *
 * Model of record (financing-journey-design-2026-11-14.md):
 *  - Wrenchli is the referral / verification / outcome-reporting
 *    layer. The partner is the lender of record; Wrenchli never
 *    lends and never makes a credit decision.
 *  - 24% APR ceiling for qualifying presentation (enforced in the
 *    database predicate; mirrored here for admin/simulation views
 *    so exclusions can be SHOWN with their reason, never silent).
 *  - No PII crosses to a partner: the partner-facing payload is
 *    exactly { token, amount_band, repair_category }.
 *  - Mock partners exist only for simulation and are excluded from
 *    every public query at the data layer.
 */
import { supabase } from "@/integrations/supabase/client";

export const FINANCING_APR_CEILING = 24;

export type FinancingPartnerType =
  | "credit_union"
  | "community_bank"
  | "large_bank"
  | "fintech"
  | "fund";

export type FinancingOutcomeKind =
  | "applied"
  | "approved"
  | "declined"
  | "funded"
  | "repair_completed";

export interface PublicFinancingPartner {
  id: string;
  name: string;
  partner_type: FinancingPartnerType;
  zero_percent_tier: boolean;
  apr_percent: number | null;
  term_months: number | null;
  min_amount_cents: number | null;
  max_amount_cents: number | null;
  rank_order: number;
}

export interface SimulationFinancingOption extends PublicFinancingPartner {
  qualifies: boolean;
  exclusion_reason: string | null;
}

export interface FinancingPartnerPayload {
  token: string;
  amount_band: string;
  repair_category: string | null;
}

export const PARTNER_TYPE_LABELS: Record<FinancingPartnerType, string> = {
  credit_union: "Credit union",
  community_bank: "Community bank",
  large_bank: "Bank",
  fintech: "Financing provider",
  fund: "Repair fund",
};

/** The ceiling rule, mirrored from the SQL predicate for display. */
export function partnerQualifies(partner: {
  zero_percent_tier: boolean;
  apr_percent: number | null;
}): boolean {
  return (
    partner.zero_percent_tier ||
    (partner.apr_percent !== null && partner.apr_percent <= FINANCING_APR_CEILING)
  );
}

/** Why a partner is excluded from qualifying presentation (or null). */
export function partnerExclusionReason(partner: {
  zero_percent_tier: boolean;
  apr_percent: number | null;
}): string | null {
  if (partnerQualifies(partner)) return null;
  return `excluded: ${partner.apr_percent}% APR exceeds the ${FINANCING_APR_CEILING}% APR ceiling`;
}

/** Amount banding, identical boundaries to the SQL function. */
export function amountBandFor(amountCents: number | null | undefined): string {
  if (amountCents === null || amountCents === undefined || amountCents < 25000)
    return "under_250";
  if (amountCents < 50000) return "250_500";
  if (amountCents < 100000) return "500_1000";
  if (amountCents < 200000) return "1000_2000";
  return "2000_plus";
}

export const AMOUNT_BAND_LABELS: Record<string, string> = {
  under_250: "under $250",
  "250_500": "$250 to $500",
  "500_1000": "$500 to $1,000",
  "1000_2000": "$1,000 to $2,000",
  "2000_plus": "$2,000 and up",
};

/**
 * Build the partner-facing payload for a referral.
 *
 * This is the ONLY shape that leaves Wrenchli toward a partner.
 * It deliberately accepts the customer record so the call sites
 * read naturally — and deliberately never reads a single identity
 * field from it. The sentinel test plants name / email / phone /
 * address values on the customer record and asserts none of them
 * (and none of their keys) appear in this payload.
 */
export function buildPartnerPayload(args: {
  token: string;
  amountCents: number | null;
  repairCategory: string | null;
  customer?: Record<string, unknown> | null;
}): FinancingPartnerPayload {
  return {
    token: args.token,
    amount_band: amountBandFor(args.amountCents),
    repair_category: args.repairCategory,
  };
}

/** Substitute the referral token into a partner link template. */
export function buildPartnerUrl(template: string, token: string): string {
  return template.replace("{token}", token);
}

/** Plain-language terms line for an option card. */
export function partnerTermsLine(partner: {
  zero_percent_tier: boolean;
  apr_percent: number | null;
  term_months: number | null;
}): string {
  const rate = partner.zero_percent_tier
    ? "0% APR tier"
    : `${partner.apr_percent}% APR`;
  return partner.term_months ? `${rate} · ${partner.term_months} months` : rate;
}

/* ------------------------------------------------------------------ */
/* Data access (all registry reads/writes go through the SQL layer)    */
/* ------------------------------------------------------------------ */

export async function fetchPublicFinancingPartners(
  amountCents?: number | null,
): Promise<PublicFinancingPartner[]> {
  const { data, error } = await supabase.rpc(
    "list_public_financing_partners" as any,
    { p_amount_cents: amountCents ?? null } as any,
  );
  if (error) throw error;
  return (data ?? []) as PublicFinancingPartner[];
}

export async function fetchSimulationFinancingOptions(
  amountCents?: number | null,
): Promise<SimulationFinancingOption[]> {
  const { data, error } = await supabase.rpc(
    "list_simulation_financing_options" as any,
    { p_amount_cents: amountCents ?? null } as any,
  );
  if (error) throw error;
  return (data ?? []) as SimulationFinancingOption[];
}

export interface CreatedFinancingReferral {
  token: string;
  partner_url: string;
  amount_band: string;
}

export async function createFinancingReferral(args: {
  partnerId: string;
  amountCents: number | null;
  repairCategory?: string | null;
  simulation?: boolean;
}): Promise<CreatedFinancingReferral> {
  const { data, error } = await supabase.rpc("create_financing_referral" as any, {
    p_partner_id: args.partnerId,
    p_amount_cents: args.amountCents,
    p_repair_category: args.repairCategory ?? null,
    p_simulation: args.simulation ?? false,
  } as any);
  if (error) throw error;
  const row = (data as CreatedFinancingReferral[])[0];
  if (!row) throw new Error("referral was not created");
  return row;
}

export async function reportFinancingOutcome(
  token: string,
  kind: FinancingOutcomeKind,
): Promise<{ outcome_id: string; source: string }> {
  const { data, error } = await supabase.rpc("report_financing_outcome" as any, {
    p_token: token,
    p_kind: kind,
  } as any);
  if (error) throw error;
  const row = (data as { outcome_id: string; source: string }[])[0];
  if (!row) throw new Error("outcome was not recorded");
  return row;
}

export interface FinancingOutcomeReportRow {
  partner_id: string;
  partner_name: string;
  partner_type: FinancingPartnerType;
  is_mock: boolean;
  referrals_sent: number;
  applied: number;
  approved: number;
  declined: number;
  funded: number;
  repair_completed: number;
}

export async function fetchFinancingOutcomeReport(): Promise<
  FinancingOutcomeReportRow[]
> {
  const { data, error } = await supabase.rpc("financing_outcome_report" as any);
  if (error) throw error;
  return (data ?? []) as FinancingOutcomeReportRow[];
}
