import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Loader2, Trash2, ExternalLink, Copy, PartyPopper, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const THEME_LABELS: Record<string, string> = {
  princesas: "👸 Princesas",
  herois: "🦸 Super-Heróis",
  dinossauros: "🦖 Dinossauros",
  unicornios: "🦄 Unicórnios",
  safari: "🦁 Safari",
  espacial: "🚀 Espaço",
  fundo_do_mar: "🐠 Fundo do Mar",
  futebol: "⚽ Futebol",
  fazendinha: "🐄 Fazendinha",
  circo: "🎪 Circo",
};

interface Invitation {
  id: string;
  share_token: string;
  child_name: string;
  child_age: number | null;
  theme: string;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
  image_url: string | null;
  created_at: string;
}

export function AdminInvites() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const { data: invitations, isLoading } = useQuery({
    queryKey: ["admin-invitations", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!tenantId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
      toast({
        title: "Convite excluído",
        description: "O convite foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyLink = async (shareToken: string) => {
    const link = `${window.location.origin}/convite/${shareToken}`;
    await navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link do convite foi copiado para a área de transferência.",
    });
  };

  const openLink = (shareToken: string) => {
    window.open(`/convite/${shareToken}`, "_blank");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5" />
              Convites de Aniversário
            </CardTitle>
            <CardDescription>
              Gerencie os convites criados para seus clientes
            </CardDescription>
          </div>
          <Button asChild>
            <a href="/convites" target="_blank" rel="noopener noreferrer">
              <Sparkles className="w-4 h-4 mr-2" />
              Criar Novo Convite
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!invitations || invitations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <PartyPopper className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum convite criado ainda.</p>
            <p className="text-sm mt-2">
              Use a página pública de convites para criar convites personalizados para seus clientes.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prévia</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Data do Evento</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>
                    {invitation.image_url ? (
                      <img
                        src={invitation.image_url}
                        alt={invitation.child_name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <PartyPopper className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invitation.child_name}</p>
                      {invitation.child_age && (
                        <p className="text-sm text-muted-foreground">
                          {invitation.child_age} anos
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {THEME_LABELS[invitation.theme] || invitation.theme}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {invitation.event_date ? (
                      <div>
                        <p>{format(new Date(invitation.event_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                        {invitation.event_time && (
                          <p className="text-sm text-muted-foreground">{invitation.event_time}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invitation.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLink(invitation.share_token)}
                        title="Copiar link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openLink(invitation.share_token)}
                        title="Abrir convite"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(invitation.id)}
                        disabled={deleteMutation.isPending}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
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
  );
}
