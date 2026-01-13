-- Fix contracts table RLS policies to protect sensitive data
-- Remove the permissive public SELECT policy that exposes all contract data
DROP POLICY IF EXISTS "Anyone can view contracts by signature token" ON public.contracts;

-- Create a view for public contract access (only necessary fields for signing)
-- This excludes sensitive fields like signer_ip, signer_user_agent, signer_location
CREATE OR REPLACE VIEW public.contracts_public
WITH (security_invoker = on) AS
SELECT 
  id,
  client_name,
  contract_type,
  file_url,
  status,
  notes,
  created_at,
  tenant_id,
  quote_id,
  signed_at,
  signature_data,
  signature_token
FROM public.contracts
WHERE signature_token IS NOT NULL;

-- Note: The sensitive fields (signer_ip, signer_user_agent, signer_location, client_email, client_phone) 
-- are intentionally excluded from the public view

-- Add comment explaining the security design
COMMENT ON VIEW public.contracts_public IS 
'Public view for contract signing. Excludes sensitive fields like IP, user agent, location, email, and phone.';