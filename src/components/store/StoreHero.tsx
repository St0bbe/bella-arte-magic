import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Package, ArrowRight } from "lucide-react";

export function StoreHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-store-cream via-white to-store-rose/10 py-16 md:py-24">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-store-rose/10 blur-2xl" />
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-store-gold/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-store-pink/20 blur-xl" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-store-rose/10 text-store-rose mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Produtos personalizados para sua festa</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-store-text mb-6 leading-tight">
            Transforme sua festa em um momento
            <span className="text-store-rose"> mágico</span>
          </h1>
          
          <p className="text-lg text-store-text/70 mb-8 max-w-2xl mx-auto">
            Convites digitais personalizados, decorações exclusivas e kits festa completos. 
            Tudo feito com carinho para tornar sua celebração inesquecível.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/loja/digitais">
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-store-rose hover:bg-store-rose/90 text-white shadow-lg shadow-store-rose/25">
                <Download className="w-5 h-5" />
                Produtos Digitais
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/loja/fisicos">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 border-store-rose/30 text-store-text hover:bg-store-rose/10 hover:border-store-rose">
                <Package className="w-5 h-5" />
                Produtos Físicos
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-store-rose/10">
            <div>
              <p className="text-3xl font-bold text-store-rose">500+</p>
              <p className="text-sm text-store-text/60">Festas realizadas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-store-rose">4.9</p>
              <p className="text-sm text-store-text/60">Avaliação média</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-store-rose">24h</p>
              <p className="text-sm text-store-text/60">Suporte rápido</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
