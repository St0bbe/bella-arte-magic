import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTenant } from "@/contexts/TenantContext";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: settings } = useSiteSettings();
  const { tenant } = useTenant();

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
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Logo"
                className="h-10 md:h-12 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  {tenant?.name || "Decoradora"}
                </span>
              </div>
            )}
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
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
            <Button
              onClick={() => scrollTo("orcamento")}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              Fazer Orçamento
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
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
