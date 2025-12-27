-- Create agenda/appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  event_type TEXT,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenant owners can view their appointments"
ON public.appointments
FOR SELECT
USING (tenant_id = get_user_tenant(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can insert appointments"
ON public.appointments
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can update their appointments"
ON public.appointments
FOR UPDATE
USING (tenant_id = get_user_tenant(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can delete their appointments"
ON public.appointments
FOR DELETE
USING (tenant_id = get_user_tenant(auth.uid()) OR is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();