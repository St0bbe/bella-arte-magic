-- Create tenants table for each decorator
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#FF6B9D',
  secondary_color text DEFAULT '#C084FC',
  whatsapp_number text,
  address text,
  is_active boolean DEFAULT true,
  subscription_status text DEFAULT 'trial',
  subscription_ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add tenant_id to existing tables
ALTER TABLE public.services ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.gallery_items ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.site_settings ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create unique constraint for site_settings per tenant
ALTER TABLE public.site_settings DROP CONSTRAINT IF EXISTS site_settings_key_key;
ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_tenant_key_unique UNIQUE (tenant_id, key);

-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::app_role
  )
$$;

-- Function to get user's tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.tenants WHERE owner_id = _user_id LIMIT 1
$$;

-- RLS Policies for tenants
CREATE POLICY "Super admins can view all tenants" ON public.tenants
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert tenants" ON public.tenants
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all tenants" ON public.tenants
  FOR UPDATE USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete tenants" ON public.tenants
  FOR DELETE USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners can view their own tenant" ON public.tenants
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own tenant" ON public.tenants
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can view active tenants by slug" ON public.tenants
  FOR SELECT USING (is_active = true);

-- New decorators can create their own tenant during signup
CREATE POLICY "Users can create their own tenant" ON public.tenants
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Update RLS for services to be tenant-aware
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

CREATE POLICY "Anyone can view tenant services" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Tenant owners can insert services" ON public.services
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant(auth.uid()) 
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant owners can update their services" ON public.services
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant(auth.uid()) 
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant owners can delete their services" ON public.services
  FOR DELETE USING (
    tenant_id = public.get_user_tenant(auth.uid()) 
    OR public.is_super_admin(auth.uid())
  );

-- Update RLS for gallery_items to be tenant-aware
DROP POLICY IF EXISTS "Gallery items are viewable by everyone" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can insert gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can update gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can delete gallery items" ON public.gallery_items;

CREATE POLICY "Anyone can view tenant gallery items" ON public.gallery_items
  FOR SELECT USING (true);

CREATE POLICY "Tenant owners can insert gallery items" ON public.gallery_items
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant(auth.uid()) 
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant owners can update their gallery items" ON public.gallery_items
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant(auth.uid()) 
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant owners can delete their gallery items" ON public.gallery_items
  FOR DELETE USING (
    tenant_id = public.get_user_tenant(auth.uid()) 
    OR public.is_super_admin(auth.uid())
  );

-- Update RLS for site_settings to be tenant-aware
DROP POLICY IF EXISTS "Site settings are viewable by everyone" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can delete site settings" ON public.site_settings;

CREATE POLICY "Anyone can view tenant site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Tenant owners can insert site settings" ON public.site_settings
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant(auth.uid()) 
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant owners can update their site settings" ON public.site_settings
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant(auth.uid()) 
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Tenant owners can delete their site settings" ON public.site_settings
  FOR DELETE USING (
    tenant_id = public.get_user_tenant(auth.uid()) 
    OR public.is_super_admin(auth.uid())
  );

-- Trigger for updated_at on tenants
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Allow users to insert their own admin role when signing up as decorator
CREATE POLICY "Users can insert their own admin role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'admin'::app_role);

-- Super admins can manage all user roles
CREATE POLICY "Super admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.is_super_admin(auth.uid()));