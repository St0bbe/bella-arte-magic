import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProductReviews, useProductAverageRating, useSubmitReview } from "@/hooks/useProductReviews";
import { useTenant } from "@/contexts/TenantContext";

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { tenant } = useTenant();
  const { data: reviews, isLoading } = useProductReviews(productId);
  const { data: ratingData } = useProductAverageRating(productId);
  const submitReview = useSubmitReview();

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    title: "",
    comment: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenant?.id) return;

    try {
      await submitReview.mutateAsync({
        product_id: productId,
        tenant_id: tenant.id,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        rating,
        title: formData.title || undefined,
        comment: formData.comment || undefined,
      });
      
      toast.success("Avaliação enviada! Aguarde aprovação.");
      setShowForm(false);
      setFormData({ customer_name: "", customer_email: "", title: "", comment: "" });
      setRating(5);
    } catch {
      toast.error("Erro ao enviar avaliação");
    }
  };

  const renderStars = (value: number, interactive = false) => {
    const displayValue = interactive && hoverRating > 0 ? hoverRating : value;
    
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 cursor-pointer transition-colors ${
              i < displayValue ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
            onClick={interactive ? () => setRating(i + 1) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(i + 1) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Avaliações dos Clientes</h3>
          {ratingData && ratingData.count > 0 && (
            <div className="flex items-center gap-2 mt-1">
              {renderStars(Math.round(ratingData.average))}
              <span className="text-sm text-muted-foreground">
                {ratingData.average.toFixed(1)} ({ratingData.count} {ratingData.count === 1 ? "avaliação" : "avaliações"})
              </span>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Escrever Avaliação"}
        </Button>
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4 bg-muted/50">
          <div className="space-y-2">
            <Label>Sua Avaliação</Label>
            {renderStars(rating, true)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Seu Nome *</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Seu Email *</Label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Título (opcional)</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Resumo da sua experiência"
            />
          </div>

          <div className="space-y-2">
            <Label>Comentário (opcional)</Label>
            <Textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Conte mais sobre sua experiência com o produto..."
              rows={4}
            />
          </div>

          <Button type="submit" disabled={submitReview.isPending}>
            {submitReview.isPending ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </form>
      )}

      <Separator />

      {/* Reviews List */}
      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando avaliações...</p>
      ) : !reviews?.length ? (
        <p className="text-center py-8 text-muted-foreground">
          Este produto ainda não possui avaliações. Seja o primeiro a avaliar!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.customer_name}</span>
                    {review.is_verified_purchase && (
                      <Badge variant="secondary" className="text-xs">Compra Verificada</Badge>
                    )}
                  </div>
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(review.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              
              {review.title && (
                <p className="font-medium">{review.title}</p>
              )}
              {review.comment && (
                <p className="text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
