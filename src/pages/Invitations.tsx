import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Download, Share2, PartyPopper, Crown, Rocket, Palette, Edit3, Gift, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { InvitationEditor } from "@/components/InvitationEditor";
import { GiftListManager, type GiftItem } from "@/components/invitation/GiftListManager";

const THEMES = [
  { value: "princesas", label: "Princesas", icon: "👸", color: "from-pink-400 to-purple-500" },
  { value: "herois", label: "Super-Heróis", icon: "🦸", color: "from-red-500 to-blue-600" },
  { value: "dinossauros", label: "Dinossauros", icon: "🦖", color: "from-green-500 to-emerald-600" },
  { value: "unicornios", label: "Unicórnios", icon: "🦄", color: "from-pink-300 to-purple-400" },
  { value: "safari", label: "Safari", icon: "🦁", color: "from-amber-500 to-orange-500" },
  { value: "espacial", label: "Espaço", icon: "🚀", color: "from-indigo-600 to-purple-700" },
  { value: "fundo_do_mar", label: "Fundo do Mar", icon: "🐠", color: "from-cyan-400 to-blue-500" },
  { value: "futebol", label: "Futebol", icon: "⚽", color: "from-green-500 to-green-700" },
  { value: "fazendinha", label: "Fazendinha", icon: "🐄", color: "from-yellow-500 to-amber-600" },
  { value: "circo", label: "Circo", icon: "🎪", color: "from-red-500 to-yellow-500" },
  { value: "frozen", label: "Frozen", icon: "❄️", color: "from-cyan-300 to-blue-500" },
  { value: "carros", label: "Carros", icon: "🏎️", color: "from-red-600 to-red-800" },
  { value: "peppa_pig", label: "Peppa Pig", icon: "🐷", color: "from-pink-400 to-pink-600" },
  { value: "minnie", label: "Minnie Mouse", icon: "🎀", color: "from-pink-500 to-red-400" },
  { value: "mickey", label: "Mickey Mouse", icon: "🐭", color: "from-red-500 to-yellow-400" },
  { value: "patrulha_canina", label: "Patrulha Canina", icon: "🐕", color: "from-blue-500 to-red-500" },
  { value: "barbie", label: "Barbie", icon: "👛", color: "from-pink-400 to-pink-600" },
  { value: "hot_wheels", label: "Hot Wheels", icon: "🔥", color: "from-orange-500 to-blue-600" },
];

interface GeneratedInvitation {
  id: string;
  share_token: string;
  image_url: string;
  child_name: string;
  child_age: number | null;
  theme: string;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
}

