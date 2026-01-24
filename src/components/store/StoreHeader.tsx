import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, Package, Download, Home, ShoppingCart, 
  Sparkles, Menu, X 
} from "lucide-react";
import { useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTenant } from "@/contexts/TenantContext";
import { useCart } from "@/contexts/CartContext";
import { CartDrawer } from "./CartDrawer";

const NAV_ITEMS = [
  { path: "/loja", label: "Início", icon: Home },
  { path: "/loja/digitais", label: "Produtos Digitais", icon: Download },
  { path: "/loja/fisicos", label: "Produtos Físicos", icon: Package },
];

export function StoreHeader() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: settings } = useSiteSettings();
  const { tenant } = useTenant();
  const { totalItems } = useCart();

  const logoSize = settings?.logo_size ? parseInt(settings.logo_size) : 100;
  const baseHeight = 40;
  const calculatedHeight = Math.round(baseHeight * logoSize / 100);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-store-rose/20 shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="hidden md:flex items-center justify-center py-2 border-b border-store-rose/10">
          <p className="text-xs text-store-text/60 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-store-gold" />
            Produtos personalizados com carinho para sua festa
            <Sparkles className="w-3 h-3 text-store-gold" />
          </p>
        </div>

        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/loja" className="flex items-center gap-2">
            {(tenant?.logo_url || settings?.logo_url) ? (
              <img
                src={tenant?.logo_url || settings?.logo_url}
                alt="Bella Arte"
                style={{ height: `${calculatedHeight}px` }}
                className="w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-store-rose to-store-pink flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-serif font-bold text-store-text">
                    Loja Bella Arte
                  </span>
                  <span className="text-[10px] text-store-text/50 -mt-1 tracking-wider">
                    FESTAS & PERSONALIZADOS
                  </span>
                </div>
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className={`gap-2 ${
                    location.pathname === item.path 
                      ? "bg-store-rose text-white hover:bg-store-rose/90" 
                      : "text-store-text hover:text-store-rose hover:bg-store-rose/10"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Cart */}
          <div className="flex items-center gap-3">
            <CartDrawer>
              <Button 
                variant="outline" 
                className="relative border-store-rose/30 text-store-text hover:bg-store-rose/10 hover:border-store-rose"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline ml-2">Carrinho</span>
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-store-rose">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </CartDrawer>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-store-text"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-store-rose/10 space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className={`w-full justify-start gap-2 ${
                    location.pathname === item.path 
                      ? "bg-store-rose text-white" 
                      : "text-store-text hover:bg-store-rose/10"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
