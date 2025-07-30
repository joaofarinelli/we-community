-- Update RLS policies for marketplace_items to handle store type
-- Allow company owners to create store items
CREATE POLICY "Company owners can create store items" 
ON marketplace_items 
FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id() 
  AND is_company_owner() 
  AND store_type = 'store'
  AND seller_type = 'company'
  AND auth.uid() = created_by
);

-- Allow users to view store items in their company
CREATE POLICY "Users can view store items in their company" 
ON marketplace_items 
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND is_active = true 
  AND store_type = 'store'
);

-- Allow company owners to update store items
CREATE POLICY "Company owners can update store items" 
ON marketplace_items 
FOR UPDATE 
USING (
  company_id = get_user_company_id() 
  AND is_company_owner() 
  AND store_type = 'store'
);

-- Allow company owners to delete store items
CREATE POLICY "Company owners can delete store items" 
ON marketplace_items 
FOR DELETE 
USING (
  company_id = get_user_company_id() 
  AND is_company_owner() 
  AND store_type = 'store'
);