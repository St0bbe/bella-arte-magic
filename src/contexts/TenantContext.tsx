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
    try {
      // Use edge function to get only public tenant data (excludes whatsapp_number, address, owner_id)
      const { data: response, error } = await supabase.functions.invoke("get-tenant-public", {
        body: { slug },
      });

      if (!error && response?.data) {
        // Map the public fields to our Tenant interface
        setTenant({
          ...response.data,
          whatsapp_number: null, // Not exposed in public API
          address: null, // Not exposed in public API
          owner_id: null, // Not exposed in public API
        });
      } else {
        // Se não encontrar tenant, criar um padrão temporário para permitir navegação
        setTenant(null);
      }
    } catch (err) {
      console.error("Error fetching tenant:", err);
      setTenant(null);
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
    // Site exclusivo para Bella Arte
    fetchTenantBySlug("bellaarte");
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
