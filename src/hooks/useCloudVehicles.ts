import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { deriveLatestReading, type MileageReading } from "@/lib/mileage";

export interface CloudVehicle {
  id: string;
  user_id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  nickname: string | null;
  vin: string | null;
  is_active: boolean;
  is_primary: boolean;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  // Batch 5 (spec SS5): VIN-decoded identity, distinct from display strings.
  vin_decoded_line: string | null;
  vin_decoded_trim: string | null;
  vin_trim_known_gap: boolean;
}

export function useCloudVehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<CloudVehicle[]>([]);
  // Batch 5 (R-50): the fleet's derived latest readings, one per vehicle,
  // from the append-only ledger — the Garage list never shows a stored
  // bare mileage attribute again.
  const [latestReadings, setLatestReadings] = useState<Record<string, MileageReading | null>>({});
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchVehicles = useCallback(async () => {
    if (!user) {
      setVehicles([]);
      setLatestReadings({});
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("user_vehicles")
        .select("id, user_id, year, make, model, trim, nickname, vin, is_active, is_primary, photo_url, created_at, updated_at, vin_decoded_line, vin_decoded_trim, vin_trim_known_gap")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const list = (data as unknown as CloudVehicle[]) || [];
      setVehicles(list);
      if (list.length > 0) {
        const { data: readingRows } = await supabase
          .from("vehicle_mileage_readings")
          .select("*")
          .in("vehicle_id", list.map((v) => v.id));
        const byVehicle: Record<string, MileageReading[]> = {};
        for (const row of (readingRows ?? []) as unknown as MileageReading[]) {
          (byVehicle[row.vehicle_id] ??= []).push(row);
        }
        const derived: Record<string, MileageReading | null> = {};
        for (const v of list) derived[v.id] = deriveLatestReading(byVehicle[v.id] ?? []);
        setLatestReadings(derived);
      } else {
        setLatestReadings({});
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetchVehicles();
    }
    if (!user) {
      hasFetched.current = false;
      setVehicles([]);
      setLatestReadings({});
      setLoading(false);
    }
  }, [user, fetchVehicles]);

  const deleteVehicle = useCallback(async (vehicleId: string) => {
    const { error } = await supabase
      .from("user_vehicles")
      .update({ is_active: false })
      .eq("id", vehicleId);
    if (error) {
      return false;
    }
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    return true;
  }, []);

  const updateVehicle = useCallback(async (vehicleId: string, updates: Partial<CloudVehicle>) => {
    const { error } = await supabase
      .from("user_vehicles")
      .update(updates)
      .eq("id", vehicleId);
    if (error) {
      return false;
    }
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, ...updates } : v))
    );
    return true;
  }, []);

  return { vehicles, latestReadings, loading, fetchVehicles, deleteVehicle, updateVehicle };
}
