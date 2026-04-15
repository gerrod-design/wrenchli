import { useState } from "react";
import { Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ShopShareConsentProps {
  consented: boolean;
  onConsentChange: (consented: boolean) => void;
}

export default function ShopShareConsent({ consented, onConsentChange }: ShopShareConsentProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Shield className="h-6 w-6 shrink-0 mt-0.5 text-accent" />
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Share your assessment with a local shop?
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            If you choose a shop below, they will receive your vehicle details and symptom summary so they can prepare for your visit. You control what gets shared.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer group">
        <Checkbox
          checked={consented}
          onCheckedChange={(checked) => onConsentChange(checked === true)}
          className="border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent"
        />
        <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
          Yes, share my assessment with the shop I select
        </span>
      </label>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Your data is never shared without your permission. Shops cannot see your assessment until you choose to share it.
      </p>
    </div>
  );
}
