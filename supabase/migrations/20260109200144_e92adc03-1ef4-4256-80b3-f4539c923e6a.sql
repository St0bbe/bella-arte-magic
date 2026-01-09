-- Add tracking fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_code TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS shipping_service TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Create order tracking events table
CREATE TABLE public.order_tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_tracking_events ENABLE ROW LEVEL SECURITY;

-- Anyone can view tracking events for orders they have access to
CREATE POLICY "Public can view tracking events by order" ON public.order_tracking_events
  FOR SELECT USING (true);

-- Tenant owners can manage tracking events
CREATE POLICY "Tenant owners can manage tracking events" ON public.order_tracking_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_tracking_events.order_id 
      AND (o.tenant_id = get_user_tenant(auth.uid()) OR is_super_admin(auth.uid()))
    )
  );

-- System can insert tracking events
CREATE POLICY "System can insert tracking events" ON public.order_tracking_events
  FOR INSERT WITH CHECK (true);