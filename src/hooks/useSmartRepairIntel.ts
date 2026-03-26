import { useState, useEffect } from "react";

export interface YouTubeQuery {
  query: string;
  label: string;
  angle: "model_specific" | "technique" | "troubleshooting";
}

export interface SmartRepairIntel {
  youtube_queries: YouTubeQuery[];
  is_common_issue: boolean;
  common_issue_reason: string;
  diy_success_rate: number;
  estimated_steps: number;
  confidence_message: string;
}

const INTEL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-repair-intel`;

export function useSmartRepairIntel(
  diagnosisTitle: string,
  diagnosisCode: string | undefined,
  vehicle: { year?: string; make?: string; model?: string } | null,
  diyCost?: string,
  shopCost?: string
): { data: SmartRepairIntel | null; loading: boolean } {
  const [data, setData] = useState<SmartRepairIntel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!diagnosisTitle) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const resp = await fetch(INTEL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            diagnosis_title: diagnosisTitle,
            diagnosis_code: diagnosisCode,
            vehicle_year: vehicle?.year,
            vehicle_make: vehicle?.make,
            vehicle_model: vehicle?.model,
            diy_cost: diyCost,
            shop_cost: shopCost,
          }),
        });

        if (!resp.ok) throw new Error("Failed to fetch repair intel");
        const json = await resp.json();
        if (!cancelled) setData(json);
      } catch (e) {
        console.error("Smart repair intel error:", e);
        // Provide sensible fallback
        if (!cancelled) {
          const vehicleStr = [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" ");
          setData({
            youtube_queries: [
              { query: `${diagnosisTitle} ${vehicleStr} DIY tutorial`, label: `${diagnosisTitle} - ${vehicleStr}`, angle: "model_specific" },
              { query: `how to fix ${diagnosisTitle} step by step`, label: `Step-by-step guide`, angle: "technique" },
              { query: `${diagnosisTitle} ${vehicleStr} troubleshooting`, label: `Troubleshooting tips`, angle: "troubleshooting" },
            ],
            is_common_issue: false,
            common_issue_reason: "",
            diy_success_rate: 75,
            estimated_steps: 8,
            confidence_message: "Many vehicle owners successfully complete this repair at home.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [diagnosisTitle, diagnosisCode, vehicle?.year, vehicle?.make, vehicle?.model, diyCost, shopCost]);

  return { data, loading };
}
