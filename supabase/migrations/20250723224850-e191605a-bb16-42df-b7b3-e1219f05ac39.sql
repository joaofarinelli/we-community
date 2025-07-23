-- Create marketplace tables for the WomanCoins marketplace system

-- Create marketplace categories table
CREATE TABLE public.marketplace_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon_type TEXT DEFAULT 'lucide',
  icon_value TEXT DEFAULT 'Package',
  color TEXT NOT NULL DEFAULT '#3B82F6',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Create marketplace items table
CREATE TABLE public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.marketplace_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price_coins INTEGER NOT NULL CHECK (price_coins >= 0),
  stock_quantity INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace purchases table
CREATE TABLE public.marketplace_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL, -- Store name at time of purchase
  price_coins INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_categories
CREATE POLICY "Users can view categories in their company" 
ON public.marketplace_categories 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_active = true);

CREATE POLICY "Company owners can create categories" 
ON public.marketplace_categories 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Company owners can update categories" 
ON public.marketplace_categories 
FOR UPDATE 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Company owners can delete categories" 
ON public.marketplace_categories 
FOR DELETE 
USING (company_id = get_user_company_id() AND is_company_owner());

-- RLS Policies for marketplace_items
CREATE POLICY "Users can view active items in their company" 
ON public.marketplace_items 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_active = true);

CREATE POLICY "Company owners can create items" 
ON public.marketplace_items 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND is_company_owner() AND auth.uid() = created_by);

CREATE POLICY "Company owners can update items" 
ON public.marketplace_items 
FOR UPDATE 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "Company owners can delete items" 
ON public.marketplace_items 
FOR DELETE 
USING (company_id = get_user_company_id() AND is_company_owner());

-- RLS Policies for marketplace_purchases
CREATE POLICY "Users can view their own purchases" 
ON public.marketplace_purchases 
FOR SELECT 
USING (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Users can create their own purchases" 
ON public.marketplace_purchases 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners can view all purchases" 
ON public.marketplace_purchases 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());

-- Update calculate_coins_for_action function to include purchase actions
CREATE OR REPLACE FUNCTION public.calculate_coins_for_action(action_type text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  CASE action_type
    WHEN 'create_post' THEN RETURN 10;
    WHEN 'like_post' THEN RETURN 2;
    WHEN 'comment_post' THEN RETURN 5;
    WHEN 'receive_like' THEN RETURN 3;
    WHEN 'receive_comment' THEN RETURN 3;
    WHEN 'purchase_item' THEN RETURN 0; -- Purchases don't add coins, they deduct
    WHEN 'refund_item' THEN RETURN 0; -- Refunds add coins back
    ELSE RETURN 0;
  END CASE;
END;
$function$;

-- Create function to deduct user coins for purchases
CREATE OR REPLACE FUNCTION public.deduct_user_coins(p_user_id uuid, p_company_id uuid, p_coins integer, p_reference_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_coins integer;
  new_level_id uuid;
BEGIN
  -- Check if user has enough coins
  SELECT total_coins INTO current_coins
  FROM public.user_points
  WHERE user_id = p_user_id AND company_id = p_company_id;
  
  IF current_coins IS NULL OR current_coins < p_coins THEN
    RETURN false; -- Not enough coins
  END IF;
  
  -- Insert transaction record (negative coins for purchase)
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
  VALUES (p_user_id, p_company_id, 'purchase_item', -p_coins, -p_coins, p_reference_id);
  
  -- Update user's total coins
  UPDATE public.user_points 
  SET 
    total_coins = total_coins - p_coins,
    updated_at = now()
  WHERE user_id = p_user_id AND company_id = p_company_id
  RETURNING total_coins INTO current_coins;
  
  -- Calculate new level
  new_level_id := public.calculate_user_level(p_user_id, p_company_id, current_coins);
  
  -- Update user's current level
  UPDATE public.user_current_level 
  SET 
    current_level_id = new_level_id,
    current_coins = current_coins,
    updated_at = now()
  WHERE user_id = p_user_id AND company_id = p_company_id;
  
  RETURN true;
END;
$function$;

-- Create function to process marketplace purchase
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(
  p_user_id uuid,
  p_company_id uuid,
  p_item_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  item_record RECORD;
  total_cost integer;
  purchase_id uuid;
  success boolean;
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
  
  -- Attempt to deduct coins
  SELECT public.deduct_user_coins(p_user_id, p_company_id, total_cost, p_item_id) INTO success;
  
  IF NOT success THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
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
$function$;

-- Create triggers for timestamp updates
CREATE TRIGGER update_marketplace_categories_updated_at
  BEFORE UPDATE ON public.marketplace_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_items_updated_at
  BEFORE UPDATE ON public.marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_marketplace_items_category_id ON public.marketplace_items(category_id);
CREATE INDEX idx_marketplace_items_company_id ON public.marketplace_items(company_id);
CREATE INDEX idx_marketplace_purchases_user_id ON public.marketplace_purchases(user_id);
CREATE INDEX idx_marketplace_purchases_item_id ON public.marketplace_purchases(item_id);