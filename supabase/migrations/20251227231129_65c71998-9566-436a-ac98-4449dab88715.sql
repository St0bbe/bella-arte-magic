-- Create leads table for contact form submissions
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'contact_form',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Tenant owners can view their leads" 
ON public.leads 
FOR SELECT 
USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can update their leads" 
ON public.leads 
FOR UPDATE 
USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can delete their leads" 
ON public.leads 
FOR DELETE 
USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();