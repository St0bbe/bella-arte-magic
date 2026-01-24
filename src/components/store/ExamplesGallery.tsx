import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Download, Star, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ExampleArt {
  id: string;
  title: string;
  theme: string;
  category: string;
  image_url: string;
  description: string;
}

const EXAMPLE_ARTS: ExampleArt[] = [
  {
    id: "1",
    title: "Convite Fazendinha",
    theme: "Fazendinha",
    category: "Convite Digital",
    image_url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=400&fit=crop",
    description: "Convite encantador com tema fazendinha, perfeito para festas ao ar livre",
  },
  {
    id: "2", 
    title: "Convite Unicórnio Mágico",
    theme: "Unicórnio",
    category: "Convite Digital",
    image_url: "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=400&h=400&fit=crop",
    description: "Arte mágica com cores pastéis e unicórnio encantado",
  },
  {
    id: "3",
    title: "Arte Safari Aventura",
    theme: "Safari",
    category: "Kit Digital",
    image_url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=400&fit=crop",
    description: "Kit completo com animais da selva para pequenos exploradores",
  },
  {
    id: "4",
    title: "Convite Princesa",
    theme: "Princesa",
    category: "Convite Digital",
    image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    description: "Convite digno de realeza para sua pequena princesa",
  },
  {
    id: "5",
    title: "Convite Super Herói",
    theme: "Super Herói",
    category: "Convite Digital",
    image_url: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=400&h=400&fit=crop",
    description: "Arte épica para os pequenos heróis salvarem o dia",
  },
  {
    id: "6",
    title: "Kit Sereia Encantada",
    theme: "Sereia",
    category: "Kit Digital",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    description: "Mergulhe em uma festa mágica no fundo do mar",
  },
  {
    id: "7",
    title: "Convite Dinossauros",
    theme: "Dinossauros",
    category: "Convite Digital",
    image_url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop",
    description: "Aventura pré-histórica para os amantes de dinossauros",
  },
  {
    id: "8",
    title: "Arte Astronauta",
    theme: "Espaço",
    category: "Kit Digital",
    image_url: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=400&fit=crop",
    description: "Explore o universo com esta arte espacial incrível",
  },
];

export function ExamplesGallery() {
  const [selectedImage, setSelectedImage] = useState<ExampleArt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (art: ExampleArt, index: number) => {
    setSelectedImage(art);
    setCurrentIndex(index);
  };

  const navigateGallery = (direction: "prev" | "next") => {
    const newIndex = direction === "prev" 
      ? (currentIndex - 1 + EXAMPLE_ARTS.length) % EXAMPLE_ARTS.length
      : (currentIndex + 1) % EXAMPLE_ARTS.length;
    setCurrentIndex(newIndex);
    setSelectedImage(EXAMPLE_ARTS[newIndex]);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-store-cream/50 to-store-pink/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-store-rose/10 text-store-rose border-store-rose/20 mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Inspiração para Mamães
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-store-text mb-4">
            💕 Artes que Encantaram Outras Mamães
          </h2>
          <p className="text-store-text/70 max-w-2xl mx-auto">
            Veja alguns exemplos de artes personalizadas que criamos com muito carinho. 
            Cada detalhe pensado para tornar a festa do seu filho inesquecível!
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {EXAMPLE_ARTS.map((art, index) => (
            <div
              key={art.id}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-store-rose/10"
              onClick={() => openLightbox(art, index)}
            >
              <img
                src={art.image_url}
                alt={art.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <Badge className="bg-store-rose text-white text-xs mb-2">
                    {art.category}
                  </Badge>
                  <h3 className="text-white font-semibold text-sm line-clamp-1">
                    {art.title}
                  </h3>
                  <p className="text-white/80 text-xs mt-1">
                    Tema: {art.theme}
                  </p>
                </div>
              </div>
              
              {/* Heart Icon */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-store-rose" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-store-cream border border-store-rose/20">
            <Star className="w-4 h-4 text-store-gold fill-store-gold" />
            <span className="text-store-text text-sm">
              <strong>+500 mamães</strong> já encomendaram suas artes personalizadas
            </span>
            <Star className="w-4 h-4 text-store-gold fill-store-gold" />
          </div>
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white">
          <VisuallyHidden>
            <DialogTitle>{selectedImage?.title || "Imagem"}</DialogTitle>
            <DialogDescription>{selectedImage?.description || "Visualização da arte"}</DialogDescription>
          </VisuallyHidden>
          
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage.image_url}
                alt={selectedImage.title}
                className="w-full aspect-square object-cover"
              />
              
              {/* Navigation Buttons */}
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateGallery("prev");
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateGallery("next");
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>

              {/* Info Panel */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="bg-store-rose text-white mb-2">
                      {selectedImage.category}
                    </Badge>
                    <h3 className="text-white text-xl font-bold">
                      {selectedImage.title}
                    </h3>
                    <p className="text-white/80 text-sm mt-1">
                      {selectedImage.description}
                    </p>
                    <p className="text-store-gold text-xs mt-2">
                      ✨ Tema: {selectedImage.theme}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="bg-store-rose hover:bg-store-rose/90"
                      onClick={() => window.location.href = "/loja/digitais"}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Quero Uma Assim!
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
