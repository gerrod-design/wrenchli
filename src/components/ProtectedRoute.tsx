import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

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

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
