import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Mail, MonitorSmartphone, ArrowLeft, Shield, Wrench, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationPreferences, NotificationPrefs } from "@/hooks/useNotificationPreferences";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

interface ToggleRowProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled: boolean;
}

function ToggleRow({ id, icon, label, description, checked, onCheckedChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
          {icon}
        </div>
        <div>
          <Label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

interface NotificationCategoryProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  emailKey: keyof NotificationPrefs;
  inappKey: keyof NotificationPrefs;
  emailDesc: string;
  inappDesc: string;
  prefs: NotificationPrefs;
  saving: boolean;
  updatePref: (key: keyof NotificationPrefs, value: boolean) => void;
}

function NotificationCategory({ icon, title, description, emailKey, inappKey, emailDesc, inappDesc, prefs, saving, updatePref }: NotificationCategoryProps) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToggleRow
          id={emailKey}
          icon={<Mail className="h-4 w-4 text-accent" />}
          label="Email Notifications"
          description={emailDesc}
          checked={prefs[emailKey]}
          onCheckedChange={(v) => updatePref(emailKey, v)}
          disabled={saving}
        />
        <ToggleRow
          id={inappKey}
          icon={<MonitorSmartphone className="h-4 w-4 text-accent" />}
          label="In-App Notifications"
          description={inappDesc}
          checked={prefs[inappKey]}
          onCheckedChange={(v) => updatePref(inappKey, v)}
          disabled={saving}
        />
      </CardContent>
    </Card>
  );
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { prefs, loading, saving, updatePref } = useNotificationPreferences();

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
            Control how you receive alerts and updates for your saved vehicles.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <NotificationCategory
              icon={<Bell className="h-5 w-5 text-accent" />}
              title="Recall Alerts"
              description="Get notified when new safety recalls are found for your vehicles."
              emailKey="email_recalls"
              inappKey="inapp_recalls"
              emailDesc="Receive email digests when new recalls are detected."
              inappDesc="Show recall alerts in the notification bell."
              prefs={prefs}
              saving={saving}
              updatePref={updatePref}
            />

            <NotificationCategory
              icon={<Wrench className="h-5 w-5 text-accent" />}
              title="Maintenance Reminders"
              description="Stay on top of scheduled maintenance for your vehicles."
              emailKey="email_maintenance"
              inappKey="inapp_maintenance"
              emailDesc="Receive email reminders when services are coming due."
              inappDesc="Show maintenance reminders in the notification bell."
              prefs={prefs}
              saving={saving}
              updatePref={updatePref}
            />

            <NotificationCategory
              icon={<TrendingUp className="h-5 w-5 text-accent" />}
              title="Market Value Alerts"
              description="Track changes in your vehicle's market value over time."
              emailKey="email_market_value"
              inappKey="inapp_market_value"
              emailDesc="Receive emails when significant value changes are detected."
              inappDesc="Show market value updates in the notification bell."
              prefs={prefs}
              saving={saving}
              updatePref={updatePref}
            />
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-lg bg-muted/50 p-4">
          <Shield className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Recall checks run automatically every day at 8:00 AM UTC. Maintenance reminders are
            calculated from your vehicle's mileage and service history. Market value alerts
            trigger when significant pricing changes are detected. Your data is never shared
            with third parties.
          </p>
        </div>
      </div>
    </main>
  );
}
