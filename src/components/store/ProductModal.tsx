import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Download, Package, Minus, Plus, Star } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import type { Product } from "@/hooks/useProducts";
import { ProductReviews } from "./ProductReviews";
import { useProductAverageRating } from "@/hooks/useProductReviews";

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductModal({ product, open, onOpenChange }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { data: ratingData } = useProductAverageRating(product?.id || "");

  if (!product) return null;

  const isDigital = product.category === "digital";
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!isDigital && product.stock_quantity <= 0) {
      toast.error("Produto esgotado");
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        is_digital: isDigital,
      });
    }
    toast.success(`${quantity}x ${product.name} adicionado ao carrinho!`);
    setQuantity(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {isDigital && (
                <Badge className="bg-blue-500 hover:bg-blue-600">
                  <Download className="w-3 h-3 mr-1" />Digital
                </Badge>
              )}
              {hasDiscount && <Badge variant="destructive">-{discountPercent}% OFF</Badge>}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {product.subcategory && (
              <span className="text-sm text-muted-foreground uppercase tracking-wide">{product.subcategory}</span>
            )}
            <h2 className="text-2xl font-bold">{product.name}</h2>
            
            {ratingData && ratingData.count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(ratingData.average) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({ratingData.count})</span>
              </div>
            )}
            
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">R$ {product.price.toFixed(2).replace(".", ",")}</span>
              {hasDiscount && <span className="text-lg text-muted-foreground line-through">R$ {product.compare_at_price!.toFixed(2).replace(".", ",")}</span>}
            </div>

            {product.description && <p className="text-muted-foreground leading-relaxed">{product.description}</p>}

            {!isDigital && (
              <div className="flex items-center gap-2">
                {product.stock_quantity > 0 ? (
                  <><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-sm text-muted-foreground">{product.stock_quantity} em estoque</span></>
                ) : (
                  <><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-sm text-destructive">Esgotado</span></>
                )}
              </div>
            )}

            {(isDigital || product.stock_quantity > 0) && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantidade:</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}><Minus className="w-4 h-4" /></Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)} disabled={!isDigital && quantity >= product.stock_quantity}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            )}

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total:</span>
                <span className="text-2xl font-bold text-primary">R$ {(product.price * quantity).toFixed(2).replace(".", ",")}</span>
              </div>
            </div>

            <Button className="w-full gap-2" size="lg" onClick={handleAddToCart} disabled={!isDigital && product.stock_quantity <= 0}>
              <ShoppingCart className="w-5 h-5" />Adicionar ao Carrinho
            </Button>
          </div>
        </div>

        <Separator className="my-6" />
        <ProductReviews productId={product.id} />
      </DialogContent>
    </Dialog>
  );
}
