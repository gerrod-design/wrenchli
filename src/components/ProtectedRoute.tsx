import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const [directAdminCheck, setDirectAdminCheck] = useState<boolean | null>(null);

  // Independent admin check as fallback
  useEffect(() => {
    if (!user || isAdmin) return;

    let cancelled = false;
    const check = async () => {
      // Wait a bit for session to settle
      await new Promise(r => setTimeout(r, 300));
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!cancelled) {
        setDirectAdminCheck(!!data);
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
