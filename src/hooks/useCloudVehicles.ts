import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CloudVehicle {
  id: string;
  user_id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  nickname: string | null;
  current_mileage: number | null;
  is_active: boolean;
  is_primary: boolean;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useCloudVehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<CloudVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchVehicles = useCallback(async () => {
    if (!user) {
      setVehicles([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("user_vehicles")
        .select("id, user_id, year, make, model, trim, nickname, current_mileage, is_active, is_primary, photo_url, created_at, updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setVehicles((data as CloudVehicle[]) || []);
    } catch (err) {
      console.error("[useCloudVehicles] error:", err);
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
      setLoading(false);
    }
  }, [user, fetchVehicles]);

  const deleteVehicle = useCallback(async (vehicleId: string) => {
    const { error } = await supabase
      .from("user_vehicles")
      .update({ is_active: false })
      .eq("id", vehicleId);
    if (error) {
      console.error("[useCloudVehicles] delete error:", error);
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
      console.error("[useCloudVehicles] update error:", error);
      return false;
    }
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, ...updates } : v))
    );
    return true;
  }, []);

  return { vehicles, loading, fetchVehicles, deleteVehicle, updateVehicle };
}
