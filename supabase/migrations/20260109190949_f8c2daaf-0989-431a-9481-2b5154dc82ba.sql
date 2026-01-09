-- Create products table for the online store
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  compare_at_price NUMERIC,
  category TEXT NOT NULL DEFAULT 'physical',
  subcategory TEXT,
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  digital_file_url TEXT,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can view active products
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Tenant owners can manage their products
CREATE POLICY "Tenant owners can insert products"
ON public.products
FOR INSERT
WITH CHECK ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can update their products"
ON public.products
FOR UPDATE
USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Tenant owners can delete their products"
ON public.products
FOR DELETE
USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_zip TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Tenant owners can view their orders
CREATE POLICY "Tenant owners can view their orders"
ON public.orders
FOR SELECT
USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

-- Anyone can create orders (for checkout)
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Tenant owners can update their orders
CREATE POLICY "Tenant owners can update their orders"
ON public.orders
FOR UPDATE
USING ((tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()));

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  is_digital BOOLEAN DEFAULT false,
  download_url TEXT,
  download_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Same access as orders through join
CREATE POLICY "Order items follow order access"
ON public.order_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND ((o.tenant_id = get_user_tenant(auth.uid())) OR is_super_admin(auth.uid()))
  )
);

-- Anyone can insert order items (for checkout)
CREATE POLICY "Anyone can insert order items"
ON public.order_items
FOR INSERT
WITH CHECK (true);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);

-- Storage policies for products bucket
CREATE POLICY "Product images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'products' AND auth.role() = 'authenticated');

-- Create storage bucket for digital products
INSERT INTO storage.buckets (id, name, public) VALUES ('digital-products', 'digital-products', false);

-- Storage policies for digital products (private)
CREATE POLICY "Digital products accessible via signed URL"
ON storage.objects
FOR SELECT
USING (bucket_id = 'digital-products');

CREATE POLICY "Authenticated users can upload digital products"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'digital-products' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete digital products"
ON storage.objects
FOR DELETE
USING (bucket_id = 'digital-products' AND auth.role() = 'authenticated');

-- Add trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();