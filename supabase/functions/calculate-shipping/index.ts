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
}

interface ShippingOption {
  service_code: string;
  service_name: string;
  price: number;
  delivery_days: number;
  delivery_range: { min: number; max: number };
}

// Simulated shipping rates based on distance zones
function calculateZone(originZip: string, destZip: string): number {
  const originPrefix = parseInt(originZip.substring(0, 2));
  const destPrefix = parseInt(destZip.substring(0, 2));
  const diff = Math.abs(originPrefix - destPrefix);
  
  if (diff <= 5) return 1;  // Same region
  if (diff <= 15) return 2; // Nearby region
  if (diff <= 30) return 3; // Distant region
  return 4;                  // Far region
}

function calculateBasePrice(weight: number, dimensions: { length: number; width: number; height: number }): number {
  const volumetricWeight = (dimensions.length * dimensions.width * dimensions.height) / 6000;
  const chargeableWeight = Math.max(weight / 1000, volumetricWeight);
  return Math.max(chargeableWeight * 2, 5); // Minimum R$ 5.00
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ShippingRequest = await req.json();
    const { origin_zip, destination_zip, weight, length, width, height } = body;

    // Validate input
    const cleanOrigin = origin_zip.replace(/\D/g, "");
    const cleanDest = destination_zip.replace(/\D/g, "");

    if (cleanOrigin.length !== 8 || cleanDest.length !== 8) {
      throw new Error("CEP inválido. Use o formato 00000-000 ou 00000000");
    }

    const zone = calculateZone(cleanOrigin, cleanDest);
    const basePrice = calculateBasePrice(weight, { length, width, height });

    // Calculate different shipping options
    const options: ShippingOption[] = [
      {
        service_code: "SEDEX",
        service_name: "SEDEX - Entrega Expressa",
        price: Math.round((basePrice * (1 + zone * 0.3) * 1.5) * 100) / 100,
        delivery_days: Math.max(1, zone),
        delivery_range: { min: Math.max(1, zone), max: Math.max(1, zone) + 1 },
      },
      {
        service_code: "PAC",
        service_name: "PAC - Entrega Econômica",
        price: Math.round((basePrice * (1 + zone * 0.2)) * 100) / 100,
        delivery_days: zone * 3 + 2,
        delivery_range: { min: zone * 2 + 2, max: zone * 3 + 3 },
      },
      {
        service_code: "EXPRESSA",
        service_name: "Entrega Expressa (Motoboy)",
        price: zone <= 2 ? Math.round((basePrice * 2.5) * 100) / 100 : 0,
        delivery_days: 1,
        delivery_range: { min: 0, max: 1 },
      },
    ].filter(opt => opt.price > 0);

    // Add free shipping option for orders above certain value (will be checked on frontend)
    options.push({
      service_code: "FREE",
      service_name: "Frete Grátis",
      price: 0,
      delivery_days: zone * 4 + 5,
      delivery_range: { min: zone * 3 + 4, max: zone * 4 + 6 },
    });

    console.log("Shipping calculated:", { origin: cleanOrigin, destination: cleanDest, zone, options });

    return new Response(
      JSON.stringify({ 
        success: true,
        options,
        origin_zip: cleanOrigin,
        destination_zip: cleanDest,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Shipping calculation error:", error);
    const message = error instanceof Error ? error.message : "Erro ao calcular frete";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
