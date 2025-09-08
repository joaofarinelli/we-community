-- Add moderation columns to marketplace_items
ALTER TABLE public.marketplace_items 
ADD COLUMN moderation_status text NOT NULL DEFAULT 'pending',
ADD COLUMN moderated_by uuid,
ADD COLUMN moderated_at timestamp with time zone,
ADD COLUMN moderation_notes text;

-- Add constraint for moderation_status values
ALTER TABLE public.marketplace_items 
ADD CONSTRAINT marketplace_items_moderation_status_check 
CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

-- Backfill existing items as approved (especially company store items)
UPDATE public.marketplace_items 
SET moderation_status = 'approved' 
WHERE moderation_status = 'pending';

-- Create marketplace_terms table
CREATE TABLE public.marketplace_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  version integer NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on marketplace_terms
ALTER TABLE public.marketplace_terms ENABLE ROW LEVEL SECURITY;

-- Create policies for marketplace_terms
CREATE POLICY "Users can view active terms in their company" 
ON public.marketplace_terms 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_active = true);

CREATE POLICY "Company owners can manage marketplace terms" 
ON public.marketplace_terms 
FOR ALL 
USING (company_id = get_user_company_id() AND is_company_owner())
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = created_by);

-- Create marketplace_terms_acceptances table
CREATE TABLE public.marketplace_terms_acceptances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  item_id uuid NOT NULL,
  terms_id uuid NOT NULL,
  accepted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on marketplace_terms_acceptances
ALTER TABLE public.marketplace_terms_acceptances ENABLE ROW LEVEL SECURITY;

-- Create policies for marketplace_terms_acceptances
CREATE POLICY "Users can create their own terms acceptances" 
ON public.marketplace_terms_acceptances 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Users can view their own terms acceptances" 
ON public.marketplace_terms_acceptances 
FOR SELECT 
USING (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners can view all terms acceptances" 
ON public.marketplace_terms_acceptances 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());

-- Update RLS policies for marketplace_items
DROP POLICY IF EXISTS "Users can view active items in their company" ON public.marketplace_items;

-- Create specific policy for approved marketplace items
CREATE POLICY "Users can view approved marketplace items" 
ON public.marketplace_items 
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND is_active = true 
  AND store_type = 'marketplace' 
  AND moderation_status = 'approved'
);

-- Create policy for company owners to view all marketplace items (for moderation)
CREATE POLICY "Company owners can view all marketplace items" 
ON public.marketplace_items 
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND is_company_owner()
  AND store_type = 'marketplace'
);

-- Create policy for users to view their own marketplace items (regardless of status)
CREATE POLICY "Users can view their own marketplace items" 
ON public.marketplace_items 
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND seller_type = 'user' 
  AND seller_id = auth.uid()
  AND store_type = 'marketplace'
);

-- Update existing policy for store items (unchanged)
CREATE POLICY "Users can view active store items" 
ON public.marketplace_items 
FOR SELECT 
USING (
  company_id = get_user_company_id() 
  AND is_active = true 
  AND store_type = 'store'
);

-- Company owners can moderate marketplace items
CREATE POLICY "Company owners can moderate marketplace items" 
ON public.marketplace_items 
FOR UPDATE 
USING (
  company_id = get_user_company_id() 
  AND is_company_owner()
  AND store_type = 'marketplace'
);

-- Update process_marketplace_purchase function to check moderation status
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(p_user_id uuid, p_company_id uuid, p_item_id uuid, p_quantity integer DEFAULT 1, p_delivery jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  item_record RECORD;
  total_cost integer;
  purchase_id uuid;
  success boolean;
  seller_user_id uuid;
  seller_type_val text;
  address_text text := '';
BEGIN
  -- Get item details and check availability (including moderation status)
  SELECT * INTO item_record
  FROM public.marketplace_items
  WHERE id = p_item_id 
    AND company_id = p_company_id 
    AND is_active = true 
    AND moderation_status = 'approved';
  
  IF item_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found, inactive, or not approved');
  END IF;
  
  -- Check stock if limited
  IF item_record.stock_quantity IS NOT NULL AND item_record.stock_quantity < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock');
  END IF;
  
  -- Calculate total cost
  total_cost := item_record.price_coins * p_quantity;
  seller_user_id := item_record.seller_id;
  seller_type_val := item_record.seller_type;

  -- Prepare address text if physical item
  IF item_record.item_type = 'physical' THEN
    address_text := ' Endereço: '
      || COALESCE(p_delivery->>'address','')
      || ', ' || COALESCE(p_delivery->>'number','')
      || ' - ' || COALESCE(p_delivery->>'neighborhood','')
      || ' - ' || COALESCE(p_delivery->>'city','')
      || '/' || COALESCE(p_delivery->>'state','')
      || ' CEP: ' || COALESCE(p_delivery->>'postal_code','');
  END IF;
  
  -- Deduct coins from buyer
  SELECT public.deduct_user_coins(p_user_id, p_company_id, total_cost, p_item_id) INTO success;
  
  IF NOT success THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
  END IF;
  
  -- If seller is a user, transfer coins to them and notify
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
      'Seu item "' || item_record.name || '" foi vendido por ' || total_cost || ' moedas.' || address_text,
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

  -- Create delivery record
  IF item_record.item_type = 'digital' THEN
    INSERT INTO public.purchase_deliveries (
      purchase_id, company_id, buyer_id, seller_id, seller_type, delivery_type, delivery_data, delivery_status, delivered_at
    ) VALUES (
      purchase_id, p_company_id, p_user_id, seller_user_id, seller_type_val, 'digital',
      jsonb_build_object('url', item_record.digital_delivery_url),
      CASE WHEN item_record.digital_delivery_url IS NOT NULL THEN 'delivered' ELSE 'pending' END,
      CASE WHEN item_record.digital_delivery_url IS NOT NULL THEN now() ELSE NULL END
    );
  ELSE
    INSERT INTO public.purchase_deliveries (
      purchase_id, company_id, buyer_id, seller_id, seller_type, delivery_type, delivery_data, delivery_status
    ) VALUES (
      purchase_id, p_company_id, p_user_id, seller_user_id, seller_type_val, 'physical',
      COALESCE(p_delivery, '{}'::jsonb),
      'pending'
    );
  END IF;

  -- Notify company owners/admins for company-sold physical items with address
  IF seller_type_val = 'company' AND item_record.item_type = 'physical' THEN
    INSERT INTO public.notifications (user_id, company_id, type, title, content, reference_id)
    SELECT p.user_id, p_company_id, 'item_order', 'Novo Pedido Físico',
      'Pedido do item "' || item_record.name || '" (' || p_quantity || ' un.).' || address_text,
      purchase_id
    FROM public.profiles p
    WHERE p.company_id = p_company_id AND p.role IN ('owner','admin') AND p.is_active = true;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'purchase_id', purchase_id,
    'total_cost', total_cost
  );
END;
$function$;

-- Create trigger to automatically update updated_at on marketplace_terms
CREATE TRIGGER update_marketplace_terms_updated_at
BEFORE UPDATE ON public.marketplace_terms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();