-- Fix the add_user_coins function to use correct column names
CREATE OR REPLACE FUNCTION public.add_user_coins(p_user_id uuid, p_company_id uuid, p_action_type text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  coins_to_add integer;
  total_coins integer;
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
  RETURNING total_coins INTO total_coins;
  
  -- Calculate new level
  new_level_id := public.calculate_user_level(p_user_id, p_company_id, total_coins);
  
  -- Update user's current level
  INSERT INTO public.user_current_level (user_id, company_id, current_level_id, current_coins)
  VALUES (p_user_id, p_company_id, new_level_id, total_coins)
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    current_level_id = new_level_id,
    current_coins = total_coins,
    updated_at = now();
END;
$$;

-- Update the add_user_points function to use coins
CREATE OR REPLACE FUNCTION public.add_user_points(p_user_id uuid, p_company_id uuid, p_action_type text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  -- Redirect to add_user_coins function for consistency
  PERFORM public.add_user_coins(p_user_id, p_company_id, p_action_type, p_reference_id);
END;
$$;

-- Fix process_challenge_reward function
CREATE OR REPLACE FUNCTION public.process_challenge_reward(
  p_challenge_id UUID,
  p_user_id UUID,
  p_company_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  challenge_record RECORD;
  reward_amount INTEGER;
  total_coins INTEGER;
  new_level_id UUID;
BEGIN
  -- Get challenge details
  SELECT * INTO challenge_record 
  FROM public.challenges 
  WHERE id = p_challenge_id;
  
  -- Process reward based on type
  CASE challenge_record.reward_type
    WHEN 'coins' THEN
      reward_amount := (challenge_record.reward_value->>'amount')::INTEGER;
      
      -- Insert coins transaction
      INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
      VALUES (p_user_id, p_company_id, 'challenge_reward', reward_amount, reward_amount, p_challenge_id);
      
      -- Update total coins
      INSERT INTO public.user_points (user_id, company_id, total_coins)
      VALUES (p_user_id, p_company_id, reward_amount)
      ON CONFLICT (user_id, company_id)
      DO UPDATE SET 
        total_coins = user_points.total_coins + reward_amount,
        updated_at = now()
      RETURNING total_coins INTO total_coins;
      
      -- Update user level
      new_level_id := public.calculate_user_level(p_user_id, p_company_id, total_coins);
      
      INSERT INTO public.user_current_level (user_id, company_id, current_level_id, current_coins)
      VALUES (p_user_id, p_company_id, new_level_id, total_coins)
      ON CONFLICT (user_id, company_id)
      DO UPDATE SET 
        current_level_id = new_level_id,
        current_coins = total_coins,
        updated_at = now();
    
    WHEN 'course_access' THEN
      -- Course access would be handled by application logic
      NULL;
    
    WHEN 'file_download' THEN
      -- File download access would be handled by application logic
      NULL;
    
    WHEN 'marketplace_item' THEN
      -- Marketplace item access would be handled by application logic
      NULL;
  END CASE;
  
  -- Record the reward
  INSERT INTO public.challenge_rewards (
    challenge_id, user_id, company_id, reward_type, reward_details
  ) VALUES (
    p_challenge_id, p_user_id, p_company_id, 
    challenge_record.reward_type::TEXT, challenge_record.reward_value
  );
END;
$$;