import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  Mail, 
  Phone, 
  MessageSquare, 
  Trash2, 
  Eye, 
  Search,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  status: string | null;
  created_at: string;
  tenant_id: string | null;
}

const statusOptions = [
  { value: "new", label: "Novo", color: "bg-blue-500" },
  { value: "contacted", label: "Contatado", color: "bg-yellow-500" },
  { value: "converted", label: "Convertido", color: "bg-green-500" },
  { value: "lost", label: "Perdido", color: "bg-red-500" },
];

export function AdminLeads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-leads", userTenant?.id],
    queryFn: async () => {
      if (!userTenant?.id) return [];

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("tenant_id", userTenant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!userTenant?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      toast({
        title: "Status atualizado!",
        description: "O status do lead foi alterado.",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      setDeleteId(null);
      toast({
        title: "Lead excluído!",
        description: "O lead foi removido com sucesso.",
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

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string | null) => {
    const statusConfig = statusOptions.find((s) => s.value === status) || statusOptions[0];
    return (
      <Badge className={`${statusConfig.color} text-white`}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "contacted":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "converted":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "lost":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Users className="w-4 h-4 text-blue-500" />;
    }
  };

  const stats = {
    total: leads?.length || 0,
    new: leads?.filter((l) => l.status === "new").length || 0,
    contacted: leads?.filter((l) => l.status === "contacted").length || 0,
    converted: leads?.filter((l) => l.status === "converted").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novos</p>
                <p className="text-2xl font-bold text-blue-500">{stats.new}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contatados</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.contacted}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Convertidos</p>
                <p className="text-2xl font-bold text-green-500">{stats.converted}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Leads Recebidos
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
            </div>
          ) : !filteredLeads?.length ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Nenhum lead encontrado com esses filtros"
                  : "Nenhum lead recebido ainda"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex items-start gap-4">
                    {getStatusIcon(lead.status)}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lead.name}</span>
                        {getStatusBadge(lead.status)}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </span>
                        )}
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-8 md:ml-0">
                    <Select
                      value={lead.status || "new"}
                      onValueChange={(value) =>
                        updateStatusMutation.mutate({ id: lead.id, status: value })
                      }
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {lead.phone && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <a
                          href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsViewOpen(true);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteId(lead.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Lead Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <p className="font-medium">{selectedLead.name}</p>
              </div>
              {selectedLead.email && (
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{selectedLead.email}</p>
                </div>
              )}
              {selectedLead.phone && (
                <div>
                  <label className="text-sm text-muted-foreground">Telefone</label>
                  <p className="font-medium">{selectedLead.phone}</p>
                </div>
              )}
              {selectedLead.message && (
                <div>
                  <label className="text-sm text-muted-foreground">Mensagem</label>
                  <p className="font-medium whitespace-pre-wrap">{selectedLead.message}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground">Data de Cadastro</label>
                <p className="font-medium">
                  {format(new Date(selectedLead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                {selectedLead.phone && (
                  <Button className="flex-1" asChild>
                    <a
                      href={`https://wa.me/${selectedLead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                )}
                {selectedLead.email && (
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`mailto:${selectedLead.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lead será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
