-- Add monthly ranking columns to user_points table
ALTER TABLE public.user_points 
ADD COLUMN monthly_coins integer DEFAULT 0 NOT NULL,
ADD COLUMN last_monthly_reset timestamp with time zone DEFAULT date_trunc('month', now());

-- Create monthly rankings history table
CREATE TABLE public.monthly_rankings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  month_year text NOT NULL, -- Format: "2025-01"
  monthly_coins integer NOT NULL DEFAULT 0,
  final_rank integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on monthly_rankings
ALTER TABLE public.monthly_rankings ENABLE ROW LEVEL SECURITY;

-- RLS policies for monthly_rankings
CREATE POLICY "Users can view monthly rankings in their company" 
ON public.monthly_rankings 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "System can create monthly rankings" 
ON public.monthly_rankings 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

-- Initialize monthly_coins with current total_coins for existing users
UPDATE public.user_points 
SET monthly_coins = total_coins;

-- Create function to reset monthly coins
CREATE OR REPLACE FUNCTION public.reset_monthly_coins(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_month_year text;
  user_record RECORD;
  rank_counter integer := 1;
BEGIN
  current_month_year := to_char(date_trunc('month', now() - interval '1 month'), 'YYYY-MM');
  
  -- Save current month rankings to history (ordered by monthly_coins descending)
  FOR user_record IN 
    SELECT up.user_id, up.company_id, up.monthly_coins
    FROM public.user_points up
    WHERE up.company_id = p_company_id AND up.monthly_coins > 0
    ORDER BY up.monthly_coins DESC
  LOOP
    INSERT INTO public.monthly_rankings (user_id, company_id, month_year, monthly_coins, final_rank)
    VALUES (user_record.user_id, user_record.company_id, current_month_year, user_record.monthly_coins, rank_counter);
    
    rank_counter := rank_counter + 1;
  END LOOP;
  
  -- Reset monthly coins for all users in the company
  UPDATE public.user_points 
  SET 
    monthly_coins = 0,
    last_monthly_reset = now(),
    updated_at = now()
  WHERE company_id = p_company_id;
  
  -- Create notifications for all users in the company
  INSERT INTO public.notifications (user_id, company_id, type, title, content)
  SELECT 
    p.user_id,
    p.company_id,
    'monthly_reset',
    'Novo Ciclo Mensal Iniciado! 🚀',
    'O ranking mensal foi resetado. Comece a acumular moedas para o novo ciclo!'
  FROM public.profiles p
  WHERE p.company_id = p_company_id AND p.is_active = true;
END;
$function$;

-- Update add_user_coins function to also update monthly_coins
CREATE OR REPLACE FUNCTION public.add_user_coins(p_user_id uuid, p_company_id uuid, p_action_type text, p_reference_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  coins_to_add integer;
  user_total_coins integer;
  new_level_id uuid;
BEGIN
  -- Get coins for this action
  coins_to_add := public.calculate_coins_for_action(p_action_type);
  
  -- Insert transaction record
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
  VALUES (p_user_id, p_company_id, p_action_type, coins_to_add, coins_to_add, p_reference_id);
  
  -- Update user's total coins and monthly coins (upsert)
  INSERT INTO public.user_points (user_id, company_id, total_coins, monthly_coins, last_monthly_reset)
  VALUES (p_user_id, p_company_id, coins_to_add, coins_to_add, date_trunc('month', now()))
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    total_coins = user_points.total_coins + coins_to_add,
    monthly_coins = user_points.monthly_coins + coins_to_add,
    updated_at = now()
  RETURNING total_coins INTO user_total_coins;
  
  -- Calculate new level based on total coins (not monthly)
  new_level_id := public.calculate_user_level(p_user_id, p_company_id, user_total_coins);
  
  -- Update user's current level
  INSERT INTO public.user_current_level (user_id, company_id, current_level_id, current_coins)
  VALUES (p_user_id, p_company_id, new_level_id, user_total_coins)
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    current_level_id = new_level_id,
    current_coins = user_total_coins,
    updated_at = now();
END;
$function$;

-- Update deduct_user_coins function to also update monthly_coins
CREATE OR REPLACE FUNCTION public.deduct_user_coins(p_user_id uuid, p_company_id uuid, p_coins integer, p_reference_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_current_coins integer;
  new_level_id uuid;
BEGIN
  -- Check if user has enough coins
  SELECT total_coins INTO user_current_coins
  FROM public.user_points
  WHERE user_id = p_user_id AND company_id = p_company_id;
  
  IF user_current_coins IS NULL OR user_current_coins < p_coins THEN
    RETURN false; -- Not enough coins
  END IF;
  
  -- Insert transaction record (negative coins for purchase)
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
  VALUES (p_user_id, p_company_id, 'purchase_item', -p_coins, -p_coins, p_reference_id);
  
  -- Update user's total coins and monthly coins
  UPDATE public.user_points 
  SET 
    total_coins = total_coins - p_coins,
    monthly_coins = GREATEST(0, monthly_coins - p_coins), -- Don't go below 0 for monthly
    updated_at = now()
  WHERE user_id = p_user_id AND company_id = p_company_id
  RETURNING total_coins INTO user_current_coins;
  
  -- Calculate new level based on total coins
  new_level_id := public.calculate_user_level(p_user_id, p_company_id, user_current_coins);
  
  -- Update user's current level
  UPDATE public.user_current_level 
  SET 
    current_level_id = new_level_id,
    current_coins = user_current_coins,
    updated_at = now()
  WHERE user_id = p_user_id AND company_id = p_company_id;
  
  RETURN true;
END;
$function$;

-- Update remove_user_coins function to also update monthly_coins
CREATE OR REPLACE FUNCTION public.remove_user_coins(p_user_id uuid, p_company_id uuid, p_action_type text, p_reference_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  coins_to_remove integer;
  user_total_coins integer;
  new_level_id uuid;
BEGIN
  -- Simple validation
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;
  
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id cannot be null';
  END IF;
  
  IF p_action_type IS NULL OR p_action_type = '' THEN
    RAISE EXCEPTION 'action_type cannot be null or empty';
  END IF;

  -- Get coins for this action
  coins_to_remove := public.calculate_coins_for_action(p_action_type);
  
  -- Only proceed if there are coins to remove
  IF coins_to_remove > 0 THEN
    -- Insert transaction record (negative coins for reversal)
    INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
    VALUES (p_user_id, p_company_id, 'undo_' || p_action_type, -coins_to_remove, -coins_to_remove, p_reference_id);
    
    -- Update user's total coins and monthly coins (ensure they don't go below 0)
    UPDATE public.user_points 
    SET 
      total_coins = GREATEST(0, total_coins - coins_to_remove),
      monthly_coins = GREATEST(0, monthly_coins - coins_to_remove),
      updated_at = now()
    WHERE user_id = p_user_id AND company_id = p_company_id
    RETURNING total_coins INTO user_total_coins;
    
    -- If no user points record exists, create one with 0 coins
    IF user_total_coins IS NULL THEN
      INSERT INTO public.user_points (user_id, company_id, total_coins, monthly_coins, last_monthly_reset)
      VALUES (p_user_id, p_company_id, 0, 0, date_trunc('month', now()));
      user_total_coins := 0;
    END IF;
    
    -- Calculate new level based on total coins
    new_level_id := public.calculate_user_level(p_user_id, p_company_id, user_total_coins);
    
    -- Update user's current level
    INSERT INTO public.user_current_level (user_id, company_id, current_level_id, current_coins)
    VALUES (p_user_id, p_company_id, new_level_id, user_total_coins)
    ON CONFLICT (user_id, company_id)
    DO UPDATE SET 
      current_level_id = new_level_id,
      current_coins = user_total_coins,
      updated_at = now();
  END IF;
END;
$function$;