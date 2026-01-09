import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShippingNotificationRequest {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  order_id: string;
  tracking_code: string;
  carrier: string;
  tracking_url?: string;
  tenant_id?: string;
}

async function sendEmail(to: string[], subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Bella Arte Festas <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

async function sendWhatsAppMessage(phone: string, message: string, tenantPhone?: string) {
  // Format phone number (remove non-digits, add country code if needed)
  let formattedPhone = phone.replace(/\D/g, "");
  if (formattedPhone.length === 11 && !formattedPhone.startsWith("55")) {
    formattedPhone = "55" + formattedPhone;
  }
  
  // Create WhatsApp API URL (using wa.me link generation for click-to-chat)
  // This can be extended to integrate with WhatsApp Business API or third-party services
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  
  console.log("WhatsApp notification prepared:", { phone: formattedPhone, whatsappUrl });
  
  return { success: true, whatsappUrl };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      customer_name, 
      customer_email, 
      customer_phone,
      order_id, 
      tracking_code, 
      carrier,
      tracking_url,
      tenant_id
    }: ShippingNotificationRequest = await req.json();

    if (!customer_email || !tracking_code) {
      throw new Error("Email do cliente e código de rastreio são obrigatórios");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get tenant info for WhatsApp number
    let tenantWhatsApp: string | null = null;
    if (tenant_id) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("whatsapp_number")
        .eq("id", tenant_id)
        .single();
      tenantWhatsApp = tenant?.whatsapp_number;
    }

    const trackingPageUrl = tracking_url || `${req.headers.get("origin")}/rastrear?codigo=${tracking_code}`;

    // Send Email
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
            <div style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                🎉 Boa notícia!
              </h1>
              <p style="color: #fce7f3; margin: 10px 0 0 0; font-size: 16px;">
                Seu pedido está a caminho!
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá <strong>${customer_name}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Temos o prazer de informar que seu pedido foi despachado e está a caminho do endereço de entrega!
              </p>
              
              <!-- Tracking Box -->
              <div style="background-color: #fdf2f8; border: 2px solid #f9a8d4; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <h2 style="color: #be185d; margin: 0 0 15px 0; font-size: 18px;">
                  📦 Informações de Rastreamento
                </h2>
                
                <div style="margin-bottom: 15px;">
                  <span style="color: #6b7280; font-size: 14px;">Transportadora:</span>
                  <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 5px 0 0 0;">
                    ${carrier || "Correios"}
                  </p>
                </div>
                
                <div style="margin-bottom: 20px;">
                  <span style="color: #6b7280; font-size: 14px;">Código de Rastreio:</span>
                  <p style="color: #111827; font-size: 20px; font-weight: 700; margin: 5px 0 0 0; font-family: monospace; background: #ffffff; padding: 10px 15px; border-radius: 8px; display: inline-block;">
                    ${tracking_code}
                  </p>
                </div>
                
                <a href="${trackingPageUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Rastrear Pedido →
                </a>
              </div>
              
              <!-- Tips -->
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  💡 Dicas
                </h3>
                <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>A atualização do rastreio pode levar até 24h após o envio</li>
                  <li>Mantenha alguém disponível no endereço para receber</li>
                  <li>Em caso de ausência, o entregador deixará um aviso</li>
                </ul>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                Se tiver alguma dúvida, não hesite em nos contatar pelo WhatsApp!
              </p>
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

    const emailResponse = await sendEmail(
      [customer_email],
      `🚚 Seu pedido foi enviado! - Pedido #${order_id.slice(0, 8)}`,
      emailHtml
    );

    console.log("Shipping notification email sent:", emailResponse);

    // Send WhatsApp notification if phone is provided
    let whatsappResult = null;
    if (customer_phone) {
      const whatsappMessage = `🚚 *Seu pedido foi enviado!*

Olá ${customer_name}! 

Seu pedido #${order_id.slice(0, 8)} foi despachado e está a caminho!

📦 *Código de Rastreio:* ${tracking_code}
🚛 *Transportadora:* ${carrier || "Correios"}

Rastreie aqui: ${trackingPageUrl}

Obrigado por comprar conosco! 💖
- Bella Arte Festas`;

      whatsappResult = await sendWhatsAppMessage(customer_phone, whatsappMessage, tenantWhatsApp || undefined);
      console.log("WhatsApp notification prepared:", whatsappResult);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          email: emailResponse,
          whatsapp: whatsappResult
        } 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error sending shipping notification:", error);
    const message = error instanceof Error ? error.message : "Erro ao enviar email";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
