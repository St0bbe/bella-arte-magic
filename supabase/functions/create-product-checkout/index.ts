import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS_API_URL = "https://api.asaas.com/v3";

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
    cpfCnpj?: string;
  };
  shipping?: {
    address: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  notes?: string;
  tenant_id?: string;
  coupon?: {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
  } | null;
}

async function asaasRequest(endpoint: string, method: string, body?: unknown) {
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  if (!apiKey) {
    throw new Error("ASAAS_API_KEY not configured");
  }

  const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "access_token": apiKey,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("Asaas API error:", JSON.stringify(data));
    throw new Error(data.errors?.[0]?.description || `Asaas API error: ${response.status}`);
  }

  return data;
}

async function findOrCreateCustomer(customer: CheckoutRequest["customer"]) {
  // Try to find existing customer by email
  const searchResult = await asaasRequest(`/customers?email=${encodeURIComponent(customer.email)}`, "GET");
  
  if (searchResult.data && searchResult.data.length > 0) {
    const existingCustomer = searchResult.data[0];
    console.log("Found existing Asaas customer:", existingCustomer.id);
    
    // Update customer with CPF if missing
    if (!existingCustomer.cpfCnpj && customer.cpfCnpj) {
      await asaasRequest(`/customers/${existingCustomer.id}`, "PUT", {
        cpfCnpj: customer.cpfCnpj.replace(/\D/g, ""),
      });
      console.log("Updated customer CPF");
    }
    
    return existingCustomer.id;
  }

  // Create new customer
  const newCustomer = await asaasRequest("/customers", "POST", {
    name: customer.name,
    email: customer.email,
    mobilePhone: customer.phone?.replace(/\D/g, "") || undefined,
    cpfCnpj: customer.cpfCnpj?.replace(/\D/g, "") || undefined,
    notificationDisabled: false,
  });

  console.log("Created new Asaas customer:", newCustomer.id);
  return newCustomer.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        tenant_id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        total_amount: totalAmount,
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

    // Find or create Asaas customer
    const asaasCustomerId = await findOrCreateCustomer(customer);

    // Build description from items
    const description = items
      .map((item) => `${item.quantity}x ${item.name}`)
      .join(", ");

    // Create due date (today + 3 days for boleto, immediate for PIX/card)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    console.log("Creating Asaas payment for order:", order.id);

    // Create payment in Asaas - UNDEFINED lets customer choose payment method
    const payment = await asaasRequest("/payments", "POST", {
      customer: asaasCustomerId,
      billingType: "UNDEFINED",
      value: totalAmount,
      dueDate: dueDateStr,
      description: `Pedido #${order.id.slice(0, 8)} - ${description}`,
      externalReference: order.id,
      postalService: false,
    });

    console.log("Asaas payment created:", payment.id, "Invoice URL:", payment.invoiceUrl);

    // Update order with Asaas payment ID
    await supabase
      .from("orders")
      .update({ 
        stripe_checkout_session_id: payment.id, // Reusing field for Asaas payment ID
        stripe_payment_intent_id: payment.id,
      })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ url: payment.invoiceUrl, order_id: order.id }),
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
