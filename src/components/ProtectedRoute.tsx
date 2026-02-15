import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const [directAdminCheck, setDirectAdminCheck] = useState<boolean | null>(null);

  // Independent admin check as fallback using native fetch
  useEffect(() => {
    if (!user || isAdmin) return;

    let cancelled = false;
    const check = async () => {
      try {
        const tokenKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        const tokenData = tokenKey ? JSON.parse(localStorage.getItem(tokenKey) || '{}') : null;
        const accessToken = tokenData?.access_token;
        if (!accessToken) { setDirectAdminCheck(false); return; }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/rest/v1/user_roles?select=role&user_id=eq.${user.id}&role=eq.admin&limit=1`,
          { headers: { 'apikey': anonKey, 'Authorization': `Bearer ${accessToken}` } }
        );
        const data = res.ok ? await res.json() : [];
        if (!cancelled) setDirectAdminCheck(Array.isArray(data) && data.length > 0);
      } catch {
        if (!cancelled) setDirectAdminCheck(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [user, isAdmin]);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
          <p className="text-sm text-muted-foreground">Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <p className="font-heading text-lg font-semibold">Authentication timed out</p>
          <p className="text-sm text-muted-foreground">Unable to verify your session. Please try refreshing.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Allow access if AuthContext says admin OR our direct check confirms it
  const hasAdmin = isAdmin || directAdminCheck === true;

  if (!user || !hasAdmin) {
    // If direct check hasn't completed yet, show loading
    if (user && !isAdmin && directAdminCheck === null) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
            <p className="text-sm text-muted-foreground">Verifying admin access…</p>
          </div>
        </div>
      );
    }
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
