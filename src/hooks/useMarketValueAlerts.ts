import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MarketValueAlert {
  id: string;
  vehicle_id: string;
  previous_value: number;
  current_value: number;
  change_percent: number;
  change_direction: "increase" | "decrease";
  summary: string;
  is_read: boolean;
  created_at: string;
}

export function useMarketValueAlerts() {
  const [alerts, setAlerts] = useState<MarketValueAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const fetchAlerts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAlerts([]); setLoading(false); return; }

      // Check preferences
      const { data: prefData } = await supabase
        .from("notification_preferences" as any)
        .select("inapp_market_value")
        .eq("user_id", user.id)
        .maybeSingle();

      const enabled = (prefData as any)?.inapp_market_value ?? true;
      if (!enabled) { setAlerts([]); setLoading(false); return; }

      const { data, error } = await supabase
        .from("market_value_alerts" as any)
        .select("*")
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts((data as any[]) || []);
    } catch (err) {
      console.warn("Failed to fetch market value alerts:", err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => fetchAlerts());
    return () => subscription.unsubscribe();
  }, [fetchAlerts]);

  const markAsRead = useCallback(async (alertId: string) => {
    await supabase.from("market_value_alerts" as any).update({ is_read: true }).eq("id", alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const markAllAsRead = useCallback(async () => {
    const ids = alerts.map((a) => a.id);
    if (ids.length === 0) return;
    await supabase.from("market_value_alerts" as any).update({ is_read: true }).in("id", ids);
    setAlerts([]);
  }, [alerts]);

  return { alerts, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchAlerts };
}
