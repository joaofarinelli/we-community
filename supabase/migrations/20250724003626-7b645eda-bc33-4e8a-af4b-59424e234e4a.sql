-- Fix the ambiguous column reference in add_user_coins function
CREATE OR REPLACE FUNCTION public.add_user_coins(p_user_id uuid, p_company_id uuid, p_action_type text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
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
  
  -- Update user's total coins (upsert)
  INSERT INTO public.user_points (user_id, company_id, total_coins)
  VALUES (p_user_id, p_company_id, coins_to_add)
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    total_coins = user_points.total_coins + coins_to_add,
    updated_at = now()
  RETURNING total_coins INTO user_total_coins;
  
  -- Calculate new level
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
$$;