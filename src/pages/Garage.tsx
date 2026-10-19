import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Car, Plus, MoreHorizontal, Trash2, Edit2, AlertTriangle,
  Search, Shield, Eye, EyeOff, Gauge,
} from "lucide-react";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useCloudVehicles, type CloudVehicle } from "@/hooks/useCloudVehicles";
import { useVehicleRecalls, type RecallAlert } from "@/hooks/useVehicleRecalls";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthGateModal from "@/components/AuthGateModal";
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
import InteractiveVehicleCard from "@/components/garage/InteractiveVehicleCard";
import VehiclePhotoPicker from "@/components/garage/VehiclePhotoPicker";
import { useResolvedVehiclePhoto, useVehicleOwnerPhoto } from "@/hooks/useVehicleOwnerPhoto";
import { attachVehiclePhotoIfSelected, type VehiclePhotoClient } from "@/lib/vehiclePhoto";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

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
  initialYear = "",
  initialMake = "",
  initialModel = "",
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (vehicleId?: string) => void;
  initialYear?: string;
  initialMake?: string;
  initialModel?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addedVehicleId, setAddedVehicleId] = useState<string | null>(null);
  const [vin, setVin] = useState("");
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinError, setVinError] = useState("");
  const [year, setYear] = useState(initialYear);
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState(initialModel);
  const [trim, setTrim] = useState("");
  const [mileage, setMileage] = useState("");
  const [nickname, setNickname] = useState("");
  const [vinDecoded, setVinDecoded] = useState(false);
  // Batch 5 (spec SS5): the raw VIN-decode result, persisted as the
  // vehicle's decoded identity (separate from the display strings) when
  // the vehicle is saved.
  const [vinDecodeResult, setVinDecodeResult] = useState<Record<string, string> | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoSkipped, setPhotoSkipped] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Update when initial values change (from URL params)
  useEffect(() => {
    if (initialYear) setYear(initialYear);
    if (initialMake) setMake(initialMake);
    if (initialModel) setModel(initialModel);
  }, [initialYear, initialMake, initialModel]);

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile);
      setPhotoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPhotoPreviewUrl(null);
  }, [photoFile]);

  const reset = () => {
    setAddedVehicleId(null);
    setVin(""); setVinError(""); setVinDecoding(false);
    setYear(""); setMake(""); setModel(""); setTrim("");
    setMileage(""); setNickname("");
    setVinDecoded(false);
    setVinDecodeResult(null);
    setPhotoFile(null);
    setPhotoSkipped(false);
    setPhotoPreviewUrl(null);
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
      setVinDecodeResult(result as Record<string, string>);
      setVinDecoded(true);
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
          vin: vin.length === 17 ? vin : null,
          nickname: nickname || null,
          // Batch 5 (spec SS5): persist the decode itself as identity.
          ...(vinDecodeResult
            ? {
                vin_decoded_line: vinDecodeResult.Model || null,
                vin_decoded_trim: vinDecodeResult.Trim || null,
                vin_decoded_series: vinDecodeResult.Series || null,
                vin_decoded_body: vinDecodeResult.BodyClass || null,
                vin_decoded_drivetrain: vinDecodeResult.DriveType || null,
                vin_decoded_year: vinDecodeResult.ModelYear ? parseInt(vinDecodeResult.ModelYear) : null,
                vin_decoded_make: vinDecodeResult.Make || null,
                vin_decode_provider: "vPIC (NHTSA)",
                vin_decoded_at: new Date().toISOString(),
                vin_trim_known_gap: !vinDecodeResult.Trim,
              }
            : {}),
        })
        .select("id")
        .single();

      if (error) throw error;

      // Batch 5 (R-50): a mileage typed at add time becomes the vehicle's
      // first ledger reading — dated today, sourced to the owner — never a
      // bare attribute on the vehicle row.
      if (data?.id && mileage) {
        const { error: readingError } = await supabase.from("vehicle_mileage_readings").insert({
          vehicle_id: data.id,
          owner_user_id: user.id,
          odometer_value: parseInt(mileage),
          unit: "mi",
          reading_date: new Date().toISOString().slice(0, 10),
          source: "owner_reported",
          source_detail: "Reported when the vehicle was added",
          layer: "reported",
        });
        if (readingError) {
          toast.warning("Vehicle added — the mileage reading could not be saved. You can record it from the vehicle's record.");
        }
      }

      // Call check-recalls for new vehicle. R-51 (Batch 1.5): a failed check
      // is surfaced to the user, never swallowed to the console — the Garage
      // also flags the vehicle with a "recall status unavailable" notice
      // until a check succeeds.
      if (data?.id) {
        supabase.functions.invoke("check-recalls", {
          body: { user_vehicle_id: data.id, make, model, year: parseInt(year) },
        }).then(({ error: recallError }) => {
          if (recallError) {
            toast.warning(
              "Vehicle added — the safety recall check couldn't be completed. Its recall status will show as unavailable in your Garage until the check succeeds."
            );
          }
        }).catch(() => {
          toast.warning(
            "Vehicle added — the safety recall check couldn't be completed. Its recall status will show as unavailable in your Garage until the check succeeds."
          );
        });
      }

      if (data?.id) {
        try {
          await attachVehiclePhotoIfSelected(supabase as unknown as VehiclePhotoClient, {
            userId: user.id,
            vehicleId: data.id,
            file: photoFile,
          });
        } catch {
          toast.warning("Vehicle added — the photo could not be saved. You can add it from the vehicle's card.");
        }
      }

      toast.success("Vehicle added to your garage!");
      onAdded(data?.id);
      setAddedVehicleId(data?.id ?? null);
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

        {addedVehicleId ? (
          <div className="space-y-4 rounded-xl border border-accent/20 bg-accent/5 p-4">
            <div>
              <h3 className="font-semibold">Vehicle added</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Just bought this car? Capture its baseline today while the photos and details are fresh.
              </p>
            </div>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => {
                const vehicleId = addedVehicleId;
                reset();
                onClose();
                navigate(`/garage/vehicles/${vehicleId}/baseline`);
              }}
            >
              Capture its Baseline
            </Button>
          </div>
        ) : (
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
              <Label className="text-xs">Current mileage (optional)</Label>
              <Input
                placeholder="e.g. 45000"
                inputMode="numeric"
                value={mileage}
                onChange={(e) => setMileage(e.target.value.replace(/\D/g, ""))}
              />
              <p className="text-[11px] text-muted-foreground">Saved as a dated reading with you as its source.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nickname</Label>
              <Input placeholder="e.g. Daily Driver" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
          </div>
          {vinDecoded && (
            <div className="space-y-2 rounded-lg border border-accent/20 bg-accent/5 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Add a photo of your car</p>
                {!photoFile && !photoSkipped && (
                  <button
                    type="button"
                    className="text-[11px] text-muted-foreground hover:underline"
                    onClick={() => setPhotoSkipped(true)}
                  >
                    Skip for now
                  </button>
                )}
              </div>
              {photoSkipped && !photoFile ? (
                <p className="text-[11px] text-muted-foreground">You can add a photo later from your vehicle's card.</p>
              ) : (
                <VehiclePhotoPicker
                  displayUrl={photoPreviewUrl}
                  hasPhoto={!!photoFile}
                  onSelectFile={(f) => { setPhotoFile(f); setPhotoSkipped(false); }}
                  onRemove={() => setPhotoFile(null)}
                  tone="light"
                />
              )}
            </div>
          )}
        </div>
        )}

        <DialogFooter>
          {addedVehicleId ? (
            <Button onClick={() => { reset(); onClose(); }} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !year || !make || !model}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {loading ? "Adding…" : "Add Vehicle"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// VehicleCard is now InteractiveVehicleCard (imported above)

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
  const [trim, setTrim] = useState(vehicle?.trim || "");
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(vehicle?.photo_url ?? null);

  const { url: resolvedPhotoUrl } = useResolvedVehiclePhoto(photoUrl);
  const { setPhoto, removePhoto, busy: photoBusy } = useVehicleOwnerPhoto(vehicle?.id);

  useEffect(() => {
    if (vehicle) {
      setNickname(vehicle.nickname || "");
      setTrim(vehicle.trim || "");
      setPhotoUrl(vehicle.photo_url ?? null);
    }
  }, [vehicle]);

  const handleSave = async () => {
    if (!vehicle) return;
    setLoading(true);
    const { error } = await supabase
      .from("user_vehicles")
      .update({
        nickname: nickname || null,
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
            <Label className="text-xs">Vehicle Photo</Label>
            <VehiclePhotoPicker
              displayUrl={resolvedPhotoUrl}
              hasPhoto={!!photoUrl}
              busy={photoBusy}
              tone="light"
              onSelectFile={async (file) => {
                try {
                  const path = await setPhoto(file);
                  setPhotoUrl(path);
                  onUpdated();
                  toast.success("Vehicle photo updated");
                } catch {
                  toast.error("Could not save the photo. Please try again.");
                }
              }}
              onRemove={async () => {
                try {
                  await removePhoto(photoUrl);
                  setPhotoUrl(null);
                  onUpdated();
                  toast.success("Vehicle photo removed");
                } catch {
                  toast.error("Could not remove the photo. Please try again.");
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nickname</Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Daily Driver" />
          </div>
          <p className="text-xs text-muted-foreground">
            Mileage is kept in the vehicle's record as dated, sourced readings — open the
            vehicle to record or correct it.
          </p>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { vehicles, latestReadings, loading: vehiclesLoading, fetchVehicles, deleteVehicle } = useCloudVehicles();

  const vehicleIds = useMemo(() => vehicles.map((v) => v.id), [vehicles]);
  const { recalls, recallChecks, recallUnavailableVehicleIds, markAsRead, unreadByVehicle } = useVehicleRecalls(vehicleIds);

  // Pre-fill from URL params (from assessment save-to-garage)
  const prefillYear = searchParams.get("addYear") || "";
  const prefillMake = searchParams.get("addMake") || "";
  const prefillModel = searchParams.get("addModel") || "";

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<CloudVehicle | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);

  // Auto-open add dialog if URL has prefill params
  useEffect(() => {
    if (prefillYear && prefillMake && prefillModel && user) {
      setShowAddVehicle(true);
    }
  }, [prefillYear, prefillMake, prefillModel, user]);

  const isLoading = vehiclesLoading;

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

  // R-51 (Batch 1.5): vehicles whose recall status cannot be asserted —
  // the last NHTSA check failed or never completed. Shown explicitly so an
  // unchecked vehicle is never mistaken for a recall-free one.
  const vehiclesWithUnavailableRecallStatus = vehicles.filter((v) =>
    recallUnavailableVehicleIds.includes(v.id)
  );

  const handleDelete = async (id: string) => {
    const ok = await deleteVehicle(id);
    if (ok) toast.success("Vehicle removed");
  };

  const handleAddClick = () => {
    if (!user) {
      toast.error("Please sign in to save vehicles to your garage.");
      return;
    }
    setShowAddVehicle(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthGate(false);
  };

  if (!user) {
    return (
      <main className="pb-[60px] md:pb-0">
        <SEO title="My Vehicle Garage | Wrenchli" description="Save unlimited vehicles, track assessments, and get safety recall alerts — free with your Wrenchli account." path="/garage" />
        <section className="section-padding" style={{ backgroundColor: "#F8F8F6" }}>
          <div className="container-wrenchli max-w-2xl text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Car className="h-6 w-6 text-accent" />
              <h1 className="font-heading text-2xl font-bold md:text-3xl">My Garage</h1>
            </div>
            <div className="rounded-xl border border-border bg-white p-8">
              <p className="text-sm text-muted-foreground mb-6">
                Sign in to save your vehicles, get safety recall alerts, and track your assessment history — all free.
              </p>
              <Button onClick={() => setShowAuthGate(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Sign In
              </Button>
            </div>
          </div>
        </section>
        <AuthGateModal
          open={showAuthGate}
          onClose={() => setShowAuthGate(false)}
          onAuthenticated={handleAuthSuccess}
        />
      </main>
    );
  }

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO title="My Vehicle Garage | Wrenchli" description="Save unlimited vehicles, track assessments, and get safety recall alerts — free with your Wrenchli account." path="/garage" />

      <section className="section-padding" style={{ backgroundColor: "#F8F8F6" }}>
        <div className="container-wrenchli max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Car className="h-6 w-6 text-accent" />
            <h1 className="font-heading text-2xl font-bold md:text-3xl">My Garage</h1>
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
                <InteractiveVehicleCard
                  key={v.id}
                  vehicle={v}
                  latestReading={latestReadings[v.id] ?? null}
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
                Add Another Vehicle
              </Button>

              {/* Recall Alerts Section */}
              {(vehiclesWithUnreadRecalls.length > 0 || vehiclesWithUnavailableRecallStatus.length > 0) && (
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
                  {vehiclesWithUnavailableRecallStatus.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-lg border border-amber-300 bg-amber-50 p-3"
                      data-testid="recall-status-unavailable"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {v.nickname || `${v.year} ${v.make} ${v.model}`}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-amber-900">
                        Recall status unavailable
                      </p>
                      <p className="mt-0.5 text-sm text-amber-800">
                        We couldn't complete the NHTSA safety recall check for this
                        vehicle{recallChecks[v.id]?.checked_at ? ` (last tried ${new Date(recallChecks[v.id].checked_at).toLocaleDateString()})` : ""}.
                        That doesn't mean it has no recalls — we'll keep retrying,
                        and the status will update here once the check succeeds.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* Dialogs */}
      <AddVehicleDialog
        open={showAddVehicle}
        onClose={() => {
          setShowAddVehicle(false);
          // Clear URL prefill params
          if (searchParams.has("addYear")) {
            searchParams.delete("addYear");
            searchParams.delete("addMake");
            searchParams.delete("addModel");
            setSearchParams(searchParams, { replace: true });
          }
        }}
        onAdded={fetchVehicles}
        initialYear={prefillYear}
        initialMake={prefillMake}
        initialModel={prefillModel}
      />
      <EditVehicleDialog
        vehicle={editingVehicle}
        onClose={() => setEditingVehicle(null)}
        onUpdated={fetchVehicles}
      />
      <AuthGateModal
        open={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        onAuthenticated={handleAuthSuccess}
      />
    </main>
  );
}
