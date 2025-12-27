import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Image, DollarSign, Sparkles, Settings, Filter, Palette, CalendarDays, BarChart3, FileText, FileSignature, Bell, Wand2 } from "lucide-react";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminGallery } from "@/components/admin/AdminGallery";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminBranding } from "@/components/admin/AdminBranding";
import { AdminAgenda } from "@/components/admin/AdminAgenda";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminQuotes } from "@/components/admin/AdminQuotes";
import { AdminContracts } from "@/components/admin/AdminContracts";
import { AdminReminders } from "@/components/admin/AdminReminders";
import { MagicCursor, effectLabels, effectOptions, EffectType } from "@/components/admin/MagicCursor";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [magicEffect, setMagicEffect] = useState<EffectType>(() => {
    const saved = localStorage.getItem("admin-magic-effect");
    return (saved as EffectType) || "none";
  });

  const handleEffectChange = (effect: EffectType) => {
    setMagicEffect(effect);
    localStorage.setItem("admin-magic-effect", effect);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/admin/login");
        return;
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasAccess = roles?.some(r => r.role === "admin");
      
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você saiu do painel administrativo.",
    });
    navigate("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Magic Cursor Effect */}
      <MagicCursor effect={magicEffect} />

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
            {/* Magic Effect Selector */}
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-muted-foreground" />
              <Select value={magicEffect} onValueChange={(v) => handleEffectChange(v as EffectType)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Efeito mágico" />
                </SelectTrigger>
                <SelectContent>
                  {effectOptions.map((effect) => (
                    <SelectItem key={effect} value={effect} className="text-xs">
                      {effectLabels[effect]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="flex flex-wrap justify-center gap-1 h-auto p-2 w-full max-w-6xl mx-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="agenda" className="flex items-center gap-1 text-xs sm:text-sm">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-1 text-xs sm:text-sm">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Lembretes</span>
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex items-center gap-1 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Orçamentos</span>
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-1 text-xs sm:text-sm">
              <FileSignature className="w-4 h-4" />
              <span className="hidden sm:inline">Contratos</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-1 text-xs sm:text-sm">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Serviços</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-1 text-xs sm:text-sm">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Galeria</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-1 text-xs sm:text-sm">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Marca</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 text-xs sm:text-sm">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="agenda">
            <AdminAgenda />
          </TabsContent>

          <TabsContent value="reminders">
            <AdminReminders />
          </TabsContent>

          <TabsContent value="quotes">
            <AdminQuotes />
          </TabsContent>

          <TabsContent value="contracts">
            <AdminContracts />
          </TabsContent>

          <TabsContent value="services">
            <AdminServices />
          </TabsContent>

          <TabsContent value="gallery">
            <AdminGallery />
          </TabsContent>

          <TabsContent value="branding">
            <AdminBranding />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
