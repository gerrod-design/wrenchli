import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock } from "lucide-react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLogin() {
  const { user, isAdmin, loading, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </main>
    );
  }

  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDebugInfo("");
    setSubmitting(true);

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

    // After successful login, verify admin status with both methods and show alert
    try {
      // Wait for session to propagate
      await new Promise(r => setTimeout(r, 500));
      
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        const msg = "Login succeeded but no session found!";
        alert(msg);
        setDebugInfo(msg);
        setSubmitting(false);
        return;
      }

      // Test 1: RPC
      const { data: rpcResult, error: rpcError } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      // Test 2: Direct query
      const { data: directResult, error: directError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      const info = [
        `User: ${userId.slice(0, 8)}`,
        `RPC: ${JSON.stringify(rpcResult)} (err: ${rpcError?.message || "none"})`,
        `Direct: ${JSON.stringify(directResult)} (err: ${directError?.message || "none"})`,
      ].join(" | ");

      prompt("Copy this debug info and send it to me:", info);
      setDebugInfo(info);
    } catch (debugErr: any) {
      const msg = `Exception: ${debugErr?.message}`;
      prompt("Copy this debug info:", msg);
      setDebugInfo(msg);
    }

    setSubmitting(false);
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
            <h1 className="font-heading text-xl font-bold">{mode === "signup" ? "Create Admin Account" : "Admin Login"}</h1>
            <p className="text-sm text-muted-foreground">{mode === "signup" ? "Create your account, then we'll grant admin access" : "Sign in to access the dashboard"}</p>
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
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            {user && !isAdmin && !debugInfo && (
              <div className="space-y-2">
                <p className="text-sm text-destructive text-center">
                  This account does not have admin access.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Nuclear: clear everything and reload
                    try { localStorage.clear(); } catch (_) {}
                    try { sessionStorage.clear(); } catch (_) {}
                    // Remove supabase auth keys specifically
                    for (const key of Object.keys(localStorage)) {
                      if (key.startsWith('sb-')) localStorage.removeItem(key);
                    }
                    window.location.href = '/admin/login';
                  }}
                  className="w-full"
                >
                  Sign Out &amp; Try Another Account
                </Button>
              </div>
            )}
            {debugInfo && (
              <div className="rounded-lg bg-muted p-3 text-xs font-mono break-all">
                {debugInfo}
              </div>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create Account" : "Sign In"}
            </Button>
          </form>

          {signupSuccess && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
              <p className="text-sm text-green-800 font-medium">Account created! We'll grant admin access next.</p>
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSignupSuccess(false); setDebugInfo(""); }}
              className="text-sm text-accent hover:underline"
            >
              {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
