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

const Index = () => {
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
