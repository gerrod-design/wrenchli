import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const PRICE_ID = Deno.env.get("STRIPE_PRO_PRICE_ID");
if (!PRICE_ID) {
  console.error("[create-pro-subscription] STRIPE_PRO_PRICE_ID env var is not set");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, email } = await req.json();
    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has a subscription record with a Stripe customer
    const { data: existingSub } = await supabase
      .from("pro_subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status")
      .eq("user_id", user_id)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    // If active subscription already exists, return error
    if (existingSub?.status === "active" || existingSub?.status === "trialing") {
      return new Response(
        JSON.stringify({ error: "User already has an active subscription" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create or retrieve Stripe customer
    if (!customerId) {
      // Check Stripe by email
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email,
          metadata: { user_id },
        });
        customerId = customer.id;
      }
    }

    // Create subscription with payment_behavior for embedded payment element
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: PRICE_ID }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;
    const clientSecret = paymentIntent?.client_secret;

    const status = subscription.status === "active" ? "active" : "trialing";
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    // Upsert subscription record
    const { error: upsertError } = await supabase
      .from("pro_subscriptions")
      .upsert(
        {
          user_id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          status,
          current_period_end: periodEnd,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[create-pro-subscription] DB upsert error:", upsertError);
    }

    // Queue N8N webhook for new active subscription
    if (status === "active") {
      await supabase.from("webhook_queue").insert({
        event_type: "pro_subscriber_new",
        payload: {
          user_id,
          stripe_subscription_id: subscription.id,
          created_at: new Date().toISOString(),
        },
      });
    }

    return new Response(
      JSON.stringify({ client_secret: clientSecret, subscription_id: subscription.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[create-pro-subscription] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
