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

// R-51 (Batch 1.5): the persisted outcome of the last NHTSA check per
// vehicle. A vehicle with no row here has never completed a check; a row
// with status "failed" means the check ran and could not be completed.
// Both states must render as "recall status unavailable" — never as a
// silent zero recalls.
export interface RecallCheck {
  vehicle_id: string;
  status: string;
  checked_at: string;
  campaigns_found: number | null;
  model_used: string | null;
  note: string | null;
  error: string | null;
}

export function useVehicleRecalls(vehicleIds: string[]) {
  const { user } = useAuth();
  const [recalls, setRecalls] = useState<RecallAlert[]>([]);
  const [recallChecks, setRecallChecks] = useState<Record<string, RecallCheck>>({});
  const [loading, setLoading] = useState(false);

  const fetchRecalls = useCallback(async () => {
    if (!user || vehicleIds.length === 0) {
      setRecalls([]);
      setRecallChecks({});
      return;
    }
    setLoading(true);
    try {
      // Batch 5 / R-28 rider: the alerts and checks queries are
      // independent — run them concurrently instead of serially.
      const [alertsResult, checksResult] = await Promise.all([
        supabase
          .from("recall_alerts")
          .select("*")
          .in("vehicle_id", vehicleIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("vehicle_recall_checks")
          .select("*")
          .in("vehicle_id", vehicleIds),
      ]);
      if (alertsResult.error) throw alertsResult.error;
      const { data, error } = alertsResult;
      setRecalls((data as RecallAlert[]) || []);

      const { data: checkData, error: checkError } = checksResult;
      if (checkError) throw checkError;
      const byVehicle: Record<string, RecallCheck> = {};
      for (const row of (checkData as RecallCheck[]) || []) {
        byVehicle[row.vehicle_id] = row;
      }
      setRecallChecks(byVehicle);
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

  // Vehicles whose recall status cannot be asserted: the last check failed
  // or no check has ever completed.
  const recallUnavailableVehicleIds = vehicleIds.filter((id) => {
    const check = recallChecks[id];
    return !check || check.status !== "ok";
  });

  return { recalls, recallChecks, recallUnavailableVehicleIds, loading, fetchRecalls, markAsRead, unreadCount, unreadByVehicle };
}
