import { Star, Quote, BadgeCheck, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  productType: string;
  date: string;
  verified: boolean;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Ana Paula M.",
    rating: 5,
    comment: "Ficou PERFEITO! A arte do convite da minha filha ficou exatamente como eu imaginava. Entregaram antes do prazo e com muito carinho. Super recomendo!",
    productType: "Convite Digital Fazendinha",
    date: "Janeiro 2026",
    verified: true,
  },
  {
    id: "2",
    name: "Juliana R.",
    rating: 5,
    comment: "Comprei o kit digital da festa Safari e me surpreendi com a qualidade! Veio tudo organizado, pronto para imprimir. Economizei muito tempo e dinheiro!",
    productType: "Kit Digital Safari",
    date: "Janeiro 2026",
    verified: true,
  },
  {
    id: "3",
    name: "Fernanda S.",
    rating: 5,
    comment: "Atendimento maravilhoso! Pedi algumas alterações e fizeram com todo carinho. A arte do unicórnio ficou linda demais! Minha princesa amou!",
    productType: "Convite Digital Unicórnio",
    date: "Dezembro 2025",
    verified: true,
  },
  {
    id: "4",
    name: "Camila B.",
    rating: 5,
    comment: "Melhor investimento que fiz para a festa do meu filho! O convite personalizado fez toda diferença. Recebi muitos elogios dos convidados.",
    productType: "Convite Digital Super Herói",
    date: "Dezembro 2025",
    verified: true,
  },
  {
    id: "5",
    name: "Patricia L.",
    rating: 5,
    comment: "Sempre compro aqui para as festas dos meus filhos. Qualidade impecável e atendimento nota 10! Já é a terceira festa que faço com eles.",
    productType: "Kit Digital Princesa",
    date: "Novembro 2025",
    verified: true,
  },
  {
    id: "6",
    name: "Mariana C.",
    rating: 5,
    comment: "Rápido, lindo e prático! Exatamente o que uma mãe ocupada precisa. Entrega via WhatsApp foi super conveniente!",
    productType: "Convite Digital Sereia",
    date: "Novembro 2025",
    verified: true,
  },
];

export function CustomerTestimonials() {
  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? "fill-store-gold text-store-gold" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  return (
    <section className="py-16 bg-gradient-to-b from-white to-store-cream/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-store-gold/10 text-store-gold border-store-gold/20 mb-4">
            <Heart className="w-3 h-3 mr-1 fill-store-gold" />
            +500 Mamães Satisfeitas
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-store-text mb-4">
            💕 O Que as Mamães Dizem
          </h2>
          <p className="text-store-text/70 max-w-2xl mx-auto">
            Veja as avaliações de quem já confiou na Bella Arte para criar 
            momentos mágicos e inesquecíveis para seus filhos!
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-store-text">4.9</div>
            <div className="flex justify-center mb-1">{renderStars(5)}</div>
            <div className="text-xs text-store-text/60">Nota média</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-store-text">500+</div>
            <div className="text-xs text-store-text/60">Mamães atendidas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-store-text">98%</div>
            <div className="text-xs text-store-text/60">Recomendariam</div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <Card 
              key={testimonial.id} 
              className="border-store-rose/10 hover:shadow-lg transition-shadow duration-300 bg-white"
            >
              <CardContent className="pt-6">
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-store-rose/20 mb-4" />
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  {renderStars(testimonial.rating)}
                  <span className="text-xs text-store-text/50">{testimonial.date}</span>
                </div>

                {/* Comment */}
                <p className="text-store-text/80 text-sm mb-4 italic">
                  "{testimonial.comment}"
                </p>

                {/* Product Badge */}
                <Badge variant="outline" className="mb-4 text-xs border-store-rose/30 text-store-rose">
                  {testimonial.productType}
                </Badge>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-store-rose/10">
                  <Avatar className="w-10 h-10 bg-store-rose/10">
                    <AvatarFallback className="text-store-rose font-medium text-sm">
                      {testimonial.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-store-text text-sm">
                        {testimonial.name}
                      </span>
                      {testimonial.verified && (
                        <BadgeCheck className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {testimonial.verified && (
                      <span className="text-xs text-green-600">Compra verificada</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Message */}
        <div className="text-center mt-12">
          <p className="text-store-text/60 text-sm">
            ⭐ Avaliações reais de mamães que confiaram na Bella Arte
          </p>
        </div>
      </div>
    </section>
  );
}
