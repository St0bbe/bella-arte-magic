-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_photo_url TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  event_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public can view active testimonials
CREATE POLICY "Anyone can view active testimonials"
ON public.testimonials
FOR SELECT
USING (is_active = true);

-- Tenant owners can manage their testimonials
CREATE POLICY "Tenant owners can insert testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can update their testimonials"
ON public.testimonials
FOR UPDATE
USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can delete their testimonials"
ON public.testimonials
FOR DELETE
USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();