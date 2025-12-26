import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { LogOut, Image, DollarSign, Sparkles, Settings, Filter, Palette, CreditCard } from "lucide-react";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminGallery } from "@/components/admin/AdminGallery";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminBranding } from "@/components/admin/AdminBranding";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const { subscription, isExpired, openCustomerPortal, isLoading: subLoading } = useSubscription();

  useEffect(() => {
    // Check payment success
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      toast({
        title: "Pagamento confirmado!",
        description: "Sua assinatura foi ativada com sucesso.",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/admin/login");
        return;
      }

      // Check if user is admin or super_admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasAccess = roles?.some(r => r.role === "admin" || r.role === "super_admin");
      
      if (!hasAccess) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/admin/login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Redirect to renewal page if subscription expired
  useEffect(() => {
    if (!subLoading && isExpired) {
      navigate("/renovar");
    }
  }, [subLoading, isExpired, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você saiu do painel administrativo.",
    });
    navigate("/admin/login");
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal de assinaturas.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Bella Arte Admin
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {subscription?.subscribed && (
              <Button variant="ghost" size="sm" onClick={handleManageSubscription}>
                <CreditCard className="w-4 h-4 mr-2" />
                Assinatura
              </Button>
            )}
            <a href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Ver Site
            </a>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="branding" className="space-y-8">
          <TabsList className="grid w-full max-w-3xl grid-cols-5 mx-auto">
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Marca
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Galeria
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding">
            <AdminBranding />
          </TabsContent>

          <TabsContent value="services">
            <AdminServices />
          </TabsContent>

          <TabsContent value="gallery">
            <AdminGallery />
          </TabsContent>

          <TabsContent value="filters">
            <AdminFilters />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
