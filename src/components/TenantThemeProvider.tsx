import { useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";

// Convert hex color to HSL values
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  if (hex.length !== 6) return null;
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant();
  
  useEffect(() => {
    if (!tenant) return;
    
    const root = document.documentElement;
    
    // Apply primary color
    if (tenant.primary_color) {
      const primaryHSL = hexToHSL(tenant.primary_color);
      if (primaryHSL) {
        root.style.setProperty('--primary', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
        // Also update related party colors
        root.style.setProperty('--party-pink', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
      }
    }
    
    // Apply secondary color
    if (tenant.secondary_color) {
      const secondaryHSL = hexToHSL(tenant.secondary_color);
      if (secondaryHSL) {
        root.style.setProperty('--secondary', `${secondaryHSL.h} ${secondaryHSL.s}% ${secondaryHSL.l}%`);
        // Also update related party colors
        root.style.setProperty('--party-purple', `${secondaryHSL.h} ${secondaryHSL.s}% ${secondaryHSL.l}%`);
      }
    }
    
    // Cleanup function to reset colors when unmounting
    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--party-pink');
      root.style.removeProperty('--party-purple');
    };
  }, [tenant]);
  
  return <>{children}</>;
}
