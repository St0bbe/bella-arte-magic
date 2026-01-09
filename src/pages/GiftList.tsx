import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Gift, Check, ExternalLink, ArrowLeft, Loader2, PartyPopper, Heart, ShoppingBag, Users, Sparkles } from "lucide-react";
import { ConfettiEffect } from "@/components/ConfettiEffect";

interface GiftItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  link_url: string | null;
  image_url: string | null;
  is_reserved: boolean | null;
  reserved_by: string | null;
}

interface Invitation {
  id: string;
  child_name: string;
  child_age: number | null;
  theme: string;
  image_url: string | null;
  event_date: string | null;
}

export default function GiftList() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [reservingGift, setReservingGift] = useState<GiftItem | null>(null);
  const [guestName, setGuestName] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      // Fetch invitation
      const { data: invitationData, error: invitationError } = await supabase
        .from("invitations")
        .select("id, child_name, child_age, theme, image_url, event_date")
        .eq("share_token", token)
        .single();

      if (invitationError) throw invitationError;
      setInvitation(invitationData);

      // Fetch gift list
      const { data: giftListData } = await supabase
        .from("gift_lists")
        .select("id")
        .eq("invitation_id", invitationData.id)
        .single();

      if (giftListData) {
        const { data: giftItems } = await supabase
          .from("gift_items")
          .select("*")
          .eq("gift_list_id", giftListData.id)
          .order("is_reserved", { ascending: true })
          .order("created_at", { ascending: true });

        setGifts(giftItems || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!reservingGift || !guestName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite seu nome para reservar o presente.",
        variant: "destructive",
      });
      return;
    }

    setReserving(true);
    try {
      const { error } = await supabase
        .from("gift_items")
        .update({
          is_reserved: true,
          reserved_by: guestName.trim(),
          reserved_at: new Date().toISOString(),
        })
        .eq("id", reservingGift.id);

      if (error) throw error;

      setGifts((prev) =>
        prev.map((g) =>
          g.id === reservingGift.id
            ? { ...g, is_reserved: true, reserved_by: guestName.trim() }
            : g
        )
      );

      setReservingGift(null);
      setGuestName("");
      setShowConfetti(true);

      toast({
        title: "Presente reservado! 🎁",
        description: `Você reservou "${reservingGift.name}". Obrigado pela gentileza!`,
      });

      setTimeout(() => setShowConfetti(false), 3000);
    } catch (error) {
      console.error("Error reserving gift:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reservar o presente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setReserving(false);
    }
  };

  const totalGifts = gifts.length;
  const reservedGifts = gifts.filter((g) => g.is_reserved).length;
  const totalValue = gifts.reduce((sum, g) => sum + (g.price || 0), 0);
  const reservedValue = gifts.filter((g) => g.is_reserved).reduce((sum, g) => sum + (g.price || 0), 0);
  const progressPercent = totalGifts > 0 ? (reservedGifts / totalGifts) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando lista de presentes...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Gift className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Lista não encontrada</h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Esta lista de presentes não existe ou foi removida.
        </p>
        <Link to="/">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {showConfetti && <ConfettiEffect trigger={showConfetti} />}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={`/convite/${token}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar ao convite</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Lista de Presentes</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full mb-4 shadow-lg">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Lista de Desejos</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Presentes para {invitation.child_name}
              {invitation.child_age && ` (${invitation.child_age} anos)`}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Escolha um presente especial para dar nesta festa incrível! 
              Reserve para que outros convidados saibam que você já vai presentear.
            </p>
          </div>

          {/* Stats */}
          {gifts.length > 0 && (
            <Card className="mb-6 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-100">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                      <ShoppingBag className="w-5 h-5" />
                      {totalGifts}
                    </div>
                    <p className="text-xs text-muted-foreground">Total de presentes</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                      <Check className="w-5 h-5" />
                      {reservedGifts}
                    </div>
                    <p className="text-xs text-muted-foreground">Reservados</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-600">
                      <Gift className="w-5 h-5" />
                      {totalGifts - reservedGifts}
                    </div>
                    <p className="text-xs text-muted-foreground">Disponíveis</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso</span>
                    <span>{Math.round(progressPercent)}% reservado</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {gifts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <Gift className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Nenhum presente na lista</h2>
                <p className="text-muted-foreground">
                  O anfitrião ainda não adicionou presentes à lista.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gifts.map((gift) => (
                <Card
                  key={gift.id}
                  className={`transition-all group ${
                    gift.is_reserved 
                      ? "opacity-75 bg-gray-50" 
                      : "hover:shadow-lg hover:-translate-y-1"
                  }`}
                >
                  {gift.image_url && (
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      <img
                        src={gift.image_url}
                        alt={gift.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {gift.is_reserved && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">Reservado</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-tight">{gift.name}</CardTitle>
                      {!gift.image_url && gift.is_reserved && (
                        <Badge className="bg-green-500 gap-1 flex-shrink-0">
                          <Check className="w-3 h-3" />
                          Reservado
                        </Badge>
                      )}
                    </div>
                    {gift.description && (
                      <CardDescription className="line-clamp-2">{gift.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {gift.price && (
                      <p className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        R$ {gift.price.toFixed(2)}
                      </p>
                    )}

                    {gift.is_reserved ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-green-50 rounded-lg p-2">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                        <span>Reservado por <strong>{gift.reserved_by}</strong></span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                          onClick={() => setReservingGift(gift)}
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          Vou Dar Este!
                        </Button>
                        {gift.link_url && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(gift.link_url!, "_blank")}
                            title="Ver na loja"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Footer tip */}
          {gifts.length > 0 && totalGifts - reservedGifts > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                💡 Dica: Reserve um presente para evitar que outros convidados deem o mesmo presente!
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Reserve Dialog */}
      <Dialog open={!!reservingGift} onOpenChange={() => setReservingGift(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Reservar Presente
            </DialogTitle>
            <DialogDescription>
              Informe seu nome para que os outros convidados saibam que você vai dar este presente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reservingGift && (
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-100">
                <p className="font-medium">{reservingGift.name}</p>
                {reservingGift.price && (
                  <p className="text-sm text-muted-foreground">
                    R$ {reservingGift.price.toFixed(2)}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="guest-name">Seu Nome</Label>
              <Input
                id="guest-name"
                placeholder="Digite seu nome completo"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReserve()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReservingGift(null)}
                disabled={reserving}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" 
                onClick={handleReserve}
                disabled={reserving}
              >
                {reserving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reservando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
