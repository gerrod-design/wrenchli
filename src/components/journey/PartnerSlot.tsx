import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WaitlistForm from "@/components/WaitlistForm";

export interface PartnerSlotProps {
  label: string;
  description: string;
  surface: "consumer" | "partner_preview";
  slotKey: string; // e.g. 'rideshare_slot' — used as the waitlist source tag
}

export default function PartnerSlot({
  label,
  description,
  surface,
  slotKey,
}: PartnerSlotProps): JSX.Element {
  if (surface === "partner_preview") {
    return (
      <Card className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">{label}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Badge variant="outline">Open partner slot</Badge>
        <p className="text-sm">
          Launching with partners in Detroit and Columbus — be first.
        </p>
        <a
          href="/contact"
          className="inline-block text-sm font-medium text-primary underline underline-offset-4"
        >
          Interested as a partner? Get in touch
        </a>
      </Card>
    );
  }

  return (
    <Card className="border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold">{label}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Badge variant="outline">Partner launching soon</Badge>
      <WaitlistForm
        userType="consumer"
        source={`journey-${slotKey}`}
        toastTitle="You're on the list"
        toastDescription="We'll let you know when this option is live in your area."
      />
    </Card>
  );
}
