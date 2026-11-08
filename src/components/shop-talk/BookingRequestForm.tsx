import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitShopBookingRequest,
  type ShopTalkWindow,
} from "@/lib/shopTalk";

interface BookingRequestFormProps {
  windows: ShopTalkWindow[];
  /** Verbatim condition-3 wording from the shared config. */
  pendingNotice: string;
  conversationId: string | null;
}

/**
 * Book-directly rung of /for-shops/talk. Submits a booking REQUEST that
 * lands as PENDING; a human confirms every appointment (no auto-confirm,
 * no email is sent by this build).
 */
export default function BookingRequestForm({
  windows,
  pendingNotice,
  conversationId,
}: BookingRequestFormProps) {
  const [contactName, setContactName] = useState("");
  const [shopName, setShopName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [pickedWindows, setPickedWindows] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  function toggleWindow(id: string, checked: boolean) {
    setPickedWindows((prev) =>
      checked ? [...prev, id] : prev.filter((w) => w !== id),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problems: string[] = [];
    if (!contactName.trim()) problems.push("Please add your name.");
    if (!shopName.trim()) problems.push("Please add your shop's name.");
    if (!contactPhone.trim() && !contactEmail.trim()) {
      problems.push("Please add a business phone number or an email address, so we can confirm your call.");
    }
    if (pickedWindows.length === 0) problems.push("Please pick at least one time window.");
    setErrors(problems);
    if (problems.length > 0) return;

    setSubmitting(true);
    try {
      await submitShopBookingRequest({
        contactName: contactName.trim(),
        shopName: shopName.trim(),
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        preferredWindows: pickedWindows,
        notes: notes.trim() || undefined,
        conversationId,
      });
      setDone(true);
    } catch (err) {
      setErrors([
        err instanceof Error
          ? err.message
          : "We could not save your request. Please try again.",
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border bg-background p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-10 w-10 text-accent" aria-hidden />
        <h3 className="mt-3 font-heading text-xl font-bold">Request received</h3>
        <p className="mt-2 leading-relaxed text-muted-foreground">{pendingNotice}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border bg-background p-6 shadow-sm"
      noValidate
    >
      {errors.length > 0 && (
        <div className="rounded-lg bg-destructive/10 p-4" role="alert">
          <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bk-name">Your name</Label>
          <Input
            id="bk-name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            maxLength={100}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bk-shop">Shop name</Label>
          <Input
            id="bk-shop"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            maxLength={200}
            autoComplete="organization"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bk-phone">Business phone</Label>
          <Input
            id="bk-phone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            maxLength={25}
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bk-email">Email</Label>
          <Input
            id="bk-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            maxLength={254}
            autoComplete="email"
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Phone or email, whichever is better for confirming your call. We only
        use it to confirm this appointment.
      </p>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">When works for a call?</legend>
        {windows.map((w) => (
          <div key={w.id} className="flex items-center gap-3">
            <Checkbox
              id={`bk-window-${w.id}`}
              checked={pickedWindows.includes(w.id)}
              onCheckedChange={(checked) => toggleWindow(w.id, checked === true)}
            />
            <Label htmlFor={`bk-window-${w.id}`} className="font-normal">
              {w.label}
            </Label>
          </div>
        ))}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="bk-notes">Anything we should know before the call? (optional)</Label>
        <Textarea
          id="bk-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
        />
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Sending..." : "Request this call"}
      </Button>
      <p className="text-sm text-muted-foreground">{pendingNotice}</p>
    </form>
  );
}
