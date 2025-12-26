import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Palette, Upload, Save, Globe, Store, Image as ImageIcon } from "lucide-react";

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tenant"] });
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
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-primary/30 overflow-hidden">
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

          {/* Slug (read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Endereço do Site
            </Label>
            <div className="flex items-center">
              <Input
                value={formData.slug}
                disabled
                className="rounded-r-none bg-muted"
              />
              <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-muted-foreground">
                .bellaarte.com
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              O endereço do site não pode ser alterado após a criação.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Cor Principal</Label>
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
              <Label htmlFor="secondary_color">Cor Secundária</Label>
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

          {/* Preview */}
          <div className="p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-2">Prévia das cores:</p>
            <div className="flex gap-4">
              <div
                className="w-20 h-20 rounded-lg shadow-md"
                style={{ backgroundColor: formData.primary_color }}
              />
              <div
                className="w-20 h-20 rounded-lg shadow-md"
                style={{ backgroundColor: formData.secondary_color }}
              />
              <div
                className="flex-1 h-20 rounded-lg shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})`,
                }}
              />
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
