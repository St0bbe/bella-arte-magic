import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface ProductReview {
  id: string;
  product_id: string;
  tenant_id: string | null;
  customer_name: string;
  customer_email: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProductReview[];
    },
    enabled: !!productId,
  });
}

export function useAllProductReviews() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["all-product-reviews", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*, products(name)")
        .eq("tenant_id", tenant?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (ProductReview & { products: { name: string } | null })[];
    },
    enabled: !!tenant?.id,
  });
}

export function useProductAverageRating(productId: string) {
  return useQuery({
    queryKey: ["product-rating", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("rating")
        .eq("product_id", productId)
        .eq("is_approved", true);

      if (error) throw error;
      
      if (!data || data.length === 0) return { average: 0, count: 0 };
      
      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      return { 
        average: sum / data.length, 
        count: data.length 
      };
    },
    enabled: !!productId,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      product_id: string;
      tenant_id: string;
      customer_name: string;
      customer_email: string;
      order_id?: string;
      rating: number;
      title?: string;
      comment?: string;
      is_verified_purchase?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("product_reviews")
        .insert(review)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["product-rating", variables.product_id] });
    },
  });
}
