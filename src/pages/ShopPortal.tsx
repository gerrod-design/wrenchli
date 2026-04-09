import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, BarChart3, DollarSign, AlertTriangle, TrendingUp, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ShopJobQueue from "@/components/shop-portal/ShopJobQueue";
import ShopBenchmarks from "@/components/shop-portal/ShopBenchmarks";
import ShopRevenue from "@/components/shop-portal/ShopRevenue";
import ShopQualityAlerts from "@/components/shop-portal/ShopQualityAlerts";
import AccuracyAuditPanel from "@/components/shop-portal/AccuracyAuditPanel";
import ShopEngagement from "@/components/shop-portal/ShopEngagement";
import SecurityStatusPanel from "@/components/shop-portal/SecurityStatusPanel";

export default function ShopPortal() {
  const navigate = useNavigate();
  const [shopAccount, setShopAccount] = useState<any>(null);
  const [shopProfile, setShopProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/shop-login");
      return;
    }

    // Get shop account
    const { data: account } = await supabase
      .from("shop_accounts")
      .select("*, service_providers(*)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (account) {
      setShopAccount(account);
      setShopProfile(account.service_providers);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/shop-login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="animate-pulse text-muted-foreground">Loading shop dashboard...</div>
      </div>
    );
  }

  if (!shopAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
        <div className="text-center max-w-md">
          <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">No Shop Account Found</h2>
          <p className="text-muted-foreground mb-6">
            Your account isn't linked to a shop yet. Contact Wrenchli to set up your shop profile.
          </p>
          <Button onClick={() => navigate("/contact")} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Contact Us
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Shop Dashboard" description="Manage your Wrenchli shop" path="/shop-portal" />
      <div className="min-h-screen bg-secondary">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-accent rounded-lg p-2">
                <Wrench className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">{shopProfile?.name || "Shop Dashboard"}</h1>
                <p className="text-xs text-muted-foreground">
                  {shopProfile?.city}{shopProfile?.state ? `, ${shopProfile.state}` : ""}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="max-w-6xl mx-auto p-4 pt-6">
          {/* Admin-only panels */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AccuracyAuditPanel />
            <SecurityStatusPanel />
          </div>

          <Tabs defaultValue="jobs" className="space-y-6">
            <TabsList className="bg-card border border-border p-1 w-full grid grid-cols-4">
              <TabsTrigger value="jobs" className="text-xs sm:text-sm">
                <Wrench className="h-4 w-4 mr-1.5" />
                Jobs
              </TabsTrigger>
              <TabsTrigger value="benchmarks" className="text-xs sm:text-sm">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Benchmarks
              </TabsTrigger>
              <TabsTrigger value="revenue" className="text-xs sm:text-sm">
                <DollarSign className="h-4 w-4 mr-1.5" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs sm:text-sm">
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jobs">
              <ShopJobQueue shopId={shopAccount.shop_id} />
            </TabsContent>
            <TabsContent value="benchmarks">
              <ShopBenchmarks shopId={shopAccount.shop_id} shopName={shopProfile?.name} />
            </TabsContent>
            <TabsContent value="revenue">
              <ShopRevenue shopId={shopAccount.shop_id} />
            </TabsContent>
            <TabsContent value="alerts">
              <ShopQualityAlerts shopId={shopAccount.shop_id} />
            </TabsContent>
          </Tabs>

          {/* Engagement Summary */}
          <div className="mt-6">
            <ShopEngagement shopId={shopAccount.shop_id} />
          </div>
        </main>
      </div>
    </>
  );
}
