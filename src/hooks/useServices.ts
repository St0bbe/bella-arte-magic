import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  tenant_id: string | null;
}

export function useServices() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["services", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!tenant?.id,
  });
}

// Hook for admin - gets services for the logged-in decorator's tenant
export function useAdminServices() {
  return useQuery({
    queryKey: ["admin-services"],
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
        .from("services")
        .select("*")
        .eq("tenant_id", tenantData.id)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as Service[];
    },
  });
}
