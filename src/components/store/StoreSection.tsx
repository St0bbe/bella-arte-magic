import { useState } from "react";
import { useProducts, useFeaturedProducts } from "@/hooks/useProducts";
import { ProductGrid } from "./ProductGrid";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Package, Download, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  { id: "all", label: "Todos", icon: ShoppingBag },
  { id: "physical", label: "Físicos", icon: Package },
  { id: "digital", label: "Digitais", icon: Download },
];

export function StoreSection() {
  const [activeCategory, setActiveCategory] = useState("all");
  const navigate = useNavigate();

  const { data: allProducts, isLoading: loadingAll } = useProducts();
  const { data: featuredProducts, isLoading: loadingFeatured } = useFeaturedProducts();
  const { data: physicalProducts, isLoading: loadingPhysical } = useProducts("physical");
  const { data: digitalProducts, isLoading: loadingDigital } = useProducts("digital");

  const getProducts = () => {
    switch (activeCategory) {
      case "physical":
        return { products: physicalProducts || [], loading: loadingPhysical };
      case "digital":
        return { products: digitalProducts || [], loading: loadingDigital };
      default:
        return { products: allProducts || [], loading: loadingAll };
    }
  };

  const { products, loading } = getProducts();

  return (
    <section id="loja" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm font-medium">Loja Online</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Produtos para sua Festa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Encontre temas de festa, topos de bolo, kits digitais e muito mais para tornar sua celebração inesquecível!
          </p>
        </div>

        {/* Featured Products */}
        {featuredProducts && featuredProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-xl font-semibold">Destaques</h3>
              </div>
              <Button variant="ghost" onClick={() => navigate("/loja")} className="gap-2">
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <ProductGrid 
              products={featuredProducts.slice(0, 4)} 
              isLoading={loadingFeatured} 
            />
          </div>
        )}

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="flex justify-center mb-8 h-auto p-1 bg-muted/50">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="flex items-center gap-2 px-6 py-3 data-[state=active]:bg-background"
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id}>
              <ProductGrid 
                products={products.slice(0, 8)} 
                isLoading={loading} 
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* View All Button */}
        {products.length > 8 && (
          <div className="text-center mt-8">
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/loja")}
              className="gap-2"
            >
              Ver todos os produtos
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
