import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Gift, Check, ExternalLink, ArrowLeft, Loader2, PartyPopper, Heart } from "lucide-react";
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
  theme: string;
  image_url: string | null;
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
        .select("id, child_name, theme, image_url")
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
        description: `Você reservou "${reservingGift.name}". Obrigado!`,
      });

      setTimeout(() => setShowConfetti(false), 3000);
    } catch (error) {
      console.error("Error reserving gift:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reservar o presente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
        <Gift className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Lista não encontrada</h1>
        <p className="text-muted-foreground mb-4">Esta lista de presentes não existe ou foi removida.</p>
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
          <Link to={`/convite/${token}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao convite</span>
          </Link>
          <div className="flex items-center gap-2">
            <PartyPopper className="w-6 h-6 text-primary" />
            <span className="font-semibold">Lista de Presentes</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Gift className="w-4 h-4" />
              <span className="text-sm font-medium">Lista de Desejos</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Presentes para {invitation.child_name}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Escolha um presente especial para dar nesta festa incrível! 
              Reserve seu presente para que outros convidados saibam que você já vai dar.
            </p>
          </div>

          {gifts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
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
                  className={`transition-all ${
                    gift.is_reserved ? "opacity-75" : "hover:shadow-lg"
                  }`}
                >
                  {gift.image_url && (
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      <img
                        src={gift.image_url}
                        alt={gift.name}
                        className="w-full h-full object-cover"
                      />
                      {gift.is_reserved && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">Reservado</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{gift.name}</CardTitle>
                      {!gift.image_url && gift.is_reserved && (
                        <div className="bg-green-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span className="text-xs">Reservado</span>
                        </div>
                      )}
                    </div>
                    {gift.description && (
                      <CardDescription>{gift.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {gift.price && (
                      <p className="text-lg font-semibold text-primary">
                        R$ {gift.price.toFixed(2)}
                      </p>
                    )}

                    {gift.is_reserved ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        Reservado por {gift.reserved_by}
                      </p>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => setReservingGift(gift)}
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          Reservar
                        </Button>
                        {gift.link_url && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(gift.link_url!, "_blank")}
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
        </div>
      </main>

      {/* Reserve Dialog */}
      <Dialog open={!!reservingGift} onOpenChange={() => setReservingGift(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservar Presente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Você está reservando: <strong>{reservingGift?.name}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="guest-name">Seu Nome</Label>
              <Input
                id="guest-name"
                placeholder="Digite seu nome"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReservingGift(null)}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleReserve}>
                <Check className="w-4 h-4 mr-2" />
                Confirmar Reserva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
