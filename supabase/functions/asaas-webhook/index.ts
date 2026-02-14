import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

async function sendOrderConfirmationEmail(order: {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
}, items: Array<{ product_name: string; quantity: number; total_price: number; is_digital: boolean }>) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.log("RESEND_API_KEY not configured, skipping email");
    return;
  }

  const { Resend } = await import("https://esm.sh/resend@2.0.0");
  const resend = new Resend(resendKey);
  
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
            <tbody>${itemsHtml}</tbody>
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
            <p style="margin: 0; color: #1e40af;"><strong>📥 Produtos Digitais:</strong> Os links para download serão enviados em breve.</p>
          </div>
        ` : ''}
        <p style="color: #6b7280; font-size: 14px;">Se tiver qualquer dúvida, entre em contato conosco pelo WhatsApp.</p>
        <p style="margin-top: 30px;">Obrigado pela sua compra! 🎉<br><strong>Bella Arte Festas</strong></p>
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

async function sendAdminNotificationEmail(order: {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_amount: number;
  tenant_id: string | null;
}, items: Array<{ product_name: string; quantity: number; total_price: number; is_digital: boolean }>) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return;

  const { Resend } = await import("https://esm.sh/resend@2.0.0");
  const resend = new Resend(resendKey);

  let adminEmail = "thaisapgalk@gmail.com";
  
  if (order.tenant_id) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("owner_id")
      .eq("id", order.tenant_id)
      .single();
    
    if (tenant?.owner_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(tenant.owner_id);
      if (userData?.user?.email) {
        adminEmail = userData.user.email;
      }
    }
  }

  const hasDigital = items.some(item => item.is_digital);
  const hasPhysical = items.some(item => !item.is_digital);

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.product_name}
        ${item.is_digital ? '<span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Digital</span>' : '<span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Físico</span>'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.total_price.toFixed(2).replace(".", ",")}</td>
    </tr>
  `).join("");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🛒 Novo Pedido Recebido!</h1>
      </div>
      <div style="padding: 25px; background: #fff;">
        <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #166534; font-size: 16px;"><strong>💰 Valor Total: R$ ${order.total_amount.toFixed(2).replace(".", ",")}</strong></p>
        </div>
        <h3 style="color: #374151;">📦 Detalhes do Pedido #${order.id.slice(0, 8)}</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead><tr style="background: #f3f4f6;">
            <th style="padding: 10px; text-align: left;">Produto</th>
            <th style="padding: 10px; text-align: center;">Qtd</th>
            <th style="padding: 10px; text-align: right;">Total</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <h3 style="color: #374151;">👤 Dados do Cliente</h3>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Nome:</strong> ${order.customer_name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${order.customer_email}</p>
          ${order.customer_phone ? `<p style="margin: 5px 0;"><strong>WhatsApp:</strong> ${order.customer_phone}</p>` : ''}
        </div>
        ${hasDigital ? '<div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 15px;"><p style="margin: 0; color: #1e40af;"><strong>🎨 Produtos Digitais:</strong> Este pedido contém produtos digitais.</p></div>' : ''}
        ${hasPhysical ? '<div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 15px;"><p style="margin: 0; color: #166534;"><strong>📦 Produtos Físicos:</strong> Este pedido contém produtos físicos.</p></div>' : ''}
        <div style="text-align: center; margin-top: 25px;">
          <a href="https://bella-arte-magic.lovable.app/admin" style="display: inline-block; background: linear-gradient(135deg, #FF6B9D 0%, #C084FC 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Pedido no Painel Admin</a>
        </div>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "Bella Arte Festas <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🛒 Novo Pedido #${order.id.slice(0, 8)} - R$ ${order.total_amount.toFixed(2).replace(".", ",")}`,
      html: emailHtml,
    });
    console.log("Admin notification email sent to:", adminEmail);
  } catch (error) {
    console.error("Error sending admin email:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Received Asaas webhook event:", body.event);

    const { event, payment } = body;

    if (!payment || !payment.externalReference) {
      console.log("No payment or externalReference in webhook, ignoring");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const orderId = payment.externalReference;

    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED": {
        console.log("Payment confirmed for order:", orderId);

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "paid",
            stripe_payment_intent_id: payment.id,
          })
          .eq("id", orderId);

        if (updateError) {
          console.error("Error updating order:", updateError);
        } else {
          console.log("Order updated to paid status");

          // Add tracking event
          await supabase.from("order_tracking_events").insert({
            order_id: orderId,
            status: "payment_confirmed",
            description: `Pagamento confirmado via Asaas (${payment.billingType})`,
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
            await sendAdminNotificationEmail(order, items);

            // Mark reviews as verified purchases
            for (const item of items) {
              if (item.product_id) {
                await supabase
                  .from("product_reviews")
                  .update({ is_verified_purchase: true })
                  .eq("product_id", item.product_id)
                  .eq("customer_email", order.customer_email);
              }
            }
          }
        }
        break;
      }

      case "PAYMENT_OVERDUE":
      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED": {
        console.log(`Payment ${event} for order:`, orderId);

        await supabase
          .from("orders")
          .update({ status: "canceled" })
          .eq("id", orderId);
        break;
      }

      default:
        console.log("Unhandled Asaas event:", event);
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
