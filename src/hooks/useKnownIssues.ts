import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VEHICLE_KNOWN_ISSUES, RELIABLE_BRANDS, getRelevantIssues, type KnownIssue } from "@/data/vehicleKnownIssues";

interface DbKnownIssue {
  id: string;
  make: string;
  description: string;
  mileage_min: number | null;
  mileage_max: number | null;
  severity: string;
  estimated_cost: string | null;
  category: string | null;
}

// Hook to fetch known issues from DB with static fallback
export function useKnownIssues(make: string, mileage?: number | null) {
  const [issues, setIssues] = useState<{ relevant: KnownIssue[]; upcoming: KnownIssue[] }>({ relevant: [], upcoming: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!make) {
      setIssues({ relevant: [], upcoming: [] });
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchFromDb() {
      try {
        const { data, error } = await supabase
          .from("vehicle_known_issues" as any)
          .select("id, make, description, mileage_min, mileage_max, severity, estimated_cost, category")
          .eq("make", make)
          .eq("status", "approved");

        if (error || !data || data.length === 0) throw new Error("No DB data");

        const dbIssues: KnownIssue[] = (data as DbKnownIssue[]).map((d) => ({
          issue: d.description,
          minMiles: d.mileage_min || 0,
          maxMiles: d.mileage_max || 999999,
          preventiveCost: "N/A",
          repairCost: d.estimated_cost || "N/A",
          severity: (d.severity as "low" | "medium" | "high") || "medium",
          systems: d.category || "general",
        }));

        if (cancelled) return;

        if (!mileage) {
          setIssues({ relevant: dbIssues, upcoming: [] });
        } else {
          const relevant = dbIssues.filter(i => mileage >= i.minMiles - 15000 && mileage <= i.maxMiles);
          const upcoming = dbIssues.filter(i => mileage < i.minMiles - 15000);
          setIssues({ relevant, upcoming });
        }
      } catch {
        // Fallback to static data
        if (!cancelled) {
          setIssues(getRelevantIssues(make, mileage));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFromDb();
    return () => { cancelled = true; };
  }, [make, mileage]);

  return { ...issues, loading };
}

// Hook to get total brand count from DB
export function useKnownIssuesBrandCount() {
  const [count, setCount] = useState(Object.keys(VEHICLE_KNOWN_ISSUES).length);

  useEffect(() => {
    supabase
      .from("vehicle_known_issues" as any)
      .select("make")
      .eq("status", "approved")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const unique = new Set((data as any[]).map(d => d.make));
          setCount(unique.size);
        }
      });
  }, []);

  return count;
}

export { RELIABLE_BRANDS };
