import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGallery } from "@/hooks/useGallery";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { ImageLightbox, useLightbox } from "@/components/ImageLightbox";
import princessParty from "@/assets/gallery/princess-party.jpg";
import superheroParty from "@/assets/gallery/superhero-party.jpg";
import tropicalParty from "@/assets/gallery/tropical-party.jpg";
import unicornParty from "@/assets/gallery/unicorn-party.jpg";
import safariParty from "@/assets/gallery/safari-party.jpg";
import corporateEvent from "@/assets/gallery/corporate-event.jpg";
import babyShower from "@/assets/gallery/baby-shower.jpg";
import spaceParty from "@/assets/gallery/space-party.jpg";

const fallbackItems = [
  { id: "1", title: "Festa Princesa", image_url: princessParty, theme: "Princesa", event_type: "Aniversário Infantil" },
  { id: "2", title: "Festa Super-Heróis", image_url: superheroParty, theme: "Super-Heróis", event_type: "Aniversário Infantil" },
  { id: "3", title: "Festa Tropical", image_url: tropicalParty, theme: "Tropical", event_type: "Aniversário" },
  { id: "4", title: "Festa Unicórnio", image_url: unicornParty, theme: "Unicórnio", event_type: "Aniversário Infantil" },
  { id: "5", title: "Festa Safari", image_url: safariParty, theme: "Safari", event_type: "Aniversário Infantil" },
  { id: "6", title: "Evento Corporativo", image_url: corporateEvent, theme: "Elegante", event_type: "Corporativo" },
  { id: "7", title: "Chá de Bebê", image_url: babyShower, theme: "Bebê", event_type: "Chá de Bebê" },
  { id: "8", title: "Festa Espacial", image_url: spaceParty, theme: "Espaço", event_type: "Aniversário Infantil" },
];

export const Gallery = () => {
  const [selectedTheme, setSelectedTheme] = useState("Todos");
  const [selectedEventType, setSelectedEventType] = useState("Todos");
  const { data: dbItems, isLoading } = useGallery();
  const { themes, eventTypes } = useFilterOptions();
  const lightbox = useLightbox();

  const themeOptions = ["Todos", ...themes];
  const eventTypeOptions = ["Todos", ...eventTypes];

  const galleryItems = dbItems && dbItems.length > 0 ? dbItems : fallbackItems;

  const filteredItems = galleryItems.filter((item) => {
    const themeMatch = selectedTheme === "Todos" || item.theme === selectedTheme;
    const eventTypeMatch = selectedEventType === "Todos" || item.event_type === selectedEventType;
    return themeMatch && eventTypeMatch;
  });

  const lightboxImages = filteredItems.map((item) => ({
    src: item.image_url,
    alt: item.title,
    title: item.title,
    description: `${item.theme} • ${item.event_type}`,
  }));

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-muted/30 to-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">Galeria de Festas</h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Veja alguns dos nossos trabalhos mais incríveis
          </p>
        </div>

        <div className="max-w-6xl mx-auto mb-12 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Filtrar por Tema</h3>
            <div className="flex flex-wrap gap-2">
              {themeOptions.map((theme) => (
                <Button
                  key={theme}
                  variant={selectedTheme === theme ? "default" : "outline"}
                  onClick={() => setSelectedTheme(theme)}
                >
                  {theme}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Filtrar por Tipo de Evento</h3>
            <div className="flex flex-wrap gap-2">
              {eventTypeOptions.map((type) => (
                <Button
                  key={type}
                  variant={selectedEventType === type ? "default" : "outline"}
                  onClick={() => setSelectedEventType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => (
                <Card 
                  key={item.id} 
                  className="group overflow-hidden border-2 hover:border-primary transition-all duration-300 bg-card cursor-pointer"
                  onClick={() => lightbox.open(index)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-square overflow-hidden">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="bg-primary text-primary-foreground">{item.theme}</Badge>
                          <Badge variant="outline" className="bg-background/80">{item.event_type}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">Nenhuma festa encontrada.</p>
              <Button variant="outline" onClick={() => { setSelectedTheme("Todos"); setSelectedEventType("Todos"); }} className="mt-4">Limpar Filtros</Button>
            </div>
          )}
        </div>
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
