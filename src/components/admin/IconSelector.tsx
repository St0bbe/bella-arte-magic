import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  PartyPopper,
  Gift,
  Cake,
  Sparkles,
  Baby,
  Star,
  Heart,
  Music,
  Camera,
  Crown,
  Wand2,
  Palette,
  Gamepad2,
  Pizza,
  IceCreamCone,
  Candy,
  TreePine,
  Sun,
  Moon,
  Zap,
  Flame,
  Snowflake,
  Cloud,
  Rainbow,
  Umbrella,
  Flower2,
  Bird,
  Bug,
  Fish,
  Cat,
  Dog,
  Rabbit,
  Tent,
  Castle,
  Rocket,
  Plane,
  Car,
  Bike,
  Ship,
  Trophy,
  Medal,
  Target,
  Dumbbell,
  Shirt,
  Watch,
  Glasses,
  Gem,
  Lightbulb,
  Mic,
  Speaker,
  Tv,
  Popcorn,
  Coffee,
  Wine,
  Utensils,
  ChefHat,
  Carrot,
  Apple,
  Cherry,
  Grape,
  Salad,
  Sandwich,
  Drama,
  Clapperboard,
  Ticket,
  FerrisWheel,
  Puzzle,
  Dice5,
  Joystick,
  Swords,
  Shield,
  Megaphone,
  Circle,
  type LucideIcon,
} from "lucide-react";

interface IconOption {
  name: string;
  icon: LucideIcon;
  label: string;
  category: string;
}

const iconOptions: IconOption[] = [
  // Festa
  { name: "PartyPopper", icon: PartyPopper, label: "Festa", category: "Festa" },
  { name: "Gift", icon: Gift, label: "Presente", category: "Festa" },
  { name: "Cake", icon: Cake, label: "Bolo", category: "Festa" },
  { name: "Sparkles", icon: Sparkles, label: "Brilhos", category: "Festa" },
  { name: "Circle", icon: Circle, label: "Balão", category: "Festa" },
  { name: "Crown", icon: Crown, label: "Coroa", category: "Festa" },
  { name: "Wand2", icon: Wand2, label: "Varinha", category: "Festa" },
  { name: "Star", icon: Star, label: "Estrela", category: "Festa" },
  { name: "Heart", icon: Heart, label: "Coração", category: "Festa" },
  { name: "Drama", icon: Drama, label: "Teatro", category: "Festa" },
  { name: "Ticket", icon: Ticket, label: "Ingresso", category: "Festa" },
  
  // Crianças
  { name: "Baby", icon: Baby, label: "Bebê", category: "Crianças" },
  { name: "Gamepad2", icon: Gamepad2, label: "Jogos", category: "Crianças" },
  { name: "Puzzle", icon: Puzzle, label: "Quebra-cabeça", category: "Crianças" },
  { name: "Dice5", icon: Dice5, label: "Dados", category: "Crianças" },
  { name: "Joystick", icon: Joystick, label: "Joystick", category: "Crianças" },
  { name: "Castle", icon: Castle, label: "Castelo", category: "Crianças" },
  { name: "Rocket", icon: Rocket, label: "Foguete", category: "Crianças" },
  { name: "Tent", icon: Tent, label: "Tenda", category: "Crianças" },
  { name: "FerrisWheel", icon: FerrisWheel, label: "Roda Gigante", category: "Crianças" },
  
  // Animais
  { name: "Cat", icon: Cat, label: "Gato", category: "Animais" },
  { name: "Dog", icon: Dog, label: "Cachorro", category: "Animais" },
  { name: "Rabbit", icon: Rabbit, label: "Coelho", category: "Animais" },
  { name: "Bird", icon: Bird, label: "Pássaro", category: "Animais" },
  { name: "Fish", icon: Fish, label: "Peixe", category: "Animais" },
  { name: "Bug", icon: Bug, label: "Inseto", category: "Animais" },
  
  // Comida
  { name: "Pizza", icon: Pizza, label: "Pizza", category: "Comida" },
  { name: "IceCreamCone", icon: IceCreamCone, label: "Sorvete", category: "Comida" },
  { name: "Candy", icon: Candy, label: "Doce", category: "Comida" },
  { name: "Popcorn", icon: Popcorn, label: "Pipoca", category: "Comida" },
  { name: "Coffee", icon: Coffee, label: "Café", category: "Comida" },
  { name: "Wine", icon: Wine, label: "Vinho", category: "Comida" },
  { name: "Utensils", icon: Utensils, label: "Talheres", category: "Comida" },
  { name: "ChefHat", icon: ChefHat, label: "Chef", category: "Comida" },
  { name: "Apple", icon: Apple, label: "Maçã", category: "Comida" },
  { name: "Cherry", icon: Cherry, label: "Cereja", category: "Comida" },
  
  // Natureza
  { name: "Flower2", icon: Flower2, label: "Flor", category: "Natureza" },
  { name: "TreePine", icon: TreePine, label: "Árvore", category: "Natureza" },
  { name: "Sun", icon: Sun, label: "Sol", category: "Natureza" },
  { name: "Moon", icon: Moon, label: "Lua", category: "Natureza" },
  { name: "Cloud", icon: Cloud, label: "Nuvem", category: "Natureza" },
  { name: "Rainbow", icon: Rainbow, label: "Arco-íris", category: "Natureza" },
  { name: "Snowflake", icon: Snowflake, label: "Floco", category: "Natureza" },
  { name: "Umbrella", icon: Umbrella, label: "Guarda-chuva", category: "Natureza" },
  
  // Entretenimento
  { name: "Music", icon: Music, label: "Música", category: "Entretenimento" },
  { name: "Camera", icon: Camera, label: "Câmera", category: "Entretenimento" },
  { name: "Mic", icon: Mic, label: "Microfone", category: "Entretenimento" },
  { name: "Speaker", icon: Speaker, label: "Alto-falante", category: "Entretenimento" },
  { name: "Tv", icon: Tv, label: "TV", category: "Entretenimento" },
  { name: "Clapperboard", icon: Clapperboard, label: "Cinema", category: "Entretenimento" },
  { name: "Palette", icon: Palette, label: "Pintura", category: "Entretenimento" },
  
  // Esportes
  { name: "Trophy", icon: Trophy, label: "Troféu", category: "Esportes" },
  { name: "Medal", icon: Medal, label: "Medalha", category: "Esportes" },
  { name: "Target", icon: Target, label: "Alvo", category: "Esportes" },
  { name: "Dumbbell", icon: Dumbbell, label: "Haltere", category: "Esportes" },
  { name: "Target", icon: Target, label: "Esporte", category: "Esportes" },
  { name: "Bike", icon: Bike, label: "Bicicleta", category: "Esportes" },
  
  // Transporte
  { name: "Car", icon: Car, label: "Carro", category: "Transporte" },
  { name: "Plane", icon: Plane, label: "Avião", category: "Transporte" },
  { name: "Ship", icon: Ship, label: "Navio", category: "Transporte" },
  
  // Outros
  { name: "Zap", icon: Zap, label: "Raio", category: "Outros" },
  { name: "Flame", icon: Flame, label: "Fogo", category: "Outros" },
  { name: "Lightbulb", icon: Lightbulb, label: "Lâmpada", category: "Outros" },
  { name: "Gem", icon: Gem, label: "Gema", category: "Outros" },
  { name: "Shield", icon: Shield, label: "Escudo", category: "Outros" },
  { name: "Swords", icon: Swords, label: "Espadas", category: "Outros" },
  { name: "Megaphone", icon: Megaphone, label: "Megafone", category: "Outros" },
];

