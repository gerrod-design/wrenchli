import { supabase } from "@/integrations/supabase/client";

interface ClickEvent {
  click_type: string;
  item_id?: string;
  item_title?: string;
  item_brand?: string;
  item_category?: string;
  item_price?: string;
  diagnosis_title?: string;
  diagnosis_code?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  source?: string;
  placement?: string;
}

export function trackAdClick(event: ClickEvent) {
  // Fire-and-forget — don't block the UI
  supabase
    .from("ad_click_events" as any)
    .insert(event as any)
    .then(({ error }) => {
      if (error) console.error("Ad click tracking error:", error);
    });
}
