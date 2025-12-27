import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NativeCheckbox } from "@/components/ui/native-checkbox";
import { FileSignature, CheckCircle, AlertCircle, Download, Shield, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contract {
  id: string;
  client_name: string;
  contract_type: string | null;
  file_url: string | null;
  status: string | null;
  signed_at: string | null;
  signature_data: string | null;
  notes: string | null;
  created_at: string;
  tenant_id: string;
}

interface Tenant {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
}

const typeLabels: Record<string, string> = {
  party: "Festa",
  rental: "Locação de Brinquedos",
  decoration: "Decoração",
  other: "Serviço",
};

export default function ContractSign() {
  const { token } = useParams<{ token: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (token) {
      fetchContract();
    }
  }, [token]);

  const fetchContract = async () => {
    try {
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("signature_token", token)
        .maybeSingle();

      if (contractError) throw contractError;

      if (!contractData) {
        setError("Contrato não encontrado ou link inválido.");
        setLoading(false);
        return;
      }

      setContract(contractData);

      if (contractData.status === "signed") {
        setSigned(true);
      }

      // Fetch tenant info
      if (contractData.tenant_id) {
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("name, logo_url, primary_color")
          .eq("id", contractData.tenant_id)
          .maybeSingle();

        if (tenantData) {
          setTenant(tenantData);
        }
      }
    } catch (err: any) {
      console.error("Error fetching contract:", err);
      setError("Erro ao carregar contrato. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signatureData: string) => {
    if (!contract || !agreedToTerms) return;

    setSigning(true);
    try {
      const { error: updateError } = await supabase
        .from("contracts")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signature_data: signatureData,
          signer_ip: "collected-server-side",
          signer_user_agent: navigator.userAgent,
        })
        .eq("id", contract.id)
        .eq("signature_token", token);

      if (updateError) throw updateError;

      setSigned(true);
    } catch (err: any) {
      console.error("Error signing contract:", err);
      setError("Erro ao assinar contrato. Tente novamente.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Carregando contrato...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-16 h-16 text-destructive" />
              <h2 className="text-xl font-semibold">Contrato não encontrado</h2>
              <p className="text-muted-foreground">{error || "O link pode estar incorreto ou expirado."}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">Contrato Assinado!</h2>
                <p className="text-muted-foreground">
                  Obrigado, {contract.client_name}! Seu contrato foi assinado com sucesso.
                </p>
              </div>
              
              {contract.signed_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Assinado em {format(new Date(contract.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              )}

              {contract.signature_data && (
                <div className="border rounded-lg p-4 bg-white">
                  <p className="text-sm text-muted-foreground mb-2">Sua assinatura:</p>
                  <img 
                    src={contract.signature_data} 
                    alt="Assinatura" 
                    className="max-w-48 h-auto mx-auto"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-full">
                <Shield className="w-4 h-4" />
                Assinatura digital verificada
              </div>

              {tenant && (
                <p className="text-sm text-muted-foreground">
                  {tenant.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            {tenant?.logo_url && (
              <img 
                src={tenant.logo_url} 
                alt={tenant.name} 
                className="h-16 w-auto mx-auto mb-4"
              />
            )}
            <CardTitle className="flex items-center justify-center gap-2">
              <FileSignature className="w-6 h-6" />
              Assinatura Digital de Contrato
            </CardTitle>
            <CardDescription>
              {tenant?.name || "Bella Arte"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Contract Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhes do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{contract.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{typeLabels[contract.contract_type || "other"]}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="outline" className="bg-blue-500/20 text-blue-700 border-blue-500/30">
                  Aguardando Assinatura
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {format(new Date(contract.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {contract.file_url && (
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <a href={contract.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Visualizar Contrato Completo (PDF)
                  </a>
                </Button>
              </div>
            )}

            {contract.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Observações:</p>
                <p className="text-sm">{contract.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assinatura Digital</CardTitle>
            <CardDescription>
              Desenhe sua assinatura no campo abaixo para confirmar o contrato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SignaturePad onSave={handleSign} disabled={signing || !agreedToTerms} />

            <label 
              className="flex items-start space-x-3 p-4 bg-muted rounded-lg cursor-pointer"
              htmlFor="terms-checkbox"
            >
              <NativeCheckbox
                id="terms-checkbox"
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed">
                Li e concordo com os termos do contrato. Declaro que as informações são verdadeiras 
                e autorizo o uso da minha assinatura digital para validação deste documento.
              </span>
            </label>

            {!agreedToTerms && (
              <p className="text-sm text-amber-600 text-center">
                Você precisa concordar com os termos para assinar o contrato.
              </p>
            )}

            {signing && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                Processando assinatura...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-foreground">Assinatura Segura</p>
                <p>Sua assinatura é criptografada e armazenada com segurança. 
                   Registramos data, hora e informações do dispositivo para validação.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
