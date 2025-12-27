import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, RotateCcw, AlertTriangle, Image, Calendar, X } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TrashedItem {
  id: string;
  title: string;
  image_url: string;
  theme: string;
  event_type: string;
  deleted_at: string;
}

export function AdminGalleryTrash() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState<{ type: "restore" | "delete" | "empty"; item?: TrashedItem } | null>(null);

  // Get user's tenant
  const { data: userTenant } = useQuery({
    queryKey: ["user-tenant"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      return data;
    },
  });

  // Fetch trashed items
  const { data: trashedItems, isLoading } = useQuery({
    queryKey: ["gallery-trash", userTenant?.id],
    queryFn: async () => {
      if (!userTenant?.id) return [];

      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("tenant_id", userTenant.id)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      return data as TrashedItem[];
    },
    enabled: !!userTenant?.id,
  });

  // Restore item mutation
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("gallery_items")
        .update({ deleted_at: null })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-trash"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      toast({
        title: "Item restaurado!",
        description: "A foto foi movida de volta para a galeria.",
      });
      setConfirmDialog(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Permanent delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("gallery_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-trash"] });
      toast({
        title: "Item excluído permanentemente",
        description: "A foto foi removida definitivamente.",
      });
      setConfirmDialog(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Empty trash mutation
  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      if (!userTenant?.id) return;

      const { error } = await supabase
        .from("gallery_items")
        .delete()
        .eq("tenant_id", userTenant.id)
        .not("deleted_at", "is", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-trash"] });
      toast({
        title: "Lixeira esvaziada",
        description: "Todos os itens foram excluídos permanentemente.",
      });
      setConfirmDialog(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getDaysInTrash = (deletedAt: string) => {
    return differenceInDays(new Date(), parseISO(deletedAt));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                Lixeira da Galeria
              </CardTitle>
              <CardDescription>
                Fotos excluídas podem ser restauradas ou apagadas permanentemente
              </CardDescription>
            </div>
            {trashedItems && trashedItems.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDialog({ type: "empty" })}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Esvaziar Lixeira
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!trashedItems || trashedItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">A lixeira está vazia</p>
              <p className="text-sm">Itens excluídos da galeria aparecerão aqui</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trashedItems.map((item) => (
                <div
                  key={item.id}
                  className="relative group rounded-xl overflow-hidden border bg-card"
                >
                  <div className="aspect-video relative">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover opacity-70 grayscale"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setConfirmDialog({ type: "restore", item })}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Restaurar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setConfirmDialog({ type: "delete", item })}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium truncate flex-1">{item.title}</h4>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {getDaysInTrash(item.deleted_at)}d
                      </Badge>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Image className="w-3 h-3" />
                        {item.theme}
                      </span>
                      <span>•</span>
                      <span>{item.event_type}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Excluído em {format(parseISO(item.deleted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmDialog?.type === "restore" ? (
                <>
                  <RotateCcw className="w-5 h-5 text-primary" />
                  Restaurar Item
                </>
              ) : confirmDialog?.type === "delete" ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Excluir Permanentemente
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Esvaziar Lixeira
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.type === "restore" ? (
                <>Deseja restaurar "{confirmDialog?.item?.title}" para a galeria?</>
              ) : confirmDialog?.type === "delete" ? (
                <>
                  Esta ação não pode ser desfeita. A foto "{confirmDialog?.item?.title}" será 
                  excluída permanentemente.
                </>
              ) : (
                <>
                  Esta ação não pode ser desfeita. Todos os {trashedItems?.length} itens da 
                  lixeira serão excluídos permanentemente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog?.type === "restore" && confirmDialog.item) {
                  restoreMutation.mutate(confirmDialog.item.id);
                } else if (confirmDialog?.type === "delete" && confirmDialog.item) {
                  deleteMutation.mutate(confirmDialog.item.id);
                } else if (confirmDialog?.type === "empty") {
                  emptyTrashMutation.mutate();
                }
              }}
              className={confirmDialog?.type === "restore" ? "" : "bg-destructive hover:bg-destructive/90"}
            >
              {confirmDialog?.type === "restore" ? "Restaurar" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
