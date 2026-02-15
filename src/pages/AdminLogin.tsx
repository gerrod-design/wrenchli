import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock } from "lucide-react";
import SEO from "@/components/SEO";

export default function AdminLogin() {
  const { user, isAdmin, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err);
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
            <h1 className="font-heading text-xl font-bold">Admin Login</h1>
            <p className="text-sm text-muted-foreground">Sign in to access the dashboard</p>
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
            {user && !isAdmin && (
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
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
