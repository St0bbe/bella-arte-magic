import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings, useUpdateSiteSetting } from "./useSiteSettings";

const DEFAULT_THEMES = ["Princesa", "Super-Heróis", "Tropical", "Unicórnio", "Safari", "Elegante", "Bebê", "Espaço"];
const DEFAULT_EVENT_TYPES = ["Aniversário Infantil", "Aniversário", "Corporativo", "Chá de Bebê"];

export function useFilterOptions() {
  const { data: settings } = useSiteSettings();

  const themes = settings?.gallery_themes 
    ? JSON.parse(settings.gallery_themes) 
    : DEFAULT_THEMES;

  const eventTypes = settings?.gallery_event_types 
    ? JSON.parse(settings.gallery_event_types) 
    : DEFAULT_EVENT_TYPES;

  return { themes, eventTypes };
}

export function useUpdateFilterOptions() {
  const updateSetting = useUpdateSiteSetting();

  const updateThemes = (themes: string[]) => {
    return updateSetting.mutateAsync({
      key: "gallery_themes",
      value: JSON.stringify(themes),
    });
  };

  const updateEventTypes = (eventTypes: string[]) => {
    return updateSetting.mutateAsync({
      key: "gallery_event_types",
      value: JSON.stringify(eventTypes),
    });
  };

  return { 
    updateThemes, 
    updateEventTypes,
    isPending: updateSetting.isPending 
  };
}
