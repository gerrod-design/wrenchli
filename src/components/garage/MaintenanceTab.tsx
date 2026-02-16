import { useState } from "react";
import { Plus, Wrench, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UpcomingMaintenance } from "@/data/maintenanceSchedule";
import type { CloudVehicle } from "@/hooks/useGarageSync";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MaintenanceRecord {
  id: string;
  service_type: string;
  service_date: string;
  mileage_at_service: number | null;
  cost: number | null;
  shop_name: string | null;
  description: string | null;
}

interface Props {
  cloudVehicle?: CloudVehicle;
  upcomingMaintenance: UpcomingMaintenance[];
  records: MaintenanceRecord[];
  onRecordAdded: () => void;
  isAuthenticated: boolean;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; badge: string }> = {
  overdue: { bg: "bg-destructive/5", text: "text-destructive", badge: "destructive" },
  urgent: { bg: "bg-wrenchli-amber/5", text: "text-wrenchli-amber", badge: "secondary" },
  soon: { bg: "bg-accent/5", text: "text-accent", badge: "outline" },
  upcoming: { bg: "bg-muted/50", text: "text-muted-foreground", badge: "outline" },
};

export default function MaintenanceTab({ cloudVehicle, upcomingMaintenance, records, onRecordAdded, isAuthenticated }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    service_type: "",
    service_date: new Date().toISOString().split("T")[0],
    mileage: "",
    cost: "",
    shop_name: "",
    description: "",
  });

  const handleAddRecord = async () => {
    if (!cloudVehicle || !form.service_type.trim() || !form.service_date) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("maintenance_records").insert({
        vehicle_id: cloudVehicle.id,
        service_type: form.service_type.trim(),
        service_date: form.service_date,
        mileage_at_service: form.mileage ? parseInt(form.mileage) : null,
        cost: form.cost ? parseFloat(form.cost) : null,
        shop_name: form.shop_name.trim() || null,
        description: form.description.trim() || null,
      });
      if (error) throw error;
      toast.success("Maintenance record added");
      setForm({ service_type: "", service_date: new Date().toISOString().split("T")[0], mileage: "", cost: "", shop_name: "", description: "" });
      setShowAdd(false);
      onRecordAdded();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add record");
    } finally {
      setAdding(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-10">
        <Wrench className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Sign in to track maintenance history and get smart reminders.
        </p>
      </div>
    );
  }

  if (!cloudVehicle) {
    return (
      <div className="text-center py-10">
        <Wrench className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Sync this vehicle to the cloud first to track maintenance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Upcoming maintenance alerts */}
      {upcomingMaintenance.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Service</h4>
          {upcomingMaintenance.map((item) => {
            const s = PRIORITY_STYLES[item.priority];
            return (
              <div key={item.type} className={cn("rounded-lg border p-3 flex items-center justify-between gap-3", s.bg)}>
                <div>
                  <p className={cn("text-sm font-medium", s.text)}>{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.milesUntilDue <= 0
                      ? `Overdue by ${Math.abs(item.milesUntilDue).toLocaleString()} miles`
                      : `Due in ${item.milesUntilDue.toLocaleString()} miles`}
                    {" · "}${item.estimatedCostLow}–${item.estimatedCostHigh}
                  </p>
                </div>
                <Badge variant={s.badge as any} className="shrink-0 text-[10px]">
                  {item.priority === "overdue" ? "Overdue" : item.priority === "urgent" ? "Urgent" : "Soon"}
                </Badge>
              </div>
            );
          })}
        </div>
      )}

      {/* Add record form */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service History</h4>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3 w-3 mr-1" /> Add Record
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Service Type *</label>
              <Input
                placeholder="e.g., Oil Change"
                value={form.service_type}
                onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date *</label>
              <Input
                type="date"
                value={form.service_date}
                onChange={(e) => setForm((f) => ({ ...f, service_date: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mileage</label>
              <Input
                placeholder="85000"
                value={form.mileage}
                onChange={(e) => setForm((f) => ({ ...f, mileage: e.target.value.replace(/\D/g, "") }))}
                className="h-9 text-sm"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cost ($)</label>
              <Input
                placeholder="75.00"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                className="h-9 text-sm"
                inputMode="decimal"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Shop Name</label>
            <Input
              placeholder="Optional"
              value={form.shop_name}
              onChange={(e) => setForm((f) => ({ ...f, shop_name: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleAddRecord} disabled={adding || !form.service_type.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs">
              {adding ? "Saving…" : "Save Record"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="text-xs">Cancel</Button>
          </div>
        </div>
      )}

      {/* Records list */}
      {records.length > 0 ? (
        <div className="space-y-2">
          {records.map((record) => (
            <div key={record.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium capitalize">{record.service_type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(record.service_date).toLocaleDateString()}
                    {record.mileage_at_service && ` · ${record.mileage_at_service.toLocaleString()} mi`}
                    {record.shop_name && ` · ${record.shop_name}`}
                  </p>
                  {record.description && <p className="text-xs text-muted-foreground mt-1">{record.description}</p>}
                </div>
                {record.cost != null && (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    ${record.cost}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showAdd && (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No service records yet</p>
          </div>
        )
      )}
    </div>
  );
}
