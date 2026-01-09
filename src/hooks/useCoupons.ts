import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface Coupon {
  id: string;
  tenant_id: string | null;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCoupons() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["coupons", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("tenant_id", tenant?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Coupon[];
    },
    enabled: !!tenant?.id,
  });
}

export async function validateCoupon(code: string, tenantId: string, orderTotal: number): Promise<{
  valid: boolean;
  coupon?: Coupon;
  error?: string;
}> {
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !coupon) {
    return { valid: false, error: "Cupom não encontrado" };
  }

  const now = new Date();

  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { valid: false, error: "Cupom ainda não está ativo" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { valid: false, error: "Cupom expirado" };
  }

  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    return { valid: false, error: "Cupom esgotado" };
  }

  if (coupon.min_order_value && orderTotal < coupon.min_order_value) {
    return { 
      valid: false, 
      error: `Valor mínimo do pedido: R$ ${coupon.min_order_value.toFixed(2).replace(".", ",")}` 
    };
  }

  return { valid: true, coupon: coupon as Coupon };
}

export function calculateDiscount(coupon: Coupon, orderTotal: number): number {
  if (coupon.discount_type === "percentage") {
    return (orderTotal * coupon.discount_value) / 100;
  }
  return Math.min(coupon.discount_value, orderTotal);
}
