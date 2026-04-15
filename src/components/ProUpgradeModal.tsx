import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Lazy-load Stripe only when the modal opens to avoid blank-screen crashes
let stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe("pk_test_51T1QqsGgIpvcscSeR1qGlKdIfTomSNBZoZqKhM0Ou6vji7JFyxAX8wNPmxEjACaerUJY1BhoQWxKRsvvFyzHyo2L00IchfYaT2").catch((err) => {
      console.warn("[Stripe] Failed to load Stripe.js:", err);
      stripePromise = null; // allow retry
      return null;
    });
  }
  return stripePromise;
}

function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError("");

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/garage" },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed. Please try again.");
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
      )}
      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-3 font-semibold"
        style={{ backgroundColor: "#E07B39", color: "#0F1117" }}
      >
        {processing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Crown className="h-4 w-4 mr-2" />
        )}
        {processing ? "Processing…" : "Subscribe — $2.99/month"}
      </Button>
      <div className="flex items-center justify-center gap-1.5 text-[10px]" style={{ color: "#6B7280" }}>
        <Shield className="h-3 w-3" /> Powered by Stripe. Cancel anytime.
      </div>
    </form>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProUpgradeModal({ open, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !user) {
      setClientSecret(null);
      setError("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");

    supabase.functions
      .invoke("create-pro-subscription", {
        body: { user_id: user.id, email: user.email },
      })
      .then(({ data, error: fnError }) => {
        if (cancelled) return;
        if (fnError) {
          setError(fnError.message || "Could not start checkout");
        } else if (data?.error) {
          setError(data.error);
        } else if (data?.client_secret) {
          setClientSecret(data.client_secret);
        } else {
          setError("Unexpected response from server");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Network error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, user]);

  const handlePaymentSuccess = () => {
    toast.success("Welcome to Wrenchli Pro! Your garage is now unlimited.");
    onClose();
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-md border-0"
        style={{
          backgroundColor: "#0F1117",
          color: "#F5F5F5",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg" style={{ color: "#F5F5F5" }}>
            <Crown className="h-5 w-5" style={{ color: "#E07B39" }} />
            Upgrade to Wrenchli Pro
          </DialogTitle>
          <DialogDescription style={{ color: "#6B7280" }}>
            Unlimited vehicles, recall alerts, PDF exports, and more — $2.99/month.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#E07B39" }} />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-6">
              <p className="text-sm text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={onClose} className="text-xs">
                Close
              </Button>
            </div>
          )}

          {clientSecret && !loading && (
            <Elements
              stripe={getStripe()}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#E07B39",
                    colorBackground: "#1A1D27",
                    colorText: "#F5F5F5",
                    colorDanger: "#EF4444",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    borderRadius: "8px",
                  },
                },
              }}
            >
              <PaymentForm onSuccess={handlePaymentSuccess} />
            </Elements>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
