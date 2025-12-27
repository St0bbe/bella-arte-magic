-- Create quotes table for budget/proposals
CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'approved', 'rejected', 'expired')),
  valid_until date,
  notes text,
  total_value numeric DEFAULT 0,
  approval_token text UNIQUE,
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create quote items table
CREATE TABLE public.quote_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity integer DEFAULT 1,
  unit_price numeric DEFAULT 0,
  total_price numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  contract_type text DEFAULT 'party' CHECK (contract_type IN ('party', 'rental', 'decoration', 'other')),
  file_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'cancelled')),
  sent_at timestamp with time zone,
  signed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Quotes policies
CREATE POLICY "Tenant owners can view their quotes" ON public.quotes
  FOR SELECT USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can insert quotes" ON public.quotes
  FOR INSERT WITH CHECK ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can update their quotes" ON public.quotes
  FOR UPDATE USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can delete their quotes" ON public.quotes
  FOR DELETE USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

-- Public access for client approval via token
CREATE POLICY "Anyone can view quotes by token" ON public.quotes
  FOR SELECT USING (approval_token IS NOT NULL);

-- Quote items policies
CREATE POLICY "Tenant owners can manage quote items" ON public.quote_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quotes q 
      WHERE q.id = quote_items.quote_id 
      AND (q.tenant_id = get_user_tenant(auth.uid()) OR is_super_admin(auth.uid()))
    )
  );

-- Contracts policies
CREATE POLICY "Tenant owners can view their contracts" ON public.contracts
  FOR SELECT USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can insert contracts" ON public.contracts
  FOR INSERT WITH CHECK ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can update their contracts" ON public.contracts
  FOR UPDATE USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can delete their contracts" ON public.contracts
  FOR DELETE USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();