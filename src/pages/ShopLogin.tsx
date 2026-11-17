import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wrench, Mail, Lock, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

// Shop sign-in (v1 shop-account slice, 2026-11-17). Shop accounts
// are created by Wrenchli when a shop is approved for the pilot;
// there is no public sign-up. A signed-in user with no shop
// account linked is told plainly, in the portal.
export default function ShopLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/shop-portal");
    } catch (e: any) {
      toast.error(e.message || "Sign-in failed. Check your email and password and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO title="Shop Sign In" description="Sign in to your Wrenchli shop page to see referrals sent to your shop." path="/shop-login" />
      <main className="min-h-screen flex items-center justify-center bg-primary px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent mb-4">
              <Wrench className="h-7 w-7 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-primary-foreground">
              Shop Sign In
            </h1>
            <p className="text-sm text-primary-foreground/60 mt-1">
              See the referrals Wrenchli has sent your shop.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4 shadow-lg">
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
              {isLoading ? "Signing in..." : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Wrenchli sets up shop accounts when a shop joins the pilot.
              If your shop is part of the pilot and you cannot sign in,{" "}
              <Link to="/contact" className="text-accent hover:underline">contact us</Link>.
            </p>
          </form>

          <p className="text-center text-xs text-primary-foreground/30 mt-6">
            <Link to="/" className="hover:underline">← Back to Wrenchli</Link>
          </p>
        </div>
      </main>
    </>
  );
}
