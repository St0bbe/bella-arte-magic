import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles, PartyPopper, ShoppingBag, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTenant } from "@/contexts/TenantContext";
import { useCart } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/store/CartDrawer";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: settings } = useSiteSettings();
  const { tenant } = useTenant();
  const { totalItems } = useCart();

  // Get logo size from settings (default 100%)
  const logoSize = settings?.logo_size ? parseInt(settings.logo_size) : 100;
  const baseHeight = 48; // 12 in tailwind = 48px
  const calculatedHeight = Math.round(baseHeight * logoSize / 100);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            {(tenant?.logo_url || settings?.logo_url) ? (
              <img
                src={tenant?.logo_url || settings?.logo_url}
                alt="Logo"
                style={{ height: `${calculatedHeight}px` }}
                className="w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  {tenant?.name || "Bella Arte"}
                </span>
              </div>
            )}
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollTo("servicos")}
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Serviços
            </button>
            <button
              onClick={() => scrollTo("orcamento")}
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Orçamento
            </button>
            <button
              onClick={() => scrollTo("contato")}
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Contato
            </button>
            <Link 
              to="/loja" 
              className="text-foreground/80 hover:text-primary transition-colors font-medium flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              Loja
            </Link>
            <Link to="/convites">
              <Button variant="outline" className="gap-2">
                <PartyPopper className="w-4 h-4" />
                Criar Convite
              </Button>
            </Link>
            
            {/* Cart Drawer */}
            <CartDrawer>
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </CartDrawer>
            
            <Button
              onClick={() => scrollTo("orcamento")}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              Fazer Orçamento
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Cart on Mobile */}
            <CartDrawer>
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </CartDrawer>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 bg-background/95 backdrop-blur-md">
            <nav className="flex flex-col gap-4">
              <button
                onClick={() => scrollTo("servicos")}
                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
              >
                Serviços
              </button>
              <button
                onClick={() => scrollTo("orcamento")}
                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
              >
                Orçamento
              </button>
              <button
                onClick={() => scrollTo("contato")}
                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
              >
                Contato
              </button>
              <Link 
                to="/loja" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2 flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Loja
              </Link>
              <Link to="/convites" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full gap-2">
                  <PartyPopper className="w-4 h-4" />
                  Criar Convite
                </Button>
              </Link>
              <Button
                onClick={() => scrollTo("orcamento")}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                Fazer Orçamento
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
