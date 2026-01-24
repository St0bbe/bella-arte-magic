import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useProducts, useFeaturedProducts } from "@/hooks/useProducts";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreHero } from "@/components/store/StoreHero";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreFAQ } from "@/components/store/StoreFAQ";
import { TrustBadges } from "@/components/store/TrustBadges";
import { CustomerTestimonials } from "@/components/store/CustomerTestimonials";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { ProductModal } from "@/components/store/ProductModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, ShoppingBag, Package, Download, Sparkles, ArrowRight 
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "@/hooks/useProducts";

export default function Store() {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: allProducts, isLoading } = useProducts();
  const { data: featuredProducts, isLoading: loadingFeatured } = useFeaturedProducts();
  const { data: digitalProducts } = useProducts("digital");
  const { data: physicalProducts } = useProducts("physical");

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    if (!search) return allProducts;
    
    const searchLower = search.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
    );
  }, [allProducts, search]);

  return (
    <>
      <Helmet>
        <title>Loja Bella Arte - Produtos Personalizados para Festas</title>
        <meta
          name="description"
          content="Convites digitais personalizados, decorações exclusivas e kits festa completos. Produtos feitos com carinho para tornar sua celebração inesquecível."
        />
      </Helmet>

      <StoreHeader />

      <main className="min-h-screen bg-white">
        <StoreHero />

        {/* Trust Badges */}
        <section className="py-12 bg-white border-b border-store-rose/10">
          <div className="container mx-auto px-4">
            <TrustBadges />
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts && featuredProducts.length > 0 && (
          <section className="py-16 bg-gradient-to-b from-white to-store-cream/20">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-store-gold" />
                    <span className="text-sm font-medium text-store-gold uppercase tracking-wider">
                      Destaques
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-store-text">
                    Mais Vendidos
                  </h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {loadingFeatured ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square w-full rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))
                ) : (
                  featuredProducts.slice(0, 4).map((product) => (
                    <StoreProductCard
                      key={product.id}
                      product={product}
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* Category Sections */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {/* Search */}
            <div className="max-w-xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-store-text/40" />
                <Input
                  placeholder="Buscar produtos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 text-base rounded-full border-store-rose/30 focus:border-store-rose focus:ring-store-rose/20"
                />
              </div>
            </div>

            {search ? (
              // Search Results
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-serif font-bold text-store-text">
                    Resultados da busca
                  </h2>
                  <Badge variant="secondary" className="bg-store-rose/10 text-store-rose">
                    {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                      <StoreProductCard
                        key={product.id}
                        product={product}
                        onClick={() => setSelectedProduct(product)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-store-text/60">Nenhum produto encontrado para "{search}"</p>
                  </div>
                )}
              </div>
            ) : (
              // Category Tabs
              <Tabs defaultValue="all" className="w-full">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-store-text">
                    Nossos Produtos
                  </h2>
                  <TabsList className="h-auto p-1 bg-store-cream/50 rounded-full">
                    <TabsTrigger 
                      value="all"
                      className="rounded-full px-6 py-2.5 data-[state=active]:bg-store-rose data-[state=active]:text-white"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Todos
                    </TabsTrigger>
                    <TabsTrigger 
                      value="digital"
                      className="rounded-full px-6 py-2.5 data-[state=active]:bg-store-rose data-[state=active]:text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Digitais
                    </TabsTrigger>
                    <TabsTrigger 
                      value="physical"
                      className="rounded-full px-6 py-2.5 data-[state=active]:bg-store-rose data-[state=active]:text-white"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Físicos
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="all">
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                          <Skeleton className="aspect-square w-full rounded-xl" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : allProducts && allProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {allProducts.slice(0, 8).map((product) => (
                        <StoreProductCard
                          key={product.id}
                          product={product}
                          onClick={() => setSelectedProduct(product)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-store-text/60">Nenhum produto disponível</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="digital">
                  {digitalProducts && digitalProducts.length > 0 ? (
                    <>
                      {/* Digital Products Notice */}
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Download className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-blue-900 mb-1">
                              Produtos Digitais Personalizados
                            </h3>
                            <p className="text-sm text-blue-700">
                              Após a compra, nossa equipe irá personalizar sua arte em até <strong>3 dias úteis</strong>. 
                              Você receberá o arquivo PDF de alta qualidade por email ou WhatsApp.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {digitalProducts.slice(0, 8).map((product) => (
                          <StoreProductCard
                            key={product.id}
                            product={product}
                            onClick={() => setSelectedProduct(product)}
                          />
                        ))}
                      </div>
                      
                      {digitalProducts.length > 8 && (
                        <div className="text-center mt-8">
                          <Link to="/loja/digitais">
                            <Button 
                              size="lg" 
                              variant="outline"
                              className="gap-2 border-store-rose/30 text-store-text hover:bg-store-rose/10"
                            >
                              Ver todos os produtos digitais
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-store-text/60">Nenhum produto digital disponível</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="physical">
                  {physicalProducts && physicalProducts.length > 0 ? (
                    <>
                      {/* Physical Products Notice */}
                      <div className="bg-store-rose/5 border border-store-rose/20 rounded-2xl p-6 mb-8">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-store-rose/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-6 h-6 text-store-rose" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-store-text mb-1">
                              Produtos Físicos
                            </h3>
                            <p className="text-sm text-store-text/70">
                              Decorações, kits festa e itens personalizados. O prazo de entrega 
                              varia de acordo com sua região. Frete calculado no checkout.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {physicalProducts.slice(0, 8).map((product) => (
                          <StoreProductCard
                            key={product.id}
                            product={product}
                            onClick={() => setSelectedProduct(product)}
                          />
                        ))}
                      </div>
                      
                      {physicalProducts.length > 8 && (
                        <div className="text-center mt-8">
                          <Link to="/loja/fisicos">
                            <Button 
                              size="lg" 
                              variant="outline"
                              className="gap-2 border-store-rose/30 text-store-text hover:bg-store-rose/10"
                            >
                              Ver todos os produtos físicos
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-store-text/60">Nenhum produto físico disponível</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </section>

        {/* Customer Testimonials */}
        <CustomerTestimonials />

        <StoreFAQ />
      </main>

      <StoreFooter />

      <ProductModal
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />
    </>
  );
}
