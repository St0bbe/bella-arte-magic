import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  whatsapp_number: string | null;
  address: string | null;
  is_active: boolean;
  subscription_status: string | null;
  owner_id: string | null;
}

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  setTenantBySlug: (slug: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTenantBySlug = async (slug: string) => {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (!error && data) {
      setTenant(data);
    }
    setIsLoading(false);
  };

  const setTenantBySlug = async (slug: string) => {
    setIsLoading(true);
    await fetchTenantBySlug(slug);
  };

  const refreshTenant = async () => {
    if (tenant?.slug) {
      await fetchTenantBySlug(tenant.slug);
    }
  };

  useEffect(() => {
    // Get tenant from subdomain or URL
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    
    // Check if we're on a subdomain (e.g., maria.bellaarte.com)
    if (parts.length >= 3 && parts[0] !== "www") {
      fetchTenantBySlug(parts[0]);
    } else {
      // For development or main domain, check URL params
      const urlParams = new URLSearchParams(window.location.search);
      const slugParam = urlParams.get("tenant");
      if (slugParam) {
        fetchTenantBySlug(slugParam);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, setTenantBySlug, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
