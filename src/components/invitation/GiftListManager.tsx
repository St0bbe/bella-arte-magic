import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Gift, Trash2, ExternalLink, X } from "lucide-react";
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

export function GiftListManager({
  gifts,
  onAddGift,
  onRemoveGift,
  giftListEnabled,
  onToggleGiftList,
}: GiftListManagerProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
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
      title: "Presente adicionado!",
      description: `"${newGift.name}" foi adicionado à lista.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Gift className="w-4 h-4" />
          Lista de Presentes
        </Label>
        <Button
          variant={giftListEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => onToggleGiftList(!giftListEnabled)}
        >
          {giftListEnabled ? "Ativada" : "Desativada"}
        </Button>
      </div>

      {giftListEnabled && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Adicione presentes que você gostaria de receber. Os convidados poderão ver a lista e marcar os presentes que vão dar.
          </p>

          {gifts.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gifts.map((gift) => (
                <Card key={gift.id} className="p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{gift.name}</p>
                    {gift.price && (
                      <p className="text-sm text-muted-foreground">
                        R$ {gift.price.toFixed(2)}
                      </p>
                    )}
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
                      className="h-8 w-8 text-destructive"
                      onClick={() => onRemoveGift(gift.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Presente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Presente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gift-name">Nome do Presente *</Label>
                  <Input
                    id="gift-name"
                    placeholder="Ex: Boneca Barbie"
                    value={newGift.name}
                    onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gift-description">Descrição</Label>
                  <Textarea
                    id="gift-description"
                    placeholder="Ex: Modelo dreamhouse, cor rosa..."
                    value={newGift.description}
                    onChange={(e) => setNewGift({ ...newGift, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gift-price">Preço Estimado (R$)</Label>
                    <Input
                      id="gift-price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="99.90"
                      value={newGift.price}
                      onChange={(e) => setNewGift({ ...newGift, price: e.target.value })}
                    />
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
                  <Label htmlFor="gift-image">URL da Imagem</Label>
                  <Input
                    id="gift-image"
                    type="url"
                    placeholder="https://..."
                    value={newGift.image_url}
                    onChange={(e) => setNewGift({ ...newGift, image_url: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleAddGift}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
