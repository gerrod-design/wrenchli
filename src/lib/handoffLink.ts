// R-70 Tier 2 — exact linking of saved assessments to Garage vehicles;
// matching is exact (year/make/model, VIN when both sides have one) and
// ambiguity links nothing.

import { supabase } from "@/integrations/supabase/client";
import type { HandoffSnapshot } from "./handoff";

export interface VehicleIdentity {
  year: number;
  make: string;
  model: string;
  vin?: string | null;
}

export interface GarageVehicleIdentity extends VehicleIdentity {
  id: string;
}

export interface LinkedAssessmentRow {
  user_vehicle_id: string | null;
  created_at: string;
  snapshot: { completed_at?: string };
}

export interface AssessmentSummary {
  count: number;
  latestDate: string | null;
}

function normalizeName(s: string): string {
  return s.trim().toLowerCase();
}

function normalizeVin(v: string | null | undefined): string {
  return (v ?? "").trim().toUpperCase();
}

export function snapshotVehicleMatches(
  snapshotVehicle: { year: number; make: string; model: string; vin?: string },
  vehicle: VehicleIdentity
): boolean {
  if (snapshotVehicle.year !== vehicle.year) return false;
  if (normalizeName(snapshotVehicle.make) !== normalizeName(vehicle.make)) return false;
  if (normalizeName(snapshotVehicle.model) !== normalizeName(vehicle.model)) return false;

  const snapVin = normalizeVin(snapshotVehicle.vin);
  const vehVin = normalizeVin(vehicle.vin);
  if (snapVin !== "" && vehVin !== "" && snapVin !== vehVin) return false;

  return true;
}

export function selectClaimableHandoffIds(
  handoffs: Array<{ id: string; snapshot: HandoffSnapshot }>,
  addedVehicle: GarageVehicleIdentity,
  allVehicles: GarageVehicleIdentity[]
): string[] {
  const otherVehicles = allVehicles.filter((v) => v.id !== addedVehicle.id);
  const result: string[] = [];

  for (const handoff of handoffs) {
    const snapVehicle = (handoff.snapshot as unknown as { vehicle: { year: number; make: string; model: string; vin?: string } }).vehicle;
    if (!snapVehicle) continue;
    if (!snapshotVehicleMatches(snapVehicle, addedVehicle)) continue;

    const matchesOther = otherVehicles.some((v) => snapshotVehicleMatches(snapVehicle, v));
    if (matchesOther) continue;

    result.push(handoff.id);
  }

  return result;
}

export function resolveStampVehicleId(
  launch: { userVehicleId: string; year: number; make: string; model: string } | null,
  vehicle: VehicleIdentity
): string | null {
  if (!launch) return null;
  if (launch.year !== vehicle.year) return null;
  if (normalizeName(launch.make) !== normalizeName(vehicle.make)) return null;
  if (normalizeName(launch.model) !== normalizeName(vehicle.model)) return null;
  return launch.userVehicleId;
}

export function summarizeLinkedAssessments(
  rows: LinkedAssessmentRow[]
): Record<string, AssessmentSummary> {
  const result: Record<string, AssessmentSummary> = {};

  for (const row of rows) {
    if (row.user_vehicle_id === null) continue;
    const id = row.user_vehicle_id;
    const date = row.snapshot?.completed_at ?? row.created_at;

    if (!result[id]) {
      result[id] = { count: 0, latestDate: null };
    }
    result[id].count += 1;
    if (result[id].latestDate === null || date > result[id].latestDate!) {
      result[id].latestDate = date;
    }
  }

  return result;
}

export async function claimHandoffsForVehicle(vehicle: GarageVehicleIdentity): Promise<number> {
  try {
    const { data: handoffData, error: handoffError } = await supabase
      .from("assessment_handoffs")
      .select("id, snapshot")
      .is("user_vehicle_id", null);

    if (handoffError || !handoffData) return 0;

    const { data: vehicleData, error: vehicleError } = await supabase
      .from("user_vehicles")
      .select("id, year, make, model, vin");

    if (vehicleError || !vehicleData) return 0;

    const handoffs = handoffData as unknown as Array<{ id: string; snapshot: HandoffSnapshot }>;
    const vehicleRows = vehicleData as unknown as GarageVehicleIdentity[];

    const ids = selectClaimableHandoffIds(handoffs, vehicle, vehicleRows);
    if (ids.length === 0) return 0;

    const { data, error } = await supabase.functions.invoke("assessment-handoff", {
      body: {
        action: "link",
        userVehicleId: vehicle.id,
        handoffIds: ids,
      },
    });

    if (error || !data) return 0;
    return typeof data.linked === "number" ? data.linked : 0;
  } catch {
    return 0;
  }
}

export async function fetchAssessmentSummaries(
  vehicleIds: string[]
): Promise<Record<string, AssessmentSummary>> {
  if (vehicleIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from("assessment_handoffs")
      .select("user_vehicle_id, snapshot, created_at")
      .in("user_vehicle_id", vehicleIds);

    if (error || !data) return {};

    return summarizeLinkedAssessments(data as unknown as LinkedAssessmentRow[]);
  } catch {
    return {};
  }
}
