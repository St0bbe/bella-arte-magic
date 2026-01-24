import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function sendOrderConfirmationEmail(order: {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
}, items: Array<{ product_name: string; quantity: number; total_price: number; is_digital: boolean }>) {
  // Import Resend dynamically
  const { Resend } = await import("https://esm.sh/resend@2.0.0");
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  
  const hasDigital = items.some(item => item.is_digital);

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${item.product_name}
        ${item.is_digital ? '<span style="color: #3b82f6; font-size: 12px;">(Digital)</span>' : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.total_price.toFixed(2).replace(".", ",")}</td>
    </tr>
  `).join("");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #FF6B9D 0%, #C084FC 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">✨ Pedido Confirmado!</h1>
      </div>
      
      <div style="padding: 30px; background: #fff;">
        <p style="font-size: 18px;">Olá, <strong>${order.customer_name}</strong>!</p>
        
        <p>Seu pedido <strong>#${order.id.slice(0, 8)}</strong> foi confirmado com sucesso.</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Itens do Pedido</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left;">Produto</th>
                <th style="padding: 12px; text-align: center;">Qtd</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 12px; text-align: right;"><strong>Total:</strong></td>
                <td style="padding: 12px; text-align: right; font-size: 18px; color: #FF6B9D;"><strong>R$ ${order.total_amount.toFixed(2).replace(".", ",")}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        ${hasDigital ? `
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;">
              <strong>📥 Produtos Digitais:</strong> Os links para download serão enviados em um email separado em breve.
            </p>
          </div>
        ` : ''}
        
        <p style="color: #6b7280; font-size: 14px;">
          Se tiver qualquer dúvida, entre em contato conosco pelo WhatsApp.
        </p>
        
        <p style="margin-top: 30px;">
          Obrigado pela sua compra! 🎉<br>
          <strong>Bella Arte Festas</strong>
        </p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
        Este email foi enviado automaticamente. Por favor, não responda.
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "Bella Arte Festas <onboarding@resend.dev>",
      to: [order.customer_email],
      subject: `✨ Pedido #${order.id.slice(0, 8)} Confirmado!`,
      html: emailHtml,
    });
    console.log("Confirmation email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // For now, skip signature verification if no webhook secret is configured
    // In production, you should always verify the signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    let event: Stripe.Event;
    
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }
    } else {
      // Parse the event directly (for development)
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log("Received webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;

        if (orderId) {
          console.log("Processing completed checkout for order:", orderId);

          // Update order status to paid
          const { error: updateError } = await supabase
            .from("orders")
            .update({
              status: "paid",
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .eq("id", orderId);

          if (updateError) {
            console.error("Error updating order:", updateError);
          } else {
            console.log("Order updated to paid status");

            // Add tracking event for payment confirmation
            await supabase.from("order_tracking_events").insert({
              order_id: orderId,
              status: "payment_confirmed",
              description: "Pagamento confirmado via Stripe",
            });

            // Fetch order and items for email
            const { data: order } = await supabase
              .from("orders")
              .select("*")
              .eq("id", orderId)
              .single();

            const { data: items } = await supabase
              .from("order_items")
              .select("*, product_id")
              .eq("order_id", orderId);

            if (order && items) {
              await sendOrderConfirmationEmail(order, items);

              // Mark any existing reviews from this customer as verified purchases
              for (const item of items) {
                if (item.product_id) {
                  await supabase
                    .from("product_reviews")
                    .update({ is_verified_purchase: true })
                    .eq("product_id", item.product_id)
                    .eq("customer_email", order.customer_email);
                }
              }
              console.log("Marked reviews as verified purchases for:", order.customer_email);
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;

        if (orderId) {
          console.log("Checkout expired for order:", orderId);

          await supabase
            .from("orders")
            .update({ status: "canceled" })
            .eq("id", orderId);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Find order by payment intent
        const { data: order } = await supabase
          .from("orders")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .single();

        if (order) {
          console.log("Payment failed for order:", order.id);

          await supabase
            .from("orders")
            .update({ status: "canceled" })
            .eq("id", order.id);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        // Find order by payment intent
        const { data: order } = await supabase
          .from("orders")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .single();

        if (order) {
          console.log("Refund processed for order:", order.id);

          await supabase
            .from("orders")
            .update({ status: "canceled" })
            .eq("id", order.id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
