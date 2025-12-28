import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfettiEffect } from "@/components/ConfettiEffect";
import { CheckCircle, XCircle, FileText, Calendar, Clock, Loader2, PartyPopper, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Quote {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  status: string | null;
  valid_until: string | null;
  notes: string | null;
  total_value: number | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

interface Tenant {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  expired: "Expirado",
};

export default function QuoteApproval() {
  const { token } = useParams<{ token: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [token]);

  const fetchQuote = async () => {
    if (!token) {
      setError("Token inválido");
      setLoading(false);
      return;
    }

    try {
      // Fetch quote by token
      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .select("*")
        .eq("approval_token", token)
        .maybeSingle();

      if (quoteError) throw quoteError;
      
      if (!quoteData) {
        setError("Orçamento não encontrado");
        setLoading(false);
        return;
      }

      setQuote(quoteData);

      // Fetch quote items
      const { data: itemsData, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quoteData.id)
        .order("created_at", { ascending: true });

      if (itemsError) throw itemsError;
      setQuoteItems(itemsData || []);

      // Fetch tenant info
      if (quoteData.tenant_id) {
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("name, logo_url, primary_color")
          .eq("id", quoteData.tenant_id)
          .maybeSingle();

        if (tenantData) {
          setTenant(tenantData);
        }
      }
    } catch (err: any) {
      console.error("Error fetching quote:", err);
      setError("Erro ao carregar orçamento");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!quote) return;
    
    setActionLoading(true);
    try {
      // Fetch full quote data including tenant_id
      const { data: fullQuote, error: fetchError } = await supabase
        .from("quotes")
        .select("*, quote_items(*)")
        .eq("id", quote.id)
        .single();

      if (fetchError) throw fetchError;

      // Update quote status
      const { error } = await supabase
        .from("quotes")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", quote.id);

      if (error) throw error;

      // Generate signature token for the contract
      const generateSignatureToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 32; i++) {
          token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
      };

      // Create contract automatically from the approved quote
      const contractData = {
        tenant_id: fullQuote.tenant_id,
        quote_id: quote.id,
        appointment_id: fullQuote.appointment_id,
        client_name: quote.client_name,
        client_email: quote.client_email,
        client_phone: quote.client_phone,
        contract_type: "party",
        status: "draft",
        signature_token: generateSignatureToken(),
        notes: `Contrato gerado automaticamente a partir do orçamento aprovado.\n\nItens:\n${
          fullQuote.quote_items?.map((item: any) => 
            `- ${item.description}: ${item.quantity}x R$ ${item.unit_price?.toFixed(2)} = R$ ${item.total_price?.toFixed(2)}`
          ).join('\n') || ''
        }\n\nValor Total: R$ ${quote.total_value?.toFixed(2) || '0.00'}`,
      };

      const { error: contractError } = await supabase
        .from("contracts")
        .insert(contractData);

      if (contractError) {
        console.error("Error creating contract:", contractError);
        // Don't throw - the quote was approved successfully, just log the contract error
      }

      setQuote({ ...quote, status: "approved", approved_at: new Date().toISOString() });
      setShowConfetti(true);
    } catch (err: any) {
      console.error("Error approving quote:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!quote) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("quotes")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
        })
        .eq("id", quote.id);

      if (error) throw error;

      setQuote({ ...quote, status: "rejected", rejected_at: new Date().toISOString() });
    } catch (err: any) {
      console.error("Error rejecting quote:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const isExpired = quote?.valid_until && new Date(quote.valid_until) < new Date();
  const canTakeAction = quote?.status !== "approved" && quote?.status !== "rejected" && !isExpired;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Orçamento não encontrado</h2>
            <p className="text-muted-foreground">
              {error || "O link pode ter expirado ou ser inválido."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <ConfettiEffect trigger={showConfetti} />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {tenant?.logo_url ? (
            <img 
              src={tenant.logo_url} 
              alt={tenant.name} 
              className="h-16 mx-auto mb-4 object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="w-8 h-8 text-primary" />
            </div>
          )}
          <h1 className="text-2xl font-bold" style={{ color: tenant?.primary_color || undefined }}>
            {tenant?.name || "Orçamento"}
          </h1>
        </div>

        {/* Status Banner */}
        {quote.status === "approved" && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Orçamento Aprovado!</p>
              <p className="text-sm text-green-700">
                Aprovado em {quote.approved_at && format(new Date(quote.approved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        )}

        {quote.status === "rejected" && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Orçamento Rejeitado</p>
              <p className="text-sm text-red-700">
                Rejeitado em {quote.rejected_at && format(new Date(quote.rejected_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        )}

        {isExpired && quote.status !== "approved" && quote.status !== "rejected" && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800">Orçamento Expirado</p>
              <p className="text-sm text-yellow-700">
                Este orçamento expirou em {quote.valid_until && format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        )}

        {/* Quote Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Orçamento
                </CardTitle>
                <CardDescription className="mt-1">
                  Para: {quote.client_name}
                </CardDescription>
              </div>
              <Badge variant="outline" className="capitalize">
                {statusLabels[quote.status || "pending"] || quote.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Criado em {format(new Date(quote.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </div>
              {quote.valid_until && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Válido até {format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              )}
            </div>

            <Separator />

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-4">Itens do Orçamento</h3>
              <div className="space-y-3">
                {quoteItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity}x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total_value || 0)}
              </span>
            </div>

            {/* Notes */}
            {quote.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Observações</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
                </div>
              </>
            )}

            {/* Actions */}
            {canTakeAction && (
              <>
                <Separator />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    className="flex-1" 
                    size="lg" 
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Aprovar Orçamento
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    size="lg"
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Recusar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Em caso de dúvidas, entre em contato conosco.
        </p>
      </div>
    </div>
  );
}