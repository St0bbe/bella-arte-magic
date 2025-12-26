import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
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
      logStep("No customer found");
      
      // Update tenant subscription status
      await supabaseClient
        .from("tenants")
        .update({ 
          subscription_status: "trial",
          subscription_ends_at: null 
        })
        .eq("owner_id", user.id);
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: "trial",
        subscription_end: null,
        plan: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;
    let plan = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const priceId = subscription.items.data[0].price.id;
      
      // Determine plan based on price ID
      if (priceId === "price_1SifxcBqyfBQHAgcsAW2Wali") {
        plan = "monthly";
      } else if (priceId === "price_1SifxyBqyfBQHAgcgy9yZLs0") {
        plan = "yearly";
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, plan, endDate: subscriptionEnd });

      // Update tenant subscription status
      await supabaseClient
        .from("tenants")
        .update({ 
          subscription_status: "active",
          subscription_ends_at: subscriptionEnd 
        })
        .eq("owner_id", user.id);
    } else {
      logStep("No active subscription found");
      
      // Check for canceled/expired subscriptions
      const allSubs = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
      });
      
      const status = allSubs.data.length > 0 ? "expired" : "trial";
      
      await supabaseClient
        .from("tenants")
        .update({ 
          subscription_status: status,
          subscription_ends_at: null 
        })
        .eq("owner_id", user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      status: hasActiveSub ? "active" : "expired",
      subscription_end: subscriptionEnd,
      plan
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
