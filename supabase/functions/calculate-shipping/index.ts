import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShippingRequest {
  origin_zip: string;
  destination_zip: string;
  weight: number; // in grams
  length: number; // in cm
  width: number;  // in cm
  height: number; // in cm
  insurance_value?: number;
}

interface MelhorEnvioQuote {
  id: number;
  name: string;
  price: string;
  custom_price: string;
  discount: string;
  currency: string;
  delivery_time: number;
  delivery_range: { min: number; max: number };
  custom_delivery_time: number;
  custom_delivery_range: { min: number; max: number };
  packages: any[];
  additional_services: any;
  company: {
    id: number;
    name: string;
    picture: string;
  };
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const melhorEnvioToken = Deno.env.get("MELHOR_ENVIO_TOKEN");
    
    if (!melhorEnvioToken) {
      // Fallback to simulated rates if no token
      return await handleSimulatedRates(req);
    }

    const body: ShippingRequest = await req.json();
    const { origin_zip, destination_zip, weight, length, width, height, insurance_value } = body;

    // Clean CEPs
    const cleanOrigin = origin_zip.replace(/\D/g, "");
    const cleanDest = destination_zip.replace(/\D/g, "");

    if (cleanOrigin.length !== 8 || cleanDest.length !== 8) {
      throw new Error("CEP inválido. Use o formato 00000-000 ou 00000000");
    }

    // Call Melhor Envio API
    const response = await fetch("https://melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${melhorEnvioToken}`,
        "User-Agent": "BellaArteFestas (thaisapgalk@gmail.com)",
      },
      body: JSON.stringify({
        from: { postal_code: cleanOrigin },
        to: { postal_code: cleanDest },
        products: [
          {
            id: "1",
            width: width || 20,
            height: height || 10,
            length: length || 30,
            weight: (weight || 500) / 1000, // Convert grams to kg
            insurance_value: insurance_value || 0,
            quantity: 1,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Melhor Envio API error:", response.status, errorText);
      throw new Error("Erro ao consultar API de frete");
    }

    const quotes: MelhorEnvioQuote[] = await response.json();
    
    // Filter valid quotes and format response
    const validQuotes = quotes.filter(q => !q.error && parseFloat(q.price) > 0);
    
    const options = validQuotes.map(quote => ({
      service_code: `ME_${quote.company.id}_${quote.id}`,
      service_name: `${quote.company.name} - ${quote.name}`,
      price: parseFloat(quote.custom_price || quote.price),
      delivery_days: quote.custom_delivery_time || quote.delivery_time,
      delivery_range: quote.custom_delivery_range || quote.delivery_range,
      carrier: quote.company.name,
      carrier_logo: quote.company.picture,
    }));

    // Sort by price
    options.sort((a, b) => a.price - b.price);

    console.log("Melhor Envio quotes:", { origin: cleanOrigin, destination: cleanDest, quotes: options.length });

    return new Response(
      JSON.stringify({ 
        success: true,
        options,
        origin_zip: cleanOrigin,
        destination_zip: cleanDest,
        source: "melhor_envio",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Shipping calculation error:", error);
    const message = error instanceof Error ? error.message : "Erro ao calcular frete";
    
    // Fallback to simulated rates on error
    try {
      return await handleSimulatedRates(req);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  }
});

// Fallback function for simulated rates
async function handleSimulatedRates(req: Request): Promise<Response> {
  const body = await req.json();
  const { origin_zip, destination_zip, weight } = body;
  
  const cleanOrigin = origin_zip.replace(/\D/g, "");
  const cleanDest = destination_zip.replace(/\D/g, "");

  // Calculate zone based on CEP difference
  const originPrefix = parseInt(cleanOrigin.substring(0, 2));
  const destPrefix = parseInt(cleanDest.substring(0, 2));
  const diff = Math.abs(originPrefix - destPrefix);
  const zone = diff <= 5 ? 1 : diff <= 15 ? 2 : diff <= 30 ? 3 : 4;

  const basePrice = Math.max((weight || 500) / 1000 * 2, 5);

  const options = [
    {
      service_code: "SEDEX",
      service_name: "SEDEX - Entrega Expressa",
      price: Math.round((basePrice * (1 + zone * 0.3) * 1.5) * 100) / 100,
      delivery_days: Math.max(1, zone),
      delivery_range: { min: Math.max(1, zone), max: Math.max(1, zone) + 1 },
      carrier: "Correios",
    },
    {
      service_code: "PAC",
      service_name: "PAC - Entrega Econômica",
      price: Math.round((basePrice * (1 + zone * 0.2)) * 100) / 100,
      delivery_days: zone * 3 + 2,
      delivery_range: { min: zone * 2 + 2, max: zone * 3 + 3 },
      carrier: "Correios",
    },
  ];

  return new Response(
    JSON.stringify({ 
      success: true,
      options,
      origin_zip: cleanOrigin,
      destination_zip: cleanDest,
      source: "simulated",
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
}
