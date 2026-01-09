import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Package, Search, Loader2, MapPin, CheckCircle2, 
  Truck, Clock, AlertCircle, PackageCheck
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TrackingEvent {
  status: string;
  description: string;
  location: string | null;
  event_date: string;
}

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  
  const [trackingCode, setTrackingCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [carrier, setCarrier] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleTrack = async () => {
    if (!trackingCode.trim()) {
      toast.error("Digite o código de rastreio");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke("track-order", {
        body: { tracking_code: trackingCode.trim() },
      });

      if (error) throw error;

      if (data?.success) {
        setEvents(data.events || []);
        setCarrier(data.carrier);
        
        if (data.events?.length === 0) {
          toast.info("Nenhum evento de rastreio encontrado ainda");
        }
      } else {
        throw new Error(data?.error || "Erro ao rastrear");
      }
    } catch (error) {
      console.error("Tracking error:", error);
      toast.error("Erro ao rastrear pedido. Verifique o código e tente novamente.");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("entregue")) {
      return <PackageCheck className="w-5 h-5 text-green-600" />;
    }
    if (lowerStatus.includes("saiu para entrega")) {
      return <Truck className="w-5 h-5 text-blue-600" />;
    }
    if (lowerStatus.includes("trânsito")) {
      return <Truck className="w-5 h-5 text-amber-600" />;
    }
    if (lowerStatus.includes("postado")) {
      return <Package className="w-5 h-5 text-primary" />;
    }
    return <Clock className="w-5 h-5 text-muted-foreground" />;
  };

  const getStatusColor = (status: string, index: number) => {
    if (index === 0) return "border-primary bg-primary/10";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("entregue")) return "border-green-500 bg-green-50";
    return "border-muted bg-muted/50";
  };

  return (
    <>
      <Helmet>
        <title>Rastrear Pedido | Bella Arte</title>
        <meta name="description" content="Acompanhe o status da entrega do seu pedido" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Rastrear Pedido</h1>
              <p className="text-muted-foreground">
                Acompanhe o status da entrega do seu pedido em tempo real
              </p>
            </div>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="tracking" className="sr-only">Código de Rastreio</Label>
                    <Input
                      id="tracking"
                      placeholder="Digite o código de rastreio"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                      className="text-lg"
                    />
                  </div>
                  <Button onClick={handleTrack} disabled={isLoading} size="lg">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Rastrear
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {hasSearched && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Histórico de Rastreio
                      </CardTitle>
                      <CardDescription>
                        Código: <span className="font-mono font-bold">{trackingCode}</span>
                        {carrier && <span className="ml-2">• {carrier}</span>}
                      </CardDescription>
                    </div>
                    {events.length > 0 && (
                      <Badge variant={events[0].status.toLowerCase().includes("entregue") ? "default" : "secondary"}>
                        {events[0].status}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum evento de rastreio encontrado.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Os eventos podem levar algumas horas para aparecer após a postagem.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted" />
                      
                      <div className="space-y-6">
                        {events.map((event, index) => (
                          <div key={index} className="relative flex gap-4">
                            {/* Timeline dot */}
                            <div className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getStatusColor(event.status, index)}`}>
                              {getStatusIcon(event.status)}
                            </div>
                            
                            <div className="flex-1 pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-semibold">{event.status}</h4>
                                  {event.description && event.description !== event.status && (
                                    <p className="text-sm text-muted-foreground">{event.description}</p>
                                  )}
                                  {event.location && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      {event.location}
                                    </p>
                                  )}
                                </div>
                                <time className="text-xs text-muted-foreground whitespace-nowrap">
                                  {format(new Date(event.event_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </time>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
