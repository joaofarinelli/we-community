-- Add store_type column to marketplace_items to differentiate between marketplace and store items
ALTER TABLE marketplace_items 
ADD COLUMN store_type text NOT NULL DEFAULT 'marketplace';

-- Add constraint to ensure valid store types
ALTER TABLE marketplace_items 
ADD CONSTRAINT marketplace_items_store_type_check 
CHECK (store_type IN ('marketplace', 'store'));

-- Create index for better performance when filtering by store type
CREATE INDEX idx_marketplace_items_store_type ON marketplace_items(store_type);

-- Update existing items to be marketplace type (to maintain backward compatibility)
UPDATE marketplace_items SET store_type = 'marketplace' WHERE store_type IS NULL;