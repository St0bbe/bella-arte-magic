import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Loader2, Package, Zap } from "lucide-react";
import { toast } from "sonner";

interface ShippingOption {
  service_code: string;
  service_name: string;
  price: number;
  delivery_days: number;
  delivery_range: { min: number; max: number };
  carrier?: string;
  carrier_logo?: string;
}

interface ShippingCalculatorProps {
  originZip?: string;
  totalWeight?: number; // in grams
  orderTotal: number;
  freeShippingThreshold?: number;
  onSelectShipping?: (option: ShippingOption | null) => void;
}

export function ShippingCalculator({
  originZip = "01310100", // Default São Paulo
  totalWeight = 500,
  orderTotal,
  freeShippingThreshold = 200,
  onSelectShipping,
}: ShippingCalculatorProps) {
  const [destinationZip, setDestinationZip] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const formatZip = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    if (numbers.length > 5) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    }
    return numbers;
  };

  const handleCalculate = async () => {
    const cleanZip = destinationZip.replace(/\D/g, "");
    if (cleanZip.length !== 8) {
      toast.error("Digite um CEP válido com 8 dígitos");
      return;
    }

    setIsCalculating(true);
    setOptions([]);
    setSelectedOption(null);

    try {
      const { data, error } = await supabase.functions.invoke("calculate-shipping", {
        body: {
          origin_zip: originZip,
          destination_zip: cleanZip,
          weight: totalWeight,
          length: 30,
          width: 20,
          height: 10,
        },
      });

      if (error) throw error;

      if (data?.success && data.options) {
        // Filter free shipping based on order total
        let filteredOptions = data.options.filter((opt: ShippingOption) => {
          if (opt.service_code === "FREE") {
            return orderTotal >= freeShippingThreshold;
          }
          return true;
        });

        setOptions(filteredOptions);
        
        // Auto-select free shipping if available
        const freeOption = filteredOptions.find((o: ShippingOption) => o.service_code === "FREE");
        if (freeOption) {
          setSelectedOption("FREE");
          onSelectShipping?.(freeOption);
        }
      } else {
        throw new Error(data?.error || "Erro ao calcular frete");
      }
    } catch (error) {
      console.error("Shipping error:", error);
      toast.error("Erro ao calcular frete. Tente novamente.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSelectOption = (code: string) => {
    setSelectedOption(code);
    const option = options.find(o => o.service_code === code);
    onSelectShipping?.(option || null);
  };

  const getIcon = (code: string) => {
    switch (code) {
      case "SEDEX":
      case "EXPRESSA":
        return <Zap className="w-4 h-4" />;
      case "FREE":
        return <Package className="w-4 h-4 text-green-600" />;
      default:
        return <Truck className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="shipping-zip" className="sr-only">CEP</Label>
          <Input
            id="shipping-zip"
            placeholder="Digite seu CEP"
            value={destinationZip}
            onChange={(e) => setDestinationZip(formatZip(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleCalculate}
          disabled={isCalculating || destinationZip.replace(/\D/g, "").length !== 8}
        >
          {isCalculating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Calcular"
          )}
        </Button>
      </div>

      {orderTotal < freeShippingThreshold && (
        <p className="text-xs text-muted-foreground">
          Frete grátis para compras acima de R$ {freeShippingThreshold.toFixed(2).replace(".", ",")}
        </p>
      )}

      {options.length > 0 && (
        <RadioGroup
          value={selectedOption || ""}
          onValueChange={handleSelectOption}
          className="space-y-2"
        >
          {options.map((option) => (
            <Card
              key={option.service_code}
              className={`cursor-pointer transition-all ${
                selectedOption === option.service_code
                  ? "ring-2 ring-primary border-primary"
                  : "hover:border-primary/50"
              } ${option.service_code === "FREE" ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : ""}`}
              onClick={() => handleSelectOption(option.service_code)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={option.service_code} id={option.service_code} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getIcon(option.service_code)}
                      <span className="font-medium text-sm">{option.service_name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {option.delivery_range.min === option.delivery_range.max
                        ? `Entrega em ${option.delivery_range.min} dia${option.delivery_range.min > 1 ? "s" : ""}`
                        : `Entrega em ${option.delivery_range.min}-${option.delivery_range.max} dias úteis`
                      }
                    </p>
                  </div>
                  <span className={`font-bold ${option.price === 0 ? "text-green-600" : "text-primary"}`}>
                    {option.price === 0 ? "Grátis" : `R$ ${option.price.toFixed(2).replace(".", ",")}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      )}

      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline inline-block"
      >
        Não sei meu CEP
      </a>
    </div>
  );
}
