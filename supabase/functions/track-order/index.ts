import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackingRequest {
  tracking_code: string;
  carrier?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body: TrackingRequest = await req.json();
    const { tracking_code, carrier } = body;

    if (!tracking_code) {
      throw new Error("Código de rastreio é obrigatório");
    }

    const melhorEnvioToken = Deno.env.get("MELHOR_ENVIO_TOKEN");
    let events = [];

    // Try Melhor Envio API first
    if (melhorEnvioToken) {
      try {
        const response = await fetch(`https://melhorenvio.com.br/api/v2/me/shipment/tracking`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${melhorEnvioToken}`,
            "User-Agent": "BellaArteFestas (thaisapgalk@gmail.com)",
          },
          body: JSON.stringify({
            orders: [tracking_code],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const trackingData = data[tracking_code];
          
          if (trackingData && trackingData.tracking) {
            events = trackingData.tracking.map((event: any) => ({
              status: event.status || "Em trânsito",
              description: event.message || event.description,
              location: event.city ? `${event.city} - ${event.state}` : null,
              event_date: event.date_time || event.date,
            }));
          }
        }
      } catch (apiError) {
        console.error("Melhor Envio tracking error:", apiError);
      }
    }

    // Fallback: Check Correios-style tracking (simplified)
    if (events.length === 0 && tracking_code.match(/^[A-Z]{2}\d{9}[A-Z]{2}$/)) {
      // This would require Correios API integration
      // For now, return a placeholder
      events = [
        {
          status: "Objeto postado",
          description: "Objeto postado",
          location: null,
          event_date: new Date().toISOString(),
        },
      ];
    }

    // Find order by tracking code and update events
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("tracking_code", tracking_code)
      .single();

    if (order && events.length > 0) {
      // Save tracking events to database
      for (const event of events) {
        await supabase
          .from("order_tracking_events")
          .upsert({
            order_id: order.id,
            status: event.status,
            description: event.description,
            location: event.location,
            event_date: event.event_date,
          }, {
            onConflict: "order_id,event_date",
            ignoreDuplicates: true,
          });
      }

      // Check if delivered
      const isDelivered = events.some((e: any) => 
        e.status?.toLowerCase().includes("entregue") || 
        e.description?.toLowerCase().includes("entregue")
      );

      if (isDelivered) {
        await supabase
          .from("orders")
          .update({ status: "delivered", delivered_at: new Date().toISOString() })
          .eq("id", order.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        tracking_code,
        events,
        carrier: carrier || "Desconhecido",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Tracking error:", error);
    const message = error instanceof Error ? error.message : "Erro ao rastrear pedido";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
