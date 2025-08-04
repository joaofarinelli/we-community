-- Add item_type column to marketplace_items table
ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'physical';

-- Add check constraint to ensure valid item types
ALTER TABLE public.marketplace_items ADD CONSTRAINT check_item_type 
CHECK (item_type IN ('physical', 'digital'));

-- Add comment to explain the field
COMMENT ON COLUMN public.marketplace_items.item_type IS 'Type of item: physical (requires shipping) or digital (downloadable/virtual)';