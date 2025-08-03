-- Fix ambiguous column reference in deduct_user_coins function
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
  
  -- Update user's total coins
  UPDATE public.user_points 
  SET 
    total_coins = total_coins - p_coins,
    updated_at = now()
  WHERE user_id = p_user_id AND company_id = p_company_id
  RETURNING total_coins INTO user_current_coins;
  
  -- Calculate new level
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