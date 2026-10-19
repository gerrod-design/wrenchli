import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGarage, type GarageVehicle } from "@/hooks/useGarage";
import { toast } from "sonner";

export interface CloudVehicle {
  id: string;
  user_id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  engine: string | null;
  transmission: string | null;
  drive_type: string | null;
  fuel_type: string | null;
  vin: string | null;
  body_type: string | null;
  color: string | null;
  nickname: string | null;
  location_zip: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  purchase_mileage: number | null;
  driving_style: string | null;
  annual_mileage_estimate: number | null;
  usage_type: string | null;
  // Batch 5 (R-57): per-field provenance stamps for the profile fields
  // above — { <field>: { source, recorded_at } }. A non-null profile value
  // without a stamp is rejected by the database gatekeeper.
  profile_provenance: Record<string, { source: string; recorded_at: string }> | null;
  // Batch 5 (spec SS5): VIN-decoded identity, stored separately from the
  // display strings. Recall/maintenance logic reads these, never `model`.
  vin_decoded_line: string | null;
  vin_decoded_trim: string | null;
  vin_decoded_series: string | null;
  vin_decoded_body: string | null;
  vin_decoded_drivetrain: string | null;
  vin_decoded_year: number | null;
  vin_decoded_make: string | null;
  vin_decode_provider: string | null;
  vin_decoded_at: string | null;
  vin_trim_known_gap: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Bridges the existing localStorage garage with cloud storage.
 * - Always reads from localStorage (source of truth for guests).
 * - When authenticated, syncs localStorage vehicles → cloud on demand.
 * - Provides cloud-only features: mileage tracking, ownership details, etc.
 */
export function useGarageSync() {
  const { user } = useAuth();
  const garage = useGarage();
  const [cloudVehicles, setCloudVehicles] = useState<CloudVehicle[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const isAuthenticated = !!user;

  // Fetch cloud vehicles on auth
  const fetchCloudVehicles = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_vehicles")
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setCloudVehicles((data as CloudVehicle[]) || []);
    } catch (err) {
      console.error("[GarageSync] fetch error:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetchCloudVehicles();
    }
    if (!user) {
      hasFetched.current = false;
      setCloudVehicles([]);
    }
  }, [user, fetchCloudVehicles]);

  // Sync localStorage vehicles to cloud
  const syncToCloud = useCallback(async () => {
    if (!user) return;
    setSyncing(true);

    let synced = 0;
    try {
      for (const local of garage.vehicles) {
        // Check if already exists in cloud
        const exists = cloudVehicles.some(
          (cv) =>
            cv.year === parseInt(local.year) &&
            cv.make === local.make &&
            cv.model === local.model &&
            (cv.trim || "") === (local.trim || "")
        );
        if (exists) continue;

        const { error } = await supabase.from("user_vehicles").insert({
          user_id: user.id,
          year: parseInt(local.year),
          make: local.make,
          model: local.model,
          trim: local.trim || null,
          engine: local.engine || null,
          transmission: local.transmission || null,
          drive_type: local.driveType || null,
          fuel_type: local.fuelType || null,
          vin: local.vin || null,
          body_type: local.bodyType || null,
          color: local.color || null,
          nickname: local.nickname || null,
        });

        if (error && error.code !== "23505") {
          console.error("[GarageSync] insert error:", error);
        } else {
          synced++;
        }
      }

      await fetchCloudVehicles();
      setLastSyncAt(new Date().toISOString());

      if (synced > 0) {
        toast.success(`Synced ${synced} vehicle${synced > 1 ? "s" : ""} to cloud`);
      } else {
        toast.info("All vehicles already synced");
      }
    } catch (err) {
      console.error("[GarageSync] sync error:", err);
      toast.error("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }, [user, garage.vehicles, cloudVehicles, fetchCloudVehicles]);

  // Record a mileage reading for a cloud vehicle (Batch 5, R-50).
  // Mileage is an append-only ledger fact with a source — never a bare
  // attribute write. The database gatekeeper rejects unsourced writes.
  const addMileageReading = useCallback(
    async (
      vehicleId: string,
      reading: {
        odometer_value: number;
        unit: "mi" | "km";
        reading_date: string;
        source: "owner_reported" | "dashboard_photo" | "shop_document" | "purchase_document";
        source_detail?: string | null;
        layer?: "reported" | "observed";
        outlier_confirmed?: boolean;
      }
    ) => {
      if (!user) return false;
      const { error } = await supabase.from("vehicle_mileage_readings").insert({
        vehicle_id: vehicleId,
        owner_user_id: user.id,
        odometer_value: reading.odometer_value,
        unit: reading.unit,
        reading_date: reading.reading_date,
        source: reading.source,
        source_detail: reading.source_detail ?? null,
        layer: reading.layer ?? "reported",
        outlier_confirmed: reading.outlier_confirmed ?? false,
      });
      if (error) {
        toast.error("Failed to record mileage");
        return false;
      }
      return true;
    },
    [user]
  );

  // Update vehicle details (ownership, preferences)
  const updateVehicleDetails = useCallback(
    async (vehicleId: string, updates: Partial<CloudVehicle>) => {
      if (!user) return;
      const { error } = await supabase
        .from("user_vehicles")
        .update(updates)
        .eq("id", vehicleId);

      if (error) {
        toast.error("Failed to update vehicle");
        return;
      }
      await fetchCloudVehicles();
    },
    [user, fetchCloudVehicles]
  );

  // Find cloud vehicle matching a local one
  const findCloudVehicle = useCallback(
    (local: GarageVehicle): CloudVehicle | undefined => {
      return cloudVehicles.find(
        (cv) =>
          cv.year === parseInt(local.year) &&
          cv.make === local.make &&
          cv.model === local.model
      );
    },
    [cloudVehicles]
  );

  return {
    // Local garage (always available)
    ...garage,
    // Cloud features (authenticated only)
    isAuthenticated,
    cloudVehicles,
    syncing,
    lastSyncAt,
    syncToCloud,
    addMileageReading,
    updateVehicleDetails,
    findCloudVehicle,
    fetchCloudVehicles,
  };
}
