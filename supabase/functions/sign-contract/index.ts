import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SignContractRequest {
  contract_id: string;
  signature_token: string;
  signature_data: string;
  user_agent?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as SignContractRequest;
    const { contract_id, signature_token, signature_data, user_agent } = body;

    // Validate required fields
    if (!contract_id || !signature_token || !signature_data) {
      return new Response(
        JSON.stringify({ error: "contract_id, signature_token, and signature_data are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token format
    if (!/^[a-f0-9]{32}$/i.test(signature_token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format for contract_id
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contract_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid contract_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP from request headers
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || "unknown";

    const signedAt = new Date().toISOString();

    // Update the contract - only if token matches
    const { data, error } = await supabase
      .from("contracts")
      .update({
        status: "signed",
        signed_at: signedAt,
        signature_data: signature_data,
        signer_ip: clientIp,
        signer_user_agent: user_agent || "unknown",
      })
      .eq("id", contract_id)
      .eq("signature_token", signature_token)
      .eq("status", "sent") // Only allow signing contracts that are in "sent" status
      .select(`
        id,
        client_name,
        client_email,
        contract_type,
        status,
        signed_at,
        signature_data,
        tenant_id
      `)
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      // Check if contract exists but is already signed
      const { data: existingContract } = await supabase
        .from("contracts")
        .select("status")
        .eq("id", contract_id)
        .eq("signature_token", signature_token)
        .maybeSingle();

      if (existingContract?.status === "signed") {
        return new Response(
          JSON.stringify({ error: "Contract already signed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Contract not found or invalid token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({
      success: true,
      contract: {
        id: data.id,
        client_name: data.client_name,
        status: data.status,
        signed_at: data.signed_at,
      }
    }), {
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
