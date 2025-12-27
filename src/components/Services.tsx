import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, PartyPopper, Baby, Cake, Gift, Star, Heart, Crown, Music, Camera, Wand2, Palette, Gamepad2, Pizza, Candy, TreePine, Sun, Moon, Zap, Flame, Snowflake, Cloud, Rainbow, Flower2, Bird, Cat, Dog, Rabbit, Tent, Castle, Rocket, Plane, Car, Bike, Ship, Trophy, Medal, Target, Dumbbell, Gem, Lightbulb, Mic, type LucideIcon } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ImageLightbox, useLightbox } from "@/components/ImageLightbox";
import inflatableImg from "@/assets/inflatable.jpg";
import ballPitImg from "@/assets/ball-pit.jpg";
import trampolineImg from "@/assets/trampoline.jpg";
import decorationImg from "@/assets/decoration.jpg";

const fallbackServices = [
  {
    id: "1",
    name: "Infláveis Divertidos",
    description: "Castelos infláveis, tobogãs e muito mais para a diversão das crianças",
    image_url: inflatableImg,
    icon: "PartyPopper",
  },
  {
    id: "2",
    name: "Piscina de Bolinhas",
    description: "Diversão colorida e segura para todas as idades",
    image_url: ballPitImg,
    icon: "Baby",
  },
  {
    id: "3",
    name: "Cama Elástica",
    description: "Energia e alegria para animar toda a festa",
    image_url: trampolineImg,
    icon: "Sparkles",
  },
  {
    id: "4",
    name: "Decorações Personalizadas",
    description: "Temas exclusivos e decorações sob medida para seu evento",
    image_url: decorationImg,
    icon: "Cake",
  },
];

// Comprehensive icon map
const iconMap: Record<string, LucideIcon> = {
  partypopper: PartyPopper,
  party: PartyPopper,
  gift: Gift,
  cake: Cake,
  sparkles: Sparkles,
  baby: Baby,
  star: Star,
  heart: Heart,
  crown: Crown,
  wand2: Wand2,
  music: Music,
  camera: Camera,
  palette: Palette,
  gamepad2: Gamepad2,
  pizza: Pizza,
  candy: Candy,
  treepine: TreePine,
  sun: Sun,
  moon: Moon,
  zap: Zap,
  flame: Flame,
  snowflake: Snowflake,
  cloud: Cloud,
  rainbow: Rainbow,
  flower2: Flower2,
  bird: Bird,
  cat: Cat,
  dog: Dog,
  rabbit: Rabbit,
  tent: Tent,
  castle: Castle,
  rocket: Rocket,
  plane: Plane,
  car: Car,
  bike: Bike,
  ship: Ship,
  trophy: Trophy,
  medal: Medal,
  target: Target,
  dumbbell: Dumbbell,
  gem: Gem,
  lightbulb: Lightbulb,
  mic: Mic,
};

export const Services = () => {
  const { data: dbServices, isLoading } = useServices();
  const { data: settings } = useSiteSettings();
  const lightbox = useLightbox();
  
  const services = dbServices && dbServices.length > 0 ? dbServices : fallbackServices;

  const getIcon = (iconName: string | null): LucideIcon => {
    if (!iconName) return Sparkles;
    return iconMap[iconName.toLowerCase()] || Sparkles;
  };

  const lightboxImages = services.map((service) => ({
    src: service.image_url || inflatableImg,
    alt: service.name,
    title: service.name,
    description: service.description || undefined,
  }));

  return (
    <section id="servicos" className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            {settings?.services_title || "Nossos Serviços"}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            {settings?.services_description || "Oferecemos uma variedade completa de opções para tornar sua festa única e memorável"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => {
              const Icon = getIcon(service.icon);
              const imageUrl = service.image_url || inflatableImg;
              
              return (
                <Card 
                  key={service.id}
                  className="group overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-[var(--shadow-card)] bg-card cursor-pointer"
                  onClick={() => lightbox.open(index)}
                >
                  <CardContent className="p-0">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={service.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Icon className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <h3 className="text-2xl font-bold text-foreground">
                            {service.name}
                          </h3>
                        </div>
                        <p className="text-foreground/80 pl-15">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightbox.initialIndex}
        isOpen={lightbox.isOpen}
        onClose={lightbox.close}
      />
    </section>
  );
};
