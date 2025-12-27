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
import { Plus, Pencil, Trash2, FileText, Send, Check, X, Eye, Copy, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Quote {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  status: string | null;
  valid_until: string | null;
  notes: string | null;
  total_value: number | null;
  approval_token: string | null;
  created_at: string;
}

interface QuoteItem {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  sent: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  approved: "bg-green-500/20 text-green-700 border-green-500/30",
  rejected: "bg-red-500/20 text-red-700 border-red-500/30",
  expired: "bg-gray-500/20 text-gray-700 border-gray-500/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  expired: "Expirado",
};

export function AdminQuotes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<Partial<QuoteItem>[]>([{ description: "", quantity: 1, unit_price: 0, total_price: 0 }]);
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    valid_until: "",
    notes: "",
  });

  // Get tenant ID
  const { data: tenantId } = useQuery({
    queryKey: ["my-tenant-id-quotes"],
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

  // Get tenant info for WhatsApp
  const { data: tenant } = useQuery({
    queryKey: ["my-tenant-quotes-whatsapp"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("tenants")
        .select("whatsapp_number, name")
        .eq("owner_id", user.id)
        .maybeSingle();
      
      return data;
    },
  });

  // Fetch quotes
  const { data: quotes, isLoading } = useQuery({
    queryKey: ["admin-quotes", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Quote[];
    },
    enabled: !!tenantId,
  });

  // Fetch services for suggestions
  const { data: services } = useQuery({
    queryKey: ["services-for-quotes", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Calculate total
  const calculateTotal = () => {
    return quoteItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
  };

  // Update item total when quantity or price changes
  const updateItemTotal = (index: number, field: string, value: string | number) => {
    const newItems = [...quoteItems];
    const item = { ...newItems[index] };
    
    if (field === 'quantity') {
      item.quantity = Number(value);
    } else if (field === 'unit_price') {
      item.unit_price = Number(value);
    } else if (field === 'description') {
      item.description = String(value);
    }
    
    item.total_price = (item.quantity || 1) * (item.unit_price || 0);
    newItems[index] = item;
    setQuoteItems(newItems);
  };

  // Add service from list
  const addServiceItem = (serviceId: string) => {
    const service = services?.find(s => s.id === serviceId);
    if (service) {
      setQuoteItems([...quoteItems, {
        description: service.name,
        quantity: 1,
        unit_price: service.price,
        total_price: service.price,
      }]);
    }
  };

  // Generate approval token
  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const totalValue = calculateTotal();
      const token = editingQuote?.approval_token || generateToken();

      const quoteData = {
        tenant_id: tenantId,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        valid_until: formData.valid_until || null,
        notes: formData.notes || null,
        total_value: totalValue,
        approval_token: token,
      };

      if (editingQuote) {
        const { error } = await supabase
          .from("quotes")
          .update(quoteData)
          .eq("id", editingQuote.id);
        if (error) throw error;

        // Delete existing items and re-insert
        await supabase.from("quote_items").delete().eq("quote_id", editingQuote.id);
        
        const items = quoteItems.filter(item => item.description).map(item => ({
          quote_id: editingQuote.id,
          description: item.description!,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
        }));

        if (items.length > 0) {
          const { error: itemsError } = await supabase.from("quote_items").insert(items);
          if (itemsError) throw itemsError;
        }

        return { id: editingQuote.id, isNew: false };
      } else {
        const { data: newQuote, error } = await supabase
          .from("quotes")
          .insert(quoteData)
          .select()
          .single();
        if (error) throw error;

        const items = quoteItems.filter(item => item.description).map(item => ({
          quote_id: newQuote.id,
          description: item.description!,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
        }));

        if (items.length > 0) {
          const { error: itemsError } = await supabase.from("quote_items").insert(items);
          if (itemsError) throw itemsError;
        }

        return { id: newQuote.id, isNew: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
      toast({
        title: editingQuote ? "Orçamento atualizado!" : "Orçamento criado!",
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
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
      toast({
        title: "Orçamento removido",
        description: "O orçamento foi removido com sucesso.",
      });
    },
  });

  // Send quote via WhatsApp
  const sendViaWhatsApp = (quote: Quote) => {
    if (!quote.client_phone) {
      toast({
        title: "Telefone não informado",
        description: "Adicione o telefone do cliente para enviar via WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    const approvalUrl = `${window.location.origin}/orcamento/${quote.approval_token}`;
    const total = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total_value || 0);
    
    const message = `🎉 *Orçamento - ${tenant?.name || 'Bella Arte'}*\n\n` +
      `Olá ${quote.client_name}!\n\n` +
      `Segue seu orçamento:\n` +
      `💰 *Valor Total: ${total}*\n\n` +
      `📋 Para ver os detalhes e aprovar:\n${approvalUrl}\n\n` +
      `Qualquer dúvida, estamos à disposição! 😊`;

    const whatsappUrl = `https://wa.me/${quote.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Update status to sent
    supabase.from("quotes").update({ status: 'sent', sent_at: new Date().toISOString() }).eq("id", quote.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
    });
  };

  // Copy approval link
  const copyApprovalLink = (token: string) => {
    const url = `${window.location.origin}/orcamento/${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link de aprovação foi copiado para a área de transferência.",
    });
  };

  const resetForm = () => {
    setFormData({
      client_name: "",
      client_email: "",
      client_phone: "",
      valid_until: "",
      notes: "",
    });
    setQuoteItems([{ description: "", quantity: 1, unit_price: 0, total_price: 0 }]);
    setEditingQuote(null);
    setIsDialogOpen(false);
  };

  const handleEdit = async (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      client_name: quote.client_name,
      client_email: quote.client_email || "",
      client_phone: quote.client_phone || "",
      valid_until: quote.valid_until || "",
      notes: quote.notes || "",
    });

    // Fetch quote items
    const { data: items } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quote.id);

    if (items && items.length > 0) {
      setQuoteItems(items);
    } else {
      setQuoteItems([{ description: "", quantity: 1, unit_price: 0, total_price: 0 }]);
    }

    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Orçamentos
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuote ? "Editar Orçamento" : "Novo Orçamento"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Client Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
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
                  <Label>Válido até</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              {/* Services Select */}
              {services && services.length > 0 && (
                <div>
                  <Label>Adicionar Serviço</Label>
                  <Select onValueChange={addServiceItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço para adicionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Quote Items */}
              <div>
                <Label className="mb-2 block">Itens do Orçamento</Label>
                <div className="space-y-2">
                  {quoteItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        className="col-span-5"
                        placeholder="Descrição"
                        value={item.description || ""}
                        onChange={(e) => updateItemTotal(index, 'description', e.target.value)}
                      />
                      <Input
                        className="col-span-2"
                        type="number"
                        placeholder="Qtd"
                        value={item.quantity || ""}
                        onChange={(e) => updateItemTotal(index, 'quantity', e.target.value)}
                      />
                      <Input
                        className="col-span-2"
                        type="number"
                        step="0.01"
                        placeholder="Valor"
                        value={item.unit_price || ""}
                        onChange={(e) => updateItemTotal(index, 'unit_price', e.target.value)}
                      />
                      <div className="col-span-2 text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_price || 0)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="col-span-1"
                        onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== index))}
                        disabled={quoteItems.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setQuoteItems([...quoteItems, { description: "", quantity: 1, unit_price: 0, total_price: 0 }])}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Item
                </Button>
              </div>

              {/* Total */}
              <div className="flex justify-end border-t pt-4">
                <div className="text-lg font-bold">
                  Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Condições de pagamento, detalhes adicionais..."
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
        ) : quotes && quotes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{quote.client_name}</span>
                      {quote.client_phone && (
                        <span className="text-sm text-muted-foreground">{quote.client_phone}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total_value || 0)}
                  </TableCell>
                  <TableCell>
                    {quote.valid_until
                      ? format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: ptBR })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[quote.status || "pending"]}>
                      {statusLabels[quote.status || "pending"]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Copiar link"
                        onClick={() => copyApprovalLink(quote.approval_token || "")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Enviar via WhatsApp"
                        onClick={() => sendViaWhatsApp(quote)}
                      >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(quote)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(quote.id)}
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
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum orçamento encontrado.</p>
            <p className="text-sm">Clique em "Novo Orçamento" para criar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
