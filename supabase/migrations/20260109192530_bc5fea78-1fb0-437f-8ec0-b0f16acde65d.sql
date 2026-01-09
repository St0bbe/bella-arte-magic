-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_value NUMERIC DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- Create product reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Coupons policies
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Tenant owners can manage coupons" ON public.coupons
  FOR ALL USING (tenant_id = get_user_tenant(auth.uid()) OR is_super_admin(auth.uid()));

-- Reviews policies
CREATE POLICY "Anyone can view approved reviews" ON public.product_reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can create reviews" ON public.product_reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Tenant owners can manage reviews" ON public.product_reviews
  FOR ALL USING (tenant_id = get_user_tenant(auth.uid()) OR is_super_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();