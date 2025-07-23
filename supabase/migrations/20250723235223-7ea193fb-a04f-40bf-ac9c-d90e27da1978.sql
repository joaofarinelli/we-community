-- Add seller fields to marketplace_items table
ALTER TABLE public.marketplace_items 
ADD COLUMN seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN seller_type text DEFAULT 'company' CHECK (seller_type IN ('company', 'user'));

-- Update existing items to be company items
UPDATE public.marketplace_items 
SET seller_type = 'company' 
WHERE seller_type IS NULL;

-- Make seller_type not null
ALTER TABLE public.marketplace_items 
ALTER COLUMN seller_type SET NOT NULL;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  content text,
  is_read boolean NOT NULL DEFAULT false,
  reference_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = auth.uid() AND company_id = get_user_company_id());

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = auth.uid() AND company_id = get_user_company_id());

-- Update marketplace_items RLS policies to allow users to create their own items
CREATE POLICY "Users can create their own items" 
ON public.marketplace_items 
FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id() AND 
  (
    (seller_type = 'company' AND is_company_owner() AND auth.uid() = created_by) OR
    (seller_type = 'user' AND auth.uid() = seller_id AND auth.uid() = created_by)
  )
);

CREATE POLICY "Users can update their own items" 
ON public.marketplace_items 
FOR UPDATE 
USING (
  company_id = get_user_company_id() AND 
  (
    (seller_type = 'company' AND is_company_owner()) OR
    (seller_type = 'user' AND auth.uid() = seller_id)
  )
);

CREATE POLICY "Users can delete their own items" 
ON public.marketplace_items 
FOR DELETE 
USING (
  company_id = get_user_company_id() AND 
  (
    (seller_type = 'company' AND is_company_owner()) OR
    (seller_type = 'user' AND auth.uid() = seller_id)
  )
);

-- Update the existing view policy to show both company and user items
DROP POLICY IF EXISTS "Users can view active items in their company" ON public.marketplace_items;
CREATE POLICY "Users can view active items in their company" 
ON public.marketplace_items 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_active = true);

