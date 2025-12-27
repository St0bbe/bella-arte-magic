import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeCheckbox } from "@/components/ui/native-checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Calculator, Sparkles, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useServices } from "@/hooks/useServices";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

// Fallback services when database is empty
const fallbackServices: ServiceItem[] = [
  { id: "inflavel", name: "Inflável (Castelo/Tobogã)", price: 350, description: "Brinquedo inflável para diversão garantida" },
  { id: "piscina-bolinhas", name: "Piscina de Bolinhas", price: 280, description: "Piscina colorida com centenas de bolinhas" },
  { id: "cama-elastica", name: "Cama Elástica", price: 320, description: "Cama elástica profissional e segura" },
  { id: "decoracao-basica", name: "Decoração Básica", price: 450, description: "Decoração temática com balões e painéis" },
  { id: "decoracao-premium", name: "Decoração Premium", price: 850, description: "Decoração completa com cenografia personalizada" },
  { id: "mesa-doces", name: "Mesa de Doces Decorada", price: 380, description: "Mesa temática para doces e bolo" },
  { id: "totem-fotos", name: "Totem de Fotos", price: 220, description: "Estrutura decorada para fotos" },
  { id: "kit-festa", name: "Kit Festa Completo", price: 180, description: "Pratos, copos, guardanapos e talheres descartáveis" },
];

export const BudgetCalculator = () => {
  const { toast } = useToast();
  const { data: dbServices, isLoading } = useServices();
  const { data: settings } = useSiteSettings();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState<Date>();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    guests: "",
    details: "",
  });

  const services: ServiceItem[] = dbServices && dbServices.length > 0 
    ? dbServices.map(s => ({ id: s.id, name: s.name, price: Number(s.price), description: s.description }))
    : fallbackServices;

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const calculateTotal = () => {
    return services
      .filter((service) => selectedServices.includes(service.id))
      .reduce((total, service) => total + service.price, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || selectedServices.length === 0 || !eventDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios e selecione pelo menos um serviço.",
        variant: "destructive",
      });
      return;
    }

    const whatsappNumber = settings?.whatsapp_number?.replace(/\D/g, "") || "";
    
    if (!whatsappNumber) {
      toast({
        title: "WhatsApp não configurado",
        description: "Entre em contato por telefone.",
        variant: "destructive",
      });
      return;
    }

    const selectedServicesList = services
      .filter((service) => selectedServices.includes(service.id))
      .map((s) => `• ${s.name}: R$ ${s.price.toLocaleString("pt-BR")}`)
      .join("%0A");

    const total = calculateTotal();
    const formattedDate = format(eventDate, "dd/MM/yyyy", { locale: ptBR });

    const headerMessage = settings?.whatsapp_budget_message 
      ? encodeURIComponent(settings.whatsapp_budget_message)
      : "*🎉 Solicitação de Orçamento*";

    const text = `${headerMessage}%0A%0A*Nome:* ${encodeURIComponent(formData.name)}%0A*Telefone:* ${encodeURIComponent(formData.phone)}%0A*Data do Evento:* ${formattedDate}%0A*Número de Convidados:* ${formData.guests || "Não informado"}%0A%0A*📋 Serviços Selecionados:*%0A${selectedServicesList}%0A%0A*💰 Total Estimado:* R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%0A%0A*📝 Detalhes:* ${encodeURIComponent(formData.details) || "Nenhum"}`;
    
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");

    toast({
      title: "Redirecionando para o WhatsApp! 🎉",
      description: "Você será direcionado para o WhatsApp com seu orçamento.",
    });

    // Reset form
    setSelectedServices([]);
    setEventDate(undefined);
    setFormData({
      name: "",
      phone: "",
      guests: "",
      details: "",
    });
  };

  const total = calculateTotal();

  return (
    <section id="orcamento" className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Calculadora de Orçamento</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Calcule seu Orçamento
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Selecione os serviços desejados e envie seu orçamento diretamente pelo WhatsApp
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Services Selection */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Selecione os Serviços
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    services.map((service) => {
                      const isSelected = selectedServices.includes(service.id);
                      return (
                        <label
                          key={service.id}
                          htmlFor={`service-${service.id}`}
                          className={cn(
                            "flex items-start space-x-3 p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:border-primary",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          )}
                        >
                          <NativeCheckbox
                            id={`service-${service.id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleServiceToggle(service.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <span className="text-base font-semibold">
                              {service.name}
                            </span>
                            <p className="text-sm text-muted-foreground">
                              {service.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              R$ {service.price.toLocaleString("pt-BR")}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Informações do Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Seu nome"
                        required
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
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
                      <Label htmlFor="guests">Número de Convidados</Label>
                      <Input
                        id="guests"
                        type="number"
                        value={formData.guests}
                        onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                        placeholder="Ex: 50"
                        min="1"
                        max="9999"
                      />
                    </div>

                    <div>
                      <Label>Data do Evento *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !eventDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {eventDate ? (
                              format(eventDate, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={eventDate}
                            onSelect={setEventDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="details">Detalhes Adicionais</Label>
                    <Textarea
                      id="details"
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      placeholder="Conte-nos mais sobre sua festa: tema, horário, local, necessidades especiais..."
                      rows={4}
                      maxLength={1000}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <Card className="border-2 sticky top-4">
                <CardHeader className="bg-gradient-to-br from-primary/10 to-secondary/10">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    Resumo do Orçamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {selectedServices.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                        Serviços Selecionados
                      </h4>
                      {services
                        .filter((service) => selectedServices.includes(service.id))
                        .map((service) => (
                          <div
                            key={service.id}
                            className="flex justify-between items-start pb-3 border-b border-border last:border-0"
                          >
                            <span className="text-sm">{service.name}</span>
                            <span className="text-sm font-semibold">
                              R$ {service.price.toLocaleString("pt-BR")}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        Selecione os serviços para ver o orçamento
                      </p>
                    </div>
                  )}

                  {selectedServices.length > 0 && (
                    <>
                      <div className="pt-4 border-t-2 border-primary/20">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-foreground">Total</span>
                          <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          * Valor estimado. O preço final pode variar conforme localização e
                          detalhes do evento.
                        </p>
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-[#25D366] hover:bg-[#20BA5C] text-white transition-all duration-300"
                    disabled={selectedServices.length === 0}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Enviar pelo WhatsApp
                  </Button>

                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-primary">✓</span>
                      <span className="text-muted-foreground">
                        Orçamento sem compromisso
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-primary">✓</span>
                      <span className="text-muted-foreground">
                        Resposta rápida via WhatsApp
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-primary">✓</span>
                      <span className="text-muted-foreground">
                        Atendimento personalizado
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};
