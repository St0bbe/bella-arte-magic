import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, CreditCard, Package, Download, 
  ArrowLeft, Loader2, CheckCircle, Truck, Palette
} from "lucide-react";
import { toast } from "sonner";
import { CouponInput } from "@/components/store/CouponInput";
import { ShippingCalculator } from "@/components/store/ShippingCalculator";
import { calculateDiscount, type Coupon } from "@/hooks/useCoupons";
import { DigitalCustomizationForm } from "@/components/store/DigitalCustomizationForm";

interface CustomizationData {
  [key: string]: string | undefined;
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<{ price: number; service_name: string } | null>(null);
  const [customizationData, setCustomizationData] = useState<Record<string, CustomizationData>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });

  const hasPhysicalProducts = items.some((item) => !item.is_digital);
  const hasDigitalProducts = items.some((item) => item.is_digital);
  const digitalItems = items.filter((item) => item.is_digital);

  const discount = appliedCoupon ? calculateDiscount(appliedCoupon, totalPrice) : 0;
  const shippingCost = hasPhysicalProducts && selectedShipping ? selectedShipping.price : 0;
  const finalTotal = totalPrice - discount + shippingCost;

  const handleCustomizationChange = (itemId: string, data: CustomizationData) => {
    setCustomizationData(prev => ({
      ...prev,
      [itemId]: data
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }

    if (!formData.name || !formData.email) {
      toast.error("Preencha nome e email");
      return;
    }

    if (hasPhysicalProducts && (!formData.address || !formData.city || !formData.state || !formData.zip)) {
      toast.error("Preencha o endereço de entrega");
      return;
    }

    if (hasPhysicalProducts && !selectedShipping) {
      toast.error("Selecione uma opção de frete");
      return;
    }

    setIsLoading(true);

    try {
      // Call edge function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke("create-product-checkout", {
        body: {
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            is_digital: item.is_digital,
            customization_data: item.is_digital ? customizationData[item.id] || null : null,
          })),
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
          shipping: hasPhysicalProducts
            ? {
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zip: formData.zip,
              }
            : null,
          notes: formData.notes,
          tenant_id: tenant?.id,
          coupon: appliedCoupon ? {
            id: appliedCoupon.id,
            code: appliedCoupon.code,
            discount_type: appliedCoupon.discount_type,
            discount_value: appliedCoupon.discount_value,
          } : null,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Helmet>
          <title>Checkout | Bella Arte</title>
        </Helmet>
        <Header />
        <main className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Carrinho vazio</h1>
              <p className="text-muted-foreground mb-6">
                Adicione produtos ao carrinho para continuar
              </p>
              <Button onClick={() => navigate("/loja")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para a Loja
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout | Bella Arte</title>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/loja")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a Loja
          </Button>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Dados do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo *</Label>
                        <Input
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>

                    {hasPhysicalProducts && (
                      <>
                        <Separator className="my-6" />
                        <div className="flex items-center gap-2 mb-4">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Endereço de entrega (para produtos físicos)
                          </span>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Endereço *</Label>
                          <Input
                            id="address"
                            required={hasPhysicalProducts}
                            value={formData.address}
                            onChange={(e) =>
                              setFormData({ ...formData, address: e.target.value })
                            }
                          />
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">Cidade *</Label>
                            <Input
                              id="city"
                              required={hasPhysicalProducts}
                              value={formData.city}
                              onChange={(e) =>
                                setFormData({ ...formData, city: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">Estado *</Label>
                            <Input
                              id="state"
                              required={hasPhysicalProducts}
                              value={formData.state}
                              onChange={(e) =>
                                setFormData({ ...formData, state: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zip">CEP *</Label>
                            <Input
                              id="zip"
                              required={hasPhysicalProducts}
                              value={formData.zip}
                              onChange={(e) =>
                                setFormData({ ...formData, zip: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        {/* Shipping Calculator */}
                        <Separator className="my-4" />
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Calcular Frete</span>
                          </div>
                          <ShippingCalculator
                            orderTotal={totalPrice - discount}
                            freeShippingThreshold={200}
                            onSelectShipping={(option) => 
                              setSelectedShipping(option ? { price: option.price, service_name: option.service_name } : null)
                            }
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        placeholder="Instruções especiais para o pedido..."
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pagar R$ {finalTotal.toFixed(2).replace(".", ",")}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {hasDigitalProducts && (
                <div className="space-y-4">
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="pt-6">
                      <div className="flex gap-3">
                        <Palette className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">
                            Produtos Digitais Personalizados
                          </h4>
                          <p className="text-sm text-blue-700">
                            Preencha as informações abaixo para personalizarmos seus produtos. Prazo de 3 dias úteis após o pagamento.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {digitalItems.map((item) => (
                    <DigitalCustomizationForm
                      key={item.id}
                      productName={item.name}
                      productCategory={item.name}
                      onDataChange={(data) => handleCustomizationChange(item.id, data)}
                      initialData={customizationData[item.id]}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Resumo do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm line-clamp-1">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {item.is_digital ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Download className="w-3 h-3 mr-1" />
                                  Digital
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <Package className="w-3 h-3 mr-1" />
                                  Físico
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Qtd: {item.quantity}
                              </span>
                            </div>
                          </div>
                          <span className="font-medium text-sm">
                            R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  {/* Coupon Input */}
                  {tenant?.id && (
                    <CouponInput
                      tenantId={tenant.id}
                      orderTotal={totalPrice}
                      appliedCoupon={appliedCoupon}
                      onApplyCoupon={setAppliedCoupon}
                    />
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto ({appliedCoupon?.code})</span>
                        <span>-R$ {discount.toFixed(2).replace(".", ",")}</span>
                      </div>
                    )}
                    {hasPhysicalProducts && selectedShipping && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frete ({selectedShipping.service_name})</span>
                        <span className={selectedShipping.price === 0 ? "text-green-600" : ""}>
                          {selectedShipping.price === 0 ? "Grátis" : `R$ ${selectedShipping.price.toFixed(2).replace(".", ",")}`}
                        </span>
                      </div>
                    )}
                    {hasPhysicalProducts && !selectedShipping && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frete</span>
                        <span className="text-amber-600">Calcule acima</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">
                      R$ {finalTotal.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Pagamento seguro via Stripe
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
