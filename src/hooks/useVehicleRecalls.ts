import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RecallAlert {
  id: string;
  vehicle_id: string;
  nhtsa_id: string | null;
  campaign_number: string;
  component: string;
  summary: string;
  consequence: string | null;
  remedy: string | null;
  is_read: boolean;
  created_at: string;
}

export function useVehicleRecalls(vehicleIds: string[]) {
  const { user } = useAuth();
  const [recalls, setRecalls] = useState<RecallAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecalls = useCallback(async () => {
    if (!user || vehicleIds.length === 0) {
      setRecalls([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recall_alerts")
        .select("*")
        .in("vehicle_id", vehicleIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRecalls((data as RecallAlert[]) || []);
    } catch (err) {
      console.error("[useVehicleRecalls] error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, vehicleIds.join(",")]);

  useEffect(() => { fetchRecalls(); }, [fetchRecalls]);

  const markAsRead = useCallback(async (recallId: string) => {
    const { error } = await supabase
      .from("recall_alerts")
      .update({ is_read: true })
      .eq("id", recallId);
    if (!error) {
      setRecalls((prev) =>
        prev.map((r) => (r.id === recallId ? { ...r, is_read: true } : r))
      );
    }
  }, []);

  const unreadCount = recalls.filter((r) => !r.is_read).length;
  const unreadByVehicle = (vehicleId: string) =>
    recalls.filter((r) => r.vehicle_id === vehicleId && !r.is_read).length;

  return { recalls, loading, fetchRecalls, markAsRead, unreadCount, unreadByVehicle };
}
