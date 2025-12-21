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
      const { error } = await supabase
        .from("site_settings")
        .update({ value })
        .eq("key", key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
}
