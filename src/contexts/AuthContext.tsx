import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const adminCheckDone = useRef(false);

  // Check admin role - separated from auth state listener to avoid race conditions
  const checkAdmin = async (userId: string): Promise<boolean> => {
    try {
      console.log("[AuthContext] Checking admin for:", userId);
      
      // Use the SECURITY DEFINER function which bypasses RLS
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      
      console.log("[AuthContext] has_role result:", JSON.stringify({ data, error: error?.message }));
      
      if (error) {
        console.error("[AuthContext] has_role error:", error);
        return false;
      }
      
      return !!data;
    } catch (err) {
      console.error("[AuthContext] checkAdmin exception:", err);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Step 1: Get initial session
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const admin = await checkAdmin(initialSession.user.id);
          if (mounted) {
            setIsAdmin(admin);
            adminCheckDone.current = true;
          }
        }
      } catch (err) {
        console.warn("[AuthContext] initAuth failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Step 2: Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Small delay to ensure the auth token is propagated to the client
          await new Promise(resolve => setTimeout(resolve, 100));
          if (!mounted) return;
          
          const admin = await checkAdmin(newSession.user.id);
          if (mounted) {
            setIsAdmin(admin);
            setLoading(false);
          }
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    // Safety fallback
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("[AuthContext] Safety timeout - forcing loading to false");
        setLoading(false);
      }
    }, 8000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
