import { useState, useEffect, FormEvent } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import wrenchliLogo from "@/assets/wrenchli-logo.jpeg";

const SITE_PASSWORD = "wrenchli2026";
const STORAGE_KEY = "wrenchli_site_access";

export default function SitePasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "granted") {
      setUnlocked(true);
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value === SITE_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "granted");
      setUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <img src={wrenchliLogo} alt="Wrenchli" className="h-14 w-14 rounded-lg" />
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground mb-2 font-heading">
          Wrenchli
        </h1>
        <p className="text-sm text-primary-foreground/60 mb-8">
          This site is currently in private preview. Enter the access password to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Enter password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 focus-visible:ring-accent"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">Incorrect password. Try again.</p>
          )}
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            Enter Site
          </Button>
        </form>

        <p className="mt-6 text-xs text-primary-foreground/30">
          Need access? Contact us at{" "}
          <a href="mailto:support@wrenchli.com" className="underline hover:text-primary-foreground/50">
            support@wrenchli.com
          </a>
        </p>
      </div>
    </div>
  );
}
