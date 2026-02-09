import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { parseDtcCodes, getDtcDescription } from "@/data/dtcCodes";
import VehicleIdentifier, { type VehicleData } from "@/components/vehicle/VehicleIdentifier";

export default function QuickActionBar() {
  const navigate = useNavigate();
  const [issueText, setIssueText] = useState("");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [validationError, setValidationError] = useState("");

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
  }, []);

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
          {/* Issue description */}
          <Input
            placeholder="Describe your issue or enter a code..."
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

          {/* Vehicle identifier */}
          <VehicleIdentifier onVehicleChange={handleVehicleChange} />

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
