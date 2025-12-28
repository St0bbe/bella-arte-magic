import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { ServicesCarousel } from "@/components/ServicesCarousel";
import { Gallery } from "@/components/Gallery";
import { BudgetCalculator } from "@/components/BudgetCalculator";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { ServiceAreaMap } from "@/components/ServiceAreaMap";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useTenant } from "@/contexts/TenantContext";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";
import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { MagicCursor, defaultSettings, EffectType, MagicCursorSettings } from "@/components/admin/MagicCursor";
import { PartyBackground as AdminPartyBackground, defaultBackgroundSettings, BackgroundEffectType, PartyBackgroundSettings } from "@/components/admin/PartyBackground";
import { useMemo } from "react";

const Index = () => {
  const { tenant, isLoading } = useTenant();
  const { data: settings } = useSiteSettings();

  // Parse effect settings
  const { cursorEffect, cursorSettings, bgEffect, bgSettings } = useMemo(() => {
    let cursorEffect: EffectType = "none";
    let cursorSettings: MagicCursorSettings = defaultSettings;
    let bgEffect: BackgroundEffectType = "none";
    let bgSettings: PartyBackgroundSettings = defaultBackgroundSettings;

    if (settings) {
      if (settings.cursor_effect) {
        cursorEffect = settings.cursor_effect as EffectType;
      }
      if (settings.cursor_settings) {
        try { cursorSettings = JSON.parse(settings.cursor_settings); } catch {}
      }
      if (settings.background_effect) {
        bgEffect = settings.background_effect as BackgroundEffectType;
      }
      if (settings.background_settings) {
        try { bgSettings = JSON.parse(settings.background_settings); } catch {}
      }
    }

    return { cursorEffect, cursorSettings, bgEffect, bgSettings };
  }, [settings]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🎈</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Site não encontrado</h1>
          <p className="text-muted-foreground">O site que você procura não existe ou está desativado.</p>
        </div>
      </div>
    );
  }

  return (
    <TenantThemeProvider>
      <Helmet>
        <title>{tenant.name} - Decoração de Festas</title>
        <meta name="description" content={`${tenant.name} - Decoração de festas infantis e locação de brinquedos. Transforme sua festa em uma obra de arte!`} />
        <meta property="og:title" content={`${tenant.name} - Decoração de Festas`} />
        <meta property="og:description" content={`${tenant.name} - Decoração de festas infantis e locação de brinquedos.`} />
      </Helmet>
      <div className="min-h-screen relative">
        {/* Custom Background Effect from Admin */}
        <AdminPartyBackground effect={bgEffect} settings={bgSettings} />
        
        {/* Custom Cursor Effect from Admin */}
        <MagicCursor effect={cursorEffect} settings={cursorSettings} />
        
        <div className="relative z-10">
          <Header />
          <Hero />
          <Services />
          <ServicesCarousel />
          <Gallery />
          <BudgetCalculator />
          <About />
          <Contact />
          <ServiceAreaMap />
          <Footer />
        </div>
        <WhatsAppButton />
      </div>
    </TenantThemeProvider>
  );
};

export default Index;
