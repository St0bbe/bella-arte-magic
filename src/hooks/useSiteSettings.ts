import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface SiteSettings {
  logo_url: string;
  about_title: string;
  about_description: string;
  about_mission: string;
  footer_text: string;
  whatsapp_number: string;
  instagram_url: string;
  facebook_url: string;
  phone_number: string;
  address: string;
  gallery_themes: string;
  gallery_event_types: string;
  whatsapp_budget_message: string;
  services_title: string;
  services_description: string;
}

// Hook for public site - gets settings for the current tenant being viewed
export function useSiteSettings() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["site-settings", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) {
        return getDefaultSettings();
      }
      
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .eq("tenant_id", tenant.id);
      
      if (error) throw error;
      
      const settings = getDefaultSettings();
      
      data?.forEach((item: { key: string; value: string | null }) => {
        if (item.key in settings) {
          (settings as any)[item.key] = item.value || "";
        }
      });
      
      return settings;
    },
    enabled: !!tenant?.id,
  });
}

// Hook for admin - gets settings for the logged-in decorator's tenant
export function useAdminSiteSettings() {
  return useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return getDefaultSettings();
      }

      // Get user's tenant
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      if (!tenantData) {
        return getDefaultSettings();
      }

      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .eq("tenant_id", tenantData.id);
      
      if (error) throw error;
      
      const settings = getDefaultSettings();
      
      data?.forEach((item: { key: string; value: string | null }) => {
        if (item.key in settings) {
          (settings as any)[item.key] = item.value || "";
        }
      });
      
      return settings;
    },
  });
}

export function useUpdateSiteSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      // Get user's tenant
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      if (!tenantData) throw new Error("No tenant found");

      // Try to update first
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", key)
        .eq("tenant_id", tenantData.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value })
          .eq("key", key)
          .eq("tenant_id", tenantData.id);
        if (error) throw error;
      } else {
        // Insert if doesn't exist
        const { error } = await supabase
          .from("site_settings")
          .insert({ key, value, tenant_id: tenantData.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
}

function getDefaultSettings(): SiteSettings {
  return {
    logo_url: "",
    about_title: "Sobre Nós",
    about_description: "",
    about_mission: "",
    footer_text: "",
    whatsapp_number: "",
    instagram_url: "",
    facebook_url: "",
    phone_number: "",
    address: "",
    gallery_themes: "",
    gallery_event_types: "",
    whatsapp_budget_message: "",
    services_title: "Nossos Serviços",
    services_description: "Oferecemos uma variedade completa de opções para tornar sua festa única e memorável",
  };
}
