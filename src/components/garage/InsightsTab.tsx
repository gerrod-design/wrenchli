import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Shield, DollarSign, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { RELIABLE_BRANDS, getRelevantIssues } from "@/data/vehicleKnownIssues";
import type { GarageVehicle } from "@/hooks/useGarage";
import type { CloudVehicle } from "@/hooks/useGarageSync";

interface Props {
  vehicle: GarageVehicle;
  cloudVehicle?: CloudVehicle;
  isAuthenticated: boolean;
}

export default function InsightsTab({ vehicle, cloudVehicle, isAuthenticated }: Props) {
  // Fetch maintenance cost data for chart
  const [costData, setCostData] = useState<{ month: string; cost: number }[]>([]);
  const [loadingCosts, setLoadingCosts] = useState(false);

  useEffect(() => {
    if (!cloudVehicle || !isAuthenticated) return;
    setLoadingCosts(true);
    supabase
      .from("maintenance_records")
      .select("service_date, cost")
      .eq("vehicle_id", cloudVehicle.id)
      .not("cost", "is", null)
      .order("service_date", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Group by month
          const grouped: Record<string, number> = {};
          data.forEach((r) => {
            const d = new Date(r.service_date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            grouped[key] = (grouped[key] || 0) + Number(r.cost);
          });
          setCostData(
            Object.entries(grouped).map(([month, cost]) => ({
              month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
              cost: Math.round(cost),
            }))
          );
        } else {
          setCostData([]);
        }
        setLoadingCosts(false);
      });
  }, [cloudVehicle, isAuthenticated]);

  const year = parseInt(vehicle.year);
  const age = new Date().getFullYear() - year;
  const mileage = cloudVehicle?.current_mileage;
  const isReliable = RELIABLE_BRANDS.includes(vehicle.make);

  // Generate insights using shared known issues database
  const { relevant: relevantIssues, upcoming: upcomingIssues } = getRelevantIssues(vehicle.make, mileage);

  // Ownership phase
  const getOwnershipPhase = () => {
    if (age <= 3) return { label: "Sweet Spot", color: "text-wrenchli-teal", desc: "Low depreciation, minimal maintenance. Best value ownership period." };
    if (age <= 6) return { label: "Mid-Life", color: "text-accent", desc: "Some maintenance costs increasing. Still good overall value." };
    if (age <= 9) return { label: "Maintenance Phase", color: "text-wrenchli-amber", desc: "Expect increased maintenance. Consider long-term plans." };
    return { label: "Decision Point", color: "text-destructive", desc: "Repair costs may exceed value. Evaluate repair vs. replace." };
  };

  const phase = getOwnershipPhase();

  if (!isAuthenticated) {
    return (
      <div className="text-center py-10">
        <TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Sign in to access personalized vehicle insights and market intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ownership Phase */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Ownership Phase</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("font-heading text-base font-bold", phase.color)}>{phase.label}</span>
          <span className="text-xs text-muted-foreground">· {age} years old</span>
        </div>
        <p className="text-xs text-muted-foreground">{phase.desc}</p>
      </div>

      {/* Reliability insight */}
      <div className={cn(
        "rounded-xl border p-4 space-y-2",
        isReliable ? "border-wrenchli-teal/20 bg-wrenchli-teal/5" : "border-border bg-card"
      )}>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Brand Reliability</h4>
        </div>
        <p className="text-xs text-muted-foreground">
          {isReliable
            ? `${vehicle.make} vehicles are known for above-average reliability. This works in your favor for long-term ownership.`
            : `${vehicle.make} vehicles have average reliability ratings. Stay on top of maintenance to maximize lifespan.`}
        </p>
      </div>

      {/* Known issues for this make at current mileage */}
      {relevantIssues.length > 0 && (
        <div className="rounded-xl border border-wrenchli-amber/20 bg-wrenchli-amber/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-wrenchli-amber" />
            <h4 className="text-sm font-semibold">
              {mileage ? "Common Issues at This Mileage" : `Known ${vehicle.make} Issues`}
            </h4>
          </div>
          {relevantIssues.map((issue, i) => (
            <div key={i} className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{issue.issue}</p>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize",
                  issue.severity === "high" ? "bg-destructive/10 text-destructive" :
                  issue.severity === "medium" ? "bg-wrenchli-amber/10 text-wrenchli-amber" :
                  "bg-muted text-muted-foreground"
                )}>
                  {issue.severity}
                </span>
              </div>
              <p className="text-muted-foreground">
                <span className="capitalize">{issue.systems}</span>
                {" · "}Preventive: <span className="text-wrenchli-teal font-medium">{issue.preventiveCost}</span>
                {" · "}Repair: <span className="text-destructive font-medium">{issue.repairCost}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming issues to watch */}
      {upcomingIssues.length > 0 && mileage && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Upcoming Issues to Watch</h4>
          </div>
          {upcomingIssues.slice(0, 3).map((issue, i) => (
            <div key={i} className="text-xs">
              <p className="font-medium text-foreground">{issue.issue}</p>
              <p className="text-muted-foreground">
                Typically {issue.minMiles.toLocaleString()}–{issue.maxMiles.toLocaleString()} mi
                {" · "}<span className="capitalize">{issue.systems}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Maintenance Cost Chart */}
      {isAuthenticated && cloudVehicle && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Maintenance Spending</h4>
          </div>
          {loadingCosts ? (
            <Skeleton className="h-40 w-full" />
          ) : costData.length > 0 ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    formatter={(value: number) => [`$${value}`, "Cost"]}
                  />
                  <Bar dataKey="cost" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6 italic">
              No maintenance records with costs yet. Add service records to see spending trends.
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Annual Cost Projection</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Current phase</p>
            <p className="font-medium">
              ~${age <= 3 ? "400–800" : age <= 6 ? "800–1,500" : age <= 9 ? "1,500–2,500" : "2,000–4,000"}/yr
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Next 2 years</p>
            <p className="font-medium">
              ~${age <= 3 ? "500–1,000" : age <= 6 ? "1,000–2,000" : age <= 9 ? "2,000–3,500" : "2,500–5,000"}/yr
            </p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          Based on average costs for {vehicle.year} {vehicle.make} {vehicle.model} vehicles.
        </p>
      </div>

      {!mileage && (
        <p className="text-xs text-muted-foreground text-center italic">
          Set your vehicle's mileage for more accurate insights.
        </p>
      )}
    </div>
  );
}
