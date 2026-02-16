import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Key, Plus, Copy, Check, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  owner_email: string | null;
  is_active: boolean;
  rate_limit_per_minute: number;
  created_at: string;
  last_used_at: string | null;
  key_hash: string;
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const prefix = "wrli_";
  let result = prefix;
  const arr = new Uint8Array(40);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 40; i++) {
    result += chars[arr[i] % chars.length];
  }
  return result;
}

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRateLimit, setNewRateLimit] = useState(30);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getHeaders = useCallback(() => {
    const tokenKey = Object.keys(localStorage).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    const tokenData = tokenKey
      ? JSON.parse(localStorage.getItem(tokenKey) || "{}")
      : null;
    const accessToken = tokenData?.access_token;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    return {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      supabaseUrl,
    };
  }, []);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const { headers, supabaseUrl } = getHeaders();
      const res = await fetch(
        `${supabaseUrl}/rest/v1/api_keys?select=*&order=created_at.desc`,
        { headers }
      );
      if (!res.ok) throw new Error("Failed to fetch API keys");
      const data = await res.json();
      setKeys(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    setCreating(true);
    try {
      const rawKey = generateApiKey();
      const keyHash = await hashKey(rawKey);
      const { headers, supabaseUrl } = getHeaders();

      const res = await fetch(`${supabaseUrl}/rest/v1/api_keys`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          key_hash: keyHash,
          name: newName.trim(),
          owner_email: newEmail.trim() || null,
          rate_limit_per_minute: newRateLimit,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to create key");
      }

      setRevealedKey(rawKey);
      setNewName("");
      setNewEmail("");
      setNewRateLimit(30);
      fetchKeys();
      toast.success("API key created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (key: ApiKey) => {
    try {
      const { headers, supabaseUrl } = getHeaders();
      const res = await fetch(
        `${supabaseUrl}/rest/v1/api_keys?id=eq.${key.id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ is_active: !key.is_active }),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      setKeys((prev) =>
        prev.map((k) =>
          k.id === key.id ? { ...k, is_active: !k.is_active } : k
        )
      );
      toast.success(
        key.is_active ? "Key deactivated" : "Key activated"
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmtDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "2-digit",
          hour: "numeric",
          minute: "2-digit",
        })
      : "Never";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5 text-accent" /> API Keys
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage API keys for the public diagnostic endpoint
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchKeys}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => {
              setRevealedKey(null);
              setShowCreate(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Create Key
          </Button>
        </div>
      </div>

      {/* Keys Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Rate Limit
              </th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Owner
              </th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Last Used
              </th>
              <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Active
              </th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr
                key={key.id}
                className="border-t border-border hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 font-medium">{key.name}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={key.is_active ? "default" : "secondary"}
                    className={
                      key.is_active
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {key.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {key.rate_limit_per_minute}/min
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {key.owner_email || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {fmtDate(key.created_at)}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {fmtDate(key.last_used_at)}
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={key.is_active}
                    onCheckedChange={() => toggleActive(key)}
                  />
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No API keys yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Dialog */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) setRevealedKey(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {revealedKey ? "API Key Created" : "Create API Key"}
            </DialogTitle>
            <DialogDescription>
              {revealedKey
                ? "Copy your key now — it won't be shown again."
                : "Generate a new API key for the diagnostic endpoint."}
            </DialogDescription>
          </DialogHeader>

          {revealedKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={revealedKey}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(revealedKey)}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this key as the <code className="bg-muted px-1 rounded">x-api-key</code> header
                in your API requests.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  placeholder="e.g. Production Key, Partner XYZ"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Owner Email</label>
                <Input
                  placeholder="owner@example.com"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Rate Limit (requests/min)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={newRateLimit}
                  onChange={(e) =>
                    setNewRateLimit(
                      Math.max(1, Math.min(1000, parseInt(e.target.value) || 30))
                    )
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {revealedKey ? (
              <Button onClick={() => setShowCreate(false)}>Done</Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Generate Key
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
