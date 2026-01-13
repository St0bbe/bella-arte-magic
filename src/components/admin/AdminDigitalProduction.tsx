import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Palette, Clock, Upload, Send, Eye, Package, 
  Loader2, AlertTriangle, CheckCircle, Mail
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_digital: boolean;
  customization_data: Record<string, string> | null;
  customization_status: string;
  customization_deadline: string | null;
  customized_file_url: string | null;
  customized_at: string | null;
  sent_to_customer_at: string | null;
  created_at: string;
  orders: {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    status: string;
    created_at: string;
  };
}

const STATUS_CONFIG = {
  pending_info: { label: "Aguardando Info", color: "bg-yellow-500", icon: Clock },
  pending_payment: { label: "Aguardando Pagamento", color: "bg-orange-500", icon: AlertTriangle },
  in_production: { label: "Em Produção", color: "bg-blue-500", icon: Palette },
  ready: { label: "Pronto", color: "bg-green-500", icon: CheckCircle },
  sent: { label: "Enviado", color: "bg-purple-500", icon: Send },
};

export default function AdminDigitalProduction() {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch tenant ID
  const { data: tenantId } = useQuery({
    queryKey: ["user-tenant"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase.rpc("get_user_tenant", { _user_id: user.id });
      return data;
    },
  });

  // Fetch digital order items
  const { data: items, isLoading } = useQuery({
    queryKey: ["digital-production", tenantId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("order_items")
        .select(`
          *,
          orders!inner(id, customer_name, customer_email, customer_phone, status, created_at, tenant_id)
        `)
        .eq("is_digital", true)
        .eq("orders.tenant_id", tenantId)
        .in("orders.status", ["paid", "processing", "shipped", "delivered"])
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("customization_status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!tenantId,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      const updates: Record<string, unknown> = { customization_status: status };
      
      if (status === "in_production" && !selectedItem?.customization_deadline) {
        updates.customization_deadline = addDays(new Date(), 3).toISOString();
      }
      
      if (status === "ready") {
        updates.customized_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("order_items")
        .update(updates)
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digital-production"] });
      toast.success("Status atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  // Upload customized file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedItem) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${selectedItem.order_id}/${selectedItem.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("customized-products")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("customized-products")
        .getPublicUrl(fileName);

      await supabase
        .from("order_items")
        .update({ 
          customized_file_url: urlData.publicUrl,
          customization_status: "ready",
          customized_at: new Date().toISOString()
        })
        .eq("id", selectedItem.id);

      queryClient.invalidateQueries({ queryKey: ["digital-production"] });
      toast.success("Arquivo personalizado enviado!");
      setSelectedItem(null);
    } catch (error) {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  // Send to customer
  const sendToCustomerMutation = useMutation({
    mutationFn: async (item: OrderItem) => {
      // Update status
      await supabase
        .from("order_items")
        .update({ 
          customization_status: "sent",
          sent_to_customer_at: new Date().toISOString()
        })
        .eq("id", item.id);

      // Send email notification
      await supabase.functions.invoke("send-shipping-notification", {
        body: {
          order_id: item.order_id,
          customer_email: item.orders.customer_email,
          customer_name: item.orders.customer_name,
          type: "digital_product_ready",
          download_url: item.customized_file_url,
          product_name: item.product_name,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digital-production"] });
      toast.success("Produto enviado para o cliente!");
    },
    onError: () => {
      toast.error("Erro ao enviar para o cliente");
    },
  });

  const getDeadlineInfo = (deadline: string | null) => {
    if (!deadline) return null;
    const daysLeft = differenceInDays(new Date(deadline), new Date());
    if (daysLeft < 0) return { text: "Atrasado!", urgent: true };
    if (daysLeft === 0) return { text: "Vence hoje!", urgent: true };
    if (daysLeft === 1) return { text: "Vence amanhã", urgent: true };
    return { text: `${daysLeft} dias restantes`, urgent: false };
  };

  const pendingCount = items?.filter(i => i.customization_status === "in_production").length || 0;
  const urgentCount = items?.filter(i => {
    if (!i.customization_deadline) return false;
    return differenceInDays(new Date(i.customization_deadline), new Date()) <= 1;
  }).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Produção Digital
            </CardTitle>
            <CardDescription>
              Personalize e envie produtos digitais aos clientes
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="w-3 h-3" />
                {pendingCount} em produção
              </Badge>
            )}
            {urgentCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {urgentCount} urgentes
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : items?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum produto digital para processar</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Personalização</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => {
                  const statusConfig = STATUS_CONFIG[item.customization_status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending_info;
                  const deadlineInfo = getDeadlineInfo(item.customization_deadline);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Pedido #{item.order_id.slice(0, 8)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.orders.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{item.orders.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.customization_data ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver dados
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem dados</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {deadlineInfo ? (
                          <span className={`text-xs ${deadlineInfo.urgent ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            {deadlineInfo.text}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.color} text-white gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {item.customization_status === "pending_info" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ itemId: item.id, status: "in_production" })}
                            >
                              <Palette className="w-4 h-4 mr-1" />
                              Iniciar
                            </Button>
                          )}
                          {item.customization_status === "in_production" && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedItem(item)}
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              Enviar Arquivo
                            </Button>
                          )}
                          {item.customization_status === "ready" && (
                            <Button
                              size="sm"
                              onClick={() => sendToCustomerMutation.mutate(item)}
                              disabled={sendToCustomerMutation.isPending}
                            >
                              {sendToCustomerMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4 mr-1" />
                              )}
                              Enviar ao Cliente
                            </Button>
                          )}
                          {item.customization_status === "sent" && item.sent_to_customer_at && (
                            <span className="text-xs text-muted-foreground">
                              Enviado em {format(new Date(item.sent_to_customer_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto Digital</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList>
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="customization">Personalização</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Produto</Label>
                    <p className="font-medium">{selectedItem.product_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Quantidade</Label>
                    <p className="font-medium">{selectedItem.quantity}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cliente</Label>
                    <p className="font-medium">{selectedItem.orders.customer_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedItem.orders.customer_email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Telefone</Label>
                    <p className="font-medium">{selectedItem.orders.customer_phone || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Data do Pedido</Label>
                    <p className="font-medium">
                      {format(new Date(selectedItem.orders.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="customization" className="space-y-4">
                {selectedItem.customization_data ? (
                  <div className="space-y-3">
                    {Object.entries(selectedItem.customization_data).map(([key, value]) => (
                      <div key={key} className="p-3 bg-muted rounded-lg">
                        <Label className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</Label>
                        <p className="font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma informação de personalização fornecida</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-4">
                  {selectedItem.customized_file_url ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Arquivo já enviado</span>
                      </div>
                      <a 
                        href={selectedItem.customized_file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:underline mt-2 block"
                      >
                        Ver arquivo atual
                      </a>
                    </div>
                  ) : null}

                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Envie o arquivo personalizado para o cliente
                    </p>
                    <Input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                      id="customized-file"
                    />
                    <Label htmlFor="customized-file" className="cursor-pointer">
                      <Button type="button" disabled={uploading} asChild>
                        <span>
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Selecionar Arquivo
                            </>
                          )}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
