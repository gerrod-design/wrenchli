import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Car,
  Calendar,
  DollarSign,
  MapPin,
  Gauge,
  User,
  CheckCircle,
  AlertCircle,
  Keyboard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { DecodedVehicle } from "@/lib/vinDecoder";
import VinInput from "@/components/vehicle/VinInput";
import { supabase } from "@/integrations/supabase/client";
import { useGarage } from "@/hooks/useGarage";
import { toast } from "sonner";
import VehicleValueAnalyzer from "@/components/quote/VehicleValueAnalyzer";

interface AddVehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleAdded: () => void;
}

interface FormData {
  year: string;
  make: string;
  model: string;
  trim: string;
  current_mileage: string;
  location_zip: string;
  purchase_date: string;
  purchase_price: string;
  purchase_mileage: string;
  driving_style: string;
  annual_mileage_estimate: string;
  usage_type: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const POPULAR_MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler",
  "Dodge", "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti",
  "Jeep", "Kia", "Lexus", "Lincoln", "Mazda", "Mercedes-Benz", "Mitsubishi",
  "Nissan", "Ram", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo",
];

const DRIVING_STYLES = [
  { value: "conservative", label: "Conservative — Gentle acceleration, highway focus" },
  { value: "normal", label: "Normal — Balanced city and highway driving" },
  { value: "aggressive", label: "Aggressive — Quick acceleration, performance driving" },
];

const USAGE_TYPES = [
  { value: "commuter", label: "Daily Commuter — Regular work/school trips" },
  { value: "family", label: "Family Vehicle — Kids, errands, weekend trips" },
  { value: "weekend", label: "Weekend/Recreational — Occasional use only" },
  { value: "commercial", label: "Commercial/Work — Business or trade use" },
];

