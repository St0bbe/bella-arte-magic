import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Share2, PartyPopper, AlertCircle, ArrowLeft, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfettiEffect } from "@/components/ConfettiEffect";
import { useCelebrationSound } from "@/hooks/useCelebrationSound";

interface Invitation {
  id: string;
  child_name: string;
  child_age: number | null;
  theme: string;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
  additional_info: string | null;
  image_url: string | null;
  created_at: string;
}

export default function InvitationView() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const { playSound } = useCelebrationSound();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("invitations")
        .select("*")
        .eq("share_token", token)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError("Convite não encontrado");
        setLoading(false);
        return;
      }

      setInvitation(data);
      // Trigger celebration effect when invitation loads
      setTimeout(() => {
        setShowConfetti(true);
        playSound();
      }, 500);
    } catch (err: any) {
      console.error("Error fetching invitation:", err);
      setError("Erro ao carregar convite");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!invitation?.image_url) return;

    try {
      const response = await fetch(invitation.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `convite-${invitation.child_name.replace(/\s+/g, "-").toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(invitation.image_url, "_blank");
    }
  };

  const handleShare = async () => {
    if (!invitation) return;

    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite de Aniversário - ${invitation.child_name}`,
          text: `Você está convidado para a festa de aniversário de ${invitation.child_name}!`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado!",
        description: "O link do convite foi copiado.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Convite não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              {error || "O link pode estar incorreto ou expirado."}
            </p>
            <Button asChild>
              <Link to="/convites">Criar novo convite</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 py-8 px-4">
      <ConfettiEffect trigger={showConfetti} />
      
      <div className="max-w-lg mx-auto">
        <Link 
          to="/convites" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Criar meu próprio convite
        </Link>

        <Card className="overflow-hidden shadow-2xl">
          <div className="relative">
            {invitation.image_url && (
              <img
                src={invitation.image_url}
                alt={`Convite de ${invitation.child_name}`}
                className="w-full h-auto"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
              <div className="text-center space-y-2">
                <p className="text-lg opacity-90">Você está convidado para o aniversário de</p>
                <h1 className="text-4xl font-bold drop-shadow-lg">
                  {invitation.child_name}
                </h1>
                {invitation.child_age && (
                  <p className="text-2xl font-semibold">
                    {invitation.child_age} {invitation.child_age === 1 ? "ano" : "anos"}! 🎂
                  </p>
                )}
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              {invitation.event_date && (
                <p className="text-lg flex items-center justify-center gap-2">
                  📅 {new Date(invitation.event_date).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
              {invitation.event_time && (
                <p className="text-lg flex items-center justify-center gap-2">
                  ⏰ {invitation.event_time}
                </p>
              )}
              {invitation.event_location && (
                <p className="text-lg flex items-center justify-center gap-2">
                  📍 {invitation.event_location}
                </p>
              )}
            </div>

            {invitation.additional_info && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-muted-foreground">{invitation.additional_info}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>

            <Link to={`/presentes/${token}`} className="block">
              <Button variant="secondary" className="w-full">
                <Gift className="w-4 h-4 mr-2" />
                Ver Lista de Presentes
              </Button>
            </Link>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <PartyPopper className="w-4 h-4" />
                Criado com Bella Arte
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
