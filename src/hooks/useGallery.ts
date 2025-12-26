import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface GalleryItem {
  id: string;
  title: string;
  image_url: string;
  theme: string;
  event_type: string;
  is_active: boolean;
  tenant_id: string | null;
}

export function useGallery() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["gallery", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GalleryItem[];
    },
    enabled: !!tenant?.id,
  });
}

// Hook for admin - gets gallery items for the logged-in decorator's tenant
export function useAdminGallery() {
  return useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return [];

      // Get user's tenant
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      if (!tenantData) return [];

      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("tenant_id", tenantData.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as GalleryItem[];
    },
  });
}
