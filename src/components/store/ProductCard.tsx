import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Download, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import type { Product } from "@/hooks/useProducts";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
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
      className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isDigital && (
            <Badge className="bg-blue-500 hover:bg-blue-600">
              <Download className="w-3 h-3 mr-1" />
              Digital
            </Badge>
          )}
          {hasDiscount && (
            <Badge variant="destructive">
              -{discountPercent}%
            </Badge>
          )}
          {product.is_featured && (
            <Badge className="bg-amber-500 hover:bg-amber-600">
              Destaque
            </Badge>
          )}
        </div>

        {/* Out of stock overlay */}
        {!isDigital && product.stock_quantity <= 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Esgotado</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          {product.subcategory && (
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {product.subcategory}
            </span>
          )}
          
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                R$ {product.compare_at_price!.toFixed(2).replace(".", ",")}
              </span>
            )}
          </div>

          <Button 
            className="w-full mt-2 gap-2" 
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
