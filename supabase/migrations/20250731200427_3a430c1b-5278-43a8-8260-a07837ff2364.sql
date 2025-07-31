-- Function to remove coins from user when actions are undone
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
  -- Get coins for this action
  coins_to_remove := public.calculate_coins_for_action(p_action_type);
  
  -- Insert transaction record (negative coins for reversal)
  INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
  VALUES (p_user_id, p_company_id, 'undo_' || p_action_type, -coins_to_remove, -coins_to_remove, p_reference_id);
  
  -- Update user's total coins (ensure it doesn't go below 0)
  UPDATE public.user_points 
  SET 
    total_coins = GREATEST(0, total_coins - coins_to_remove),
    updated_at = now()
  WHERE user_id = p_user_id AND company_id = p_company_id
  RETURNING total_coins INTO user_total_coins;
  
  -- If no user points record exists, create one with 0 coins
  IF user_total_coins IS NULL THEN
    INSERT INTO public.user_points (user_id, company_id, total_coins)
    VALUES (p_user_id, p_company_id, 0);
    user_total_coins := 0;
  END IF;
  
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
$function$