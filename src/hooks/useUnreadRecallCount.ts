import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Returns the total count of unread recall_alerts across all user vehicles. */
export function useUnreadRecallCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }

    let cancelled = false;

    (async () => {
      // Get user's vehicle IDs first
      const { data: vehicles } = await supabase
        .from("user_vehicles")
        .select("id")
        .eq("is_active", true);

      if (cancelled || !vehicles?.length) return;

      const vehicleIds = vehicles.map((v: { id: string }) => v.id);
      const { count: unread, error } = await supabase
        .from("recall_alerts")
        .select("id", { count: "exact", head: true })
        .in("vehicle_id", vehicleIds)
        .eq("is_read", false);

      if (!cancelled && !error) {
        setCount(unread ?? 0);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  return count;
}
