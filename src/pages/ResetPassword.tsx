import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound, CheckCircle, ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let disposed = false;
    let subscription: { unsubscribe: () => void } | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (!disposed) setChecking(false);
    };

    const verifyToken = async () => {
      // Check for token_hash in URL query params (from our custom edge function)
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash && type === "recovery") {
        // Verify the OTP token directly
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (!verifyError) {
          setIsRecovery(true);
        } else {
          console.error("Token verification failed:", verifyError.message);
        }
        finish();
        return;
      }

      // Hash-based recovery links: the form is shown only for a session the
      // server validates. A garbage token in the hash cannot produce one —
      // never trust a substring match on the hash itself.
      const validateSession = async () => {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!disposed && user && !userError) {
          setIsRecovery(true);
          finish();
        }
      };

      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          void validateSession();
        }
      });
      subscription = data.subscription;

      // The recovery session may already have been established before this
      // listener attached; check once now and once more before giving up.
      void validateSession();
      timer = setTimeout(() => {
        void validateSession().finally(finish);
      }, 3000);
    };

    void verifyToken();

    return () => {
      disposed = true;
      subscription?.unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary pb-[60px] md:pb-0">
      <SEO title="Reset Password — Wrenchli" description="Set a new password" path="/reset-password" />
      <div className="w-full max-w-sm mx-4">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <KeyRound className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-xl font-bold">Set New Password</h1>
            <p className="text-sm text-muted-foreground">Enter your new password below</p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-sm font-medium">Password updated successfully!</p>
              <Button
                onClick={() => window.location.href = "/garage"}
                className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                Back to Sign In
              </Button>
            </div>
          ) : !isRecovery ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                This link is invalid or has expired. Go to sign in and choose
                "Forgot password?" to request a new reset link.
              </p>
              <Button
                onClick={() => window.location.href = "/garage"}
                className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                Request a New Reset Link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11"
              />
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          )}

          <div className="text-center pt-2">
            <a
              href="/garage"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
