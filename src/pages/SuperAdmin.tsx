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
  LogOut, Shield, Users, Store, BarChart3, 
  ExternalLink, Search, CheckCircle, XCircle, Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";

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

      // Check if user is super admin
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
        supabase.from("tenants").select("id, is_active, subscription_status"),
        supabase.from("services").select("id"),
        supabase.from("gallery_items").select("id"),
      ]);

      const allTenants = tenantsRes.data || [];
      return {
        totalTenants: allTenants.length,
        activeTenants: allTenants.filter(t => t.is_active).length,
        trialTenants: allTenants.filter(t => t.subscription_status === "trial").length,
        totalServices: servicesRes.data?.length || 0,
        totalGalleryItems: galleryRes.data?.length || 0,
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
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case "trial":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Trial</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status || "N/A"}</Badge>;
    }
  };

  if (isLoading || tenantsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Super Admin
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Decoradoras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold">{stats?.totalTenants || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Contas Ativas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-3xl font-bold">{stats?.activeTenants || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Em Trial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-3xl font-bold">{stats?.trialTenants || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Serviços Cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <span className="text-3xl font-bold">{stats?.totalServices || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Fotos na Galeria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="text-3xl font-bold">{stats?.totalGalleryItems || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Decoradoras Cadastradas</CardTitle>
                <CardDescription>Gerencie todas as contas de decoradoras</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {tenant.slug}.bellaarte.com
                      </code>
                    </TableCell>
                    <TableCell>{tenant.whatsapp_number || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(tenant.subscription_status)}
                        <select
                          className="text-xs border rounded px-1 py-0.5"
                          value={tenant.subscription_status || "trial"}
                          onChange={(e) => updateSubscriptionMutation.mutate({ 
                            id: tenant.id, 
                            status: e.target.value 
                          })}
                        >
                          <option value="trial">Trial</option>
                          <option value="active">Ativo</option>
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
                    <TableCell>
                      {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/?tenant=${tenant.slug}`, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma decoradora encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
