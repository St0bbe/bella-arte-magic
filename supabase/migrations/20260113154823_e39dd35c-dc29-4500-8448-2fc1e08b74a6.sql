-- ================================================================
-- SECURITY FIX 1: Protect tenants table - Create public view with limited fields
-- ================================================================

-- Create a public view that exposes only non-sensitive tenant information
CREATE OR REPLACE VIEW public.tenants_public
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  slug,
  logo_url,
  primary_color,
  secondary_color,
  is_active,
  subscription_status,
  created_at
FROM public.tenants
WHERE is_active = true;

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.tenants_public TO anon;
GRANT SELECT ON public.tenants_public TO authenticated;

-- Drop the overly permissive policy that exposes all fields
DROP POLICY IF EXISTS "Anyone can view active tenants by slug" ON public.tenants;

-- Create a restrictive policy for base table - only owners and super admins can access directly
-- The existing policies "Owners can view their own tenant" and "Super admins can view all tenants" remain

-- ================================================================
-- SECURITY FIX 2: Protect invitations table - Require exact token match
-- ================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view invitations by share token" ON public.invitations;

-- Create a function to validate invitation access by exact token match
CREATE OR REPLACE FUNCTION public.can_access_invitation_by_token(invitation_share_token text, provided_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT invitation_share_token IS NOT NULL AND invitation_share_token = provided_token
$$;

-- Create new restrictive policy - invitations can only be viewed by tenant admins
-- Public access will be handled through the application with token validation
CREATE POLICY "Tenant admins can view their invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  (tenant_id = get_user_tenant(auth.uid())) 
  OR is_super_admin(auth.uid())
);

-- Add a comment explaining the security model
COMMENT ON TABLE public.invitations IS 'Invitations table. Public access is handled via edge function with exact token validation. Direct database access requires authentication.';