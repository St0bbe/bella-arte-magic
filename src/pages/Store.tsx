import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/store/ProductGrid";
import { CartDrawer } from "@/components/store/CartDrawer";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Search, Filter, ShoppingBag, Package, Download, 
  SlidersHorizontal, X, ArrowUpDown
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "Todos", icon: ShoppingBag },
  { id: "physical", label: "Produtos Físicos", icon: Package },
  { id: "digital", label: "Produtos Digitais", icon: Download },
];

const SUBCATEGORIES = [
  "Temas de Festa",
  "Topos de Bolo",
  "Kits Digitais",
  "Convites",
  "Decoração",
  "Lembrancinhas",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mais recentes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "name_asc", label: "A-Z" },
];

export default function Store() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSubcategories, setActiveSubcategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState("newest");

  const { data: products, isLoading } = useProducts(
    activeCategory === "all" ? undefined : activeCategory
  );

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    // Subcategory filter
    if (activeSubcategories.length > 0) {
      filtered = filtered.filter((p) =>
        activeSubcategories.includes(p.subcategory || "")
      );
    }

    // Price filter
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Sorting
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
      case "newest":
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
    setActiveCategory("all");
    setActiveSubcategories([]);
    setPriceRange([0, 500]);
    setSortBy("newest");
  };

  const hasActiveFilters =
    search ||
    activeCategory !== "all" ||
    activeSubcategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 500;

  return (
    <>
      <Helmet>
        <title>Loja - Produtos para Festa | Bella Arte</title>
        <meta
          name="description"
          content="Encontre temas de festa, topos de bolo, kits digitais e muito mais para tornar sua celebração inesquecível!"
        />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Loja Online</h1>
              <p className="text-muted-foreground">
                {filteredProducts.length} produto
                {filteredProducts.length !== 1 ? "s" : ""} encontrado
                {filteredProducts.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <CartDrawer />
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
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

              {/* Mobile Filter Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filtros
                    {hasActiveFilters && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
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
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
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
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {activeCategory !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setActiveCategory("all")}
                  />
                </Badge>
              )}
              {activeSubcategories.map((sub) => (
                <Badge key={sub} variant="secondary" className="gap-1">
                  {sub}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => toggleSubcategory(sub)}
                  />
                </Badge>
              ))}
              {(priceRange[0] > 0 || priceRange[1] < 500) && (
                <Badge variant="secondary" className="gap-1">
                  R$ {priceRange[0]} - R$ {priceRange[1]}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setPriceRange([0, 500])}
                  />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar todos
              </Button>
            </div>
          )}

          {/* Main Content */}
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                <FilterContent
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  activeSubcategories={activeSubcategories}
                  toggleSubcategory={toggleSubcategory}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                />
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              <ProductGrid products={filteredProducts} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

interface FilterContentProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  activeSubcategories: string[];
  toggleSubcategory: (sub: string) => void;
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
}

function FilterContent({
  activeCategory,
  setActiveCategory,
  activeSubcategories,
  toggleSubcategory,
  priceRange,
  setPriceRange,
}: FilterContentProps) {
  return (
    <>
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categorias</h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveCategory(cat.id)}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Subcategories */}
      <div>
        <h3 className="font-semibold mb-3">Tipo de Produto</h3>
        <div className="space-y-2">
          {SUBCATEGORIES.map((sub) => (
            <Button
              key={sub}
              variant={activeSubcategories.includes(sub) ? "default" : "ghost"}
              className="w-full justify-start text-sm"
              onClick={() => toggleSubcategory(sub)}
            >
              {sub}
            </Button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Faixa de Preço</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={500}
            step={10}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>R$ {priceRange[0]}</span>
            <span>R$ {priceRange[1]}</span>
          </div>
        </div>
      </div>
    </>
  );
}
