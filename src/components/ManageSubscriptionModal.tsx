import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ProSubscription } from "@/hooks/useProSubscription";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  subscription: ProSubscription | null;
  onUpdated: () => void;
}

export default function ManageSubscriptionModal({ open, onClose, subscription, onUpdated }: Props) {
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const handleCancel = async () => {
    if (!subscription?.stripe_subscription_id) return;
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { action: "cancel", subscription_id: subscription.stripe_subscription_id },
      });
      if (error) throw error;
      // Update local status
      await supabase
        .from("pro_subscriptions")
        .update({ status: "canceled" })
        .eq("id", subscription.id);
      toast.success(`Your Pro access continues until ${periodEnd}. After that your garage will return to the free tier.`);
      setShowConfirm(false);
      onClose();
      onUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const isActive = subscription?.status === "active" || subscription?.status === "trialing";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-accent" />
            Manage Subscription
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Wrenchli Pro</span>
              <span className="text-xs font-mono text-muted-foreground">$2.99/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <span className={`text-xs font-semibold ${isActive ? "text-green-600" : "text-destructive"}`}>
                {subscription?.status === "active" ? "Active" : subscription?.status === "trialing" ? "Trial" : subscription?.status || "None"}
              </span>
            </div>
            {periodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Next billing</span>
                <span className="text-xs font-mono">{periodEnd}</span>
              </div>
            )}
          </div>

          {isActive && !showConfirm && (
            <Button
              variant="outline"
              className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowConfirm(true)}
            >
              Cancel Subscription
            </Button>
          )}

          {showConfirm && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Your Pro access will continue until <span className="font-semibold text-foreground">{periodEnd}</span>. After that, your garage will return to the free tier (2 vehicles).
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setShowConfirm(false)}
                >
                  Keep Pro
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 text-xs"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Confirm Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-xs">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
