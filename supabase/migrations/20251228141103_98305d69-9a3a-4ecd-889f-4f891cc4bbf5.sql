-- Add gift_list_url column to invitations table
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS gift_list_url TEXT;

-- Create a gift_lists table for more detailed gift management
CREATE TABLE IF NOT EXISTS public.gift_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gift_items table for individual gifts
CREATE TABLE IF NOT EXISTS public.gift_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_list_id UUID NOT NULL REFERENCES public.gift_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  image_url TEXT,
  link_url TEXT,
  is_reserved BOOLEAN DEFAULT false,
  reserved_by TEXT,
  reserved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;

-- Policies for gift_lists - public read via invitation share_token
CREATE POLICY "Gift lists are viewable by everyone"
  ON public.gift_lists
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage gift lists"
  ON public.gift_lists
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Policies for gift_items - public read and reserve
CREATE POLICY "Gift items are viewable by everyone"
  ON public.gift_items
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can reserve gifts"
  ON public.gift_items
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage gift items"
  ON public.gift_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );