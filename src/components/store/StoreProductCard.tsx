import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Download, Package, Clock, Eye, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import type { Product } from "@/hooks/useProducts";

interface StoreProductCardProps {
  product: Product;
  onClick?: () => void;
}

export function StoreProductCard({ product, onClick }: StoreProductCardProps) {
  const { addItem } = useCart();

  const isDigital = product.category === "digital";
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isDigital && product.stock_quantity <= 0) {
      toast.error("Produto esgotado");
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      is_digital: isDigital,
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  return (
    <Card 
      className="group overflow-hidden cursor-pointer bg-white border-store-rose/10 hover:border-store-rose/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-store-cream/30">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-store-cream to-store-rose/10">
            <Package className="w-16 h-16 text-store-rose/40" />
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick view button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white/90 hover:bg-white text-store-text gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <Eye className="w-4 h-4" />
            Ver Detalhes
          </Button>
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isDigital && (
            <Badge className="bg-blue-500 hover:bg-blue-600 shadow-lg">
              <Download className="w-3 h-3 mr-1" />
              Digital
            </Badge>
          )}
          {!isDigital && (
            <Badge className="bg-store-rose hover:bg-store-rose/90 shadow-lg">
              <Package className="w-3 h-3 mr-1" />
              Físico
            </Badge>
          )}
          {hasDiscount && (
            <Badge variant="destructive" className="shadow-lg">
              -{discountPercent}%
            </Badge>
          )}
          {product.is_featured && (
            <Badge className="bg-store-gold hover:bg-store-gold/90 shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" />
              Destaque
            </Badge>
          )}
        </div>

        {/* Out of stock overlay */}
        {!isDigital && product.stock_quantity <= 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-lg bg-red-500 px-4 py-2 rounded-full">
              Esgotado
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          {product.subcategory && (
            <span className="text-xs text-store-rose uppercase tracking-wider font-medium">
              {product.subcategory}
            </span>
          )}
          
          <h3 className="font-serif font-semibold text-lg text-store-text line-clamp-2 group-hover:text-store-rose transition-colors">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-sm text-store-text/60 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Digital product notice */}
          {isDigital && (
            <div className="flex items-center gap-1.5 text-xs text-store-text/60 bg-store-cream/50 px-2 py-1.5 rounded-md">
              <Clock className="w-3.5 h-3.5 text-store-rose" />
              <span>Prazo: 3 dias úteis</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xl font-bold text-store-rose">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </span>
            {hasDiscount && (
              <span className="text-sm text-store-text/40 line-through">
                R$ {product.compare_at_price!.toFixed(2).replace(".", ",")}
              </span>
            )}
          </div>

          <Button 
            className="w-full gap-2 bg-store-rose hover:bg-store-rose/90 text-white" 
            onClick={handleAddToCart}
            disabled={!isDigital && product.stock_quantity <= 0}
          >
            <ShoppingCart className="w-4 h-4" />
            Adicionar ao Carrinho
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
