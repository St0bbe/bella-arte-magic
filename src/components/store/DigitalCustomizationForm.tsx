import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Palette, User, MapPin, PartyPopper, Sparkles, Info } from "lucide-react";

interface CustomizationData {
  child_name?: string;
  child_age?: string;
  party_theme?: string;
  party_date?: string;
  party_time?: string;
  party_location?: string;
  additional_names?: string;
  colors?: string;
  special_requests?: string;
  [key: string]: string | undefined;
}

interface DigitalCustomizationFormProps {
  productName: string;
  productCategory: string;
  onDataChange: (data: CustomizationData) => void;
  initialData?: CustomizationData;
}

const PARTY_THEMES = [
  "Unicórnio",
  "Safari",
  "Princesa",
  "Super-heróis",
  "Circo",
  "Dinossauros",
  "Fazendinha",
  "Fundo do Mar",
  "Espacial",
  "Tropical",
  "Floresta Encantada",
  "Arco-íris",
  "Carnaval",
  "Outro",
];

export function DigitalCustomizationForm({
  productName,
  productCategory,
  onDataChange,
  initialData = {},
}: DigitalCustomizationFormProps) {
  const [data, setData] = useState<CustomizationData>(initialData);

  const updateField = (field: string, value: string) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    onDataChange(newData);
  };

  const isInvite = productCategory.toLowerCase().includes("convite");
  const isCakeTopper = productCategory.toLowerCase().includes("topo");
  const isDecoration = productCategory.toLowerCase().includes("decoração");
  const isSouvenir = productCategory.toLowerCase().includes("lembrancinha");
  const isKit = productCategory.toLowerCase().includes("kit");

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Personalização</CardTitle>
            <CardDescription>
              Preencha os dados para personalizarmos seu {productName}
            </CardDescription>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit gap-1 mt-2">
          <Info className="w-3 h-3" />
          Prazo de 3 dias úteis após a compra
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="w-4 h-4 text-muted-foreground" />
            Informações do Aniversariante
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="child_name">Nome do(a) Aniversariante *</Label>
              <Input
                id="child_name"
                placeholder="Ex: Maria Clara"
                value={data.child_name || ""}
                onChange={(e) => updateField("child_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="child_age">Idade que vai completar *</Label>
              <Input
                id="child_age"
                placeholder="Ex: 5"
                value={data.child_age || ""}
                onChange={(e) => updateField("child_age", e.target.value)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Theme Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            Tema da Festa
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="party_theme">Tema *</Label>
              <Select
                value={data.party_theme || ""}
                onValueChange={(value) => updateField("party_theme", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tema" />
                </SelectTrigger>
                <SelectContent>
                  {PARTY_THEMES.map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {theme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="colors">Cores preferidas</Label>
              <Input
                id="colors"
                placeholder="Ex: Rosa e dourado"
                value={data.colors || ""}
                onChange={(e) => updateField("colors", e.target.value)}
              />
            </div>
          </div>

          {data.party_theme === "Outro" && (
            <div className="space-y-2">
              <Label htmlFor="custom_theme">Descreva o tema</Label>
              <Input
                id="custom_theme"
                placeholder="Descreva o tema desejado"
                value={data.custom_theme || ""}
                onChange={(e) => updateField("custom_theme", e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Event Info Section - Only for invites and some products */}
        {(isInvite || isKit) && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <PartyPopper className="w-4 h-4 text-muted-foreground" />
                Dados do Evento
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="party_date">Data da Festa *</Label>
                  <Input
                    id="party_date"
                    type="date"
                    value={data.party_date || ""}
                    onChange={(e) => updateField("party_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="party_time">Horário *</Label>
                  <Input
                    id="party_time"
                    type="time"
                    value={data.party_time || ""}
                    onChange={(e) => updateField("party_time", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="party_location">Local da Festa *</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    id="party_location"
                    placeholder="Ex: Buffet Alegria - Rua das Flores, 123"
                    value={data.party_location || ""}
                    onChange={(e) => updateField("party_location", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Additional names for some products */}
        {(isSouvenir || isDecoration || isCakeTopper) && (
          <>
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="additional_names">
                {isCakeTopper ? "Texto para o Topo de Bolo" : "Nomes adicionais (se houver)"}
              </Label>
              <Input
                id="additional_names"
                placeholder={isCakeTopper ? "Ex: Maria - 5 anos" : "Ex: Pais: João e Maria"}
                value={data.additional_names || ""}
                onChange={(e) => updateField("additional_names", e.target.value)}
              />
            </div>
          </>
        )}

        <Separator />

        {/* Special Requests */}
        <div className="space-y-2">
          <Label htmlFor="special_requests">Observações especiais</Label>
          <Textarea
            id="special_requests"
            placeholder="Algum detalhe especial que devemos considerar na personalização?"
            value={data.special_requests || ""}
            onChange={(e) => updateField("special_requests", e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
