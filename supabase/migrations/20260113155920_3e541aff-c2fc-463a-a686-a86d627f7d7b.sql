-- Fix leads table RLS policy to prevent tenant_id manipulation
-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

-- Create a secure insert policy that validates tenant_id exists and is active
-- This prevents attackers from inserting leads with arbitrary tenant_ids
CREATE POLICY "Public can insert leads for valid tenants"
ON public.leads
FOR INSERT
WITH CHECK (
  -- Ensure tenant_id is provided and references an active tenant
  tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.tenants 
    WHERE id = tenant_id 
    AND is_active = true
  )
);

-- Add a rate limiting comment (actual rate limiting should be done at API level)
COMMENT ON POLICY "Public can insert leads for valid tenants" ON public.leads IS 
'Allows public lead insertion only for valid, active tenants. Rate limiting should be implemented at the application layer.';