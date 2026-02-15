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

  // Check admin role via native fetch to avoid Supabase client auth locks
  const checkAdmin = async (userId: string, accessToken: string): Promise<boolean> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `${supabaseUrl}/rest/v1/user_roles?select=role&user_id=eq.${userId}&role=eq.admin&limit=1`,
        {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) {
        console.error("[AuthContext] admin check failed:", res.status);
        return false;
      }
      const data = await res.json();
      return Array.isArray(data) && data.length > 0;
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

        if (initialSession?.user && initialSession.access_token) {
          const admin = await checkAdmin(initialSession.user.id, initialSession.access_token);
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

        if (newSession?.user && newSession.access_token) {
          const admin = await checkAdmin(newSession.user.id, newSession.access_token);
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
    try {
      // Use native fetch to avoid Supabase client auth lock
      const tokenKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      const tokenData = tokenKey ? JSON.parse(localStorage.getItem(tokenKey) || '{}') : null;
      const accessToken = tokenData?.access_token;

      if (accessToken) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        await fetch(`${supabaseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }

      // Clear local storage token
      if (tokenKey) localStorage.removeItem(tokenKey);
    } catch (err) {
      console.error("[AuthContext] signOut error:", err);
    } finally {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    }
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
