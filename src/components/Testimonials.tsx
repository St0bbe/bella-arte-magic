import { Star, Quote, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface Testimonial {
  id: string;
  client_name: string;
  client_photo_url: string | null;
  rating: number;
  comment: string;
  event_type: string | null;
}

export const Testimonials = () => {
  const { tenant } = useTenant();

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["testimonials", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, client_name, client_photo_url, rating, comment, event_type")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as Testimonial[];
    },
    enabled: !!tenant?.id,
  });

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section id="depoimentos" className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O Que Nossos <span className="text-primary">Clientes</span> Dizem
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A satisfação dos nossos clientes é nossa maior recompensa. Veja o que eles têm a dizer sobre nossos serviços!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="group relative bg-card rounded-2xl p-6 shadow-lg border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Quote icon */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
                <Quote className="w-5 h-5 text-primary-foreground" />
              </div>

              {/* Content */}
              <div className="pt-4">
                {/* Stars */}
                <div className="mb-4">
                  {renderStars(testimonial.rating)}
                </div>

                {/* Comment */}
                <p className="text-muted-foreground italic leading-relaxed mb-6">
                  "{testimonial.comment}"
                </p>

                {/* Client info */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  {testimonial.client_photo_url ? (
                    <img
                      src={testimonial.client_photo_url}
                      alt={testimonial.client_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
                      {testimonial.client_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.client_name}</h4>
                    {testimonial.event_type && (
                      <p className="text-sm text-muted-foreground">{testimonial.event_type}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};