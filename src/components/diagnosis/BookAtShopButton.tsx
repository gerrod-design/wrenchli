import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

interface BookAtShopButtonProps {
  diagnosisTitle: string;
  vehicle: string;
  shopName?: string;
  shopEmail?: string;
  className?: string;
}

export default function BookAtShopButton({
  diagnosisTitle,
  vehicle,
  shopName,
  shopEmail,
  className,
}: BookAtShopButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    preferredTime: "",
    notes: "",
  });

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.preferredTime.trim()) {
      toast.error("Please fill in name, phone, and preferred time.");
      return;
    }

    setLoading(true);
    try {
      trackEvent({
        event_type: "user_action",
        category: "navigation",
        action: "shop_booking_submit",
        label: shopName || "unknown_shop",
        metadata: { diagnosisTitle, vehicle },
      });

      const { error } = await supabase.functions.invoke("submit-booking-request", {
        body: {
          to: shopEmail || "bookings@wrenchli.net",
          shopName: shopName || "your shop",
          customerName: form.name,
          customerPhone: form.phone,
          preferredTime: form.preferredTime,
          vehicle,
          diagnosisTitle,
          notes: form.notes,
        },
      });


      if (error) throw error;

      setSubmitted(true);
      toast.success("Booking request sent!", {
        description: `${shopName || "The shop"} will contact you to confirm.`,
      });
    } catch (err) {
      console.error("Booking submission failed:", err);
      toast.error("Couldn't send booking request", {
        description: "Please try again or call the shop directly.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSubmitted(false);
      setForm({ name: "", phone: "", preferredTime: "", notes: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className={`w-full text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 ${className ?? ""}`}
        >
          <Calendar className="mr-1.5 h-3.5 w-3.5" />
          Book at This Shop
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-10 w-10 text-wrenchli-teal" />
            <DialogTitle>Request sent</DialogTitle>
            <DialogDescription>
              {shopName || "The shop"} will reach out at <strong>{form.phone}</strong> to confirm your appointment for <strong>{form.preferredTime}</strong>.
            </DialogDescription>
            <Button onClick={() => handleOpenChange(false)} className="mt-2">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Book at {shopName || "this shop"}</DialogTitle>
              <DialogDescription>
                Send your contact info and a preferred time. The shop will text or call you to confirm.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="book-name">Your name *</Label>
                <Input
                  id="book-name"
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Jane Doe"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="book-phone">Phone number *</Label>
                <Input
                  id="book-phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  maxLength={20}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="book-time">Preferred time *</Label>
                <Input
                  id="book-time"
                  required
                  value={form.preferredTime}
                  onChange={(e) => update("preferredTime", e.target.value)}
                  placeholder="e.g., Tuesday morning, or April 22 at 9am"
                  maxLength={120}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="book-notes">Anything else? (optional)</Label>
                <Textarea
                  id="book-notes"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Drop-off vs. wait, additional symptoms, etc."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="rounded-md bg-muted/50 border border-border p-3 text-xs text-muted-foreground space-y-1">
                <p><strong className="text-foreground">Vehicle:</strong> {vehicle}</p>
                <p><strong className="text-foreground">Concern:</strong> {diagnosisTitle}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