-- Add function to transfer coins between users
CREATE OR REPLACE FUNCTION public.transfer_user_coins(
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_company_id uuid,
  p_coins integer,
  p_reference_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  from_user_coins integer;
  new_from_level_id uuid;
  new_to_level_id uuid;
  to_user_total_coins integer;
BEGIN
  -- Check if sender has enough coins
  SELECT total_coins INTO from_user_coins
  FROM public.user_points
  WHERE user_id = p_from_user_id AND company_id = p_company_id;
  
  IF from_user_coins IS NULL OR from_user_coins < p_coins THEN
    RETURN false;
  END IF;
  
  -- Deduct coins from sender
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
  VALUES (p_from_user_id, p_company_id, 'transfer_sent', -p_coins, -p_coins, p_reference_id);
  
  UPDATE public.user_points 
  SET total_coins = total_coins - p_coins, updated_at = now()
  WHERE user_id = p_from_user_id AND company_id = p_company_id;
  
  -- Add coins to receiver
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
  VALUES (p_to_user_id, p_company_id, 'transfer_received', p_coins, p_coins, p_reference_id);
  
  INSERT INTO public.user_points (user_id, company_id, total_coins)
  VALUES (p_to_user_id, p_company_id, p_coins)
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    total_coins = user_points.total_coins + p_coins,
    updated_at = now()
  RETURNING total_coins INTO to_user_total_coins;
  
  -- Update levels for both users
  new_from_level_id := public.calculate_user_level(p_from_user_id, p_company_id, from_user_coins - p_coins);
  new_to_level_id := public.calculate_user_level(p_to_user_id, p_company_id, to_user_total_coins);
  
  -- Update sender's level
  UPDATE public.user_current_level 
  SET current_level_id = new_from_level_id, current_coins = from_user_coins - p_coins, updated_at = now()
  WHERE user_id = p_from_user_id AND company_id = p_company_id;
  
  -- Update receiver's level
  INSERT INTO public.user_current_level (user_id, company_id, current_level_id, current_coins)
  VALUES (p_to_user_id, p_company_id, new_to_level_id, to_user_total_coins)
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    current_level_id = new_to_level_id,
    current_coins = to_user_total_coins,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Update process_marketplace_purchase function to handle user sellers
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(p_user_id uuid, p_company_id uuid, p_item_id uuid, p_quantity integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_record RECORD;
  total_cost integer;
  purchase_id uuid;
  success boolean;
  seller_user_id uuid;
  seller_type_val text;
BEGIN
  -- Get item details and check availability
  SELECT * INTO item_record
  FROM public.marketplace_items
  WHERE id = p_item_id AND company_id = p_company_id AND is_active = true;
  
  IF item_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found or inactive');
  END IF;
  
  -- Check stock if limited
  IF item_record.stock_quantity IS NOT NULL AND item_record.stock_quantity < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock');
  END IF;
  
  -- Calculate total cost
  total_cost := item_record.price_coins * p_quantity;
  seller_user_id := item_record.seller_id;
  seller_type_val := item_record.seller_type;
  
  -- Deduct coins from buyer
  SELECT public.deduct_user_coins(p_user_id, p_company_id, total_cost, p_item_id) INTO success;
  
  IF NOT success THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
  END IF;
  
  -- If seller is a user, transfer coins to them
  IF seller_type_val = 'user' AND seller_user_id IS NOT NULL THEN
    -- Add coins to seller
    INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
    VALUES (seller_user_id, p_company_id, 'item_sold', total_cost, total_cost, p_item_id);
    
    -- Update seller's total coins
    INSERT INTO public.user_points (user_id, company_id, total_coins)
    VALUES (seller_user_id, p_company_id, total_cost)
    ON CONFLICT (user_id, company_id)
    DO UPDATE SET 
      total_coins = user_points.total_coins + total_cost,
      updated_at = now();
    
    -- Update seller's level
    DECLARE
      seller_total_coins integer;
      new_seller_level_id uuid;
    BEGIN
      SELECT total_coins INTO seller_total_coins
      FROM public.user_points
      WHERE user_id = seller_user_id AND company_id = p_company_id;
      
      new_seller_level_id := public.calculate_user_level(seller_user_id, p_company_id, seller_total_coins);
      
      INSERT INTO public.user_current_level (user_id, company_id, current_level_id, current_coins)
      VALUES (seller_user_id, p_company_id, new_seller_level_id, seller_total_coins)
      ON CONFLICT (user_id, company_id)
      DO UPDATE SET 
        current_level_id = new_seller_level_id,
        current_coins = seller_total_coins,
        updated_at = now();
    END;
    
    -- Create notification for seller
    INSERT INTO public.notifications (user_id, company_id, type, title, content, reference_id)
    VALUES (
      seller_user_id,
      p_company_id,
      'item_sold',
      'Item Vendido!',
      'Seu item "' || item_record.name || '" foi vendido por ' || total_cost || ' moedas.',
      purchase_id
    );
  END IF;
  
  -- Create purchase record
  INSERT INTO public.marketplace_purchases (
    company_id, user_id, item_id, item_name, price_coins, quantity
  ) VALUES (
    p_company_id, p_user_id, p_item_id, item_record.name, item_record.price_coins, p_quantity
  ) RETURNING id INTO purchase_id;
  
  -- Update stock if limited
  IF item_record.stock_quantity IS NOT NULL THEN
    UPDATE public.marketplace_items 
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_item_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'purchase_id', purchase_id,
    'total_cost', total_cost
  );
END;
$$;

-- Add trigger for updated_at on notifications
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_company_id ON public.notifications(company_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_marketplace_items_seller_id ON public.marketplace_items(seller_id);
CREATE INDEX idx_marketplace_items_seller_type ON public.marketplace_items(seller_type);