import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock } from "lucide-react";
import SEO from "@/components/SEO";


export default function AdminLogin() {
  const { user, isAdmin, loading, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [adminConfirmed, setAdminConfirmed] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </main>
    );
  }

  if ((user && isAdmin) || adminConfirmed) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (mode === "forgot") {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
            body: JSON.stringify({
              email,
              redirectTo:
                window.location.hostname.includes("lovableproject.com") || window.location.hostname.includes("id-preview--")
                  ? "https://wrenchli.net/reset-password"
                  : `${window.location.origin}/reset-password`,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) setError(data.error || "Failed to send reset email");
        else setResetSent(true);
      } catch {
        setError("Failed to send reset email. Please try again.");
      }
      setSubmitting(false);
      return;
    }

    if (mode === "signup") {
      const { error: err } = await signUp(email, password);
      if (err) setError(err);
      else setSignupSuccess(true);
      setSubmitting(false);
      return;
    }

    // Login flow
    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }

    // Wait for session to propagate, then verify admin via native fetch
    await new Promise(r => setTimeout(r, 500));

    const tokenKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    const tokenData = tokenKey ? JSON.parse(localStorage.getItem(tokenKey) || '{}') : null;
    const accessToken = tokenData?.access_token;
    const userId = tokenData?.user?.id;

    if (userId && accessToken) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `${supabaseUrl}/rest/v1/user_roles?select=role&user_id=eq.${userId}&role=eq.admin&limit=1`,
        { headers: { 'apikey': anonKey, 'Authorization': `Bearer ${accessToken}` } }
      );
      const data = res.ok ? await res.json() : [];

      if (Array.isArray(data) && data.length > 0) {
        setAdminConfirmed(true);
        return;
      }
    }

    setError("This account does not have admin access.");
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (_) {
      // ignore
    }
    setAdminConfirmed(false);
    setError("");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary pb-[60px] md:pb-0">
      <SEO title="Admin Login — Wrenchli" description="Admin login" path="/admin/login" />
      <div className="w-full max-w-sm mx-4">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-xl font-bold">
              {mode === "signup" ? "Create Admin Account" : mode === "forgot" ? "Reset Password" : "Admin Login"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signup" ? "Create your account, then we'll grant admin access" : mode === "forgot" ? "Enter your email to receive a reset link" : "Sign in to access the dashboard"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
            {mode !== "forgot" && (
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            )}
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            {user && !isAdmin && !submitting && !adminConfirmed && mode === "login" && (
              <p className="text-sm text-destructive text-center">
                This account does not have admin access.
              </p>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create Account" : mode === "forgot" ? "Send Reset Link" : "Sign In"}
            </Button>
          </form>

          {signupSuccess && (
            <div className="rounded-lg border border-border bg-muted p-3 text-center">
              <p className="text-sm font-medium">Account created! We'll grant admin access next.</p>
            </div>
          )}

          {resetSent && (
            <div className="rounded-lg border border-border bg-muted p-3 text-center">
              <p className="text-sm font-medium">Reset link sent! Check your email inbox.</p>
            </div>
          )}

          {user && !isAdmin && !submitting && !adminConfirmed && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              className="w-full"
            >
              Sign Out &amp; Try Another Account
            </Button>
          )}

          <div className="text-center space-y-2">
            {mode === "login" && (
              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(""); setResetSent(false); }}
                className="text-sm text-muted-foreground hover:underline"
              >
                Forgot password?
              </button>
            )}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSignupSuccess(false); setResetSent(false); }}
              className="block w-full text-sm text-accent hover:underline"
            >
              {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
