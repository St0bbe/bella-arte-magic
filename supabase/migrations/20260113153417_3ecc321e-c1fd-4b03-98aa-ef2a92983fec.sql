-- Add customization fields to order_items for digital products
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS customization_data jsonb DEFAULT NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS customization_status text DEFAULT 'pending_info';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS customization_deadline timestamp with time zone DEFAULT NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS customized_file_url text DEFAULT NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS customized_at timestamp with time zone DEFAULT NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS sent_to_customer_at timestamp with time zone DEFAULT NULL;

-- Add requires_customization to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS requires_customization boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customization_fields jsonb DEFAULT NULL;

-- Create index for faster queries on digital product orders
CREATE INDEX IF NOT EXISTS idx_order_items_customization_status ON public.order_items(customization_status) WHERE is_digital = true;

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "Allow admins to update order items" ON public.order_items;
CREATE POLICY "Allow admins to update order items" 
ON public.order_items 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Create storage bucket for customized files
INSERT INTO storage.buckets (id, name, public)
VALUES ('customized-products', 'customized-products', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for customized products - allow authenticated uploads
DROP POLICY IF EXISTS "Allow authenticated uploads to customized-products" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to customized-products"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'customized-products' AND auth.role() = 'authenticated');

-- Allow public read for customized products (customers need to download)
DROP POLICY IF EXISTS "Allow public read for customized-products" ON storage.objects;
CREATE POLICY "Allow public read for customized-products"
ON storage.objects
FOR SELECT
USING (bucket_id = 'customized-products');