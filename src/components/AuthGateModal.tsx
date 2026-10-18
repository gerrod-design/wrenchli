import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

type Mode = "login" | "signup" | "forgot";

export default function AuthGateModal({ open, onClose, onAuthenticated }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (mode !== "forgot" && !password) return;
    setLoading(true);
    setError("");

    if (mode === "forgot") {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
            body: JSON.stringify({
              email,
              redirectTo: "https://wrenchli.net/reset-password",
            }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Failed to send reset email");
        } else {
          setResetSent(true);
        }
      } catch {
        setError("Failed to send reset email. Please try again.");
      }
      setLoading(false);
      return;
    }

    const result = mode === "login"
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === "signup") {
      setError("Check your email for a confirmation link, then sign in.");
    } else {
      onAuthenticated();
    }
  };

  const title = mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password";
  const description =
    mode === "login"
      ? "Sign in to your garage to save vehicles and track your history."
      : mode === "signup"
        ? "Create a free account to save vehicles to your garage."
        : "Enter your email and we'll send you a link to reset your password.";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-sm border-0"
        style={{ backgroundColor: "#0F1117", color: "#F5F5F5", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: "#F5F5F5" }}>
            <Crown className="h-5 w-5" style={{ color: "#E07B39" }} />
            {title}
          </DialogTitle>
          <DialogDescription style={{ color: "#6B7280" }}>
            {description}
          </DialogDescription>
        </DialogHeader>

        {resetSent ? (
          <div className="space-y-3 mt-2">
            <p className="text-sm" style={{ color: "#F5F5F5" }}>
              If an account exists for that email, a reset link is on its way.
            </p>
            <Button
              type="button"
              onClick={() => switchMode("login")}
              className="w-full font-semibold"
              style={{ backgroundColor: "#E07B39", color: "#0F1117" }}
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="text-xs" style={{ color: "#9CA3AF" }}>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#2A2D37]"
                style={{ backgroundColor: "#1A1D27", color: "#F5F5F5" }}
                required
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: "#9CA3AF" }}>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[#2A2D37]"
                  style={{ backgroundColor: "#1A1D27", color: "#F5F5F5" }}
                  minLength={6}
                  required
                />
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-semibold"
              style={{ backgroundColor: "#E07B39", color: "#0F1117" }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </Button>

            {mode === "login" && (
              <p className="text-center text-[11px]" style={{ color: "#6B7280" }}>
                <button type="button" onClick={() => switchMode("forgot")} className="underline" style={{ color: "#E07B39" }}>Forgot password?</button>
              </p>
            )}

            <p className="text-center text-[11px]" style={{ color: "#6B7280" }}>
              {mode === "login" ? (
                <>Don't have an account?{" "}
                  <button type="button" onClick={() => switchMode("signup")} className="underline" style={{ color: "#E07B39" }}>Sign up</button>
                </>
              ) : mode === "signup" ? (
                <>Already have an account?{" "}
                  <button type="button" onClick={() => switchMode("login")} className="underline" style={{ color: "#E07B39" }}>Sign in</button>
                </>
              ) : (
                <>Remembered it?{" "}
                  <button type="button" onClick={() => switchMode("login")} className="underline" style={{ color: "#E07B39" }}>Back to Sign In</button>
                </>
              )}
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
