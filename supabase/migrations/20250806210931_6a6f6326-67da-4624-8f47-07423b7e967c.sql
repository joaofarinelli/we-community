-- 1) Add digital delivery URL to marketplace_items
ALTER TABLE public.marketplace_items
ADD COLUMN IF NOT EXISTS digital_delivery_url text;

-- 2) Create purchase_deliveries table to store delivery info per purchase
CREATE TABLE IF NOT EXISTS public.purchase_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.marketplace_purchases(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NULL,
  seller_type text NOT NULL CHECK (seller_type IN ('user','company')),
  delivery_type text NOT NULL CHECK (delivery_type IN ('digital','physical')),
  delivery_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery_status text NOT NULL DEFAULT 'pending',
  delivered_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_deliveries ENABLE ROW LEVEL SECURITY;

-- Policies: drop if exist then create
DROP POLICY IF EXISTS "Buyers can view their deliveries" ON public.purchase_deliveries;
CREATE POLICY "Buyers can view their deliveries"
ON public.purchase_deliveries
FOR SELECT
USING (
  company_id = public.get_user_company_id()
  AND buyer_id = auth.uid()
);

DROP POLICY IF EXISTS "User sellers can view their deliveries" ON public.purchase_deliveries;
CREATE POLICY "User sellers can view their deliveries"
ON public.purchase_deliveries
FOR SELECT
USING (
  company_id = public.get_user_company_id()
  AND seller_type = 'user'
  AND seller_id = auth.uid()
);

DROP POLICY IF EXISTS "Company owners can view all deliveries" ON public.purchase_deliveries;
CREATE POLICY "Company owners can view all deliveries"
ON public.purchase_deliveries
FOR SELECT
USING (
  company_id = public.get_user_company_id() AND public.is_company_owner()
);

DROP POLICY IF EXISTS "Company owners can update deliveries" ON public.purchase_deliveries;
CREATE POLICY "Company owners can update deliveries"
ON public.purchase_deliveries
FOR UPDATE
USING (
  company_id = public.get_user_company_id() AND public.is_company_owner()
)
WITH CHECK (
  company_id = public.get_user_company_id() AND public.is_company_owner()
);

-- Trigger to maintain updated_at
DROP TRIGGER IF EXISTS update_purchase_deliveries_updated_at ON public.purchase_deliveries;
CREATE TRIGGER update_purchase_deliveries_updated_at
BEFORE UPDATE ON public.purchase_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_purchase_deliveries_purchase_id ON public.purchase_deliveries(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_deliveries_company_id ON public.purchase_deliveries(company_id);

-- 3) Extend purchase processing function to record delivery data
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(
  p_user_id uuid,
  p_company_id uuid,
  p_item_id uuid,
  p_quantity integer DEFAULT 1,
  p_delivery jsonb DEFAULT '{}'::jsonb
)
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
    
    -- Create notification for seller (user). Note: purchase_id set later; reference_id may be null here.
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