import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Ticket, Percent, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Coupon } from "@/hooks/useCoupons";

export function AdminCoupons() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    min_order_value: 0,
    max_uses: "",
    is_active: true,
    starts_at: "",
    expires_at: "",
  });

  const queryClient = useQueryClient();

  const { data: tenantId } = useQuery({
    queryKey: ["user-tenant"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.rpc("get_user_tenant", { _user_id: user.id });
      return data;
    },
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
    enabled: !!tenantId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const couponData = {
        tenant_id: tenantId,
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_order_value: data.min_order_value || null,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        is_active: data.is_active,
        starts_at: data.starts_at || null,
        expires_at: data.expires_at || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("coupons")
          .insert(couponData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(editingCoupon ? "Cupom atualizado!" : "Cupom criado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar cupom: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Cupom excluído!");
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 0,
      min_order_value: 0,
      max_uses: "",
      is_active: true,
      starts_at: "",
      expires_at: "",
    });
    setEditingCoupon(null);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_value: coupon.min_order_value || 0,
      max_uses: coupon.max_uses?.toString() || "",
      is_active: coupon.is_active,
      starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : "",
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, id: editingCoupon?.id });
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { label: "Inativo", variant: "secondary" as const };
    
    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return { label: "Agendado", variant: "outline" as const };
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return { label: "Expirado", variant: "destructive" as const };
    }
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { label: "Esgotado", variant: "destructive" as const };
    }
    return { label: "Ativo", variant: "default" as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Cupons de Desconto
          </CardTitle>
          <CardDescription>Gerencie os cupons promocionais da loja</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
              <DialogDescription>
                {editingCoupon ? "Atualize as informações do cupom" : "Crie um novo cupom de desconto"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Código do Cupom</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="DESCONTO10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="10% de desconto em todos os produtos"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(v: "percentage" | "fixed") => setFormData({ ...formData, discount_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor do Desconto</Label>
                  <Input
                    type="number"
                    min="0"
                    step={formData.discount_type === "percentage" ? "1" : "0.01"}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Mínimo do Pedido</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Limite de Usos</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Válido a partir de</Label>
                  <Input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expira em</Label>
                  <Input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Cupom Ativo</Label>
              </div>

              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar Cupom"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Carregando...</p>
        ) : !coupons?.length ? (
          <p className="text-center py-8 text-muted-foreground">Nenhum cupom cadastrado</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div>
                        <span className="font-mono font-bold">{coupon.code}</span>
                        {coupon.description && (
                          <p className="text-xs text-muted-foreground">{coupon.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {coupon.discount_type === "percentage" ? (
                          <>
                            <Percent className="w-3 h-3" />
                            {coupon.discount_value}%
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-3 h-3" />
                            R$ {coupon.discount_value.toFixed(2).replace(".", ",")}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.current_uses}{coupon.max_uses ? `/${coupon.max_uses}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMutation.mutate(coupon.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
