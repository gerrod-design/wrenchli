import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Mail, MonitorSmartphone, ArrowLeft, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { prefs, loading, saving, updatePref } = useNotificationPreferences();

  // Redirect if not logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/garage");
    });
  }, [navigate]);

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Notification Settings | Wrenchli"
        description="Manage your recall alert notification preferences"
        path="/settings/notifications"
      />
      <div className="container-wrenchli max-w-2xl py-10 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-foreground">Notification Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control how you receive recall alerts and updates for your saved vehicles.
          </p>
        </div>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Recall Alerts</CardTitle>
            </div>
            <CardDescription>
              Get notified when new safety recalls are found for your vehicles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (
              <>
                {/* Email toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
                      <Mail className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <Label htmlFor="email-recalls" className="text-sm font-medium text-foreground cursor-pointer">
                        Email Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Receive daily email digests when new recalls are detected.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email-recalls"
                    checked={prefs.email_recalls}
                    onCheckedChange={(v) => updatePref("email_recalls", v)}
                    disabled={saving}
                  />
                </div>

                {/* In-app toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
                      <MonitorSmartphone className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <Label htmlFor="inapp-recalls" className="text-sm font-medium text-foreground cursor-pointer">
                        In-App Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Show recall alerts in the notification bell on the navbar.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="inapp-recalls"
                    checked={prefs.inapp_recalls}
                    onCheckedChange={(v) => updatePref("inapp_recalls", v)}
                    disabled={saving}
                  />
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <Shield className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Recall checks run automatically every day at 8:00 AM UTC. We query the NHTSA database
                for your saved vehicles and alert you if new safety recalls are found. Your data is
                never shared with third parties.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
