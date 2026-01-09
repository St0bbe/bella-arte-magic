import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Gift, Trash2, ExternalLink, Sparkles, ShoppingBag, Star, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface GiftItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  link_url?: string;
  image_url?: string;
}

interface GiftListManagerProps {
  gifts: GiftItem[];
  onAddGift: (gift: Omit<GiftItem, "id">) => void;
  onRemoveGift: (id: string) => void;
  giftListEnabled: boolean;
  onToggleGiftList: (enabled: boolean) => void;
}

// Sugestões de presentes populares por categoria
const GIFT_SUGGESTIONS = [
  {
    category: "Brinquedos",
    icon: "🧸",
    items: [
      { name: "Boneca Barbie", price: 89.90 },
      { name: "Carrinho Hot Wheels", price: 29.90 },
      { name: "LEGO Classic", price: 149.90 },
      { name: "Jogo de Tabuleiro", price: 79.90 },
      { name: "Pelúcia Grande", price: 69.90 },
      { name: "Quebra-Cabeça", price: 39.90 },
    ],
  },
  {
    category: "Eletrônicos",
    icon: "🎮",
    items: [
      { name: "Jogo de Videogame", price: 199.90 },
      { name: "Fone de Ouvido Infantil", price: 79.90 },
      { name: "Tablet Infantil", price: 299.90 },
      { name: "Câmera Infantil", price: 149.90 },
    ],
  },
  {
    category: "Roupas",
    icon: "👕",
    items: [
      { name: "Pijama Temático", price: 59.90 },
      { name: "Fantasia", price: 89.90 },
      { name: "Tênis", price: 129.90 },
      { name: "Mochila Escolar", price: 99.90 },
    ],
  },
  {
    category: "Livros",
    icon: "📚",
    items: [
      { name: "Livro Ilustrado", price: 49.90 },
      { name: "Coleção de Histórias", price: 79.90 },
      { name: "Livro de Atividades", price: 34.90 },
    ],
  },
  {
    category: "Esportes",
    icon: "⚽",
    items: [
      { name: "Bola de Futebol", price: 69.90 },
      { name: "Patinete", price: 199.90 },
      { name: "Bicicleta", price: 399.90 },
      { name: "Kit Esportivo", price: 89.90 },
    ],
  },
];

export function GiftListManager({
  gifts,
  onAddGift,
  onRemoveGift,
  giftListEnabled,
  onToggleGiftList,
}: GiftListManagerProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sugestoes");
  const [newGift, setNewGift] = useState({
    name: "",
    description: "",
    price: "",
    link_url: "",
    image_url: "",
  });

  const handleAddGift = () => {
    if (!newGift.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do presente.",
        variant: "destructive",
      });
      return;
    }

    onAddGift({
      name: newGift.name,
      description: newGift.description || undefined,
      price: newGift.price ? parseFloat(newGift.price) : undefined,
      link_url: newGift.link_url || undefined,
      image_url: newGift.image_url || undefined,
    });

    setNewGift({ name: "", description: "", price: "", link_url: "", image_url: "" });
    setIsOpen(false);
    toast({
      title: "Presente adicionado! 🎁",
      description: `"${newGift.name}" foi adicionado à lista.`,
    });
  };

  const handleAddSuggestion = (item: { name: string; price: number }) => {
    onAddGift({
      name: item.name,
      price: item.price,
    });
    toast({
      title: "Presente adicionado! 🎁",
      description: `"${item.name}" foi adicionado à lista.`,
    });
  };

  const isGiftInList = (name: string) => {
    return gifts.some((g) => g.name.toLowerCase() === name.toLowerCase());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base font-medium">
          <Gift className="w-5 h-5 text-primary" />
          Lista de Presentes
        </Label>
        <Button
          variant={giftListEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => onToggleGiftList(!giftListEnabled)}
          className={giftListEnabled ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {giftListEnabled ? "✓ Ativada" : "Ativar"}
        </Button>
      </div>

      {giftListEnabled && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3 border border-pink-100">
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>
                Adicione presentes que você gostaria de receber. Os convidados receberão um link especial para ver e reservar os presentes!
              </span>
            </p>
          </div>

          {gifts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {gifts.length} presente{gifts.length !== 1 ? "s" : ""} na lista
                </p>
                <Badge variant="secondary" className="gap-1">
                  <ShoppingBag className="w-3 h-3" />
                  R$ {gifts.reduce((sum, g) => sum + (g.price || 0), 0).toFixed(2)}
                </Badge>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {gifts.map((gift, index) => (
                  <Card 
                    key={gift.id} 
                    className="p-3 flex items-center justify-between hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{gift.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {gift.price && (
                            <span className="text-green-600 font-medium">
                              R$ {gift.price.toFixed(2)}
                            </span>
                          )}
                          {gift.link_url && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <LinkIcon className="w-2.5 h-2.5" />
                              Link
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {gift.link_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(gift.link_url, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onRemoveGift(gift.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Presente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Adicionar Presente
                </DialogTitle>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="sugestoes" className="gap-1">
                    <Star className="w-4 h-4" />
                    Sugestões
                  </TabsTrigger>
                  <TabsTrigger value="personalizado" className="gap-1">
                    <Plus className="w-4 h-4" />
                    Personalizado
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sugestoes" className="flex-1 overflow-y-auto mt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Clique para adicionar rapidamente presentes populares:
                  </p>
                  {GIFT_SUGGESTIONS.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.category}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {category.items.map((item) => {
                          const isAdded = isGiftInList(item.name);
                          return (
                            <Button
                              key={item.name}
                              variant={isAdded ? "secondary" : "outline"}
                              size="sm"
                              className="justify-start h-auto py-2 px-3"
                              disabled={isAdded}
                              onClick={() => handleAddSuggestion(item)}
                            >
                              <div className="text-left">
                                <p className="text-xs font-medium truncate">
                                  {isAdded && "✓ "}{item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  R$ {item.price.toFixed(2)}
                                </p>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="personalizado" className="flex-1 overflow-y-auto mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gift-name">Nome do Presente *</Label>
                      <Input
                        id="gift-name"
                        placeholder="Ex: Boneca Barbie Dreamhouse"
                        value={newGift.name}
                        onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gift-description">Descrição (opcional)</Label>
                      <Textarea
                        id="gift-description"
                        placeholder="Ex: Modelo rosa, tamanho grande..."
                        value={newGift.description}
                        onChange={(e) => setNewGift({ ...newGift, description: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gift-price">Preço Estimado</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            R$
                          </span>
                          <Input
                            id="gift-price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="99,90"
                            className="pl-10"
                            value={newGift.price}
                            onChange={(e) => setNewGift({ ...newGift, price: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gift-link">Link da Loja</Label>
                        <Input
                          id="gift-link"
                          type="url"
                          placeholder="https://..."
                          value={newGift.link_url}
                          onChange={(e) => setNewGift({ ...newGift, link_url: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gift-image">URL da Imagem (opcional)</Label>
                      <Input
                        id="gift-image"
                        type="url"
                        placeholder="https://..."
                        value={newGift.image_url}
                        onChange={(e) => setNewGift({ ...newGift, image_url: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
                        Cancelar
                      </Button>
                      <Button className="flex-1 gap-2" onClick={handleAddGift}>
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
