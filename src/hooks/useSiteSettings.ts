import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");
      
      if (error) throw error;
      
      const settings: SiteSettings = {
        logo_url: "",
        about_title: "Sobre a Bella Arte",
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
      };
      
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
      // Try to update first
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", key)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value })
          .eq("key", key);
        if (error) throw error;
      } else {
        // Insert if doesn't exist
        const { error } = await supabase
          .from("site_settings")
          .insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
}
