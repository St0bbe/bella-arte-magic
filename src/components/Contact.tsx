import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

export const Contact = () => {
  const { toast } = useToast();
  const { data: settings } = useSiteSettings();
  const { tenant } = useTenant();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save lead to database
      if (tenant?.id) {
        await supabase.from("leads").insert({
          tenant_id: tenant.id,
          name: formData.name,
          phone: formData.phone,
          message: formData.message,
          source: "contact_form",
          status: "new",
        });
      }
    } catch (error) {
      console.error("Error saving lead:", error);
    }

    const whatsappNumber = settings?.whatsapp_number?.replace(/\D/g, "") || "";
    
    if (!whatsappNumber) {
      toast({
        title: "WhatsApp não configurado",
        description: "Entre em contato por telefone.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const text = `*Nova Mensagem de Contato*%0A%0A*Nome:* ${encodeURIComponent(formData.name)}%0A*Telefone:* ${encodeURIComponent(formData.phone)}%0A*Mensagem:* ${encodeURIComponent(formData.message)}`;
    
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");

    toast({
      title: "Mensagem enviada!",
      description: "Você será direcionado para o WhatsApp.",
    });

    setFormData({
      name: "",
      phone: "",
      message: "",
    });
    setIsSubmitting(false);
  };

  const whatsappNumber = settings?.whatsapp_number?.replace(/\D/g, "") || "";

  const contactInfo = [
    {
      icon: MessageCircle,
      title: "WhatsApp",
      content: settings?.whatsapp_number || "(00) 00000-0000",
      href: whatsappNumber ? `https://wa.me/${whatsappNumber}` : "#",
    },
    {
      icon: Phone,
      title: "Telefone",
      content: settings?.whatsapp_number || "(00) 00000-0000",
      href: `tel:+${whatsappNumber}`,
    },
    {
      icon: MapPin,
      title: "Localização",
      content: "Sua Cidade, Estado",
      href: "#",
    },
  ];

  return (
    <section id="contato" className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Entre em Contato
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Vamos criar juntos a festa dos seus sonhos! Entre em contato pelo WhatsApp para um orçamento personalizado.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Nome *
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Seu nome completo"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                      Telefone *
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      required
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Mensagem *
                    </label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Conte-nos sobre sua festa..."
                      rows={4}
                      required
                      maxLength={1000}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-[#25D366] hover:bg-[#20BA5C] text-white transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {isSubmitting ? "Enviando..." : "Enviar pelo WhatsApp"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <Card 
                    key={index}
                    className="border-2 hover:border-primary transition-all duration-300 hover:shadow-[var(--shadow-card)]"
                  >
                    <CardContent className="p-6">
                      <a 
                        href={info.href}
                        target={info.href.startsWith("https") ? "_blank" : undefined}
                        rel={info.href.startsWith("https") ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-4 group"
                      >
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            {info.title}
                          </h3>
                          <p className="text-lg font-semibold text-foreground">
                            {info.content}
                          </p>
                        </div>
                      </a>
                    </CardContent>
                  </Card>
                );
              })}

              <Card className="border-2 bg-gradient-to-br from-primary/10 to-secondary/10">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    Horário de Atendimento
                  </h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>Segunda a Sexta: 8h às 18h</p>
                    <p>Sábado: 9h às 16h</p>
                    <p>Domingo: Fechado</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
