import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceContractInput } from "@/lib/journeyPlanData";

export interface ServiceContractFormProps {
  onSave: (contract: ServiceContractInput) => void | Promise<void>;
}

export default function ServiceContractForm({ onSave }: ServiceContractFormProps) {
  const [providerName, setProviderName] = useState("");
  const [planName, setPlanName] = useState("");
  const [coverageNotes, setCoverageNotes] = useState("");
  const [expiresOn, setExpiresOn] = useState("");

  const isValid = providerName.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    await onSave({
      providerName: providerName.trim(),
      planName: planName.trim() || undefined,
      coverageNotes: coverageNotes.trim() || undefined,
      expiresOn: expiresOn.trim() || undefined,
    });
    setProviderName("");
    setPlanName("");
    setCoverageNotes("");
    setExpiresOn("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Add a service contract</h3>

      <div>
        <Label htmlFor="providerName">Provider name</Label>
        <Input
          id="providerName"
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="planName">Plan name</Label>
        <Input id="planName" value={planName} onChange={(e) => setPlanName(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="coverageNotes">Coverage notes</Label>
        <textarea
          id="coverageNotes"
          className="w-full border rounded-md px-3 py-2 text-sm"
          placeholder="What does it cover? (e.g. powertrain, roadside)"
          value={coverageNotes}
          onChange={(e) => setCoverageNotes(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="expiresOn">Expires on</Label>
        <Input
          id="expiresOn"
          type="date"
          value={expiresOn}
          onChange={(e) => setExpiresOn(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={!isValid}>
        Save contract
      </Button>

      <p className="text-xs text-muted-foreground">
        Adding a contract never changes your coverage — it only helps Wrenchli remind you to check
        it before you pay.
      </p>
    </form>
  );
}
