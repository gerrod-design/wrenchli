import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NotificationPrefs {
  email_recalls: boolean;
  inapp_recalls: boolean;
}

const DEFAULTS: NotificationPrefs = { email_recalls: true, inapp_recalls: true };

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
        setPrefs({
          email_recalls: (data as any).email_recalls,
          inapp_recalls: (data as any).inapp_recalls,
        });
      } else {
        // Create default row
        await supabase
          .from("notification_preferences" as any)
          .insert({ user_id: user.id, email_recalls: true, inapp_recalls: true });
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
