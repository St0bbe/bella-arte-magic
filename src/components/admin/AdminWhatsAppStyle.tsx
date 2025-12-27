import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Phone, Check, Save } from "lucide-react";
import { whatsappStyles } from "@/components/WhatsAppButton";
import { cn } from "@/lib/utils";

export function AdminWhatsAppStyle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStyle, setSelectedStyle] = useState("classic");
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

  // Get current style setting
  const { data: currentStyle } = useQuery({
    queryKey: ["whatsapp-style", userTenant?.id],
    queryFn: async () => {
      if (!userTenant?.id) return "classic";

      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("tenant_id", userTenant.id)
        .eq("key", "whatsapp_button_style")
        .maybeSingle();

      return data?.value || "classic";
    },
    enabled: !!userTenant?.id,
  });

  useEffect(() => {
    if (currentStyle) {
      setSelectedStyle(currentStyle);
    }
  }, [currentStyle]);

  const handleSave = async () => {
    if (!userTenant?.id) return;

    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "whatsapp_button_style")
        .eq("tenant_id", userTenant.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("site_settings")
          .update({ value: selectedStyle })
          .eq("key", "whatsapp_button_style")
          .eq("tenant_id", userTenant.id);
      } else {
        await supabase
          .from("site_settings")
          .insert({ key: "whatsapp_button_style", value: selectedStyle, tenant_id: userTenant.id });
      }

      queryClient.invalidateQueries({ queryKey: ["whatsapp-style"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });

      toast({
        title: "Estilo salvo!",
        description: "O estilo do botão WhatsApp foi atualizado.",
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
          <MessageCircle className="w-5 h-5 text-[#25D366]" />
          Estilo do Botão WhatsApp
        </CardTitle>
        <CardDescription>
          Escolha entre 8 estilos diferentes para o botão flutuante
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {whatsappStyles.map((style) => {
            const IconComponent = style.icon === "phone" ? Phone : MessageCircle;
            const isSelected = selectedStyle === style.id;

            return (
              <div
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={cn(
                  "relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50",
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                <div className="flex flex-col items-center gap-3">
                  {/* Preview button */}
                  <div
                    className={cn(
                      "p-3 flex items-center gap-2 transition-all",
                      style.className,
                      "scale-90"
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                    {style.showText && (
                      <span className="text-xs font-medium">{style.text}</span>
                    )}
                  </div>

                  <span className="text-sm font-medium text-center">
                    {style.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Preview */}
        <div className="p-6 bg-muted/50 rounded-xl border">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Prévia em tamanho real:
          </p>
          <div className="flex justify-center">
            {(() => {
              const style = whatsappStyles.find(s => s.id === selectedStyle) || whatsappStyles[0];
              const IconComponent = style.icon === "phone" ? Phone : MessageCircle;
              return (
                <div
                  className={cn(
                    "p-4 flex items-center gap-2 transition-all cursor-pointer",
                    style.className,
                    style.animation
                  )}
                >
                  <IconComponent className="w-7 h-7" />
                  {style.showText && (
                    <span className="font-medium">{style.text}</span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-[#25D366] to-[#128C7E]"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Estilo
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
