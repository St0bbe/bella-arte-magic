-- Add deleted_at column to gallery_items for soft delete / trash functionality
ALTER TABLE public.gallery_items 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster queries on deleted items
CREATE INDEX IF NOT EXISTS idx_gallery_items_deleted_at ON public.gallery_items(deleted_at);

-- Comment explaining the column
COMMENT ON COLUMN public.gallery_items.deleted_at IS 'Timestamp when item was moved to trash. NULL means item is active.';