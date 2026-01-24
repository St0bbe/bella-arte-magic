import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  is_digital: boolean;
  customization_data?: Record<string, string> | null;
}

interface CheckoutRequest {
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  shipping?: {
    address: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  notes?: string;
  tenant_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe key not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CheckoutRequest = await req.json();
    const { items, customer, shipping, notes, tenant_id } = body;

    if (!items || items.length === 0) {
      throw new Error("No items in cart");
    }

    if (!customer.email || !customer.name) {
      throw new Error("Customer name and email required");
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        tenant_id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        total_amount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        shipping_address: shipping?.address,
        shipping_city: shipping?.city,
        shipping_state: shipping?.state,
        shipping_zip: shipping?.zip,
        notes,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items with customization data
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      is_digital: item.is_digital,
      customization_data: item.is_digital && item.customization_data ? item.customization_data : null,
      customization_status: item.is_digital ? "pending_info" : null,
      customization_deadline: item.is_digital ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Create Stripe line items
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Create Stripe Checkout Session
    // Using automatic_payment_methods to let Stripe show available methods
    // based on what's enabled in the Dashboard (card, boleto, pix, etc.)
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/pedido/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=true`,
      customer_email: customer.email,
      locale: "pt-BR",
      metadata: {
        order_id: order.id,
        tenant_id: tenant_id || "",
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
        },
      },
    });

    // Update order with Stripe session ID
    await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ url: session.url, order_id: order.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
