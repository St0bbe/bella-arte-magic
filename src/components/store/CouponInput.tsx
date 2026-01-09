import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validateCoupon, calculateDiscount, type Coupon } from "@/hooks/useCoupons";

interface CouponInputProps {
  tenantId: string;
  orderTotal: number;
  appliedCoupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon | null) => void;
}

export function CouponInput({ tenantId, orderTotal, appliedCoupon, onApplyCoupon }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    
    setIsValidating(true);
    try {
      const result = await validateCoupon(code, tenantId, orderTotal);
      
      if (result.valid && result.coupon) {
        onApplyCoupon(result.coupon);
        setCode("");
        toast.success("Cupom aplicado com sucesso!");
      } else {
        toast.error(result.error || "Cupom inválido");
      }
    } catch {
      toast.error("Erro ao validar cupom");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    onApplyCoupon(null);
    toast.success("Cupom removido");
  };

  if (appliedCoupon) {
    const discount = calculateDiscount(appliedCoupon, orderTotal);
    
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">{appliedCoupon.code}</Badge>
              <span className="text-sm text-green-700 dark:text-green-300">
                {appliedCoupon.discount_type === "percentage" 
                  ? `${appliedCoupon.discount_value}% de desconto`
                  : `R$ ${appliedCoupon.discount_value.toFixed(2).replace(".", ",")} de desconto`
                }
              </span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              Você economiza R$ {discount.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRemove}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Código do cupom"
            className="pl-10 uppercase"
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={handleApply}
          disabled={isValidating || !code.trim()}
        >
          {isValidating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Aplicar"
          )}
        </Button>
      </div>
    </div>
  );
}
