import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NotificationPrefs {
  email_recalls: boolean;
  inapp_recalls: boolean;
  email_maintenance: boolean;
  inapp_maintenance: boolean;
  email_market_value: boolean;
  inapp_market_value: boolean;
}

const DEFAULTS: NotificationPrefs = {
  email_recalls: true,
  inapp_recalls: true,
  email_maintenance: true,
  inapp_maintenance: true,
  email_market_value: true,
  inapp_market_value: true,
};

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("notification_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const d = data as any;
        setPrefs({
          email_recalls: d.email_recalls,
          inapp_recalls: d.inapp_recalls,
          email_maintenance: d.email_maintenance,
          inapp_maintenance: d.inapp_maintenance,
          email_market_value: d.email_market_value,
          inapp_market_value: d.inapp_market_value,
        });
      } else {
        // Create default row
        await supabase
          .from("notification_preferences" as any)
          .insert({ user_id: user.id, ...DEFAULTS });
      }
    } catch (err) {
      console.warn("Failed to fetch notification preferences:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const updatePref = useCallback(async (key: keyof NotificationPrefs, value: boolean) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setPrefs((prev) => ({ ...prev, [key]: value }));

      const { error } = await supabase
        .from("notification_preferences" as any)
        .update({ [key]: value })
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (err) {
      console.warn("Failed to update preference:", err);
      // Revert on error
      setPrefs((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setSaving(false);
    }
  }, []);

  return { prefs, loading, saving, updatePref };
}
