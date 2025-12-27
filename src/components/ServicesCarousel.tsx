import { useGallery } from "@/hooks/useGallery";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Autoplay from "embla-carousel-autoplay";
import { useMemo } from "react";

export const ServicesCarousel = () => {
  const { data: galleryItems, isLoading } = useGallery();
  const plugins = useMemo(
    () => [Autoplay({ delay: 3000, stopOnInteraction: true })],
    []
  );

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (!galleryItems || galleryItems.length === 0) {
    return null;
  }

  // Get the latest 8 items
  const latestItems = galleryItems.slice(0, 8);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background overflow-hidden">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Trabalhos Recentes
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Confira nossos últimos eventos e festas realizadas
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={plugins}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {latestItems.map((item) => (
                <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <Card className="group overflow-hidden border-2 hover:border-primary transition-all duration-300 bg-card">
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xl font-bold text-foreground mb-2">
                            {item.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-primary text-primary-foreground">
                              {item.theme}
                            </Badge>
                            <Badge variant="outline" className="bg-background/80">
                              {item.event_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12" />
            <CarouselNext className="hidden md:flex -right-12" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};
