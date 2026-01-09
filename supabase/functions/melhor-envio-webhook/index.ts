import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MelhorEnvioWebhookPayload {
  event: string;
  tracking_code?: string;
  order_id?: string;
  status?: string;
  description?: string;
  date?: string;
  city?: string;
  state?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload: MelhorEnvioWebhookPayload = await req.json();
    
    console.log("Melhor Envio webhook received:", payload);

    const { event, tracking_code, status, description, date, city, state } = payload;

    if (!tracking_code) {
      return new Response(
        JSON.stringify({ success: false, error: "Tracking code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find order by tracking code
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, customer_name, customer_email, customer_phone, tenant_id, status")
      .eq("tracking_code", tracking_code)
      .single();

    if (orderError || !order) {
      console.log("Order not found for tracking code:", tracking_code);
      return new Response(
        JSON.stringify({ success: true, message: "Order not found, ignoring webhook" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map Melhor Envio status to our status
    const statusMap: Record<string, string> = {
      "posted": "shipped",
      "in_transit": "shipped",
      "out_for_delivery": "shipped",
      "delivered": "delivered",
      "returned": "canceled",
      "canceled": "canceled",
    };

    const newStatus = statusMap[event] || order.status;
    const location = city && state ? `${city} - ${state}` : null;

    // Insert tracking event
    await supabase
      .from("order_tracking_events")
      .insert({
        order_id: order.id,
        status: status || event,
        description: description || getEventDescription(event),
        location,
        event_date: date || new Date().toISOString(),
      });

    // Update order status if changed
    const updates: Record<string, unknown> = {};
    
    if (newStatus !== order.status) {
      updates.status = newStatus;
    }

    if (event === "delivered") {
      updates.delivered_at = date || new Date().toISOString();
      updates.status = "delivered";
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from("orders")
        .update(updates)
        .eq("id", order.id);
    }

    // Send notification if delivered
    if (event === "delivered" && order.customer_email) {
      try {
        await sendDeliveryNotification(supabase, order, tracking_code);
      } catch (notifError) {
        console.error("Failed to send delivery notification:", notifError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getEventDescription(event: string): string {
  const descriptions: Record<string, string> = {
    "posted": "Objeto postado",
    "in_transit": "Em trânsito",
    "out_for_delivery": "Saiu para entrega",
    "delivered": "Entregue ao destinatário",
    "returned": "Devolvido ao remetente",
    "canceled": "Envio cancelado",
  };
  return descriptions[event] || event;
}

async function sendDeliveryNotification(
  _supabase: unknown,
  order: { id: string; customer_name: string; customer_email: string; customer_phone: string | null; tenant_id: string | null },
  tracking_code: string
) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping email notification");
    return;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
            ✅ Pedido Entregue!
          </h1>
          <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">
            Seu pedido chegou ao destino!
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Olá <strong>${order.customer_name}</strong>,
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Temos o prazer de informar que seu pedido #${order.id.slice(0, 8)} foi entregue com sucesso! 🎉
          </p>
          
          <!-- Success Box -->
          <div style="background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin-bottom: 30px; text-align: center;">
            <p style="color: #065f46; font-size: 18px; font-weight: 600; margin: 0;">
              📦 Código de Rastreio: <span style="font-family: monospace;">${tracking_code}</span>
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Esperamos que você aproveite seus produtos! Se tiver qualquer problema ou dúvida, não hesite em nos contatar.
          </p>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              ⭐ <strong>Gostou dos produtos?</strong> Deixe uma avaliação! Sua opinião é muito importante para nós.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 30px; text-align: center;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
            Obrigado por comprar conosco! 💖
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Bella Arte Festas - Transformando momentos em memórias
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Bella Arte Festas <onboarding@resend.dev>",
      to: [order.customer_email],
      subject: `✅ Pedido Entregue! - Pedido #${order.id.slice(0, 8)}`,
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send delivery email: ${error}`);
  }

  console.log("Delivery notification email sent successfully");
}