const categories = [...new Set(iconOptions.map(opt => opt.category))];

interface IconSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconSelector({ value, onChange }: IconSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const selectedIcon = iconOptions.find(
    opt => opt.name.toLowerCase() === value?.toLowerCase()
  );
  const SelectedIconComponent = selectedIcon?.icon || Sparkles;

  const filteredIcons = iconOptions.filter(opt => {
    const matchesSearch = opt.label.toLowerCase().includes(search.toLowerCase()) ||
                          opt.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || opt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start gap-2"
        >
          <SelectedIconComponent className="w-4 h-4" />
          <span className="flex-1 text-left">
            {selectedIcon?.label || "Selecionar ícone"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b space-y-3">
          <Input
            placeholder="Buscar ícone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedCategory === null ? "default" : "ghost"}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "ghost"}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-6 gap-1 p-2 max-h-64 overflow-y-auto">
          {filteredIcons.map((opt) => {
            const IconComponent = opt.icon;
            const isSelected = value?.toLowerCase() === opt.name.toLowerCase();
            return (
              <button
                key={opt.name}
                onClick={() => handleSelect(opt.name)}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary"
                )}
                title={opt.label}
              >
                <IconComponent className="w-5 h-5" />
              </button>
            );
          })}
          {filteredIcons.length === 0 && (
            <div className="col-span-6 text-center py-4 text-muted-foreground text-sm">
              Nenhum ícone encontrado
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Export the icon map for use in other components
export const iconMap: Record<string, LucideIcon> = Object.fromEntries(
  iconOptions.map(opt => [opt.name.toLowerCase(), opt.icon])
);

export { iconOptions };
