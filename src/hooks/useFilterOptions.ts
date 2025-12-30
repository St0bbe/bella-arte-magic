import { useMemo } from "react";
import { useSiteSettings, useAdminSiteSettings, useUpdateSiteSetting } from "./useSiteSettings";

const DEFAULT_THEMES = ["Princesa", "Super-Heróis", "Tropical", "Unicórnio", "Safari", "Elegante", "Bebê", "Espaço"];
const DEFAULT_EVENT_TYPES = ["Aniversário Infantil", "Aniversário", "Corporativo", "Chá de Bebê"];

function parseStringArray(value: string | null | undefined, fallback: string[]) {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;

    const cleaned = parsed
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean);

    return cleaned.length ? cleaned : fallback;
  } catch {
    return fallback;
  }
}

// Hook for public site - uses the tenant context
export function useFilterOptions() {
  const { data: settings } = useSiteSettings();

  const themes = useMemo(
    () => parseStringArray(settings?.gallery_themes, DEFAULT_THEMES),
    [settings?.gallery_themes]
  );

  const eventTypes = useMemo(
    () => parseStringArray(settings?.gallery_event_types, DEFAULT_EVENT_TYPES),
    [settings?.gallery_event_types]
  );

  return { themes, eventTypes };
}

// Hook for admin panel - uses authenticated user's tenant
export function useAdminFilterOptions() {
  const { data: settings, isLoading } = useAdminSiteSettings();

  const themes = useMemo(
    () => parseStringArray(settings?.gallery_themes, DEFAULT_THEMES),
    [settings?.gallery_themes]
  );

  const eventTypes = useMemo(
    () => parseStringArray(settings?.gallery_event_types, DEFAULT_EVENT_TYPES),
    [settings?.gallery_event_types]
  );

  return { themes, eventTypes, isLoading };
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
    isPending: updateSetting.isPending,
  };
}

