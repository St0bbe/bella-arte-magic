import { Heart, Settings, Sparkles, Phone, MapPin, PartyPopper, Cake, Gift, Star, Instagram, Facebook, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTenant } from "@/contexts/TenantContext";

export const Footer = () => {
  const { data: settings } = useSiteSettings();
  const { tenant } = useTenant();
  const businessName = tenant?.name || "Bella Arte";

  return (
    <footer className="relative bg-gradient-to-b from-foreground to-foreground/95 text-background overflow-hidden">
      {/* Decorative Party Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 animate-bounce" style={{ animationDelay: "0s", animationDuration: "3s" }}>
          <PartyPopper className="w-8 h-8 text-primary/20" />
        </div>
        <div className="absolute top-20 right-20 animate-bounce" style={{ animationDelay: "0.5s", animationDuration: "2.5s" }}>
          <Star className="w-6 h-6 text-secondary/20" />
        </div>
        <div className="absolute bottom-32 left-1/4 animate-bounce" style={{ animationDelay: "1s", animationDuration: "3.5s" }}>
          <Cake className="w-10 h-10 text-accent/20" />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-bounce" style={{ animationDelay: "1.5s", animationDuration: "2.8s" }}>
          <Gift className="w-7 h-7 text-primary/20" />
        </div>
        <div className="absolute bottom-20 right-10 animate-bounce" style={{ animationDelay: "0.8s", animationDuration: "3.2s" }}>
          <Sparkles className="w-6 h-6 text-secondary/20" />
        </div>
        
        {/* Confetti dots */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-primary/10" />
        <div className="absolute top-1/2 right-1/3 w-3 h-3 rounded-full bg-secondary/10" />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 rounded-full bg-accent/10" />
        <div className="absolute top-2/3 left-1/5 w-2 h-2 rounded-full bg-primary/15" />
        <div className="absolute bottom-1/4 right-1/5 w-3 h-3 rounded-full bg-secondary/15" />
      </div>

      <div className="container px-4 py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Logo & Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {settings?.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="h-12 w-auto object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="text-2xl font-bold">{businessName}</span>
                  </div>
                )}
              </div>
              <p className="text-background/70 leading-relaxed">
                Transformando festas em obras de arte em Piraquara e região.
                Decorações personalizadas e diversão garantida para todas as idades!
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-primary" />
                Navegação
              </h4>
              <nav className="flex flex-col gap-2">
                <a href="#servicos" className="text-background/70 hover:text-primary transition-colors">
                  Nossos Serviços
                </a>
                <a href="#orcamento" className="text-background/70 hover:text-primary transition-colors">
                  Calcular Orçamento
                </a>
                <a href="#contato" className="text-background/70 hover:text-primary transition-colors">
                  Entre em Contato
                </a>
              </nav>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Gift className="w-5 h-5 text-secondary" />
                Contato
              </h4>
              <div className="space-y-3">
                {settings?.whatsapp_number && (
                  <a 
                    href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-background/70 hover:text-primary transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {settings.whatsapp_number}
                  </a>
                )}
                <a 
                  href={settings?.whatsapp_number ? `tel:+${settings.whatsapp_number.replace(/\D/g, "")}` : "#"}
                  className="flex items-center gap-3 text-background/70 hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {settings?.whatsapp_number || "(00) 00000-0000"}
                </a>
                <div className="flex items-center gap-3 text-background/70">
                  <MapPin className="w-4 h-4" />
                  Piraquara - PR e região
                </div>
              </div>
              
              {/* Social Media Links */}
              {(settings?.instagram_url || settings?.facebook_url) && (
                <div className="flex items-center gap-4 pt-2">
                  {settings?.instagram_url && (
                    <a
                      href={settings.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-background/70 hover:text-primary transition-colors hover:scale-110 transform"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-6 h-6" />
                    </a>
                  )}
                  {settings?.facebook_url && (
                    <a
                      href={settings.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-background/70 hover:text-primary transition-colors hover:scale-110 transform"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-6 h-6" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Divider with party theme */}
          <div className="relative py-4 mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-background/20" />
            </div>
            <div className="relative flex justify-center">
              <div className="bg-foreground px-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <Cake className="w-5 h-5 text-secondary" />
                <Star className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-background/60">
              <span>Feito com</span>
              <Heart className="w-4 h-4 fill-primary text-primary animate-pulse" />
              <span>para você</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <p className="text-xs text-background/60">
                {settings?.footer_text || `© ${new Date().getFullYear()} ${businessName}. Todos os direitos reservados.`}
              </p>
              <a 
                href="/admin/login" 
                className="text-xs text-background/40 hover:text-background/60 transition-colors flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                Admin
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
