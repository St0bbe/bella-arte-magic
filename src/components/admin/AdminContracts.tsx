import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, FileSignature, Send, Upload, MessageCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contract {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  contract_type: string | null;
  file_url: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-700 border-gray-500/30",
  sent: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  signed: "bg-green-500/20 text-green-700 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-700 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  signed: "Assinado",
  cancelled: "Cancelado",
};

const typeLabels: Record<string, string> = {
  party: "Festa",
  rental: "Locação de Brinquedos",
  decoration: "Decoração",
  other: "Outro",
};

export function AdminContracts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    contract_type: "party",
    notes: "",
  });

  // Get tenant ID
  const { data: tenantId } = useQuery({
    queryKey: ["my-tenant-id-contracts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      
      return data?.id;
    },
  });

  // Get tenant info
  const { data: tenant } = useQuery({
    queryKey: ["my-tenant-contracts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("tenants")
        .select("name")
        .eq("owner_id", user.id)
        .maybeSingle();
      
      return data;
    },
  });

  // Fetch contracts
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["admin-contracts", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!tenantId,
  });

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo é 10MB.",
          variant: "destructive",
        });
        return;
      }
      setContractFile(file);
    }
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      let fileUrl = editingContract?.file_url || null;

      // Upload file if provided
      if (contractFile && tenantId) {
        const fileExt = contractFile.name.split(".").pop();
        const fileName = `${tenantId}/contracts/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(fileName, contractFile);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("gallery")
          .getPublicUrl(fileName);

        fileUrl = publicUrl.publicUrl;
      }

      const contractData = {
        tenant_id: tenantId,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        contract_type: formData.contract_type,
        file_url: fileUrl,
        notes: formData.notes || null,
      };

      if (editingContract) {
        const { error } = await supabase
          .from("contracts")
          .update(contractData)
          .eq("id", editingContract.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("contracts")
          .insert(contractData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
      toast({
        title: editingContract ? "Contrato atualizado!" : "Contrato criado!",
        description: "As alterações foram salvas.",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
      toast({
        title: "Contrato removido",
        description: "O contrato foi removido com sucesso.",
      });
    },
  });

  // Send contract via WhatsApp
  const sendViaWhatsApp = (contract: Contract) => {
    if (!contract.client_phone) {
      toast({
        title: "Telefone não informado",
        description: "Adicione o telefone do cliente para enviar via WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    if (!contract.file_url) {
      toast({
        title: "Contrato não anexado",
        description: "Faça upload do contrato antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    const message = `📄 *Contrato - ${tenant?.name || 'Bella Arte'}*\n\n` +
      `Olá ${contract.client_name}!\n\n` +
      `Segue o contrato de ${typeLabels[contract.contract_type || 'party'].toLowerCase()}:\n\n` +
      `📎 ${contract.file_url}\n\n` +
      `Por favor, revise e nos avise para prosseguirmos! 😊`;

    const whatsappUrl = `https://wa.me/${contract.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Update status to sent
    supabase.from("contracts").update({ status: 'sent', sent_at: new Date().toISOString() }).eq("id", contract.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
    });
  };

  // Mark as signed
  const markAsSigned = async (id: string) => {
    await supabase.from("contracts").update({ status: 'signed', signed_at: new Date().toISOString() }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
    toast({
      title: "Contrato assinado!",
      description: "O status foi atualizado.",
    });
  };

  const resetForm = () => {
    setFormData({
      client_name: "",
      client_email: "",
      client_phone: "",
      contract_type: "party",
      notes: "",
    });
    setContractFile(null);
    setEditingContract(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      client_name: contract.client_name,
      client_email: contract.client_email || "",
      client_phone: contract.client_phone || "",
      contract_type: contract.contract_type || "party",
      notes: contract.notes || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="w-5 h-5" />
          Contratos
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingContract ? "Editar Contrato" : "Novo Contrato"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome do Cliente *</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label>Tipo de Contrato</Label>
                  <Select
                    value={formData.contract_type}
                    onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="party">Festa</SelectItem>
                      <SelectItem value="rental">Locação de Brinquedos</SelectItem>
                      <SelectItem value="decoration">Decoração</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <Label>Arquivo do Contrato (PDF)</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="contract-file"
                  />
                  <Label
                    htmlFor="contract-file"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {contractFile ? contractFile.name : "Escolher arquivo"}
                  </Label>
                  {editingContract?.file_url && !contractFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <FileSignature className="w-4 h-4" />
                      <a href={editingContract.file_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                        Ver contrato atual <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !formData.client_name}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          </div>
        ) : contracts && contracts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{contract.client_name}</span>
                      {contract.client_phone && (
                        <span className="text-sm text-muted-foreground">{contract.client_phone}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {typeLabels[contract.contract_type || "party"]}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[contract.status || "draft"]}>
                      {statusLabels[contract.status || "draft"]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(contract.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {contract.file_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver contrato"
                          onClick={() => window.open(contract.file_url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Enviar via WhatsApp"
                        onClick={() => sendViaWhatsApp(contract)}
                      >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </Button>
                      {contract.status !== 'signed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Marcar como assinado"
                          onClick={() => markAsSigned(contract.id)}
                        >
                          <FileSignature className="w-4 h-4 text-primary" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(contract)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(contract.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileSignature className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum contrato encontrado.</p>
            <p className="text-sm">Clique em "Novo Contrato" para criar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