export default function Invitations() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingGifts, setSavingGifts] = useState(false);
  const [generatedInvitation, setGeneratedInvitation] = useState<GeneratedInvitation | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [giftListEnabled, setGiftListEnabled] = useState(false);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [giftsSaved, setGiftsSaved] = useState(false);
  
  const [formData, setFormData] = useState({
    childName: "",
    childAge: "",
    theme: "",
    eventDate: "",
    eventTime: "",
    eventLocation: "",
    additionalInfo: "",
  });

  const handleAddGift = (gift: Omit<GiftItem, "id">) => {
    const newGift: GiftItem = {
      ...gift,
      id: `temp-${Date.now()}`,
    };
    setGifts((prev) => [...prev, newGift]);
    setGiftsSaved(false);
  };

  const handleRemoveGift = (id: string) => {
    setGifts((prev) => prev.filter((g) => g.id !== id));
    setGiftsSaved(false);
  };

  const handleGenerate = async () => {
    if (!formData.childName || !formData.theme) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome da criança e escolha um tema.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invitation", {
        body: {
          childName: formData.childName,
          childAge: formData.childAge ? parseInt(formData.childAge) : null,
          theme: formData.theme,
          eventDate: formData.eventDate || null,
          eventTime: formData.eventTime || null,
          eventLocation: formData.eventLocation || null,
          additionalInfo: formData.additionalInfo || null,
        },
      });

      if (error) throw error;

      setGeneratedInvitation(data.invitation);

      // If gift list is enabled, save it
      if (giftListEnabled && gifts.length > 0) {
        await saveGiftList(data.invitation.id);
      }

      toast({
        title: "Convite gerado!",
        description: "Seu convite personalizado foi criado com sucesso.",
      });
    } catch (error: any) {
      console.error("Error generating invitation:", error);
      toast({
        title: "Erro ao gerar convite",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveGiftList = async (invitationId: string) => {
    setSavingGifts(true);
    try {
      // Create gift list
      const { data: giftList, error: listError } = await supabase
        .from("gift_lists")
        .insert({ invitation_id: invitationId })
        .select()
        .single();

      if (listError) throw listError;

      // Create gift items
      const giftItems = gifts.map((g) => ({
        gift_list_id: giftList.id,
        name: g.name,
        description: g.description || null,
        price: g.price || null,
        link_url: g.link_url || null,
        image_url: g.image_url || null,
      }));

      const { error: itemsError } = await supabase
        .from("gift_items")
        .insert(giftItems);

      if (itemsError) throw itemsError;

      setGiftsSaved(true);
      toast({
        title: "Lista de presentes salva!",
        description: `${gifts.length} presentes foram adicionados à lista.`,
      });
    } catch (error) {
      console.error("Error saving gift list:", error);
      toast({
        title: "Erro ao salvar lista",
        description: "Não foi possível salvar a lista de presentes.",
        variant: "destructive",
      });
    } finally {
      setSavingGifts(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedInvitation?.image_url) return;

    try {
      const response = await fetch(generatedInvitation.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `convite-${generatedInvitation.child_name.replace(/\s+/g, "-").toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(generatedInvitation.image_url, "_blank");
    }
  };

  const handleShare = async () => {
    if (!generatedInvitation) return;

    const shareUrl = `${window.location.origin}/convite/${generatedInvitation.share_token}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite de Aniversário - ${generatedInvitation.child_name}`,
          text: `Você está convidado para a festa de aniversário de ${generatedInvitation.child_name}!`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado!",
        description: "O link do convite foi copiado para a área de transferência.",
      });
    }
  };

  const copyGiftListLink = async () => {
    if (!generatedInvitation) return;
    const giftUrl = `${window.location.origin}/presentes/${generatedInvitation.share_token}`;
    await navigator.clipboard.writeText(giftUrl);
    toast({
      title: "Link da lista copiado!",
      description: "Compartilhe este link para que os convidados vejam sua lista de presentes.",
    });
  };

  const selectedTheme = THEMES.find(t => t.value === formData.theme);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <PartyPopper className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl">Bella Arte</span>
          </Link>
          <h1 className="text-lg font-semibold text-muted-foreground">Criar Convite</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Gerado por Inteligência Artificial</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Crie Convites de Aniversário Únicos
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Personalize o convite perfeito para a festa do seu filho com nossa tecnologia de IA.
              Escolha um tema e deixe a magia acontecer!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Personalizar Convite
                  </CardTitle>
                  <CardDescription>
                    Preencha os dados para gerar seu convite exclusivo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="childName">Nome da Criança *</Label>
                      <Input
                        id="childName"
                        placeholder="Ex: Maria"
                        value={formData.childName}
                        onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="childAge">Idade</Label>
                      <Input
                        id="childAge"
                        type="number"
                        min="1"
                        max="18"
                        placeholder="Ex: 5"
                        value={formData.childAge}
                        onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tema do Convite *</Label>
                    <Select 
                      value={formData.theme} 
                      onValueChange={(value) => setFormData({ ...formData, theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um tema" />
                      </SelectTrigger>
                      <SelectContent>
                        {THEMES.map((theme) => (
                          <SelectItem key={theme.value} value={theme.value}>
                            <span className="flex items-center gap-2">
                              <span>{theme.icon}</span>
                              <span>{theme.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Theme Preview */}
                  {selectedTheme && (
                    <div className={`p-4 rounded-lg bg-gradient-to-r ${selectedTheme.color} text-white text-center`}>
                      <span className="text-4xl">{selectedTheme.icon}</span>
                      <p className="font-semibold mt-2">Tema: {selectedTheme.label}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventDate">Data do Evento</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventTime">Horário</Label>
                      <Input
                        id="eventTime"
                        type="time"
                        value={formData.eventTime}
                        onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventLocation">Local do Evento</Label>
                    <Input
                      id="eventLocation"
                      placeholder="Ex: Salão de Festas, Rua..."
                      value={formData.eventLocation}
                      onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalInfo">Informações Adicionais</Label>
                    <Textarea
                      id="additionalInfo"
                      placeholder="Ex: Traje, RSVP, observações..."
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Gift List Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Lista de Presentes
                  </CardTitle>
                  <CardDescription>
                    Adicione os presentes que você deseja receber. Os convidados poderão ver e reservar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GiftListManager
                    gifts={gifts}
                    onAddGift={handleAddGift}
                    onRemoveGift={handleRemoveGift}
                    giftListEnabled={giftListEnabled}
                    onToggleGiftList={setGiftListEnabled}
                  />
                </CardContent>
              </Card>

              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleGenerate}
                disabled={loading || !formData.childName || !formData.theme}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando convite com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Convite Mágico
                  </>
                )}
              </Button>
            </div>

            {/* Preview Section */}
            <Card className="h-fit sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Prévia do Convite
                </CardTitle>
                <CardDescription>
                  Seu convite personalizado aparecerá aqui
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedInvitation ? (
                  <div className="space-y-4">
                    {showEditor ? (
                      <InvitationEditor
                        imageUrl={generatedInvitation.image_url}
                        childName={generatedInvitation.child_name}
                        childAge={generatedInvitation.child_age}
                        eventDate={generatedInvitation.event_date}
                        eventTime={generatedInvitation.event_time}
                        eventLocation={generatedInvitation.event_location}
                      />
                    ) : (
                      <>
                        <div className="relative rounded-lg overflow-hidden shadow-lg">
                          <img
                            src={generatedInvitation.image_url}
                            alt="Convite gerado"
                            className="w-full h-auto"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
                            <h2 className="text-2xl font-bold drop-shadow-lg">
                              {generatedInvitation.child_name}
                              {generatedInvitation.child_age && ` faz ${generatedInvitation.child_age} anos!`}
                            </h2>
                            {generatedInvitation.event_date && (
                              <p className="drop-shadow-lg">
                                📅 {new Date(generatedInvitation.event_date).toLocaleDateString("pt-BR")}
                                {generatedInvitation.event_time && ` às ${generatedInvitation.event_time}`}
                              </p>
                            )}
                            {generatedInvitation.event_location && (
                              <p className="drop-shadow-lg">📍 {generatedInvitation.event_location}</p>
                            )}
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => setShowEditor(true)}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Personalizar Textos e Adesivos
                        </Button>

                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={handleDownload}>
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                          <Button variant="outline" className="flex-1" onClick={handleShare}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartilhar
                          </Button>
                        </div>

                        {giftListEnabled && gifts.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <p className="text-sm font-medium flex items-center gap-2">
                                <Gift className="w-4 h-4" />
                                Link da Lista de Presentes
                              </p>
                              <div className="flex gap-2">
                                <Input
                                  readOnly
                                  value={`${window.location.origin}/presentes/${generatedInvitation.share_token}`}
                                  className="text-xs"
                                />
                                <Button variant="outline" size="icon" onClick={copyGiftListLink}>
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Compartilhe este link para que os convidados vejam e reservem os presentes.
                              </p>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-muted/50 rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                    <Rocket className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-center px-4">
                      Preencha os dados e clique em "Gerar Convite Mágico" para criar seu convite personalizado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
