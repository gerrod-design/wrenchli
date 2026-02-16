import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Loader2,
  Check,
  Zap,
  Crown,
  ExternalLink,
  LogIn,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

// Stripe product/price mapping
const TIERS = {
  free: {
    name: "Free",
    price: "$0",
    calls: "50 / month",
    price_id: null,
    product_id: null,
    features: ["50 API calls/month", "All 5 endpoints", "Community support"],
  },
  pro: {
    name: "Pro",
    price: "$49",
    calls: "500 / month",
    price_id: "price_1T1RFeGgIpvcscSeSqFbCitS",
    product_id: "prod_SHxqHdT5TcnmCw",
    features: [
      "500 API calls/month",
      "All 5 endpoints",
      "Priority support",
      "Usage analytics",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "$199",
    calls: "5,000 / month",
    price_id: "price_1T1RHBGgIpvcscSeOjZjBECx",
    product_id: "prod_SHxsQrpMdNxPMH",
    features: [
      "5,000 API calls/month",
      "All 5 endpoints",
      "Dedicated support",
      "Custom rate limits",
      "SLA guarantee",
    ],
  },
} as const;

type TierKey = keyof typeof TIERS;

interface SubscriptionState {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
  tier: TierKey;
}

export default function DeveloperBilling() {
  const { user, session, signIn, signUp } = useAuth();
  const [sub, setSub] = useState<SubscriptionState>({
    subscribed: false,
    product_id: null,
    subscription_end: null,
    tier: "free",
  });
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const getTierFromProductId = (productId: string | null): TierKey => {
    if (!productId) return "free";
    for (const [key, tier] of Object.entries(TIERS)) {
      if (tier.product_id === productId) return key as TierKey;
    }
    return "free";
  };

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      const tier = getTierFromProductId(data.product_id);
      setSub({ ...data, tier });
    } catch (err) {
      console.error("check-subscription error:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (user) checkSubscription();
  }, [user, checkSubscription]);

  // Check for checkout success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast.success("Subscription activated! Checking status...");
      window.history.replaceState({}, "", "/developers");
      setTimeout(checkSubscription, 2000);
    } else if (params.get("checkout") === "cancel") {
      toast.info("Checkout cancelled");
      window.history.replaceState({}, "", "/developers");
    }
  }, [checkSubscription]);

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setCheckoutLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const result =
        authMode === "login"
          ? await signIn(email, password)
          : await signUp(email, password);
      if (result.error) {
        toast.error(result.error);
      } else if (authMode === "signup") {
        toast.success("Check your email to verify your account!");
        setShowAuth(false);
      } else {
        toast.success("Signed in!");
        setShowAuth(false);
      }
    } catch {
      toast.error("Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const tierIcon = (tier: TierKey) => {
    if (tier === "enterprise") return <Crown className="h-5 w-5" />;
    if (tier === "pro") return <Zap className="h-5 w-5" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Auth status bar */}
      {!user && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Sign in to manage your API subscription and billing.
          </p>
          <Button size="sm" onClick={() => setShowAuth(true)}>
            <LogIn className="h-4 w-4 mr-1.5" /> Sign In
          </Button>
        </div>
      )}

      {user && sub.subscribed && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-primary-foreground">
              {TIERS[sub.tier].name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {sub.subscription_end &&
                `Renews ${new Date(sub.subscription_end).toLocaleDateString()}`}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleManage}>
            <CreditCard className="h-4 w-4 mr-1.5" /> Manage Billing
          </Button>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(TIERS) as [TierKey, (typeof TIERS)[TierKey]][]).map(
          ([key, tier]) => {
            const isCurrent = user && sub.tier === key;
            const isUpgrade =
              user &&
              sub.subscribed &&
              key !== "free" &&
              key !== sub.tier;

            return (
              <Card
                key={key}
                className={`relative p-6 flex flex-col ${
                  key === "pro"
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border"
                } ${isCurrent ? "ring-2 ring-primary" : ""}`}
              >
                {key === "pro" && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                    Most Popular
                  </Badge>
                )}

                {isCurrent && (
                  <Badge
                    variant="outline"
                    className="absolute -top-2.5 right-4 text-xs border-primary text-primary"
                  >
                    Your Plan
                  </Badge>
                )}

                <div className="flex items-center gap-2 mb-2">
                  {tierIcon(key)}
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {key !== "free" && (
                    <span className="text-muted-foreground text-sm">/mo</span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {tier.calls} API calls
                </p>

                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {key === "free" ? (
                  <Button variant="outline" disabled={!!isCurrent} className="w-full">
                    {isCurrent ? "Current Plan" : "Free Forever"}
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${
                      key === "pro"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : ""
                    }`}
                    variant={key === "pro" ? "default" : "outline"}
                    disabled={!!isCurrent || checkoutLoading === tier.price_id}
                    onClick={() => tier.price_id && handleCheckout(tier.price_id)}
                  >
                    {checkoutLoading === tier.price_id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                    )}
                    {isCurrent
                      ? "Current Plan"
                      : isUpgrade
                      ? "Change Plan"
                      : "Subscribe"}
                  </Button>
                )}
              </Card>
            );
          }
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">
            Checking subscription...
          </span>
        </div>
      )}

      {/* Auth Dialog */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {authMode === "login" ? "Sign In" : "Create Account"}
            </DialogTitle>
            <DialogDescription>
              {authMode === "login"
                ? "Sign in to manage your API subscription."
                : "Create a developer account to get started."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAuth} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : authMode === "login" ? (
                  <LogIn className="h-4 w-4 mr-1.5" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-1.5" />
                )}
                {authMode === "login" ? "Sign In" : "Sign Up"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() =>
                  setAuthMode(authMode === "login" ? "signup" : "login")
                }
              >
                {authMode === "login"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
