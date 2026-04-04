import { useState } from "react";
import { Activity, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SymptomInputProps {
  onSubmit: (data: { symptoms: string; year: string; make: string; model: string; zipCode: string }) => void;
  isLoading: boolean;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 35 }, (_, i) => String(currentYear - i));

export default function SymptomInput({ onSubmit, isLoading }: SymptomInputProps) {
  const [symptoms, setSymptoms] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [zipCode, setZipCode] = useState("");

  const canSubmit = symptoms.trim().length >= 10 && year && make && model;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
          <Activity className="h-4 w-4" />
          Step 1 of 5: Describe Your Issue
        </div>
        <h2 className="text-3xl font-heading font-bold text-foreground">
          What's wrong with your car?
        </h2>
        <p className="text-muted-foreground mt-2">
          Describe the symptoms and we'll provide a transparent, data-driven diagnosis.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5 shadow-sm">
        {/* Vehicle selector */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Your Vehicle</label>
          <div className="grid grid-cols-3 gap-3">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Make (e.g. Honda)"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="bg-background"
            />
            <Input
              placeholder="Model (e.g. Civic)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Describe the symptoms
          </label>
          <Textarea
            placeholder="e.g. Car makes clicking noise when turning key, won't start. Battery light was on yesterday."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="bg-background min-h-[120px] resize-none"
          />
          <p className={cn(
            "text-xs mt-1 transition-colors",
            symptoms.length < 10 ? "text-muted-foreground" : "text-accent"
          )}>
            {symptoms.length < 10 ? `${10 - symptoms.length} more characters needed` : "✓ Good description"}
          </p>
        </div>

        {/* ZIP */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            ZIP Code <span className="text-muted-foreground font-normal">(for local pricing)</span>
          </label>
          <Input
            placeholder="e.g. 48201"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
            className="bg-background max-w-[200px]"
            inputMode="numeric"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={() => onSubmit({ symptoms, year, make, model, zipCode })}
          disabled={!canSubmit || isLoading}
          size="lg"
          className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isLoading ? (
            <>
              <Activity className="mr-2 h-5 w-5 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              Get AI Diagnosis
              <ChevronRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Free • No account required • Full transparency on how we reach our conclusions
        </p>
      </div>
    </div>
  );
}
