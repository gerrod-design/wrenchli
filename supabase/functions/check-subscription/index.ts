import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${d}`);
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = checkRateLimit(rateLimitId, RATE_LIMITS.STANDARD);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      { status: 429, headers: { ...securityHeaders, ...getRateLimitHeaders(RATE_LIMITS.STANDARD.maxRequests, rateResult.remaining, rateResult.resetTime), "Content-Type": "application/json" } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...securityHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      logStep("Active subscription found", { productId, subscriptionEnd });

      const { data: devAccount } = await supabaseClient
        .from("developer_accounts").select("id").eq("user_id", user.id).maybeSingle();

      let tier = "free"; let limit = 50;
      const priceId = subscription.items.data[0].price.id;
      if (priceId === "price_1T1RFeGgIpvcscSeSqFbCitS") { tier = "pro"; limit = 500; }
      else if (priceId === "price_1T1RHBGgIpvcscSeOjZjBECx") { tier = "enterprise"; limit = 5000; }

      if (devAccount) {
        await supabaseClient.from("developer_accounts")
          .update({ subscription_tier: tier, monthly_call_limit: limit, stripe_customer_id: customerId })
          .eq("id", devAccount.id);
      } else {
        await supabaseClient.from("developer_accounts").insert({
          user_id: user.id, subscription_tier: tier, monthly_call_limit: limit, stripe_customer_id: customerId,
        });
      }
      logStep("Developer account synced", { tier, limit });
    } else {
      logStep("No active subscription found");
    }

    return new Response(
      JSON.stringify({ subscribed: hasActiveSub, product_id: productId, subscription_end: subscriptionEnd }),
      { headers: { ...securityHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...securityHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
