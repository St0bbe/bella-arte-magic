import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Check, Crown, Calendar, CreditCard } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: string;
  priceId: string;
  period: string;
  savings?: string;
  features: string[];
}

const PLANS: Record<"monthly" | "yearly", Plan> = {
  monthly: {
    id: "monthly",
    name: "Plano Mensal",
    price: "R$ 49,90",
    priceId: "price_1SifxcBqyfBQHAgcsAW2Wali",
    period: "/mês",
    features: [
      "Site profissional personalizado",
      "Galeria de fotos ilimitada",
      "Calculadora de orçamento",
      "WhatsApp integrado",
      "Suporte por email",
    ],
  },
  yearly: {
    id: "yearly",
    name: "Plano Anual",
    price: "R$ 479,00",
    priceId: "price_1SifxyBqyfBQHAgcgy9yZLs0",
    period: "/ano",
    savings: "Economize R$ 119,80",
    features: [
      "Tudo do plano mensal",
      "2 meses grátis",
      "Suporte prioritário",
      "Domínio personalizado",
      "SEO otimizado",
    ],
  },
};

export default function RenewSubscription() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/admin/login");
        return;
      }
      
      setUser(session.user);
      setIsCheckingAuth(false);

      // Check payment status from URL
      const paymentStatus = searchParams.get("payment");
      if (paymentStatus === "canceled") {
        toast({
          title: "Pagamento cancelado",
          description: "Você pode tentar novamente quando quiser.",
          variant: "destructive",
        });
      }
    };

    checkAuth();
  }, [navigate, searchParams, toast]);

  const handleSubscribe = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PLANS[selectedPlan].priceId },
      });

      if (response.error) throw new Error(response.error.message);
      
      const { url } = response.data;
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Renove sua Assinatura
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sua assinatura expirou. Escolha um plano para continuar usando o Festa Fácil e manter seu site online.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {Object.values(PLANS).map((plan) => (
            <Card
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedPlan === plan.id
                  ? "border-2 border-primary shadow-lg ring-2 ring-primary/20"
                  : "border hover:border-primary/50"
              }`}
              onClick={() => setSelectedPlan(plan.id as "monthly" | "yearly")}
            >
              {plan.id === "yearly" && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary">
                  Mais Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  {plan.id === "yearly" ? (
                    <Crown className="w-6 h-6 text-primary" />
                  ) : (
                    <Calendar className="w-6 h-6 text-primary" />
                  )}
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                {plan.savings && (
                  <Badge variant="secondary" className="mt-2">
                    {plan.savings}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button
            size="lg"
            onClick={handleSubscribe}
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg px-12 py-6"
          >
            {isLoading ? (
              "Processando..."
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Assinar {PLANS[selectedPlan].name}
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Pagamento seguro via Stripe. Cancele quando quiser.
          </p>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <button
            onClick={() => supabase.auth.signOut().then(() => navigate("/"))}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
