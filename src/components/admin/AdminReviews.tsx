import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAllProductReviews } from "@/hooks/useProductReviews";

export function AdminReviews() {
  const { data: reviews, isLoading } = useAllProductReviews();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase
        .from("product_reviews")
        .update({ is_approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-product-reviews"] });
      toast.success("Avaliação atualizada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-product-reviews"] });
      toast.success("Avaliação excluída!");
    },
  });

  const pendingReviews = reviews?.filter(r => !r.is_approved) || [];
  const approvedReviews = reviews?.filter(r => r.is_approved) || [];

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Avaliações Pendentes
            {pendingReviews.length > 0 && (
              <Badge variant="secondary">{pendingReviews.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Avaliações aguardando aprovação</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : !pendingReviews.length ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma avaliação pendente</p>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.customer_name}</span>
                        {review.is_verified_purchase && (
                          <Badge variant="outline" className="text-xs">Compra Verificada</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{review.customer_email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Produto: {review.products?.name || "Produto removido"}
                      </p>
                    </div>
                    <div className="text-right">
                      {renderStars(review.rating)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(review.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  {review.title && (
                    <p className="font-medium">{review.title}</p>
                  )}
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: review.id, is_approved: true })}
                      className="gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(review.id)}
                      className="gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Avaliações Aprovadas
          </CardTitle>
          <CardDescription>Avaliações visíveis na loja</CardDescription>
        </CardHeader>
        <CardContent>
          {!approvedReviews.length ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma avaliação aprovada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <span className="font-medium">{review.products?.name || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span>{review.customer_name}</span>
                        {review.is_verified_purchase && (
                          <Badge variant="outline" className="ml-2 text-xs">Verificado</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {renderStars(review.rating)}
                        {review.title && (
                          <p className="text-sm text-muted-foreground mt-1">{review.title}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(review.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateMutation.mutate({ id: review.id, is_approved: false })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(review.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
