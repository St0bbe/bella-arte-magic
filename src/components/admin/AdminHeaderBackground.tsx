import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Upload, Trash2, Save, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const defaultBackgrounds = [
  { id: "gradient", name: "Gradiente", preview: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)" },
  { id: "confetti", name: "Confetes", preview: "linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)" },
  { id: "party", name: "Festa", preview: "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)" },
  { id: "elegant", name: "Elegante", preview: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" },
];

export function AdminHeaderBackground() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<"gradient" | "image">("gradient");
  const [selectedGradient, setSelectedGradient] = useState("gradient");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  // Get current setting
  const { data: currentSetting } = useQuery({
    queryKey: ["header-background", userTenant?.id],
    queryFn: async () => {
      if (!userTenant?.id) return null;

      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("tenant_id", userTenant.id)
        .eq("key", "header_background")
        .maybeSingle();

      return data?.value ? JSON.parse(data.value) : null;
    },
    enabled: !!userTenant?.id,
  });

  useEffect(() => {
    if (currentSetting) {
      setSelectedType(currentSetting.type || "gradient");
      setSelectedGradient(currentSetting.gradient || "gradient");
      setImageUrl(currentSetting.imageUrl || "");
    }
  }, [currentSetting]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userTenant?.id) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userTenant.id}/header-bg-${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("gallery")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("gallery")
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      setSelectedType("image");

      toast({
        title: "Imagem enviada!",
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
    if (!userTenant?.id) return;

    setIsSaving(true);
    try {
      const value = JSON.stringify({
        type: selectedType,
        gradient: selectedGradient,
        imageUrl: imageUrl,
      });

      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "header_background")
        .eq("tenant_id", userTenant.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("site_settings")
          .update({ value })
          .eq("key", "header_background")
          .eq("tenant_id", userTenant.id);
      } else {
        await supabase
          .from("site_settings")
          .insert({ key: "header_background", value, tenant_id: userTenant.id });
      }

      queryClient.invalidateQueries({ queryKey: ["header-background"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });

      toast({
        title: "Fundo salvo!",
        description: "O fundo do header foi atualizado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          Fundo do Header/Hero
        </CardTitle>
        <CardDescription>
          Escolha um gradiente ou envie uma imagem personalizada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Type Selection */}
        <div className="flex gap-4">
          <Button
            variant={selectedType === "gradient" ? "default" : "outline"}
            onClick={() => setSelectedType("gradient")}
            className="flex-1"
          >
            Gradiente
          </Button>
          <Button
            variant={selectedType === "image" ? "default" : "outline"}
            onClick={() => setSelectedType("image")}
            className="flex-1"
          >
            Imagem
          </Button>
        </div>

        {/* Gradient Options */}
        {selectedType === "gradient" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {defaultBackgrounds.map((bg) => (
              <div
                key={bg.id}
                onClick={() => setSelectedGradient(bg.id)}
                className={cn(
                  "relative h-24 rounded-xl cursor-pointer border-2 overflow-hidden transition-all hover:scale-105",
                  selectedGradient === bg.id ? "border-primary ring-2 ring-primary/50" : "border-border"
                )}
                style={{ background: bg.preview }}
              >
                {selectedGradient === bg.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs text-center">
                  {bg.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image Upload */}
        {selectedType === "image" && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Cole a URL da imagem ou faça upload"
                className="flex-1"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </Button>
            </div>

            {imageUrl && (
              <div className="relative rounded-xl overflow-hidden h-40">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setImageUrl("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        <div className="p-4 bg-muted/50 rounded-xl border">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            Prévia do Header:
          </p>
          <div
            className="h-32 rounded-xl flex items-center justify-center text-white font-bold text-xl"
            style={{
              background: selectedType === "image" && imageUrl
                ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${imageUrl})`
                : defaultBackgrounds.find(bg => bg.id === selectedGradient)?.preview,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            Seu Site de Festas
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Fundo
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
