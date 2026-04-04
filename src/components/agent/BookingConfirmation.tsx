import { CheckCircle, Phone, MapPin, FileText, ExternalLink, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { RankedShop } from "./types";

interface BookingConfirmationProps {
  shop: RankedShop;
  diagnosis: string;
  estimatedCost: number;
  trackingNumber: string;
  onDone: () => void;
  onViewOutcome: () => void;
}

export default function BookingConfirmation({
  shop, diagnosis, estimatedCost, trackingNumber, onDone, onViewOutcome
}: BookingConfirmationProps) {
  const copyTracking = () => {
    navigator.clipboard.writeText(trackingNumber);
    toast.success("Tracking number copied!");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
          <CheckCircle className="h-8 w-8 text-accent" />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
          Step 5 of 5: Booking Confirmed
        </div>
        <h2 className="text-3xl font-heading font-bold text-foreground">
          You're All Set!
        </h2>
        <p className="text-muted-foreground mt-2">
          Here's your booking summary and shop contact information.
        </p>
      </div>

      <div className="space-y-4">
        {/* Summary card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4">Booking Summary</h3>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Diagnosis</span>
              <span className="font-medium text-foreground">{diagnosis}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Cost</span>
              <span className="font-medium text-foreground">${estimatedCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shop</span>
              <span className="font-medium text-foreground">{shop.name}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tracking Number</span>
              <button
                onClick={copyTracking}
                className="flex items-center gap-1.5 font-mono text-accent hover:underline"
              >
                {trackingNumber}
                <ClipboardCopy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Shop contact */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4">Shop Contact</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-foreground">
                {shop.address}{shop.city ? `, ${shop.city}` : ""}{shop.state ? `, ${shop.state}` : ""} {shop.zipCode}
              </span>
            </div>
            {shop.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`tel:${shop.phone}`} className="text-accent hover:underline">{shop.phone}</a>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            {shop.phone && (
              <Button asChild variant="outline" className="flex-1">
                <a href={`tel:${shop.phone}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call Shop
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-accent/5 rounded-2xl border border-accent/20 p-5">
          <h4 className="text-sm font-bold text-accent mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            What Happens Next
          </h4>
          <ol className="space-y-2 text-sm text-foreground">
            <li className="flex items-start gap-2">
              <span className="bg-accent text-accent-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
              Contact the shop to schedule your appointment.
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-accent text-accent-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
              Share your tracking number ({trackingNumber}) for context.
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-accent text-accent-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
              After repair, return here to report the outcome and help improve our accuracy.
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={onViewOutcome}
            size="lg"
            className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Report Repair Outcome
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>
          <Button onClick={onDone} variant="ghost" className="text-muted-foreground">
            Done — I'll report later
          </Button>
        </div>
      </div>
    </div>
  );
}
