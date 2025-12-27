import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Image, DollarSign, Sparkles, Settings, Filter, Palette, CalendarDays, BarChart3, FileText, FileSignature, Bell, Wand2, Volume2, Zap, Gauge, Users, PartyPopper, MessageCircle, Trash2 } from "lucide-react";
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
import { AdminLeads } from "@/components/admin/AdminLeads";
import { AdminWhatsAppStyle } from "@/components/admin/AdminWhatsAppStyle";
import { AdminHeaderBackground } from "@/components/admin/AdminHeaderBackground";
import { AdminGalleryTrash } from "@/components/admin/AdminGalleryTrash";
import { MagicCursor, effectLabels, effectOptions, defaultSettings, EffectType, MagicCursorSettings } from "@/components/admin/MagicCursor";
import { PartyBackground, backgroundEffectLabels, backgroundEffectOptions, defaultBackgroundSettings, BackgroundEffectType, PartyBackgroundSettings } from "@/components/admin/PartyBackground";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [magicEffect, setMagicEffect] = useState<EffectType>(() => {
    const saved = localStorage.getItem("admin-magic-effect");
    return (saved as EffectType) || "none";
  });
  const [magicSettings, setMagicSettings] = useState<MagicCursorSettings>(() => {
    const saved = localStorage.getItem("admin-magic-settings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [bgEffect, setBgEffect] = useState<BackgroundEffectType>(() => {
    const saved = localStorage.getItem("admin-bg-effect");
    return (saved as BackgroundEffectType) || "none";
  });
  const [bgSettings, setBgSettings] = useState<PartyBackgroundSettings>(() => {
    const saved = localStorage.getItem("admin-bg-settings");
    return saved ? JSON.parse(saved) : defaultBackgroundSettings;
  });

  const handleEffectChange = (effect: EffectType) => {
    setMagicEffect(effect);
    localStorage.setItem("admin-magic-effect", effect);
  };

  const handleSettingsChange = (newSettings: Partial<MagicCursorSettings>) => {
    const updated = { ...magicSettings, ...newSettings };
    setMagicSettings(updated);
    localStorage.setItem("admin-magic-settings", JSON.stringify(updated));
  };

  const handleBgEffectChange = (effect: BackgroundEffectType) => {
    setBgEffect(effect);
    localStorage.setItem("admin-bg-effect", effect);
  };

  const handleBgSettingsChange = (newSettings: Partial<PartyBackgroundSettings>) => {
    const updated = { ...bgSettings, ...newSettings };
    setBgSettings(updated);
    localStorage.setItem("admin-bg-settings", JSON.stringify(updated));
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background relative">
      {/* Party Background Effect */}
      <PartyBackground effect={bgEffect} settings={bgSettings} />
      
      {/* Magic Cursor Effect */}
      <MagicCursor effect={magicEffect} settings={magicSettings} />

      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50 relative">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Bella Arte Admin
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Magic Effect Selector with Settings */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Wand2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="end">
                  <div className="space-y-4">
                    <div className="font-medium text-sm flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      Efeitos Mágicos
                    </div>
                    
                    {/* Effect Selector */}
                    <div className="space-y-2">
                      <Label className="text-xs">Efeito</Label>
                      <Select value={magicEffect} onValueChange={(v) => handleEffectChange(v as EffectType)}>
                        <SelectTrigger className="w-full h-8 text-xs">
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

                    {magicEffect !== "none" && (
                      <>
                        {/* Intensity Slider */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Intensidade
                            </Label>
                            <span className="text-xs text-muted-foreground">{magicSettings.intensity}</span>
                          </div>
                          <Slider
                            value={[magicSettings.intensity]}
                            onValueChange={([v]) => handleSettingsChange({ intensity: v })}
                            min={1}
                            max={10}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        {/* Speed Slider */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs flex items-center gap-1">
                              <Gauge className="w-3 h-3" />
                              Velocidade
                            </Label>
                            <span className="text-xs text-muted-foreground">{magicSettings.speed}</span>
                          </div>
                          <Slider
                            value={[magicSettings.speed]}
                            onValueChange={([v]) => handleSettingsChange({ speed: v })}
                            min={1}
                            max={10}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        {/* Sound Toggle */}
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1">
                            <Volume2 className="w-3 h-3" />
                            Sons
                          </Label>
                          <Switch
                            checked={magicSettings.soundEnabled}
                            onCheckedChange={(v) => handleSettingsChange({ soundEnabled: v })}
                          />
                        </div>

                        {/* Volume Slider */}
                        {magicSettings.soundEnabled && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Volume</Label>
                              <span className="text-xs text-muted-foreground">{Math.round(magicSettings.volume * 100)}%</span>
                            </div>
                            <Slider
                              value={[magicSettings.volume]}
                              onValueChange={([v]) => handleSettingsChange({ volume: v })}
                              min={0.1}
                              max={1}
                              step={0.1}
                              className="w-full"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Background Effects Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <PartyPopper className="w-4 h-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <PartyPopper className="w-4 h-4" />
                    Efeitos de Fundo
                  </div>
                  
                  {/* Background Effect Selector */}
                  <div className="space-y-2">
                    <Label className="text-xs">Efeito</Label>
                    <Select value={bgEffect} onValueChange={(v) => handleBgEffectChange(v as BackgroundEffectType)}>
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="Efeito de fundo" />
                      </SelectTrigger>
                      <SelectContent>
                        {backgroundEffectOptions.map((effect) => (
                          <SelectItem key={effect} value={effect} className="text-xs">
                            {backgroundEffectLabels[effect]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {bgEffect !== "none" && (
                    <>
                      {/* Intensity Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Intensidade
                          </Label>
                          <span className="text-xs text-muted-foreground">{bgSettings.intensity}</span>
                        </div>
                        <Slider
                          value={[bgSettings.intensity]}
                          onValueChange={([v]) => handleBgSettingsChange({ intensity: v })}
                          min={1}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Speed Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1">
                            <Gauge className="w-3 h-3" />
                            Velocidade
                          </Label>
                          <span className="text-xs text-muted-foreground">{bgSettings.speed}</span>
                        </div>
                        <Slider
                          value={[bgSettings.speed]}
                          onValueChange={([v]) => handleBgSettingsChange({ speed: v })}
                          min={1}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Colorful Toggle */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs flex items-center gap-1">
                          <Palette className="w-3 h-3" />
                          Colorido
                        </Label>
                        <Switch
                          checked={bgSettings.colorful}
                          onCheckedChange={(v) => handleBgSettingsChange({ colorful: v })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>

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
            <TabsTrigger value="leads" className="flex items-center gap-1 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Leads</span>
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
            <TabsTrigger value="trash" className="flex items-center gap-1 text-xs sm:text-sm">
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Lixeira</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="agenda">
            <AdminAgenda />
          </TabsContent>

          <TabsContent value="leads">
            <AdminLeads />
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
            <div className="space-y-6">
              <AdminBranding />
              <AdminWhatsAppStyle />
              <AdminHeaderBackground />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>

          <TabsContent value="trash">
            <AdminGalleryTrash />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
