import { supabase } from "@/integrations/supabase/client";
import type { JourneyPlan, JourneySituationInput, JourneyStepKey } from "./journeyPlan";

export interface JourneyPlanRow {
  id: string;
  user_id: string;
  vehicle_id: string;
  assessment_id: string | null;
  downtime_days_min: number;
  downtime_days_max: number;
  daily_distance_miles: number;
  budget_tier: 'low' | 'medium' | 'high';
  vehicle_drivable: boolean;
  metro_area: 'detroit' | 'columbus' | 'other';
  issue_category: string | null;
  plan_snapshot: JourneyPlan;
  layer: 'reported' | 'observed';
  source_type: 'owner' | 'technician' | 'shop' | 'document' | 'system';
  created_at: string;
  updated_at: string;
}

export interface VehicleServiceContractRow {
  id: string;
  user_id: string;
  vehicle_id: string;
  provider_name: string;
  plan_name: string | null;
  coverage_notes: string | null;
  expires_on: string | null;
  layer: 'reported' | 'observed';
  source_type: 'owner' | 'technician' | 'shop' | 'document' | 'system';
  created_at: string;
  updated_at: string;
}

export interface ServiceContractInput {
  providerName: string;
  planName?: string;
  coverageNotes?: string;
  expiresOn?: string; // ISO date or undefined
}

interface JourneyPlanSelectionRow {
  id: string;
  journey_plan_id: string;
  user_id: string;
  step: JourneyStepKey;
  option_key: string;
  note: string | null;
  layer: 'reported' | 'observed';
  source_type: 'owner' | 'technician' | 'shop' | 'document' | 'system';
  created_at: string;
}

interface ShopCapabilityRow {
  capability: string;
}

// The tables backing this module (migration 20261015120000_journey_plan.sql) are
// not yet present in the generated Supabase types. Once the types regenerate,
// this helper and the local row interfaces above can be removed in favor of
// the typed `supabase.from(...)` calls.
const fromTable = (name: string) => (supabase.from as unknown as (t: string) => any)(name);

export async function saveJourneyPlan(
  userId: string,
  vehicleId: string,
  input: JourneySituationInput,
  plan: JourneyPlan,
  assessmentId?: string
): Promise<JourneyPlanRow> {
  const { data, error } = await fromTable('journey_plans')
    .insert({
      user_id: userId,
      vehicle_id: vehicleId,
      assessment_id: assessmentId ?? null,
      downtime_days_min: input.downtimeDaysMin,
      downtime_days_max: input.downtimeDaysMax,
      daily_distance_miles: input.dailyDistanceMiles,
      budget_tier: input.budgetTier,
      vehicle_drivable: input.vehicleDrivable,
      metro_area: input.metroArea,
      issue_category: input.issueCategory ?? null,
      plan_snapshot: plan,
      layer: 'reported',
      source_type: 'owner',
    })
    .select()
    .single();

  if (error) throw error;
  return data as JourneyPlanRow;
}

export async function getLatestJourneyPlanForVehicle(vehicleId: string): Promise<JourneyPlanRow | null> {
  const { data, error } = await fromTable('journey_plans')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as JourneyPlanRow | null) ?? null;
}

export async function saveJourneyPlanSelection(
  userId: string,
  journeyPlanId: string,
  step: JourneyStepKey,
  optionKey: string,
  note?: string
): Promise<void> {
  const { error } = await fromTable('journey_plan_selections').insert({
    journey_plan_id: journeyPlanId,
    user_id: userId,
    step,
    option_key: optionKey,
    note: note ?? null,
    layer: 'reported',
    source_type: 'owner',
  });

  if (error) throw error;
}

export async function getServiceContracts(vehicleId: string): Promise<VehicleServiceContractRow[]> {
  const { data, error } = await fromTable('vehicle_service_contracts')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as VehicleServiceContractRow[] | null) ?? [];
}

export async function saveServiceContract(
  userId: string,
  vehicleId: string,
  contract: ServiceContractInput
): Promise<VehicleServiceContractRow> {
  const { data, error } = await fromTable('vehicle_service_contracts')
    .insert({
      user_id: userId,
      vehicle_id: vehicleId,
      provider_name: contract.providerName,
      plan_name: contract.planName ?? null,
      coverage_notes: contract.coverageNotes ?? null,
      expires_on: contract.expiresOn ?? null,
      layer: 'reported',
      source_type: 'owner',
    })
    .select()
    .single();

  if (error) throw error;
  return data as VehicleServiceContractRow;
}

export async function getShopCapabilities(shopId: string): Promise<string[]> {
  // Capabilities are display-only badges. A read failure here must never
  // break the page, so swallow errors and simply hide the badges.
  try {
    const { data, error } = await fromTable('shop_capabilities')
      .select('capability')
      .eq('shop_id', shopId);

    if (error) return [];
    return ((data as ShopCapabilityRow[] | null) ?? []).map((row) => row.capability);
  } catch {
    return [];
  }
}
