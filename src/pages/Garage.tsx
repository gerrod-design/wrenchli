import { useState, useEffect, useCallback } from "react";

import AddVehicleForm from "@/components/garage/AddVehicleForm";
import {
  Car, Plus, Cloud, CloudOff, RefreshCw, BarChart3,
  Wrench, TrendingUp, Settings, Gauge,
} from "lucide-react";
import SEO from "@/components/SEO";
import { useGarageSync, type CloudVehicle } from "@/hooks/useGarageSync";
import type { GarageVehicle } from "@/hooks/useGarage";
import GarageVehicleCard from "@/components/garage/GarageVehicleCard";
import GaragePrivacyNotice from "@/components/garage/GaragePrivacyNotice";
import GarageClearDialog from "@/components/garage/GarageClearDialog";
import MaintenanceTab from "@/components/garage/MaintenanceTab";
import ProactiveInsights from "@/components/ProactiveInsights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { getUpcomingMaintenance, type UpcomingMaintenance } from "@/data/maintenanceSchedule";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Garage() {
  const {
    vehicles, removeVehicle, updateNickname, updateColor, clearAll,
    isAuthenticated, cloudVehicles, syncing, syncToCloud,
    updateMileage, findCloudVehicle, fetchCloudVehicles,
  } = useGarageSync();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [mileageInput, setMileageInput] = useState("");
  const [updatingMileage, setUpdatingMileage] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [insightFilter, setInsightFilter] = useState<string | undefined>();

  const selected = vehicles[selectedIdx] as GarageVehicle | undefined;
  const cloudMatch = selected ? findCloudVehicle(selected) : undefined;
  const mileage = cloudMatch?.current_mileage ?? null;

  // Build upcoming maintenance for selected vehicle
  const upcoming: UpcomingMaintenance[] = mileage
    ? getUpcomingMaintenance(
        mileage,
        maintenanceRecords.map((r) => ({ type: r.service_type, mileage: r.mileage_at_service ?? 0 }))
      )
    : [];

  // Load maintenance records when cloud vehicle changes
  const loadRecords = useCallback(async () => {
    if (!cloudMatch) { setMaintenanceRecords([]); return; }
    const { data } = await supabase
      .from("maintenance_records")
      .select("*")
      .eq("vehicle_id", cloudMatch.id)
      .order("service_date", { ascending: false });
    setMaintenanceRecords(data || []);
  }, [cloudMatch?.id]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const handleMileageUpdate = async () => {
    if (!cloudMatch || !mileageInput.trim()) return;
    const miles = parseInt(mileageInput.replace(/\D/g, ""));
    if (!miles || miles < 0) return;
    setUpdatingMileage(true);
    await updateMileage(cloudMatch.id, miles);
    setMileageInput("");
    setUpdatingMileage(false);
    toast.success("Mileage updated");
  };

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="My Garage — Vehicle Lifecycle Advisor"
        description="Track your vehicles, maintenance history, and get proactive insights to optimize ownership costs."
        path="/garage"
      />

      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Car className="h-6 w-6 text-wrenchli-teal" />
              <h1 className="font-heading text-2xl font-bold md:text-3xl">My Garage</h1>
            </div>
            {isAuthenticated && vehicles.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={syncToCloud}
                disabled={syncing}
              >
                {syncing ? (
                  <><RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> Syncing…</>
                ) : (
                  <><Cloud className="h-3 w-3 mr-1.5" /> Sync to Cloud</>
                )}
              </Button>
            )}
          </div>

          {/* Cloud status */}
          {isAuthenticated && cloudVehicles.length > 0 && (
            <div className="flex items-center gap-2 mb-4 text-[11px] text-muted-foreground">
              <Cloud className="h-3 w-3 text-wrenchli-teal" />
              <span>{cloudVehicles.length} vehicle{cloudVehicles.length > 1 ? "s" : ""} synced to cloud</span>
            </div>
          )}

          {vehicles.length === 0 ? (
            /* Empty state */
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <Car className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h2 className="font-heading text-lg font-semibold">No vehicles saved yet</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                Add a vehicle to get started with maintenance tracking and market insights.
              </p>
              <Button onClick={() => setShowAddVehicle(true)} className="mt-6 bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90">
                <Plus className="mr-2 h-4 w-4" /> Add a Vehicle
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Vehicle cards */}
              {vehicles.map((v, i) => (
                <div
                  key={v.garageId}
                  className={cn(
                    "rounded-xl border transition-all",
                    i === selectedIdx ? "border-accent ring-1 ring-accent/30" : "border-border"
                  )}
                >
                  <div onClick={() => setSelectedIdx(i)} className="cursor-pointer">
                    <GarageVehicleCard
                      vehicle={v}
                      isActive={i === selectedIdx}
                      onRemove={removeVehicle}
                      onRename={updateNickname}
                      onColorChange={updateColor}
                      onRecallClick={() => {
                        setSelectedIdx(i);
                        setActiveTab("insights");
                        setInsightFilter("recall");
                      }}
                    />
                  </div>
                </div>
              ))}

              {vehicles.length < 5 && (
                <Button variant="outline" className="w-full h-12 border-dashed" onClick={() => setShowAddVehicle(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Another Vehicle
                </Button>
              )}

              {/* Selected vehicle detail panel */}
              {selected && (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== "insights") setInsightFilter(undefined); }} className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 px-2 h-auto flex-wrap">
                      <TabsTrigger value="overview" className="text-xs gap-1.5 data-[state=active]:bg-background">
                        <BarChart3 className="h-3 w-3" /> Overview
                      </TabsTrigger>
                      <TabsTrigger value="maintenance" className="text-xs gap-1.5 data-[state=active]:bg-background">
                        <Wrench className="h-3 w-3" /> Maintenance
                      </TabsTrigger>
                      <TabsTrigger value="insights" className="text-xs gap-1.5 data-[state=active]:bg-background">
                        <TrendingUp className="h-3 w-3" /> Insights
                      </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="p-4 space-y-4">
                      {/* Mileage card */}
                      <div className="rounded-lg border border-border bg-muted/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Gauge className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Current Mileage</span>
                        </div>
                        {cloudMatch ? (
                          <div>
                            <p className="font-heading text-2xl font-bold">
                              {mileage ? mileage.toLocaleString() : "Not set"}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Input
                                placeholder="Update mileage"
                                value={mileageInput}
                                onChange={(e) => setMileageInput(e.target.value.replace(/\D/g, ""))}
                                className="h-8 text-xs w-32"
                                inputMode="numeric"
                                onKeyDown={(e) => e.key === "Enter" && handleMileageUpdate()}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={handleMileageUpdate}
                                disabled={updatingMileage || !mileageInput.trim()}
                              >
                                Update
                              </Button>
                            </div>
                          </div>
                        ) : isAuthenticated ? (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Sync this vehicle to track mileage.
                            </p>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={syncToCloud} disabled={syncing}>
                              <Cloud className="h-3 w-3 mr-1.5" /> Sync Now
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Sign in to track mileage and maintenance.
                          </p>
                        )}
                      </div>

                      {/* Quick stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                          <p className="text-xs text-muted-foreground">Vehicle Age</p>
                          <p className="font-heading text-lg font-bold">
                            {new Date().getFullYear() - parseInt(selected.year)} years
                          </p>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                          <p className="text-xs text-muted-foreground">Service Alerts</p>
                          <p className={cn(
                            "font-heading text-lg font-bold",
                            upcoming.length > 0 ? "text-wrenchli-amber" : "text-wrenchli-teal"
                          )}>
                            {upcoming.length || "None"}
                          </p>
                        </div>
                      </div>

                      {/* Upcoming maintenance preview */}
                      {upcoming.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Upcoming Maintenance
                          </h4>
                          {upcoming.slice(0, 3).map((item) => (
                            <div
                              key={item.type}
                              className={cn(
                                "rounded-lg border p-2.5 flex items-center justify-between text-xs",
                                item.priority === "overdue"
                                  ? "border-destructive/30 bg-destructive/5"
                                  : item.priority === "urgent"
                                  ? "border-wrenchli-amber/30 bg-wrenchli-amber/5"
                                  : "border-border bg-muted/20"
                              )}
                            >
                              <span className="font-medium">{item.label}</span>
                              <span className="text-muted-foreground">
                                {item.milesUntilDue <= 0
                                  ? "Overdue"
                                  : `${item.milesUntilDue.toLocaleString()} mi`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Maintenance Tab */}
                    <TabsContent value="maintenance" className="p-4">
                      <MaintenanceTab
                        cloudVehicle={cloudMatch}
                        upcomingMaintenance={upcoming}
                        records={maintenanceRecords}
                        onRecordAdded={loadRecords}
                        isAuthenticated={isAuthenticated}
                      />
                    </TabsContent>

                    {/* Insights Tab */}
                    <TabsContent value="insights" className="p-4">
                      {isAuthenticated && cloudMatch ? (
                        <ProactiveInsights vehicle={{
                          id: cloudMatch.id,
                          year: cloudMatch.year,
                          make: cloudMatch.make,
                          model: cloudMatch.model,
                          current_mileage: cloudMatch.current_mileage ?? undefined,
                          driving_style: cloudMatch.driving_style ?? undefined,
                          usage_type: cloudMatch.usage_type ?? undefined,
                        }} initialFilter={insightFilter} onFilterApplied={() => setInsightFilter(undefined)} />
                      ) : (
                        <div className="text-center py-10">
                          <TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Sign in and sync your vehicle to access proactive insights.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Footer */}
              <div className="space-y-3 pt-2">
                {!isAuthenticated && (
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-xs text-muted-foreground">
                    <Cloud className="h-3.5 w-3.5 inline mr-1.5 text-accent" />
                    <strong className="text-foreground">Sign in</strong> to sync your garage to the cloud, track maintenance, and get personalized insights.
                  </div>
                )}
                <GaragePrivacyNotice />
                <GarageClearDialog onClear={clearAll} />
              </div>
            </div>
          )}
        </div>
      </section>

      <AddVehicleForm
        isOpen={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
        onVehicleAdded={() => {
          setShowAddVehicle(false);
          if (isAuthenticated) fetchCloudVehicles();
        }}
      />
    </main>
  );
}
