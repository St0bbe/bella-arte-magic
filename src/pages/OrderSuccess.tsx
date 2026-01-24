import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, Package, Download, ArrowRight, ShoppingBag, 
  Clock, MessageCircle, FileText, Sparkles, Heart
} from "lucide-react";
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
    if (sessionId) {
      clearCart();
    }
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [sessionId, clearCart]);

  return (
    <>
      <Helmet>
        <title>Pedido Confirmado! | Bella Arte</title>
        <meta name="description" content="Seu pedido foi confirmado com sucesso! Aguarde as instruções de entrega." />
      </Helmet>

      {showConfetti && <ConfettiEffect trigger={true} />}

      <Header />

      <main className="min-h-screen bg-gradient-to-b from-green-50 via-store-cream/30 to-background pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-10">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200 mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Pagamento Confirmado
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-3">
                🎉 Parabéns, Mamãe!
              </h1>
              <p className="text-lg text-store-text/70">
                Seu pedido foi processado com sucesso! Agora é só aguardar a mágica acontecer.
              </p>
            </div>

            {/* Digital Products Card */}
            {hasDigital && (
              <Card className="border-store-rose/30 bg-gradient-to-br from-store-cream to-store-pink/20 mb-6 overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-full bg-store-rose/20 flex items-center justify-center flex-shrink-0">
                      <Download className="w-7 h-7 text-store-rose" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-store-text text-lg mb-2 flex items-center gap-2">
                        💕 Produtos Digitais Personalizados
                      </h3>
                      <p className="text-store-text/70 mb-4">
                        Nossa equipe de designers já está trabalhando na sua arte personalizada! 
                        Cada detalhe será cuidadosamente criado para deixar a festa do seu filho ainda mais especial.
                      </p>

                      <div className="bg-white rounded-xl p-4 border border-store-rose/20 space-y-3">
                        <h4 className="font-semibold text-store-text flex items-center gap-2">
                          <Clock className="w-4 h-4 text-store-rose" />
                          Próximos Passos
                        </h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-store-rose text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                            <div>
                              <p className="font-medium text-store-text text-sm">Produção da Arte</p>
                              <p className="text-xs text-store-text/60">Nossa equipe criará sua arte personalizada em até 3 dias úteis</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-store-rose text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                            <div>
                              <p className="font-medium text-store-text text-sm">Entrega via WhatsApp</p>
                              <p className="text-xs text-store-text/60">Você receberá o arquivo PDF diretamente no seu WhatsApp</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-store-rose text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                            <div>
                              <p className="font-medium text-store-text text-sm">Pronto para Usar!</p>
                              <p className="text-xs text-store-text/60">Imprima ou compartilhe digitalmente com os convidados</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                          <FileText className="w-3 h-3 mr-1" />
                          PDF de Alta Qualidade
                        </Badge>
                        <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Entrega via WhatsApp
                        </Badge>
                        <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                          <Clock className="w-3 h-3 mr-1" />
                          Até 3 dias úteis
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Physical Products Card */}
            {hasPhysical && (
              <Card className="border-blue-200 bg-blue-50/50 mb-6">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">
                        📦 Produtos Físicos
                      </h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Seus produtos serão cuidadosamente embalados e enviados para o endereço informado.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                          Código de rastreamento por email
                        </Badge>
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                          Embalagem especial
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Important Info */}
            <Card className="bg-amber-50/50 border-amber-200 mb-6">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Dica Importante</h4>
                    <p className="text-sm text-amber-700">
                      Verifique se nosso número está salvo no seu WhatsApp para garantir o recebimento da sua arte. 
                      Caso tenha alguma dúvida, estamos à disposição!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Thank You Message */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-store-rose mb-2">
                <Heart className="w-5 h-5 fill-store-rose" />
                <span className="font-medium">Obrigado por confiar na Bella Arte!</span>
                <Heart className="w-5 h-5 fill-store-rose" />
              </div>
              <p className="text-sm text-store-text/60">
                Estamos honradas em fazer parte desse momento especial da sua família
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/loja")}
                className="gap-2 border-store-rose/30 hover:bg-store-rose/5"
              >
                <ShoppingBag className="w-4 h-4" />
                Continuar Comprando
              </Button>
              <Button
                size="lg"
                onClick={() => navigate("/")}
                className="gap-2 bg-store-rose hover:bg-store-rose/90"
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