export default function AddVehicleForm({ isOpen, onClose, onVehicleAdded }: AddVehicleFormProps) {
  const { user } = useAuth();
  const { addVehicle } = useGarage();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showValueAnalysis, setShowValueAnalysis] = useState(false);
  const [vinMode, setVinMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    year: "",
    make: "",
    model: "",
    trim: "",
    current_mileage: "",
    location_zip: "",
    purchase_date: "",
    purchase_price: "",
    purchase_mileage: "",
    driving_style: "normal",
    annual_mileage_estimate: "12000",
    usage_type: "commuter",
  });

  const handleVinDecoded = (vehicle: DecodedVehicle) => {
    // NHTSA returns uppercase makes (e.g. "JEEP") — match to our title-case list
    const normalizedMake = POPULAR_MAKES.find(
      (m) => m.toLowerCase() === (vehicle.make || "").toLowerCase()
    ) || vehicle.make || "";

    setFormData((prev) => ({
      ...prev,
      year: vehicle.year || prev.year,
      make: normalizedMake || prev.make,
      model: vehicle.model || prev.model,
      trim: vehicle.trim || prev.trim,
    }));
    setVinMode(false);
    toast.success(`Decoded: ${[vehicle.year, normalizedMake, vehicle.model].filter(Boolean).join(" ")}`);
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return !!(formData.year && formData.make && formData.model && formData.current_mileage && formData.location_zip);
      case 2:
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Always save to localStorage garage
      addVehicle({
        nickname: `My ${formData.model}`,
        year: formData.year,
        make: formData.make,
        model: formData.model,
        trim: formData.trim || undefined,
      });

      // If authenticated, also save to cloud with full details
      if (user) {
        const { error } = await supabase.from("user_vehicles").insert({
          user_id: user.id,
          year: parseInt(formData.year),
          make: formData.make,
          model: formData.model,
          trim: formData.trim || null,
          current_mileage: parseInt(formData.current_mileage) || null,
          location_zip: formData.location_zip || null,
          purchase_date: formData.purchase_date || null,
          purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
          purchase_mileage: formData.purchase_mileage ? parseInt(formData.purchase_mileage) : null,
          driving_style: formData.driving_style,
          annual_mileage_estimate: parseInt(formData.annual_mileage_estimate),
          usage_type: formData.usage_type,
        });

        if (error && error.code !== "23505") {
          console.error("[AddVehicle] cloud insert error:", error);
        }
      }

      toast.success("Vehicle added to your garage!");
      onVehicleAdded();
      handleClose();
    } catch (error) {
      console.error("Error adding vehicle:", error);
      toast.error("Failed to add vehicle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setVinMode(false);
    setShowValueAnalysis(false);
    setFormData({
      year: "", make: "", model: "", trim: "",
      current_mileage: "", location_zip: "", purchase_date: "",
      purchase_price: "", purchase_mileage: "",
      driving_style: "normal", annual_mileage_estimate: "12000", usage_type: "commuter",
    });
    onClose();
  };

  const canShowValueAnalysis = !!(formData.year && formData.make && formData.model && formData.current_mileage);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-accent" />
            Add Vehicle to Your Garage
          </DialogTitle>
          <DialogDescription>
            Tell us about your vehicle to get personalized maintenance reminders and market insights.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  currentStep >= step
                    ? "bg-accent text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              {step < 2 && (
                <div
                  className={`h-0.5 w-8 rounded transition-colors ${
                    currentStep > step ? "bg-accent" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* Step 1: Vehicle Basics */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Car className="h-4 w-4 text-muted-foreground" />
                Vehicle Information
              </div>

              {/* VIN toggle */}
              <button
                type="button"
                onClick={() => setVinMode(!vinMode)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
              >
                <Keyboard className="h-3.5 w-3.5" />
                {vinMode ? "Use Year/Make/Model instead" : "Have a VIN? Auto-fill with VIN"}
              </button>

              {vinMode && (
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                  <VinInput onDecoded={handleVinDecoded} />
                </div>
              )}

              {!vinMode && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Year *</Label>
                      <Select value={formData.year} onValueChange={(v) => updateFormData("year", v)}>
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
                      <Select value={formData.make} onValueChange={(v) => updateFormData("make", v)}>
                        <SelectTrigger><SelectValue placeholder="Make" /></SelectTrigger>
                        <SelectContent>
                          {POPULAR_MAKES.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Model *</Label>
                      <Input
                        placeholder="e.g. Civic, Camry"
                        value={formData.model}
                        onChange={(e) => updateFormData("model", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Trim (Optional)</Label>
                      <Input
                        placeholder="e.g. LX, Sport"
                        value={formData.trim}
                        onChange={(e) => updateFormData("trim", e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Current Mileage *</Label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="e.g. 45000"
                    className="pl-9"
                    value={formData.current_mileage}
                    onChange={(e) => updateFormData("current_mileage", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">ZIP Code *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="e.g. 48201"
                    className="pl-9"
                    maxLength={5}
                    value={formData.location_zip}
                    onChange={(e) => updateFormData("location_zip", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Used for local market pricing and service recommendations
                </p>
              </div>

              {/* Value Analysis Preview */}
              {canShowValueAnalysis && (
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">Instant Value Preview</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px]"
                      onClick={() => setShowValueAnalysis(!showValueAnalysis)}
                    >
                      {showValueAnalysis ? "Hide" : "Show"} Analysis
                    </Button>
                  </div>
                  {showValueAnalysis && (
                    <VehicleValueAnalyzer
                      vehicleYear={formData.year}
                      vehicleMake={formData.make}
                      vehicleModel={formData.model}
                      vehicleTrim={formData.trim}
                      repairCostLow={0}
                      repairCostHigh={0}
                      initialMileage={formData.current_mileage}
                      onRecommendation={() => {}}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Purchase & Driving Profile (Optional) */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Additional Details (Optional)
                </div>
                <p className="text-xs text-muted-foreground">
                  Helps track finances and personalize maintenance recommendations
                </p>
              </div>

              {/* Purchase Info */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Purchase Info</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Purchase Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="date"
                        className="pl-9"
                        value={formData.purchase_date}
                        onChange={(e) => updateFormData("purchase_date", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Purchase Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="e.g. 25000"
                        className="pl-9"
                        value={formData.purchase_price}
                        onChange={(e) => updateFormData("purchase_price", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mileage at Purchase</Label>
                  <div className="relative">
                    <Gauge className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="e.g. 15000"
                      className="pl-9"
                      value={formData.purchase_mileage}
                      onChange={(e) => updateFormData("purchase_mileage", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Driving Profile */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Driving Profile</p>
                <div className="space-y-2">
                  <Label className="text-xs">Driving Style</Label>
                  <RadioGroup value={formData.driving_style} onValueChange={(v) => updateFormData("driving_style", v)}>
                    {DRIVING_STYLES.map((style) => (
                      <div key={style.value} className="flex items-start gap-2">
                        <RadioGroupItem value={style.value} id={`driving-${style.value}`} className="mt-0.5" />
                        <label htmlFor={`driving-${style.value}`} className="text-xs leading-tight cursor-pointer">
                          {style.label}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Primary Usage</Label>
                  <RadioGroup value={formData.usage_type} onValueChange={(v) => updateFormData("usage_type", v)}>
                    {USAGE_TYPES.map((usage) => (
                      <div key={usage.value} className="flex items-start gap-2">
                        <RadioGroupItem value={usage.value} id={`usage-${usage.value}`} className="mt-0.5" />
                        <label htmlFor={`usage-${usage.value}`} className="text-xs leading-tight cursor-pointer">
                          {usage.label}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Expected Annual Mileage</Label>
                  <Select
                    value={formData.annual_mileage_estimate}
                    onValueChange={(v) => updateFormData("annual_mileage_estimate", v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5000">Under 5,000 mi/yr</SelectItem>
                      <SelectItem value="7500">5,000–10,000 mi/yr</SelectItem>
                      <SelectItem value="12000">10,000–15,000 mi/yr (Avg)</SelectItem>
                      <SelectItem value="17500">15,000–20,000 mi/yr</SelectItem>
                      <SelectItem value="25000">Over 20,000 mi/yr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <div className="flex-1" />
          {currentStep > 1 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep((p) => p - 1)}>
              Back
            </Button>
          )}
          {currentStep < 2 ? (
            <Button
              size="sm"
              onClick={() => setCurrentStep((p) => p + 1)}
              disabled={!validateStep(currentStep)}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              Next Step
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              {loading ? "Adding Vehicle…" : "Add to Garage"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
