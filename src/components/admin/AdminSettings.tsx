import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Upload, Trash2, Save, ImageIcon, Phone, Instagram, Facebook, MapPin, MessageSquare } from "lucide-react";

interface SiteSettings {
  logo_url: string;
  about_title: string;
  about_description: string;
  about_mission: string;
  footer_text: string;
  whatsapp_number: string;
  instagram_url: string;
  facebook_url: string;
  phone_number: string;
  address: string;
  whatsapp_budget_message: string;
}

function getDefaultSettings(): SiteSettings {
  return {
    logo_url: "",
    about_title: "Sobre Nós",
    about_description: "",
    about_mission: "",
    footer_text: "",
    whatsapp_number: "",
    instagram_url: "",
    facebook_url: "",
    phone_number: "",
    address: "",
    whatsapp_budget_message: "",
  };
}

export function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<SiteSettings>(getDefaultSettings());

  // Get user's tenant
  const { data: userTenant } = useQuery({
    queryKey: ["user-tenant"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      return data;
    },
  });

  // Get settings for the user's tenant
  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-site-settings", userTenant?.id],
    queryFn: async () => {
      if (!userTenant?.id) return getDefaultSettings();

      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .eq("tenant_id", userTenant.id);
      
      if (error) throw error;
      
      const result = getDefaultSettings();
      
      data?.forEach((item: { key: string; value: string | null }) => {
        if (item.key in result) {
          (result as any)[item.key] = item.value || "";
        }
      });
      
      return result;
    },
    enabled: !!userTenant?.id,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("gallery")
        .getPublicUrl(fileName);

      setFormData({ ...formData, logo_url: publicUrl.publicUrl });

      toast({
        title: "Logo enviada!",
        description: "A imagem foi carregada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!userTenant?.id) {
      toast({
        title: "Erro",
        description: "Tenant não encontrado",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updates = Object.entries(formData).map(async ([key, value]) => {
        // Check if setting exists
        const { data: existing } = await supabase
          .from("site_settings")
          .select("id")
          .eq("key", key)
          .eq("tenant_id", userTenant.id)
          .single();

        if (existing) {
          const { error } = await supabase
            .from("site_settings")
            .update({ value })
            .eq("key", key)
            .eq("tenant_id", userTenant.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("site_settings")
            .insert({ key, value, tenant_id: userTenant.id });
          if (error) throw error;
        }
      });
      
      await Promise.all(updates);
      
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      
      toast({
        title: "Configurações salvas!",
        description: "Todas as alterações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Logo do Site
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {formData.logo_url ? (
              <div className="relative w-48 h-24 rounded-lg overflow-hidden border-2 border-border bg-muted">
                <img
                  src={formData.logo_url}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Logo
                  </>
                )}
              </Button>
              {formData.logo_url && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setFormData({ ...formData, logo_url: "" })}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            A logo será exibida no cabeçalho e no rodapé do site.
          </p>
        </CardContent>
      </Card>

      {/* About Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Sobre Nós
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="about_title">Título</Label>
            <Input
              id="about_title"
              value={formData.about_title}
              onChange={(e) =>
                setFormData({ ...formData, about_title: e.target.value })
              }
              placeholder="Ex: Sobre Nós"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="about_description">Descrição Principal</Label>
            <Textarea
              id="about_description"
              value={formData.about_description}
              onChange={(e) =>
                setFormData({ ...formData, about_description: e.target.value })
              }
              rows={4}
              placeholder="Conte um pouco sobre a empresa..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="about_mission">Missão / Segunda Descrição</Label>
            <Textarea
              id="about_mission"
              value={formData.about_mission}
              onChange={(e) =>
                setFormData({ ...formData, about_mission: e.target.value })
              }
              rows={3}
              placeholder="Nossa missão é..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Media & Contact Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Redes Sociais e Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#25D366]" />
              Número do WhatsApp
            </Label>
            <Input
              id="whatsapp_number"
              value={formData.whatsapp_number}
              onChange={(e) =>
                setFormData({ ...formData, whatsapp_number: e.target.value })
              }
              placeholder="Ex: 5511999999999 (com código do país)"
            />
            <p className="text-xs text-muted-foreground">
              Digite o número completo com código do país (sem espaços ou caracteres especiais)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram_url" className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-[#E4405F]" />
              URL do Instagram
            </Label>
            <Input
              id="instagram_url"
              value={formData.instagram_url}
              onChange={(e) =>
                setFormData({ ...formData, instagram_url: e.target.value })
              }
              placeholder="https://instagram.com/seuusuario"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook_url" className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-[#1877F2]" />
              URL do Facebook
            </Label>
            <Input
              id="facebook_url"
              value={formData.facebook_url}
              onChange={(e) =>
                setFormData({ ...formData, facebook_url: e.target.value })
              }
              placeholder="https://facebook.com/suapagina"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Telefone
            </Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
              placeholder="Ex: (11) 99999-9999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Endereço
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo"
            />
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Budget Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#25D366]" />
            Mensagem de Orçamento WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp_budget_message">Texto Introdutório</Label>
            <Textarea
              id="whatsapp_budget_message"
              value={formData.whatsapp_budget_message}
              onChange={(e) =>
                setFormData({ ...formData, whatsapp_budget_message: e.target.value })
              }
              rows={3}
              placeholder="🎉 Solicitação de Orçamento"
            />
            <p className="text-xs text-muted-foreground">
              Este texto aparecerá no início da mensagem do WhatsApp quando o cliente enviar um orçamento.
              Deixe vazio para usar o padrão.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Rodapé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="footer_text">Texto do Rodapé</Label>
            <Input
              id="footer_text"
              value={formData.footer_text}
              onChange={(e) =>
                setFormData({ ...formData, footer_text: e.target.value })
              }
              placeholder="© 2024 Sua Empresa. Todos os direitos reservados."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-primary to-secondary"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
