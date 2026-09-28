import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";

interface ShopNominationFormProps {
  source?: string;
}

/**
 * Consumer "recommend your shop" nomination form.
 * Featherweight: shop name + city, optional email for follow-up.
 * Honest framing: program is onboarding gradually; nominations are used as
 * aggregate demand evidence with shops — no named attribution promised.
 */
export default function ShopNominationForm({ source = "for-shops" }: ShopNominationFormProps) {
  const [shopName, setShopName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("shop_nominations").insert({
        shop_name: shopName.trim(),
        city: city.trim() || null,
        consumer_email: email.trim() || null,
        source,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({
        title: "Nomination received",
        description: "Thanks — we'll reach out when we open in your area.",
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
        <h3 className="font-heading text-xl font-bold">Thanks for the nomination</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We'll reach out when we open in your area. Your nomination helps show
          shops that drivers want them on Wrenchli.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 md:p-8">
      <h3 className="font-heading text-xl font-bold md:text-2xl">Nominate your shop</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        We're onboarding shops gradually — nominate yours and we'll reach out
        when we open in your area. We use nomination counts to show shops that
        drivers want them on Wrenchli.
      </p>
      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nom-shop-name">Shop name</Label>
          <Input
            id="nom-shop-name"
            type="text"
            placeholder="e.g. Main Street Auto Repair"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
            maxLength={120}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nom-city">Town / city</Label>
          <Input
            id="nom-city"
            type="text"
            placeholder="e.g. Detroit"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={80}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nom-email">
            Your email <span className="font-normal text-muted-foreground">(optional — for follow-up only)</span>
          </Label>
          <Input
            id="nom-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            className="h-12 text-base"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !shopName.trim()}
          className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base"
        >
          {loading ? "Sending..." : "Nominate this shop"}
        </Button>
      </div>
    </form>
  );
}
