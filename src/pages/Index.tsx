import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { ServicesCarousel } from "@/components/ServicesCarousel";
import { Gallery } from "@/components/Gallery";
import { BudgetCalculator } from "@/components/BudgetCalculator";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PartyBackground } from "@/components/PartyBackground";
import { useTenant } from "@/contexts/TenantContext";

const Index = () => {
  const { slug } = useParams<{ slug: string }>();
  const { tenant, isLoading, setTenantBySlug } = useTenant();

  useEffect(() => {
    if (slug) {
      setTenantBySlug(slug);
    }
  }, [slug, setTenantBySlug]);

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
    <div className="min-h-screen relative">
      <PartyBackground />
      <div className="relative z-10">
        <Header />
        <Hero />
        <Services />
        <ServicesCarousel />
        <Gallery />
        <BudgetCalculator />
        <About />
        <Contact />
        <Footer />
      </div>
      <WhatsAppButton />
    </div>
  );
};

export default Index;
