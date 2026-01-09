import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface Product {
  id: string;
  tenant_id: string | null;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category: string;
  subcategory: string | null;
  image_url: string | null;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  stock_quantity: number;
  digital_file_url: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useProducts(category?: string) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["products", tenant?.id, category],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (tenant?.id) {
        query = query.eq("tenant_id", tenant.id);
      }

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!tenant?.id,
  });
}

export function useFeaturedProducts() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["featured-products", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .eq("tenant_id", tenant?.id)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!tenant?.id,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
}
