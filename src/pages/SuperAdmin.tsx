import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  LogOut, Users, Store, BarChart3, Shield, Settings, Bell,
  ExternalLink, Search, CheckCircle, XCircle, Clock, AlertTriangle,
  TrendingUp, DollarSign, Calendar, Activity, Database, HardDrive,
  UserPlus, RefreshCw, Trash2, Eye, Ban, CreditCard, FileText,
  PieChart, ArrowUpRight, ArrowDownRight, MoreHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  is_active: boolean;
  subscription_status: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  whatsapp_number: string | null;
}

type ActiveSection = "dashboard" | "tenants" | "subscriptions" | "analytics" | "settings";

const MENU_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
  { id: "tenants" as const, label: "Decoradoras", icon: Users },
  { id: "subscriptions" as const, label: "Assinaturas", icon: CreditCard },
  { id: "analytics" as const, label: "Analytics", icon: PieChart },
  { id: "settings" as const, label: "Configurações", icon: Settings },
];

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");

  useEffect(() => {
    const checkSuperAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/admin/login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "super_admin");

      if (!roles || roles.length === 0) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão de super administrador.",
          variant: "destructive",
        });
        navigate("/admin");
        return;
      }

      setIsLoading(false);
    };

    checkSuperAdmin();
  }, [navigate, toast]);

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ["superadmin-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Tenant[];
    },
    enabled: !isLoading,
  });

  const { data: stats } = useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: async () => {
      const [tenantsRes, servicesRes, galleryRes] = await Promise.all([
        supabase.from("tenants").select("id, is_active, subscription_status, created_at"),
        supabase.from("services").select("id, tenant_id"),
        supabase.from("gallery_items").select("id, tenant_id"),
      ]);

      const allTenants = tenantsRes.data || [];
      const allServices = servicesRes.data || [];
      const allGallery = galleryRes.data || [];
      
      const now = new Date();
      const thisMonth = allTenants.filter(t => {
        const created = new Date(t.created_at);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      });
      
      const lastMonth = allTenants.filter(t => {
        const created = new Date(t.created_at);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return created.getMonth() === lastMonthDate.getMonth() && created.getFullYear() === lastMonthDate.getFullYear();
      });

      const activeSubs = allTenants.filter(t => t.subscription_status === "active").length;
      const trialSubs = allTenants.filter(t => t.subscription_status === "trial").length;
      const expiredSubs = allTenants.filter(t => t.subscription_status === "expired" || t.subscription_status === "cancelled").length;

      const conversionRate = trialSubs + activeSubs > 0 
        ? Math.round((activeSubs / (trialSubs + activeSubs)) * 100) 
        : 0;

      // Calculate MRR (Monthly Recurring Revenue) - assuming R$49.90/month
      const mrr = activeSubs * 49.90;

      return {
        totalTenants: allTenants.length,
        activeTenants: allTenants.filter(t => t.is_active).length,
        inactiveTenants: allTenants.filter(t => !t.is_active).length,
        trialTenants: trialSubs,
        activeSubs,
        expiredSubs,
        totalServices: allServices.length,
        totalGalleryItems: allGallery.length,
        newThisMonth: thisMonth.length,
        newLastMonth: lastMonth.length,
        conversionRate,
        mrr,
        monthlyGrowth: lastMonth.length > 0 
          ? Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100) 
          : thisMonth.length > 0 ? 100 : 0,
      };
    },
    enabled: !isLoading,
  });

  const toggleTenantMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("tenants")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
      toast({ title: "Status atualizado" });
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { subscription_status: status };
      if (status === "active") {
        updates.subscription_ends_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
      const { error } = await supabase.from("tenants").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
      toast({ title: "Assinatura atualizada" });
    },
  });

  const deleteTenantMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete related data first
      await supabase.from("services").delete().eq("tenant_id", id);
      await supabase.from("gallery_items").delete().eq("tenant_id", id);
      await supabase.from("site_settings").delete().eq("tenant_id", id);
      const { error } = await supabase.from("tenants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
      toast({ title: "Decoradora removida com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao remover decoradora", variant: "destructive" });
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case "trial":
        return <Badge className="bg-amber-500 hover:bg-amber-600"><Clock className="w-3 h-3 mr-1" />Trial</Badge>;
      case "expired":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><Ban className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status || "N/A"}</Badge>;
    }
  };

  if (isLoading || tenantsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-400">Carregando painel...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Receita Mensal (MRR)</p>
                <p className="text-2xl font-bold text-white">R$ {stats?.mrr?.toFixed(2) || "0.00"}</p>
                <p className="text-xs text-emerald-400 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {stats?.activeSubs || 0} assinaturas ativas
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total de Contas</p>
                <p className="text-2xl font-bold text-white">{stats?.totalTenants || 0}</p>
                <p className="text-xs text-blue-400 flex items-center mt-1">
                  <UserPlus className="w-3 h-3 mr-1" />
                  +{stats?.newThisMonth || 0} este mês
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-white">{stats?.conversionRate || 0}%</p>
                <p className="text-xs text-amber-400 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trial → Pago
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Crescimento Mensal</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.monthlyGrowth !== undefined && stats.monthlyGrowth >= 0 ? "+" : ""}
                  {stats?.monthlyGrowth || 0}%
                </p>
                <p className="text-xs text-purple-400 flex items-center mt-1">
                  {stats?.monthlyGrowth >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  vs mês anterior
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              Distribuição de Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="text-3xl font-bold text-emerald-400">{stats?.activeSubs || 0}</div>
                <div className="text-xs text-slate-400 mt-1">Ativos</div>
              </div>
              <div className="text-center p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="text-3xl font-bold text-amber-400">{stats?.trialTenants || 0}</div>
                <div className="text-xs text-slate-400 mt-1">Em Trial</div>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="text-3xl font-bold text-red-400">{stats?.expiredSubs || 0}</div>
                <div className="text-xs text-slate-400 mt-1">Expirados</div>
              </div>
              <div className="text-center p-4 bg-slate-500/10 rounded-lg border border-slate-500/20">
                <div className="text-3xl font-bold text-slate-400">{stats?.inactiveTenants || 0}</div>
                <div className="text-xs text-slate-400 mt-1">Inativos</div>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Conversão Trial → Pago</span>
                  <span className="text-white">{stats?.conversionRate || 0}%</span>
                </div>
                <Progress value={stats?.conversionRate || 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Uso da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-blue-400" />
                <span className="text-slate-300">Serviços</span>
              </div>
              <span className="text-white font-semibold">{stats?.totalServices || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-purple-400" />
                <span className="text-slate-300">Fotos</span>
              </div>
              <span className="text-white font-semibold">{stats?.totalGalleryItems || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-300">Contas Ativas</span>
              </div>
              <span className="text-white font-semibold">{stats?.activeTenants || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            Cadastros Recentes
          </CardTitle>
          <CardDescription className="text-slate-400">Últimas 5 decoradoras cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenants.slice(0, 5).map((tenant) => (
              <div 
                key={tenant.id} 
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-white">{tenant.name}</div>
                    <div className="text-xs text-slate-400">{tenant.slug}.celebrai.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(tenant.subscription_status)}
                  <span className="text-xs text-slate-500">
                    {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTenants = () => (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Gerenciar Decoradoras
            </CardTitle>
            <CardDescription className="text-slate-400">
              {filteredTenants.length} de {tenants.length} decoradoras
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["superadmin-tenants"] })}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-400">Decoradora</TableHead>
              <TableHead className="text-slate-400">Subdomínio</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Conta</TableHead>
              <TableHead className="text-slate-400">Criado em</TableHead>
              <TableHead className="text-slate-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.map((tenant) => (
              <TableRow key={tenant.id} className="border-slate-700 hover:bg-slate-700/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">{tenant.name}</div>
                      <div className="text-xs text-slate-500">{tenant.whatsapp_number || "Sem WhatsApp"}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="bg-slate-700 text-indigo-300 px-2 py-1 rounded text-xs">
                    {tenant.slug}.celebrai.com
                  </code>
                </TableCell>
                <TableCell>
                  <select
                    className="text-xs border border-slate-600 rounded px-2 py-1 bg-slate-700 text-white focus:border-indigo-500 focus:outline-none"
                    value={tenant.subscription_status || "trial"}
                    onChange={(e) => updateSubscriptionMutation.mutate({ 
                      id: tenant.id, 
                      status: e.target.value 
                    })}
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Ativo</option>
                    <option value="expired">Expirado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={tenant.is_active}
                      onCheckedChange={(checked) => 
                        toggleTenantMutation.mutate({ id: tenant.id, is_active: checked })
                      }
                    />
                    <span className={`text-xs ${tenant.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {tenant.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">
                  {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-700">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem 
                        onClick={() => window.open(`/site/${tenant.slug}`, "_blank")}
                        className="text-slate-300 focus:bg-slate-700 focus:text-white cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Site
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => window.open(`https://wa.me/${tenant.whatsapp_number?.replace(/\D/g, "")}`, "_blank")}
                        disabled={!tenant.whatsapp_number}
                        className="text-slate-300 focus:bg-slate-700 focus:text-white cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        WhatsApp
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()}
                            className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-800 border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Excluir decoradora?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400">
                              Esta ação não pode ser desfeita. Isso irá excluir permanentemente a conta de 
                              <span className="text-white font-semibold"> {tenant.name}</span> e todos os seus dados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteTenantMutation.mutate(tenant.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredTenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <div className="text-slate-400">Nenhuma decoradora encontrada</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderSubscriptions = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-emerald-300">Assinaturas Ativas</p>
                <p className="text-3xl font-bold text-white">{stats?.activeSubs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-amber-300">Período Trial</p>
                <p className="text-3xl font-bold text-white">{stats?.trialTenants || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-red-300">Expirados/Cancelados</p>
                <p className="text-3xl font-bold text-white">{stats?.expiredSubs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            Gerenciar Assinaturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">Decoradora</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Expira em</TableHead>
                <TableHead className="text-slate-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell className="text-white font-medium">{tenant.name}</TableCell>
                  <TableCell>{getStatusBadge(tenant.subscription_status)}</TableCell>
                  <TableCell className="text-slate-400">
                    {tenant.subscription_ends_at 
                      ? new Date(tenant.subscription_ends_at).toLocaleDateString("pt-BR")
                      : "N/A"
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSubscriptionMutation.mutate({ id: tenant.id, status: "active" })}
                        className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 text-xs"
                      >
                        Ativar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSubscriptionMutation.mutate({ id: tenant.id, status: "trial" })}
                        className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20 text-xs"
                      >
                        Trial
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Analytics da Plataforma
          </CardTitle>
          <CardDescription className="text-slate-400">
            Métricas e insights sobre o uso da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-white font-medium">Métricas de Crescimento</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Novos este mês</span>
                  <span className="text-white font-bold">{stats?.newThisMonth || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Novos mês passado</span>
                  <span className="text-white font-bold">{stats?.newLastMonth || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Crescimento</span>
                  <span className={`font-bold ${stats?.monthlyGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stats?.monthlyGrowth >= 0 ? '+' : ''}{stats?.monthlyGrowth || 0}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-white font-medium">Métricas de Engajamento</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Total de Serviços</span>
                  <span className="text-white font-bold">{stats?.totalServices || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Total de Fotos</span>
                  <span className="text-white font-bold">{stats?.totalGalleryItems || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Taxa de Conversão</span>
                  <span className="text-emerald-400 font-bold">{stats?.conversionRate || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Configurações do Sistema
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configurações gerais da plataforma Celebrai
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h4 className="text-white font-medium">Segurança</h4>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Configurações de segurança e acesso à plataforma.
              </p>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Gerenciar Acessos
              </Button>
            </div>

            <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <Bell className="w-5 h-5 text-indigo-400" />
                <h4 className="text-white font-medium">Notificações</h4>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Configure alertas e notificações do sistema.
              </p>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Configurar Alertas
              </Button>
            </div>

            <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h4 className="text-white font-medium">Logs do Sistema</h4>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Visualize logs de atividades e erros.
              </p>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Ver Logs
              </Button>
            </div>

            <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-5 h-5 text-indigo-400" />
                <h4 className="text-white font-medium">Banco de Dados</h4>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Informações sobre o banco de dados.
              </p>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Ver Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "tenants":
        return renderTenants();
      case "subscriptions":
        return renderSubscriptions();
      case "analytics":
        return renderAnalytics();
      case "settings":
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-950">
        {/* Sidebar */}
        <Sidebar className="border-r border-slate-800 bg-slate-900">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">Celebrai</h1>
                <p className="text-xs text-slate-400">Super Admin</p>
              </div>
            </div>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-slate-500 text-xs uppercase tracking-wider">
                Menu Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {MENU_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full justify-start gap-3 ${
                          activeSection === item.id 
                            ? 'bg-indigo-500/20 text-indigo-400' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="mt-auto p-4 border-t border-slate-800">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </Button>
          </div>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-slate-400 hover:text-white" />
              <h2 className="text-lg font-semibold text-white capitalize">
                {MENU_ITEMS.find(i => i.id === activeSection)?.label || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <Bell className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
