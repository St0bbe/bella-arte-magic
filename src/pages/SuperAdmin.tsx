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
  LogOut, Users, Store, BarChart3, 
  ExternalLink, Search, CheckCircle, XCircle, Clock,
  TrendingUp, Camera, DollarSign, Calendar,
  PartyPopper, Sparkles, Crown, Gift
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
      
      // Calculate monthly growth
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

      // Calculate conversion rate (trial to active)
      const conversionRate = trialSubs + activeSubs > 0 
        ? Math.round((activeSubs / (trialSubs + activeSubs)) * 100) 
        : 0;

      // Average services per tenant
      const avgServices = allTenants.length > 0 
        ? (allServices.length / allTenants.length).toFixed(1) 
        : "0";

      // Average gallery items per tenant
      const avgGallery = allTenants.length > 0 
        ? (allGallery.length / allTenants.length).toFixed(1) 
        : "0";

      return {
        totalTenants: allTenants.length,
        activeTenants: allTenants.filter(t => t.is_active).length,
        trialTenants: trialSubs,
        activeSubs,
        expiredSubs,
        totalServices: allServices.length,
        totalGalleryItems: allGallery.length,
        newThisMonth: thisMonth.length,
        newLastMonth: lastMonth.length,
        conversionRate,
        avgServices,
        avgGallery,
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
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case "trial":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" />Trial</Badge>;
      case "expired":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status || "N/A"}</Badge>;
    }
  };

  if (isLoading || tenantsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-background">
      {/* Header */}
      <header className="border-b border-pink-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <PartyPopper className="w-8 h-8 text-pink-500" />
              <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Celebrai
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-500" />
                Painel Super Admin
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-pink-200 hover:bg-pink-50">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 text-white border-0 overflow-hidden relative">
          <div className="absolute inset-0 opacity-20">
            {["🎉", "🎊", "🎈", "🎁", "⭐"].map((emoji, i) => (
              <span
                key={i}
                className="absolute text-3xl"
                style={{
                  left: `${15 + i * 18}%`,
                  top: `${20 + (i % 2) * 40}%`,
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
          <CardContent className="py-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Bem-vindo ao Celebrai! 🎉</h2>
                <p className="text-white/80">Gerencie todas as decoradoras da plataforma</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{stats?.totalTenants || 0}</div>
                <div className="text-sm text-white/80">decoradoras cadastradas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-white border border-pink-100">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tenants" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700">
              <Users className="w-4 h-4 mr-2" />
              Decoradoras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-pink-100 hover:shadow-lg hover:shadow-pink-500/10 transition-all">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-pink-500" />
                    Total de Decoradoras
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-pink-600">{stats?.totalTenants || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.activeTenants || 0} contas ativas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-100 hover:shadow-lg hover:shadow-green-500/10 transition-all">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    Assinaturas Ativas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats?.activeSubs || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    gerando receita recorrente
                  </p>
                </CardContent>
              </Card>

              <Card className="border-yellow-100 hover:shadow-lg hover:shadow-yellow-500/10 transition-all">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    Em Período Trial
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{stats?.trialTenants || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    potenciais conversões
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Crescimento Mensal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-600">
                      {stats?.monthlyGrowth !== undefined && stats.monthlyGrowth >= 0 ? "+" : ""}
                      {stats?.monthlyGrowth || 0}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.newThisMonth || 0} novos este mês
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-purple-100">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-500" />
                    Taxa de Conversão
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-2xl font-bold text-purple-600">{stats?.conversionRate || 0}%</span>
                      <span className="text-xs text-muted-foreground">Trial → Pago</span>
                    </div>
                    <Progress value={stats?.conversionRate || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-100">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    Média de Serviços
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">{stats?.avgServices || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    serviços por decoradora
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: {stats?.totalServices || 0} serviços
                  </p>
                </CardContent>
              </Card>

              <Card className="border-cyan-100">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-500" />
                    Média de Fotos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-600">{stats?.avgGallery || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    fotos por decoradora
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: {stats?.totalGalleryItems || 0} fotos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Distribution */}
            <Card className="border-pink-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-pink-500" />
                  Distribuição de Assinaturas
                </CardTitle>
                <CardDescription>Visão geral do status das assinaturas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="text-4xl mb-2">✅</div>
                    <div className="text-3xl font-bold text-green-600">{stats?.activeSubs || 0}</div>
                    <div className="text-sm text-green-700">Assinaturas Ativas</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                    <div className="text-4xl mb-2">⏳</div>
                    <div className="text-3xl font-bold text-yellow-600">{stats?.trialTenants || 0}</div>
                    <div className="text-sm text-yellow-700">Em Trial</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="text-4xl mb-2">❌</div>
                    <div className="text-3xl font-bold text-red-600">{stats?.expiredSubs || 0}</div>
                    <div className="text-sm text-red-700">Expirados/Cancelados</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-pink-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-500" />
                  Decoradoras Recentes
                </CardTitle>
                <CardDescription>Últimas 5 decoradoras cadastradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tenants.slice(0, 5).map((tenant, index) => (
                    <div 
                      key={tenant.id} 
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {tenant.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-xs text-muted-foreground">{tenant.slug}.celebrai.com</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(tenant.subscription_status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-6">
            {/* Tenants Table */}
            <Card className="border-pink-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-pink-500" />
                      Decoradoras Cadastradas
                    </CardTitle>
                    <CardDescription>Gerencie todas as contas de decoradoras</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar decoradora..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-pink-200 focus:border-pink-400"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Subdomínio</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Assinatura</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow key={tenant.id} className="hover:bg-pink-50/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                              {tenant.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{tenant.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-pink-50 text-pink-700 px-2 py-1 rounded text-sm border border-pink-200">
                            {tenant.slug}.celebrai.com
                          </code>
                        </TableCell>
                        <TableCell>{tenant.whatsapp_number || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(tenant.subscription_status)}
                            <select
                              className="text-xs border border-pink-200 rounded px-2 py-1 bg-white focus:border-pink-400 focus:outline-none"
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
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={tenant.is_active}
                            onCheckedChange={(checked) => 
                              toggleTenantMutation.mutate({ id: tenant.id, is_active: checked })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/site/${tenant.slug}`, "_blank")}
                            className="hover:bg-pink-100 hover:text-pink-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTenants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="text-4xl mb-2">🔍</div>
                          <div className="text-muted-foreground">Nenhuma decoradora encontrada</div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-pink-100 bg-white/50 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <PartyPopper className="w-4 h-4 text-pink-500" />
            Celebrai © {new Date().getFullYear()} - Painel Super Admin
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </p>
        </div>
      </footer>
    </div>
  );
}
