import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { parseDtcCodes, getDtcDescription } from "@/data/dtcCodes";

const modelsByMake: Record<string, string[]> = {
  Ford: ["F-150", "Escape", "Explorer", "Mustang", "Edge", "Bronco", "Ranger", "Expedition", "Fusion", "Focus"],
  Chevrolet: ["Silverado", "Equinox", "Malibu", "Traverse", "Camaro", "Tahoe", "Suburban", "Colorado", "Blazer", "Trax"],
  Toyota: ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "Tundra", "4Runner", "Prius", "Sienna", "Supra"],
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "HR-V", "Odyssey", "Ridgeline", "Passport", "Fit", "Insight"],
  Chrysler: ["300", "Pacifica", "Voyager"],
  Jeep: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator"],
  GMC: ["Sierra", "Terrain", "Acadia", "Yukon", "Canyon", "Hummer EV"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona", "Palisade", "Venue", "Ioniq 5"],
  Kia: ["Forte", "K5", "Sportage", "Sorento", "Telluride", "Soul", "Seltos", "EV6"],
  Nissan: ["Altima", "Sentra", "Rogue", "Pathfinder", "Frontier", "Murano", "Kicks", "Versa"],
  BMW: ["3 Series", "5 Series", "X3", "X5", "X1", "4 Series", "7 Series", "iX"],
  Mercedes: ["C-Class", "E-Class", "GLC", "GLE", "A-Class", "S-Class", "GLA", "GLB"],
};

const makes = ["Ford", "Chevrolet", "Toyota", "Honda", "Chrysler", "Jeep", "GMC", "Hyundai", "Kia", "Nissan", "BMW", "Mercedes", "Other"];

export default function QuickActionBar() {
  const navigate = useNavigate();
  const [issueText, setIssueText] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
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

  const handleSubmit = () => {
    if (!selectedYear || !selectedMake || !selectedModel) {
      setValidationError("Please select your vehicle to get accurate results.");
      return;
    }
    setValidationError("");

    const params = new URLSearchParams({
      year: selectedYear,
      make: selectedMake,
      model: selectedModel,
    });

    if (detectedCodes.length > 0) {
      params.set("code", detectedCodes.join(","));
    } else if (issueText.trim()) {
      params.set("symptom", issueText.trim());
    }

    navigate(`/vehicle-insights?${params.toString()}`);
  };

  const handleMakeChange = (value: string) => {
    setSelectedMake(value);
    setSelectedModel("");
    setValidationError("");
  };

  return (
    <section id="quote" className="relative -mt-8 z-10">
      <div className="container-wrenchli">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl md:p-8">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <Input
              placeholder="Describe your issue or enter a code..."
              value={issueText}
              onChange={(e) => {
                setIssueText(e.target.value);
                setValidationError("");
              }}
              className="h-12 text-base sm:col-span-2 md:col-span-1 min-w-0"
            />
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setValidationError(""); }}
              className="flex h-12 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Year</option>
              {Array.from({ length: 30 }, (_, i) => 2025 - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={selectedMake}
              onChange={(e) => handleMakeChange(e.target.value)}
              className="flex h-12 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Make</option>
              {makes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={selectedModel}
              onChange={(e) => { setSelectedModel(e.target.value); setValidationError(""); }}
              className="flex h-12 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Model</option>
              {(modelsByMake[selectedMake] || []).map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <Button
              onClick={handleSubmit}
              className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-6 whitespace-nowrap"
            >
              Get Your Diagnosis
            </Button>
          </div>

          {/* DTC code detection badges */}
          {codeDescriptions.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
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

          {/* Validation error */}
          {validationError && (
            <p className="mt-3 text-sm text-destructive font-medium">{validationError}</p>
          )}
        </div>
      </div>
    </section>
  );
}
