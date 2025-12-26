import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export function useTenantServices() {
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
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });
}

export function useTenantGallery() {
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
      return data || [];
    },
    enabled: !!tenant?.id,
  });
}

export function useTenantSettings() {
  const { tenant } = useTenant();
  
  return useQuery({
    queryKey: ["site_settings", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return {};
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("tenant_id", tenant.id);
      
      if (error) throw error;
      
      const settings: Record<string, string> = {};
      data?.forEach((item) => {
        settings[item.key] = item.value || "";
      });
      return settings;
    },
    enabled: !!tenant?.id,
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  const { tenant, refreshTenant } = useTenant();
  
  return useMutation({
    mutationFn: async (updates: Partial<{
      name: string;
      logo_url: string;
      primary_color: string;
      secondary_color: string;
      whatsapp_number: string;
      address: string;
    }>) => {
      if (!tenant?.id) throw new Error("No tenant");
      
      const { error } = await supabase
        .from("tenants")
        .update(updates)
        .eq("id", tenant.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refreshTenant();
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
    },
  });
}
