import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Package, Download, ArrowRight, ShoppingBag } from "lucide-react";
import { ConfettiEffect } from "@/components/ConfettiEffect";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart, items } = useCart();
  const [showConfetti, setShowConfetti] = useState(true);
  
  const sessionId = searchParams.get("session_id");
  const hasDigital = items.some((item) => item.is_digital);
  const hasPhysical = items.some((item) => !item.is_digital);

  useEffect(() => {
    // Clear cart after successful purchase
    if (sessionId) {
      clearCart();
    }

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [sessionId, clearCart]);

  return (
    <>
      <Helmet>
        <title>Pedido Confirmado! | Bella Arte</title>
      </Helmet>

      {showConfetti && <ConfettiEffect trigger={true} />}

      <Header />

      <main className="min-h-screen bg-gradient-to-b from-green-50 to-background pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Success Icon */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-green-700 mb-2">
                Pedido Confirmado!
              </h1>
              <p className="text-muted-foreground">
                Obrigado pela sua compra! Seu pedido foi processado com sucesso.
              </p>
            </div>

            {/* Order Info Cards */}
            <div className="grid gap-4 mb-8">
              {hasPhysical && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-1">
                          Produtos Físicos
                        </h3>
                        <p className="text-sm text-blue-700">
                          Seus produtos serão enviados para o endereço informado.
                          Você receberá um email com o código de rastreamento assim
                          que o pedido for despachado.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {hasDigital && (
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Download className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900 mb-1">
                          Produtos Digitais Personalizados
                        </h3>
                        <p className="text-sm text-purple-700 mb-3">
                          Seus produtos digitais estão em produção! Nossa equipe irá 
                          personalizar cada item com as informações que você forneceu.
                        </p>
                        <div className="bg-purple-100 rounded-lg p-3 border border-purple-200">
                          <div className="flex items-center gap-2 text-purple-800">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-sm">
                              Prazo de entrega: até 3 dias úteis
                            </span>
                          </div>
                          <p className="text-xs text-purple-600 mt-1 ml-7">
                            Você receberá um email com o link de download assim que estiver pronto!
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Next Steps */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Próximos passos</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      1
                    </span>
                    Você receberá um email de confirmação do pedido
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      2
                    </span>
                    {hasDigital
                      ? "Seus produtos digitais serão personalizados e enviados em até 3 dias úteis"
                      : "Seu pedido será preparado e enviado"}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      3
                    </span>
                    Em caso de dúvidas, entre em contato pelo WhatsApp
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/loja")}
                className="gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Continuar Comprando
              </Button>
              <Button
                size="lg"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                Voltar ao Início
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
