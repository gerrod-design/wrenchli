import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Car, Plus, MoreHorizontal, Trash2, Edit2, AlertTriangle,
  Search, Crown, Shield, Check, Lock, Eye, EyeOff, Gauge,
} from "lucide-react";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useCloudVehicles, type CloudVehicle } from "@/hooks/useCloudVehicles";
import { useVehicleRecalls, type RecallAlert } from "@/hooks/useVehicleRecalls";
import { useProSubscription } from "@/hooks/useProSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);
const FREE_VEHICLE_LIMIT = 2;

const POPULAR_MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler",
  "Dodge", "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti",
  "Jeep", "Kia", "Lexus", "Lincoln", "Mazda", "Mercedes-Benz", "Mitsubishi",
  "Nissan", "Ram", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo",
];

// ─── Add Vehicle Form ──────────────────────────────────────────
function AddVehicleDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vin, setVin] = useState("");
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinError, setVinError] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [mileage, setMileage] = useState("");
  const [nickname, setNickname] = useState("");

  const reset = () => {
    setVin(""); setVinError(""); setVinDecoding(false);
    setYear(""); setMake(""); setModel(""); setTrim("");
    setMileage(""); setNickname("");
  };

  const handleVinChange = (raw: string) => {
    const sanitized = raw.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, "").slice(0, 17);
    setVin(sanitized);
    setVinError("");
  };

  const handleVinDecode = async () => {
    if (vin.length !== 17) return;
    setVinDecoding(true);
    setVinError("");
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${supabaseUrl}/functions/v1/decode-vin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey },
        body: JSON.stringify({ vin }),
      });
      if (!resp.ok) throw new Error("API error");
      const data = await resp.json();
      const result = data.Results?.[0];
      if (!result || (!result.Make && !result.ErrorCode?.includes?.("0"))) {
        setVinError("We couldn't decode that VIN. Please fill in your vehicle details manually.");
        return;
      }
      if (result.ModelYear) setYear(String(result.ModelYear));
      if (result.Make) setMake(result.Make);
      if (result.Model) setModel(result.Model);
      if (result.Trim) setTrim(result.Trim);
    } catch {
      setVinError("We couldn't decode that VIN. Please fill in your vehicle details manually.");
    } finally {
      setVinDecoding(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !year || !make || !model) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_vehicles")
        .insert({
          user_id: user.id,
          year: parseInt(year),
          make,
          model,
          trim: trim || null,
          current_mileage: mileage ? parseInt(mileage) : null,
          nickname: nickname || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Call check-recalls for new vehicle
      if (data?.id) {
        supabase.functions.invoke("check-recalls", {
          body: { user_vehicle_id: data.id, make, model, year: parseInt(year) },
        }).catch((err) => console.warn("[Garage] check-recalls error:", err));
      }

      toast.success("Vehicle added to your garage!");
      reset();
      onClose();
      onAdded();
    } catch (err: any) {
      console.error("[Garage] add error:", err);
      toast.error(err?.message || "Failed to add vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-accent" />
            Add a Vehicle
          </DialogTitle>
          <DialogDescription>
            Enter your VIN to auto-fill, or fill in the details manually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* VIN input */}
          <div className="space-y-1">
            <Label className="text-xs">VIN (optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. 4T1B11HK5KU123456"
                value={vin}
                onChange={(e) => handleVinChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleVinDecode(); }
                }}
                className="font-mono uppercase flex-1"
                maxLength={17}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleVinDecode}
                disabled={vin.length !== 17 || vinDecoding}
                className="shrink-0"
              >
                {vinDecoding ? "Decoding VIN…" : "Decode"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">{vin.length}/17 characters</p>
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              Optional. Your VIN helps us auto-fill your vehicle details and check for open safety recalls. It is stored securely, never sold, and can be deleted at any time.
            </p>
            {vinError && <p className="text-xs text-destructive">{vinError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Year *</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Make *</Label>
              <Input placeholder="e.g. Toyota" value={make} onChange={(e) => setMake(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Model *</Label>
              <Input placeholder="e.g. Camry" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Trim</Label>
              <Input placeholder="e.g. SE" value={trim} onChange={(e) => setTrim(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Mileage</Label>
              <Input
                placeholder="e.g. 45000"
                inputMode="numeric"
                value={mileage}
                onChange={(e) => setMileage(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nickname</Label>
              <Input placeholder="e.g. Daily Driver" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !year || !make || !model}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading ? "Adding…" : "Add Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Vehicle Card ───────────────────────────────────────────────
function VehicleCard({
  vehicle,
  unreadRecalls,
  onDelete,
  onEdit,
}: {
  vehicle: CloudVehicle;
  unreadRecalls: number;
  onDelete: (id: string) => void;
  onEdit: (v: CloudVehicle) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const subtitle = vehicle.nickname
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`
    : vehicle.trim || "";

  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-sm font-bold truncate">{displayName}</h3>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          <div className="flex items-center gap-3 mt-1">
            {vehicle.current_mileage && (
              <span className="text-xs text-muted-foreground font-mono">
                <Gauge className="h-3 w-3 inline mr-1" />
                {vehicle.current_mileage.toLocaleString()} mi
              </span>
            )}
            {unreadRecalls > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                {unreadRecalls} recall{unreadRecalls !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Three-dot menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-muted-foreground hover:text-foreground rounded"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-border bg-white shadow-lg py-1">
              <button
                onClick={() => { onEdit(vehicle); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
              >
                <Edit2 className="h-3 w-3" /> Edit Vehicle
              </button>
              <button
                onClick={() => { onDelete(vehicle.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Delete Vehicle
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() =>
            navigate(`/?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`)
          }
        >
          <Search className="mr-1 h-3 w-3" /> Run Assessment
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 text-xs"
        >
          <Link to={`/vehicle-insights?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`}>
            View Assessments
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Recall Alert Card ──────────────────────────────────────────
function RecallAlertCard({
  recall,
  onMarkRead,
}: {
  recall: RecallAlert;
  onMarkRead: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const summary = recall.summary || "";
  const truncated = summary.length > 150;

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-2",
      recall.is_read
        ? "border-border bg-muted/30"
        : "border-destructive/30 bg-destructive/5"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold">{recall.component}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {truncated && !expanded ? `${summary.slice(0, 150)}…` : summary}
            {truncated && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="ml-1 text-accent hover:underline font-medium"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </p>
        </div>
      </div>
      {recall.consequence && (
        <div className="text-[11px]">
          <span className="font-semibold text-destructive">Risk:</span>{" "}
          <span className="text-muted-foreground">{recall.consequence}</span>
        </div>
      )}
      {recall.remedy && (
        <div className="text-[11px]">
          <span className="font-semibold">Remedy:</span>{" "}
          <span className="text-muted-foreground">{recall.remedy}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground/60">
          NHTSA #{recall.campaign_number}
        </span>
        {!recall.is_read && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2"
            onClick={() => onMarkRead(recall.id)}
          >
            <Eye className="h-3 w-3 mr-1" /> Mark as read
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Free vs Pro Comparison ─────────────────────────────────────
function FreeVsProComparison({ onUpgrade }: { onUpgrade: () => void }) {
  const features = [
    { label: "Saved vehicles", free: "2", pro: "Unlimited" },
    { label: "Recall alerts", free: true, pro: true },
    { label: "Assessment history", free: true, pro: true },
    { label: "PDF report export", free: false, pro: true },
    { label: "AI vehicle health insights", free: false, pro: "Coming soon" },
    { label: "Priority processing", free: false, pro: "Coming soon" },
  ];

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="grid grid-cols-3 text-center border-b border-border">
        <div className="p-3 text-xs font-semibold text-muted-foreground">Feature</div>
        <div className="p-3 text-xs font-semibold border-l border-border">FREE</div>
        <div className="p-3 text-xs font-semibold border-l border-accent/30 bg-accent/5 text-accent">
          <Crown className="h-3 w-3 inline mr-1" />
          PRO $2.99/mo
        </div>
      </div>
      {features.map((f) => (
        <div key={f.label} className="grid grid-cols-3 text-center border-b border-border last:border-b-0">
          <div className="p-3 text-xs text-left text-muted-foreground">{f.label}</div>
          <div className="p-3 text-xs border-l border-border flex items-center justify-center">
            {f.free === true ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : f.free === false ? (
              <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
            ) : (
              <span className="font-mono text-muted-foreground">{f.free}</span>
            )}
          </div>
          <div className="p-3 text-xs border-l border-accent/30 bg-accent/5 flex items-center justify-center">
            {f.pro === true ? (
              <Check className="h-3.5 w-3.5 text-accent" />
            ) : typeof f.pro === "string" && f.pro !== "Coming soon" ? (
              <span className="font-mono font-semibold text-accent">{f.pro}</span>
            ) : (
              <span className="text-muted-foreground italic text-[10px]">{f.pro}</span>
            )}
          </div>
        </div>
      ))}
      <div className="p-4 bg-accent/5 border-t border-accent/20">
        <Button
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
          onClick={onUpgrade}
        >
          <Crown className="mr-2 h-4 w-4" />
          Upgrade to Wrenchli Pro — $2.99/month
        </Button>
      </div>
    </div>
  );
}

// ─── Edit Vehicle Dialog ────────────────────────────────────────
function EditVehicleDialog({
  vehicle,
  onClose,
  onUpdated,
}: {
  vehicle: CloudVehicle | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [nickname, setNickname] = useState(vehicle?.nickname || "");
  const [mileage, setMileage] = useState(vehicle?.current_mileage?.toString() || "");
  const [trim, setTrim] = useState(vehicle?.trim || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setNickname(vehicle.nickname || "");
      setMileage(vehicle.current_mileage?.toString() || "");
      setTrim(vehicle.trim || "");
    }
  }, [vehicle]);

  const handleSave = async () => {
    if (!vehicle) return;
    setLoading(true);
    const { error } = await supabase
      .from("user_vehicles")
      .update({
        nickname: nickname || null,
        current_mileage: mileage ? parseInt(mileage) : null,
        trim: trim || null,
      })
      .eq("id", vehicle.id);
    setLoading(false);
    if (error) {
      toast.error("Failed to update vehicle");
    } else {
      toast.success("Vehicle updated");
      onClose();
      onUpdated();
    }
  };

  return (
    <Dialog open={!!vehicle} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Nickname</Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Daily Driver" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mileage</Label>
            <Input
              value={mileage}
              onChange={(e) => setMileage(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 45000"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Trim</Label>
            <Input value={trim} onChange={(e) => setTrim(e.target.value)} placeholder="e.g. SE" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Garage Page ───────────────────────────────────────────
export default function Garage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { vehicles, loading: vehiclesLoading, fetchVehicles, deleteVehicle } = useCloudVehicles();
  const { isPro, loading: proLoading } = useProSubscription();

  const vehicleIds = useMemo(() => vehicles.map((v) => v.id), [vehicles]);
  const { recalls, markAsRead, unreadByVehicle } = useVehicleRecalls(vehicleIds);

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<CloudVehicle | null>(null);

  const isLoading = vehiclesLoading || proLoading;

  // Group unread recalls by vehicle
  const unreadRecallsByVehicle = useMemo(() => {
    const map: Record<string, RecallAlert[]> = {};
    for (const r of recalls) {
      if (!r.is_read) {
        if (!map[r.vehicle_id]) map[r.vehicle_id] = [];
        map[r.vehicle_id].push(r);
      }
    }
    return map;
  }, [recalls]);

  const vehiclesWithUnreadRecalls = vehicles.filter((v) => (unreadRecallsByVehicle[v.id]?.length || 0) > 0);

  const handleDelete = async (id: string) => {
    const ok = await deleteVehicle(id);
    if (ok) toast.success("Vehicle removed");
  };

  const handleAddClick = () => {
    if (!user) {
      toast.error("Please sign in to save vehicles to your garage.");
      return;
    }
    if (!isPro && vehicles.length >= FREE_VEHICLE_LIMIT) {
      toast("Free tier limit reached. Upgrade to Pro for unlimited vehicles.", {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/garage#upgrade"),
        },
      });
      return;
    }
    setShowAddVehicle(true);
  };

  const handleUpgradeClick = () => {
    // Part D will implement Stripe checkout — for now scroll to comparison
    const el = document.getElementById("pro-comparison");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  if (!user) {
    return (
      <main className="pb-[60px] md:pb-0">
        <SEO title="My Garage — Wrenchli" description="Save your vehicles, get recall alerts, and track assessment history." path="/garage" />
        <section className="section-padding" style={{ backgroundColor: "#F8F8F6" }}>
          <div className="container-wrenchli max-w-2xl text-center py-20">
            <Car className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h1 className="font-heading text-2xl font-bold mb-2">My Garage</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in to save your vehicles, get recall alerts, and track your assessment history.
            </p>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/admin/login">Sign In</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO title="My Garage — Wrenchli" description="Save your vehicles, get recall alerts, and track assessment history." path="/garage" />

      <section className="section-padding" style={{ backgroundColor: "#F8F8F6" }}>
        <div className="container-wrenchli max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Car className="h-6 w-6 text-accent" />
              <h1 className="font-heading text-2xl font-bold md:text-3xl">My Garage</h1>
              {isPro && (
                <Badge className="bg-accent text-accent-foreground text-[10px] px-2 py-0.5">
                  <Crown className="h-3 w-3 mr-1" /> Pro
                </Badge>
              )}
            </div>
            {!isPro && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-accent text-accent hover:bg-accent/10"
                onClick={handleUpgradeClick}
              >
                <Crown className="h-3 w-3 mr-1.5" /> Upgrade to Pro — $2.99/mo
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-white p-4 h-24 animate-pulse" />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            /* Empty state */
            <div className="rounded-xl border border-border bg-white p-10 text-center">
              <Car className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h2 className="font-heading text-lg font-semibold">Your garage is empty</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Add your first vehicle to get recall alerts and track your assessment history.
              </p>
              <Button
                onClick={handleAddClick}
                className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Plus className="mr-2 h-4 w-4" /> Add a Vehicle
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Vehicle cards */}
              {vehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  unreadRecalls={unreadByVehicle(v.id)}
                  onDelete={handleDelete}
                  onEdit={setEditingVehicle}
                />
              ))}

              {/* Add vehicle button */}
              <Button
                variant="outline"
                className="w-full h-12 border-dashed"
                onClick={handleAddClick}
              >
                <Plus className="mr-2 h-4 w-4" />
                {!isPro && vehicles.length >= FREE_VEHICLE_LIMIT
                  ? <>Add Vehicle <Lock className="ml-1 h-3 w-3 text-muted-foreground" /> (Pro)</>
                  : "Add Another Vehicle"
                }
              </Button>

              {/* Recall Alerts Section */}
              {vehiclesWithUnreadRecalls.length > 0 && (
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <h2 className="font-heading text-base font-bold">Recall Alerts</h2>
                  </div>
                  {vehiclesWithUnreadRecalls.map((v) => (
                    <div key={v.id} className="space-y-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {v.nickname || `${v.year} ${v.make} ${v.model}`}
                      </h3>
                      {unreadRecallsByVehicle[v.id]?.map((r) => (
                        <RecallAlertCard key={r.id} recall={r} onMarkRead={markAsRead} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Free vs Pro Comparison (only for free users) */}
          {!isPro && !isLoading && (
            <div id="pro-comparison" className="mt-8">
              <FreeVsProComparison onUpgrade={handleUpgradeClick} />
            </div>
          )}
        </div>
      </section>

      {/* Dialogs */}
      <AddVehicleDialog
        open={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
        onAdded={fetchVehicles}
      />
      <EditVehicleDialog
        vehicle={editingVehicle}
        onClose={() => setEditingVehicle(null)}
        onUpdated={fetchVehicles}
      />
    </main>
  );
}
