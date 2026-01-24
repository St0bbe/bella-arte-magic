import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useProducts } from "@/hooks/useProducts";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreFAQ } from "@/components/store/StoreFAQ";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { ProductModal } from "@/components/store/ProductModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Search, Package, SlidersHorizontal, X, ArrowUpDown,
  Truck, Shield, Gift
} from "lucide-react";
import type { Product } from "@/hooks/useProducts";

const SUBCATEGORIES = [
  "Decoração",
  "Topos de Bolo",
  "Kits Festa",
  "Balões",
  "Lembrancinhas",
  "Personalizados",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mais recentes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "name_asc", label: "A-Z" },
];

export default function StorePhysical() {
  const [search, setSearch] = useState("");
  const [activeSubcategories, setActiveSubcategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useProducts("physical");

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    if (activeSubcategories.length > 0) {
      filtered = filtered.filter((p) =>
        activeSubcategories.includes(p.subcategory || "")
      );
    }

    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    switch (sortBy) {
      case "price_asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name_asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return filtered;
  }, [products, search, activeSubcategories, priceRange, sortBy]);

  const toggleSubcategory = (sub: string) => {
    setActiveSubcategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setActiveSubcategories([]);
    setPriceRange([0, 500]);
    setSortBy("newest");
  };

  const hasActiveFilters =
    search ||
    activeSubcategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 500;

  return (
    <>
      <Helmet>
        <title>Produtos Físicos para Festas | Loja Bella Arte</title>
        <meta
          name="description"
          content="Decorações, kits festa, topos de bolo e itens personalizados para sua celebração. Entrega para todo o Brasil."
        />
      </Helmet>

      <StoreHeader />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-store-rose/10 via-white to-store-cream/30 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-store-rose/10 text-store-rose mb-4">
                <Package className="w-4 h-4" />
                <span className="text-sm font-medium">Produtos Físicos</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-store-text mb-4">
                Decorações & Personalizados
              </h1>
              <p className="text-store-text/70 mb-6">
                Topos de bolo, decorações exclusivas, kits festa completos e muito mais 
                para transformar sua celebração em um momento mágico.
              </p>
              
              {/* Info Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-store-rose/20 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-store-rose/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-store-rose" />
                  </div>
                  <div>
                    <p className="font-semibold text-store-text text-sm">Entrega Nacional</p>
                    <p className="text-xs text-store-text/60">Para todo o Brasil</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-store-rose/20 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-store-rose/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-store-rose" />
                  </div>
                  <div>
                    <p className="font-semibold text-store-text text-sm">Garantia de Qualidade</p>
                    <p className="text-xs text-store-text/60">Produtos selecionados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-store-rose/20 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-store-rose/10 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-store-rose" />
                  </div>
                  <div>
                    <p className="font-semibold text-store-text text-sm">Embalagem Especial</p>
                    <p className="text-xs text-store-text/60">Enviado com cuidado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-store-text/40" />
                <Input
                  placeholder="Buscar produtos físicos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 rounded-full border-store-rose/30"
                />
              </div>

              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-12 rounded-full border-store-rose/30">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="h-12 rounded-full border-store-rose/30 md:hidden">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filtros
                      {hasActiveFilters && (
                        <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-store-rose">
                          !
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="py-6 space-y-6">
                      <FilterContent
                        activeSubcategories={activeSubcategories}
                        toggleSubcategory={toggleSubcategory}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-store-text/60">Filtros ativos:</span>
                {activeSubcategories.map((sub) => (
                  <Badge key={sub} variant="secondary" className="gap-1 bg-store-rose/10 text-store-rose">
                    {sub}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => toggleSubcategory(sub)}
                    />
                  </Badge>
                ))}
                {(priceRange[0] > 0 || priceRange[1] < 500) && (
                  <Badge variant="secondary" className="gap-1 bg-store-rose/10 text-store-rose">
                    R$ {priceRange[0]} - R$ {priceRange[1]}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setPriceRange([0, 500])}
                    />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-store-rose">
                  Limpar todos
                </Button>
              </div>
            )}

            {/* Main Content */}
            <div className="flex gap-8">
              {/* Desktop Sidebar */}
              <aside className="hidden md:block w-64 flex-shrink-0">
                <div className="sticky top-24 space-y-6 bg-store-cream/30 rounded-2xl p-6 border border-store-rose/10">
                  <FilterContent
                    activeSubcategories={activeSubcategories}
                    toggleSubcategory={toggleSubcategory}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                  />
                </div>
              </aside>

              {/* Products Grid */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-store-text/60">
                    {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="aspect-square w-full rounded-xl" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <p className="text-store-text/60">Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

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

interface FilterContentProps {
  activeSubcategories: string[];
  toggleSubcategory: (sub: string) => void;
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
}

function FilterContent({
  activeSubcategories,
  toggleSubcategory,
  priceRange,
  setPriceRange,
}: FilterContentProps) {
  return (
    <>
      <div>
        <h3 className="font-semibold text-store-text mb-3">Categoria</h3>
        <div className="space-y-2">
          {SUBCATEGORIES.map((sub) => (
            <Button
              key={sub}
              variant={activeSubcategories.includes(sub) ? "default" : "ghost"}
              className={`w-full justify-start text-sm ${
                activeSubcategories.includes(sub) 
                  ? "bg-store-rose text-white hover:bg-store-rose/90" 
                  : "text-store-text hover:bg-store-rose/10"
              }`}
              onClick={() => toggleSubcategory(sub)}
            >
              {sub}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-store-text mb-3">Faixa de Preço</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={500}
            step={10}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-store-text/60">
            <span>R$ {priceRange[0]}</span>
            <span>R$ {priceRange[1]}</span>
          </div>
        </div>
      </div>
    </>
  );
}
