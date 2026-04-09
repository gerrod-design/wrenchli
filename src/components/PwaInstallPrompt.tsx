import { useState, useEffect, useCallback } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "wrenchli_pwa_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === "true");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  if (dismissed || isStandalone) return null;
  if (!deferredPrompt && !isIos) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg flex items-center gap-3 rounded-xl border border-border bg-card/95 backdrop-blur-sm p-3 shadow-lg">
        <div className="flex-1 min-w-0">
          {isIos ? (
            <p className="text-xs text-muted-foreground leading-snug">
              <Share className="inline h-3.5 w-3.5 mr-1 -mt-0.5 text-primary" aria-hidden="true" />
              Tap the <span className="font-semibold">Share</span> button then <span className="font-semibold">Add to Home Screen</span> to save Wrenchli
            </p>
          ) : (
            <p className="text-xs text-muted-foreground leading-snug">
              Save Wrenchli to your home screen for quick access
            </p>
          )}
        </div>
        {!isIos && (
          <Button size="sm" variant="default" className="shrink-0 text-xs gap-1" onClick={handleInstall}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Add to Home Screen
          </Button>
        )}
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
