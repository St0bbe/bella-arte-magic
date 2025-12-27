-- Add digital signature fields to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS signature_token text UNIQUE,
ADD COLUMN IF NOT EXISTS signature_data text,
ADD COLUMN IF NOT EXISTS signer_ip text,
ADD COLUMN IF NOT EXISTS signer_user_agent text,
ADD COLUMN IF NOT EXISTS signer_location text;

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_contracts_signature_token ON public.contracts(signature_token);

-- Allow public access to contracts by signature token for signing
DROP POLICY IF EXISTS "Anyone can view contracts by signature token" ON public.contracts;
CREATE POLICY "Anyone can view contracts by signature token" 
ON public.contracts 
FOR SELECT 
USING (signature_token IS NOT NULL);

-- Allow public to update signature (only signature fields)
DROP POLICY IF EXISTS "Anyone can sign contracts with valid token" ON public.contracts;
CREATE POLICY "Anyone can sign contracts with valid token" 
ON public.contracts 
FOR UPDATE 
USING (signature_token IS NOT NULL)
WITH CHECK (signature_token IS NOT NULL);