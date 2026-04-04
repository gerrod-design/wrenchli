import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wrench, Mail, Lock, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

export default function ShopLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [shopName, setShopName] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/shop-portal" },
        });
        if (error) throw error;
        toast.success("Check your email to verify your account.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Check if they have a shop account
        const { data: shopAccount } = await supabase
          .from("shop_accounts")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (shopAccount) {
          navigate("/shop-portal");
        } else {
          toast.info("No shop account found. Please contact us to set up your shop.");
          navigate("/shop-portal");
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO title="Shop Portal Login" description="Sign in to your Wrenchli shop dashboard." path="/shop-login" />
      <main className="min-h-screen flex items-center justify-center bg-primary px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent mb-4">
              <Wrench className="h-7 w-7 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-primary-foreground">
              Shop Portal
            </h1>
            <p className="text-sm text-primary-foreground/60 mt-1">
              {isSignUp ? "Create your shop account" : "Sign in to your dashboard"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4 shadow-lg">
            {isSignUp && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Shop Name</label>
                <Input
                  placeholder="Your shop name"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="shop@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
              {isLoading ? "Loading..." : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-accent hover:underline"
              >
                {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-primary-foreground/30 mt-6">
            <Link to="/" className="hover:underline">← Back to Wrenchli</Link>
          </p>
        </div>
      </main>
    </>
  );
}
