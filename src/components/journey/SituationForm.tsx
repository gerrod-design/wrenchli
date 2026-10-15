import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JourneySituationInput, BudgetTier, MetroArea } from "@/lib/journeyPlan";

export interface SituationFormProps {
  initial?: Partial<JourneySituationInput>;
  onSubmit: (input: JourneySituationInput) => void;
  submitLabel?: string;
}

export default function SituationForm({ initial, onSubmit, submitLabel = "Continue" }: SituationFormProps) {
  const [downtimeDaysMin, setDowntimeDaysMin] = useState(initial?.downtimeDaysMin ?? 1);
  const [downtimeDaysMax, setDowntimeDaysMax] = useState(initial?.downtimeDaysMax ?? 3);
  const [dailyDistanceMiles, setDailyDistanceMiles] = useState(initial?.dailyDistanceMiles ?? 10);
  const [budgetTier, setBudgetTier] = useState<BudgetTier>(initial?.budgetTier ?? "medium");
  const [vehicleDrivable, setVehicleDrivable] = useState(initial?.vehicleDrivable ?? true);
  const [metroArea, setMetroArea] = useState<MetroArea>(initial?.metroArea ?? "detroit");

  const isValid =
    downtimeDaysMin >= 0 &&
    downtimeDaysMax >= 0 &&
    dailyDistanceMiles >= 0 &&
    downtimeDaysMax >= downtimeDaysMin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({
      downtimeDaysMin,
      downtimeDaysMax,
      dailyDistanceMiles,
      budgetTier,
      vehicleDrivable,
      metroArea,
      issueCategory: initial?.issueCategory,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>How long will your car be in the shop?</Label>
        <div className="flex gap-3 mt-1">
          <div className="flex-1">
            <Label htmlFor="downtimeMin">At least (days)</Label>
            <Input
              id="downtimeMin"
              type="number"
              min={0}
              value={downtimeDaysMin}
              onChange={(e) => setDowntimeDaysMin(Number(e.target.value))}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="downtimeMax">Up to (days)</Label>
            <Input
              id="downtimeMax"
              type="number"
              min={0}
              value={downtimeDaysMax}
              onChange={(e) => setDowntimeDaysMax(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="dailyDistance">How far do you travel on a typical day? (miles)</Label>
        <Input
          id="dailyDistance"
          type="number"
          min={0}
          value={dailyDistanceMiles}
          onChange={(e) => setDailyDistanceMiles(Number(e.target.value))}
        />
      </div>

      <div>
        <Label htmlFor="budgetTier">What budget fits you best?</Label>
        <select
          id="budgetTier"
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={budgetTier}
          onChange={(e) => setBudgetTier(e.target.value as BudgetTier)}
        >
          <option value="low">Tight</option>
          <option value="medium">Moderate</option>
          <option value="high">Flexible</option>
        </select>
      </div>

      <div>
        <Label htmlFor="vehicleDrivable">Can the car be driven?</Label>
        <select
          id="vehicleDrivable"
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={vehicleDrivable ? "yes" : "no"}
          onChange={(e) => setVehicleDrivable(e.target.value === "yes")}
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      <div>
        <Label htmlFor="metroArea">Where are you?</Label>
        <select
          id="metroArea"
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={metroArea}
          onChange={(e) => setMetroArea(e.target.value as MetroArea)}
        >
          <option value="detroit">Detroit area</option>
          <option value="columbus">Columbus area</option>
          <option value="other">Somewhere else</option>
        </select>
      </div>

      <Button type="submit" disabled={!isValid}>
        {submitLabel}
      </Button>
    </form>
  );
}
