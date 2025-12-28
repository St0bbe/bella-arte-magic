import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Palette, Upload, Save, Globe, Store, Image as ImageIcon, Sparkles } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

// Paletas de cores pré-definidas
const COLOR_PALETTES = [
  { name: "Rosa & Roxo", primary: "#FF6B9D", secondary: "#C084FC", icon: "🎀" },
  { name: "Azul & Ciano", primary: "#3B82F6", secondary: "#06B6D4", icon: "🌊" },
  { name: "Verde & Lima", primary: "#22C55E", secondary: "#84CC16", icon: "🌿" },
  { name: "Laranja & Amarelo", primary: "#F97316", secondary: "#EAB308", icon: "🌅" },
  { name: "Vermelho & Rosa", primary: "#EF4444", secondary: "#EC4899", icon: "❤️" },
  { name: "Roxo & Índigo", primary: "#A855F7", secondary: "#6366F1", icon: "💜" },
  { name: "Dourado & Bronze", primary: "#D4A574", secondary: "#CD7F32", icon: "✨" },
  { name: "Turquesa & Verde", primary: "#14B8A6", secondary: "#10B981", icon: "🌴" },
  { name: "Coral & Pêssego", primary: "#FF6B6B", secondary: "#FECA57", icon: "🍑" },
  { name: "Azul Marinho & Dourado", primary: "#1E3A5F", secondary: "#D4AF37", icon: "⚓" },
  { name: "Lavanda & Rosa", primary: "#9B59B6", secondary: "#FFC0CB", icon: "💐" },
  { name: "Menta & Rosa", primary: "#98D8C8", secondary: "#F7CAC9", icon: "🍃" },
];

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  whatsapp_number: string | null;
  address: string | null;
}

export function AdminBranding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refreshTenant } = useTenant();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo_url: "",
    primary_color: "#FF6B9D",
    secondary_color: "#C084FC",
    whatsapp_number: "",
    address: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(100); // Percentage 50-150
  const { data: tenant, isLoading } = useQuery({
    queryKey: ["my-tenant"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (error) throw error;
      return data as Tenant;
    },
  });

  // Fetch logo size from site_settings
  const { data: logoSizeSetting } = useQuery({
    queryKey: ["logo-size", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return 100;
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("tenant_id", tenant.id)
        .eq("key", "logo_size")
        .single();
      return data?.value ? parseInt(data.value) : 100;
    },
    enabled: !!tenant?.id,
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        slug: tenant.slug || "",
        logo_url: tenant.logo_url || "",
        primary_color: tenant.primary_color || "#FF6B9D",
        secondary_color: tenant.secondary_color || "#C084FC",
        whatsapp_number: tenant.whatsapp_number || "",
        address: tenant.address || "",
      });
      setLogoPreview(tenant.logo_url);
    }
  }, [tenant]);

  useEffect(() => {
    if (logoSizeSetting) {
      setLogoSize(logoSizeSetting);
    }
  }, [logoSizeSetting]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!tenant) throw new Error("Tenant não encontrado");

      let logoUrl = formData.logo_url;

      // Upload logo if changed
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${tenant.id}/logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("gallery")
          .getPublicUrl(fileName);

        logoUrl = publicUrl.publicUrl;
      }

      const { error } = await supabase
        .from("tenants")
        .update({
          name: formData.name,
          logo_url: logoUrl,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          whatsapp_number: formData.whatsapp_number,
          address: formData.address,
        })
        .eq("id", tenant.id);

      if (error) throw error;

      // Save logo size to site_settings
      const { data: existingSetting } = await supabase
        .from("site_settings")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("key", "logo_size")
        .single();

      if (existingSetting) {
        await supabase
          .from("site_settings")
          .update({ value: logoSize.toString() })
          .eq("tenant_id", tenant.id)
          .eq("key", "logo_size");
      } else {
        await supabase
          .from("site_settings")
          .insert({ tenant_id: tenant.id, key: "logo_size", value: logoSize.toString() });
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["my-tenant"] });
      queryClient.invalidateQueries({ queryKey: ["logo-size"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      // Refresh tenant context to apply colors immediately
      await refreshTenant();
      toast({
        title: "Sucesso!",
        description: "As configurações foram salvas.",
      });
      setLogoFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Nenhuma conta encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Identidade do Site
          </CardTitle>
          <CardDescription>
            Personalize a aparência do seu site de decorações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Logo do Site
            </Label>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div 
                    className="rounded-lg border-2 border-dashed border-primary/30 overflow-hidden flex items-center justify-center bg-muted"
                    style={{ 
                      width: `${Math.round(96 * logoSize / 100)}px`, 
                      height: `${Math.round(96 * logoSize / 100)}px` 
                    }}
                  >
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Escolher imagem
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recomendado: 200x200px, PNG ou SVG
                  </p>
                </div>
              </div>
              
              {/* Logo Size Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Tamanho da Logo</Label>
                  <span className="text-sm text-muted-foreground">{logoSize}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={logoSize}
                  onChange={(e) => setLogoSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Menor</span>
                  <span>Normal</span>
                  <span>Maior</span>
                </div>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Site</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Maria Decorações"
            />
          </div>

          {/* Site Info */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Identificador do Site
            </Label>
            <Input
              value={formData.slug}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Identificador interno do site.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Cores do Site
          </CardTitle>
          <CardDescription>
            Escolha as cores que representam sua marca
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Paletas Pré-definidas */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Paletas Sugeridas
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.name}
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    primary_color: palette.primary, 
                    secondary_color: palette.secondary 
                  })}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    formData.primary_color === palette.primary && formData.secondary_color === palette.secondary
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{palette.icon}</span>
                    <span className="text-xs font-medium truncate">{palette.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded-full shadow-sm"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full shadow-sm"
                      style={{ backgroundColor: palette.secondary }}
                    />
                    <div
                      className="flex-1 h-6 rounded-full shadow-sm"
                      style={{
                        background: `linear-gradient(90deg, ${palette.primary}, ${palette.secondary})`,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cores Personalizadas */}
          <div className="space-y-3">
            <Label>Cores Personalizadas</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primary_color" className="text-sm text-muted-foreground">Cor Principal</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#FF6B9D"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_color" className="text-sm text-muted-foreground">Cor Secundária</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    placeholder="#C084FC"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <p className="text-sm text-muted-foreground mb-3">Prévia das cores selecionadas:</p>
            <div className="flex gap-4">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-lg shadow-md mb-1"
                  style={{ backgroundColor: formData.primary_color }}
                />
                <span className="text-xs text-muted-foreground">Principal</span>
              </div>
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-lg shadow-md mb-1"
                  style={{ backgroundColor: formData.secondary_color }}
                />
                <span className="text-xs text-muted-foreground">Secundária</span>
              </div>
              <div className="flex-1 text-center">
                <div
                  className="h-16 rounded-lg shadow-md mb-1"
                  style={{
                    background: `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})`,
                  }}
                />
                <span className="text-xs text-muted-foreground">Gradiente</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
          <CardDescription>
            Informações de contato exibidas no site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={formData.whatsapp_number}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
              placeholder="5511999999999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua das Flores, 123 - São Paulo, SP"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          size="lg"
        >
          {updateMutation.isPending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
