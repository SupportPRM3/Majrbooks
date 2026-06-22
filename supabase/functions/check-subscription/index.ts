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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is an admin - admins bypass subscription checks
    const { data: roleData, error: roleError } = await supabaseClient
      .from('app_user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleError && roleData) {
      logStep("Admin user detected - bypassing subscription check", { userId: user.id });
      return new Response(JSON.stringify({
        subscribed: true,
        product_id: "admin_access",
        subscription_end: null,
        is_trial: false,
        is_stripe_trial: false,
        trial_ends_at: null,
        is_admin: true,
        can_cancel: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Always check profiles.trial_ends_at first — works even without Stripe configured
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('trial_ends_at')
      .eq('id', user.id)
      .single();

    if (profile?.trial_ends_at) {
      const trialEnd = new Date(profile.trial_ends_at);
      const now = new Date();
      if (trialEnd > now) {
        logStep("Active free trial found", { trialEndsAt: profile.trial_ends_at });
        return new Response(JSON.stringify({
          subscribed: true,
          product_id: "trial",
          subscription_end: profile.trial_ends_at,
          is_trial: true,
          is_stripe_trial: false,
          trial_ends_at: profile.trial_ends_at,
          is_admin: false,
          can_cancel: false
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      logStep("Trial expired", { trialEndsAt: profile.trial_ends_at });
    }

    // No active trial — check Stripe for paid subscription
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("STRIPE_SECRET_KEY not configured — no paid subscription");
      return new Response(JSON.stringify({
        subscribed: false,
        product_id: null,
        subscription_end: null,
        is_trial: false,
        is_stripe_trial: false,
        trial_ends_at: null,
        is_admin: false,
        can_cancel: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({
        subscribed: false,
        product_id: null,
        subscription_end: null,
        is_trial: false,
        is_stripe_trial: false,
        trial_ends_at: null,
        is_admin: false,
        can_cancel: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active OR trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });
    
    // Find active or trialing subscription
    const activeSub = subscriptions.data.find((sub: Stripe.Subscription) => 
      sub.status === "active" || sub.status === "trialing"
    );

    if (!activeSub) {
      logStep("No active or trialing subscription found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        product_id: null,
        subscription_end: null,
        is_trial: false,
        is_stripe_trial: false,
        trial_ends_at: null,
        is_admin: false,
        can_cancel: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = activeSub;
    const isTrialing = subscription.status === "trialing";
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const productId = subscription.items.data[0].price.product;
    
    let trialEndsAt = null;
    if (isTrialing && subscription.trial_end) {
      trialEndsAt = new Date(subscription.trial_end * 1000).toISOString();
    }

    logStep("Subscription found", { 
      subscriptionId: subscription.id, 
      status: subscription.status,
      isTrialing,
      trialEndsAt,
      productId 
    });

    return new Response(JSON.stringify({
      subscribed: true,
      product_id: productId,
      subscription_end: isTrialing ? trialEndsAt : subscriptionEnd,
      is_trial: isTrialing,
      is_stripe_trial: isTrialing,
      trial_ends_at: trialEndsAt,
      is_admin: false,
      can_cancel: true // User can always cancel via customer portal
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
