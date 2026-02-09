import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { parseDtcCodes, getDtcDescription } from "@/data/dtcCodes";
import VehicleIdentifier, { type VehicleData } from "@/components/vehicle/VehicleIdentifier";
import { useGarage } from "@/hooks/useGarage";
import VehicleSilhouette, { mapBodyClass, DEFAULT_COLOR } from "@/components/vehicle/VehicleSilhouette";

export default function QuickActionBar() {
  const navigate = useNavigate();
  const [issueText, setIssueText] = useState("");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [validationError, setValidationError] = useState("");
  const [garagePreFilled, setGaragePreFilled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { getActiveVehicle, updateLastUsed } = useGarage();
  const activeGarageVehicle = getActiveVehicle();

  // Pre-fill from garage on mount
  useEffect(() => {
    if (activeGarageVehicle && !vehicle && !dismissed) {
      const data: VehicleData = {
        year: activeGarageVehicle.year,
        make: activeGarageVehicle.make,
        model: activeGarageVehicle.model,
        trim: activeGarageVehicle.trim,
        engine: activeGarageVehicle.engine,
        transmission: activeGarageVehicle.transmission,
        driveType: activeGarageVehicle.driveType,
        fuelType: activeGarageVehicle.fuelType,
      };
      setVehicle(data);
      setGaragePreFilled(true);
      updateLastUsed(activeGarageVehicle.garageId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectedCodes = useMemo(() => parseDtcCodes(issueText), [issueText]);

  const codeDescriptions = useMemo(
    () =>
      detectedCodes.map((code) => ({
        code,
        description: getDtcDescription(code),
      })),
    [detectedCodes]
  );

  const handleVehicleChange = useCallback((data: VehicleData | null) => {
    setVehicle(data);
    setValidationError("");
    if (data) setGaragePreFilled(false);
  }, []);

  const handleDismissGarage = () => {
    setGaragePreFilled(false);
    setDismissed(true);
    setVehicle(null);
  };

  const handleSubmit = () => {
    if (!vehicle?.year || !vehicle?.make || !vehicle?.model) {
      setValidationError("Please identify your vehicle to get accurate results.");
      return;
    }
    setValidationError("");

    const params = new URLSearchParams({
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
    });

    if (vehicle.trim) params.set("trim", vehicle.trim);
    if (vehicle.engine) params.set("engine", vehicle.engine);

    if (detectedCodes.length > 0) {
      params.set("code", detectedCodes.join(","));
    } else if (issueText.trim()) {
      params.set("symptom", issueText.trim());
    }

    navigate(`/vehicle-insights?${params.toString()}`);
  };

  return (
    <section id="quote" className="relative -mt-8 z-10">
      <div className="container-wrenchli">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl md:p-8 space-y-4">

          {/* Welcome back bar when pre-filled from garage */}
          {garagePreFilled && activeGarageVehicle && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 flex items-center gap-3">
              <VehicleSilhouette
                bodyType={activeGarageVehicle.bodyType || mapBodyClass("")}
                color={activeGarageVehicle.color || DEFAULT_COLOR.hex}
                className="w-16 h-8 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Welcome back! Using: <span className="text-accent">{activeGarageVehicle.nickname}</span>
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activeGarageVehicle.year} {activeGarageVehicle.make} {activeGarageVehicle.model}
                  {activeGarageVehicle.trim ? ` ${activeGarageVehicle.trim}` : ""}
                </p>
              </div>
              <button
                onClick={handleDismissGarage}
                className="text-xs text-muted-foreground hover:text-foreground shrink-0 p-1"
                aria-label="Choose a different vehicle"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Issue description */}
          <Input
            placeholder="Describe your issue or enter a DTC code..."
            value={issueText}
            onChange={(e) => {
              setIssueText(e.target.value);
              setValidationError("");
            }}
            className="h-12 text-base"
          />

          {/* DTC code detection badges */}
          {codeDescriptions.length > 0 && (
            <div className="flex flex-col gap-2">
              {codeDescriptions.map(({ code, description }) => (
                <div key={code} className="flex items-start gap-2 text-sm">
                  <Badge variant="secondary" className="shrink-0 bg-accent/10 text-accent border-accent/20 font-mono">
                    <Search className="mr-1 h-3 w-3" />
                    {code}
                  </Badge>
                  <span className="text-muted-foreground">
                    {description ?? "Unknown code — we'll look it up for you"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Vehicle identifier — hidden when pre-filled from garage */}
          {!garagePreFilled && (
            <VehicleIdentifier onVehicleChange={handleVehicleChange} />
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base"
          >
            Get Your Diagnosis
          </Button>

          {/* Validation error */}
          {validationError && (
            <p className="text-sm text-destructive font-medium">{validationError}</p>
          )}
        </div>
      </div>
    </section>
  );
}
