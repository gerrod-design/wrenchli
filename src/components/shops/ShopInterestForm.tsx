import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";

const SHOP_SYSTEMS = ["Tekmetric", "Mitchell 1", "Shop-Ware", "Other"] as const;

/**
 * Shop-side "express interest / learn more" inbound form.
 * Honest framing: the partner program is paused while Wrenchli focuses on the
 * free driver assessment; this captures interest for when onboarding opens.
 */
export default function ShopInterestForm() {
  const [shopName, setShopName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [shopSystem, setShopSystem] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("shop_interest").insert({
        shop_name: shopName.trim(),
        contact_name: contactName.trim() || null,
        email: email.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        shop_system: shopSystem || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({
        title: "Interest recorded",
        description: "We'll be in touch when onboarding opens in your area.",
      });
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-wrenchli-green" />
        <h3 className="font-heading text-xl font-bold">You're on our radar</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Thanks for your interest. We'll reach out when shop onboarding opens
          in your area.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 md:p-8">
      <h3 className="font-heading text-xl font-bold md:text-2xl">Run a shop? Express interest</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        The partner program is paused while we focus on the free driver
        assessment. Tell us you're interested and we'll reach out when
        onboarding opens in your area.
      </p>
      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="int-shop-name">Shop name</Label>
          <Input
            id="int-shop-name"
            type="text"
            placeholder="e.g. Main Street Auto Repair"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
            maxLength={120}
            className="h-12 text-base"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="int-contact">Contact name</Label>
            <Input
              id="int-contact"
              type="text"
              placeholder="Your name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              maxLength={100}
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="int-city">City</Label>
            <Input
              id="int-city"
              type="text"
              placeholder="e.g. Detroit"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={80}
              className="h-12 text-base"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="int-email">Email</Label>
            <Input
              id="int-email"
              type="email"
              placeholder="you@yourshop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="int-phone">
              Phone <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="int-phone"
              type="tel"
              placeholder="(313) 555-0123"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
              className="h-12 text-base"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="int-system">Shop management system</Label>
          <Select value={shopSystem} onValueChange={setShopSystem}>
            <SelectTrigger id="int-system" className="h-12 text-base">
              <SelectValue placeholder="Select your system (optional)" />
            </SelectTrigger>
            <SelectContent>
              {SHOP_SYSTEMS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          disabled={loading || !shopName.trim() || !email.trim()}
          className="h-12 w-full font-semibold text-base"
        >
          {loading ? "Sending..." : "Notify me when onboarding opens"}
        </Button>
      </div>
    </form>
  );
}
