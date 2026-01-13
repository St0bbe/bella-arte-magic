import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GetContractRequest {
  signature_token: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signature_token } = (await req.json()) as GetContractRequest;

    if (!signature_token || typeof signature_token !== "string") {
      return new Response(
        JSON.stringify({ error: "signature_token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token format (should be hex string, 32 chars for 16 bytes)
    if (!/^[a-f0-9]{32}$/i.test(signature_token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS and return only safe fields
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query only the fields needed for the signing page
    // EXCLUDE: client_email, client_phone, signer_ip, signer_user_agent, signer_location
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        id,
        client_name,
        contract_type,
        file_url,
        status,
        notes,
        created_at,
        tenant_id,
        quote_id,
        signed_at,
        signature_data
      `)
      .eq("signature_token", signature_token)
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Contract not found or invalid token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
