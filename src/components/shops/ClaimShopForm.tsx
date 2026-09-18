import { useState } from "react";
import { Store, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const CLAIM_EMAIL = "gerrod@wrenchli.net";

/**
 * Claim CTA v1: inline intent form. On submit it opens the user's mail client
 * with a prefilled claim email. No backend write — full verification is
 * post-buildathon.
 */
export default function ClaimShopForm({
  shopName,
  shopSlug,
}: {
  shopName: string;
  shopSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please add your name and a callback phone number.");
      return;
    }
    setError("");
    const subject = `Shop claim intent: ${shopName}`;
    const body = [
      `Shop: ${shopName}`,
      `Listing: https://wrenchli.net/shops/${shopSlug}`,
      `Name: ${name.trim()}`,
      `Role: ${role.trim() || "(not provided)"}`,
      `Phone: ${phone.trim()}`,
      ``,
      `Please contact me to verify ownership and activate this listing.`,
    ].join("\n");
    window.location.href = `mailto:${CLAIM_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  if (sent) {
    return (
      <Card className="border-wrenchli-green/40 bg-wrenchli-green/5">
        <CardContent className="p-5 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-wrenchli-green mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Claim request started</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your email app should have opened with the claim details. If it
              didn't, email {CLAIM_EMAIL} directly and mention "{shopName}".
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="p-5">
        {!open ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Store className="h-8 w-8 text-wrenchli-trust-blue flex-shrink-0" />
              <div>
                <p className="font-semibold">Is this your shop?</p>
                <p className="text-sm text-muted-foreground">
                  Claim this listing to add your certified technicians and keep
                  your information current.
                </p>
              </div>
            </div>
            <Button onClick={() => setOpen(true)} className="shrink-0">
              Claim this shop
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="font-semibold text-sm">
              Claim "{shopName}" — we'll verify ownership before activating.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="claim-name"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Your name *
                </label>
                <Input
                  id="claim-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  autoComplete="name"
                />
              </div>
              <div>
                <label
                  htmlFor="claim-role"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Role at shop
                </label>
                <Input
                  id="claim-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Owner, manager…"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="claim-phone"
                className="text-xs font-medium text-muted-foreground"
              >
                Callback phone *
              </label>
              <Input
                id="claim-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(313) 555-0123"
                autoComplete="tel"
                inputMode="tel"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit">Send claim request</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This opens your email app with the details prefilled. We never
              share your information with anyone but the Wrenchli team.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
