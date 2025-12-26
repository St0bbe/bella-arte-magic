import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft, Store, Mail, Lock, User, Globe } from "lucide-react";

export default function DecoratorSignup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    slug: "",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleBusinessNameChange = (value: string) => {
    setFormData({
      ...formData,
      businessName: value,
      slug: generateSlug(value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug || formData.slug.length < 3) {
      toast({
        title: "Erro",
        description: "O endereço do site deve ter pelo menos 3 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if slug is available
      const { data: existingTenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", formData.slug)
        .single();

      if (existingTenant) {
        toast({
          title: "Erro",
          description: "Este endereço já está em uso. Escolha outro nome.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      // Create tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          owner_id: authData.user.id,
          name: formData.businessName,
          slug: formData.slug,
          subscription_status: "trial",
          subscription_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Add admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "admin",
        });

      if (roleError) throw roleError;

      toast({
        title: "Conta criada com sucesso!",
        description: "Você será redirecionada para o painel administrativo.",
      });

      navigate("/admin");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-party-pink/20 via-background to-party-purple/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Celebrai
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Crie sua conta</h1>
          <p className="text-muted-foreground mt-2">
            Comece a gerenciar seus eventos e serviços de decoração
          </p>
        </div>

        <Card className="border-primary/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Dados do seu negócio
            </CardTitle>
            <CardDescription>
              Preencha os dados para criar seu site personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome do seu negócio
                </Label>
                <Input
                  id="businessName"
                  placeholder="Ex: Maria Decorações"
                  value={formData.businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Endereço do seu site
                </Label>
                <div className="flex items-center">
                  <Input
                    id="slug"
                    placeholder="maria-decoracoes"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                    className="rounded-r-none"
                    required
                  />
                  <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-muted-foreground text-sm">
                    .celebrai.com
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Seu site será acessível em: {formData.slug || "seu-endereco"}.celebrai.com
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirmar Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  "Criar minha conta"
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/admin/login")}
                    className="text-primary hover:underline"
                  >
                    Fazer login
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o site
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao criar sua conta, você concorda com nossos termos de serviço e política de privacidade.
        </p>
      </div>
    </div>
  );
}
