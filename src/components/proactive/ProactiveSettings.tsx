import { AlertTriangle, Bell, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useProactivePreferences } from "@/hooks/useProactiveMessages";
import type { ProactivePrefs } from "@/lib/proactive/delivery";
import {
  SETTINGS_TITLE,
  SETTINGS_DESCRIPTION,
  MASTER_LABEL,
  MASTER_DESCRIPTION,
  CATEGORY_COPY,
  RECALL_TOGGLE_LABEL,
  RECALL_TOGGLE_DESCRIPTION,
  RECALL_SAFETY_WARNING,
} from "@/lib/proactive/copy";

// Proactive Events Phase 1 — settings section, rendered inside the
// Notification Settings page. Master switch, per-category toggles, and
// the separate recall safety toggle with its plain warning. Opt-outs save
// immediately and are honored at delivery time, not just at queue time.

interface RowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (v: boolean) => void;
}

function ToggleRow({ id, label, description, checked, disabled, onCheckedChange }: RowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="pr-4">
        <Label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

const CATEGORY_KEYS: { key: keyof ProactivePrefs; copyKey: string }[] = [
  { key: "assessmentFollowups", copyKey: "assessment_followups" },
  { key: "repairUpdates", copyKey: "repair_updates" },
  { key: "postRepairCheckins", copyKey: "post_repair_checkins" },
  { key: "servicePrompts", copyKey: "service_prompts" },
];

export default function ProactiveSettings() {
  const { prefs, loading, saving, update } = useProactivePreferences();

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-accent" />
          <CardTitle className="text-lg">{SETTINGS_TITLE}</CardTitle>
        </div>
        <CardDescription>{SETTINGS_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToggleRow
          id="proactive-master"
          label={MASTER_LABEL}
          description={MASTER_DESCRIPTION}
          checked={prefs.masterEnabled}
          disabled={saving}
          onCheckedChange={(v) => update({ masterEnabled: v })}
        />

        {CATEGORY_KEYS.map(({ key, copyKey }) => (
          <ToggleRow
            key={key}
            id={`proactive-${copyKey}`}
            label={CATEGORY_COPY[copyKey].label}
            description={CATEGORY_COPY[copyKey].description}
            checked={prefs.masterEnabled && (prefs[key] as boolean)}
            disabled={saving || !prefs.masterEnabled}
            onCheckedChange={(v) => update({ [key]: v } as Partial<ProactivePrefs>)}
          />
        ))}

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 pr-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
                <Bell className="h-4 w-4 text-accent" />
              </div>
              <div>
                <Label htmlFor="proactive-recalls" className="text-sm font-medium text-foreground cursor-pointer">
                  {RECALL_TOGGLE_LABEL}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">{RECALL_TOGGLE_DESCRIPTION}</p>
              </div>
            </div>
            <Switch
              id="proactive-recalls"
              checked={prefs.recallAlertsEnabled}
              onCheckedChange={(v) => update({ recallAlertsEnabled: v })}
              disabled={saving}
            />
          </div>
          {!prefs.recallAlertsEnabled && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-500/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-foreground">{RECALL_SAFETY_WARNING}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
