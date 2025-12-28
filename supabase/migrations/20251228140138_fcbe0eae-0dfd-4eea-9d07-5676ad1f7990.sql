-- Create a table for storing birthday invitations
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  child_name TEXT NOT NULL,
  child_age INTEGER,
  theme TEXT NOT NULL,
  event_date DATE,
  event_time TEXT,
  event_location TEXT,
  additional_info TEXT,
  image_url TEXT,
  background_color TEXT DEFAULT '#FFFFFF',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Public can view invitations by share token
CREATE POLICY "Anyone can view invitations by share token" 
ON public.invitations 
FOR SELECT 
USING (share_token IS NOT NULL);

-- Anyone can create invitations (public feature)
CREATE POLICY "Anyone can create invitations" 
ON public.invitations 
FOR INSERT 
WITH CHECK (true);

-- Admins can manage their tenant invitations
CREATE POLICY "Admins can update tenant invitations" 
ON public.invitations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.tenants t ON t.owner_id = ur.user_id
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
    AND t.id = invitations.tenant_id
  )
);

CREATE POLICY "Admins can delete tenant invitations" 
ON public.invitations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.tenants t ON t.owner_id = ur.user_id
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
    AND t.id = invitations.tenant_id
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();