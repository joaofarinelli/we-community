-- Fix ambiguous column reference in process_streak_rewards function
CREATE OR REPLACE FUNCTION public.process_streak_rewards(p_user_id uuid, p_company_id uuid, p_current_streak integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  milestone_coins integer;
  milestone_days integer;
  user_total_coins integer;
  new_level_id uuid;
BEGIN
  -- Define streak milestones and their rewards
  CASE 
    WHEN p_current_streak = 7 THEN
      milestone_days := 7;
      milestone_coins := 50;
    WHEN p_current_streak = 14 THEN
      milestone_days := 14;
      milestone_coins := 100;
    WHEN p_current_streak = 30 THEN
      milestone_days := 30;
      milestone_coins := 200;
    WHEN p_current_streak = 60 THEN
      milestone_days := 60;
      milestone_coins := 400;
    WHEN p_current_streak = 100 THEN
      milestone_days := 100;
      milestone_coins := 800;
    ELSE
      -- No milestone reached, exit early
      RETURN;
  END CASE;

  -- Check if this milestone was already awarded
  IF EXISTS (
    SELECT 1 FROM public.user_streak_milestones 
    WHERE user_id = p_user_id 
    AND company_id = p_company_id 
    AND user_streak_milestones.milestone_days = milestone_days
  ) THEN
    -- Milestone already awarded, exit
    RAISE LOG 'Streak milestone % days already awarded to user % in company %', milestone_days, p_user_id, p_company_id;
    RETURN;
  END IF;

  -- Log the milestone reward
  RAISE LOG 'Awarding streak milestone: % days = % coins to user % in company %', milestone_days, milestone_coins, p_user_id, p_company_id;

  -- Record the milestone to prevent future duplicates
  INSERT INTO public.user_streak_milestones (
    user_id, company_id, milestone_days, coins_awarded
  ) VALUES (
    p_user_id, p_company_id, milestone_days, milestone_coins
  );

  -- Insert transaction record with proper reference
  INSERT INTO public.point_transactions (
    user_id, company_id, action_type, points, coins, reference_id
  ) VALUES (
    p_user_id, p_company_id, 'streak_milestone', milestone_coins, milestone_coins, 
    (SELECT id FROM public.user_streak_milestones 
     WHERE user_id = p_user_id AND company_id = p_company_id AND user_streak_milestones.milestone_days = milestone_days)
  );

  -- Update user's total coins and monthly coins (upsert)
  INSERT INTO public.user_points (user_id, company_id, total_coins, monthly_coins, last_monthly_reset)
  VALUES (p_user_id, p_company_id, milestone_coins, milestone_coins, date_trunc('month', now()))
  ON CONFLICT (user_id, company_id)
  DO UPDATE SET 
    total_coins = user_points.total_coins + milestone_coins,
    monthly_coins = user_points.monthly_coins + milestone_coins,
    updated_at = now()
  RETURNING total_coins INTO user_total_coins;

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

  -- Create notification for the milestone
  INSERT INTO public.notifications (
    user_id, company_id, type, title, content, reference_id
  ) VALUES (
    p_user_id, p_company_id, 'streak_milestone',
    'Marco da Ofensiva Alcançado! 🔥',
    'Parabéns! Você alcançou ' || milestone_days || ' dias consecutivos e ganhou ' || milestone_coins || ' moedas!',
    (SELECT id FROM public.user_streak_milestones 
     WHERE user_id = p_user_id AND company_id = p_company_id AND user_streak_milestones.milestone_days = milestone_days)
  );

  RAISE LOG 'Successfully awarded streak milestone: % days = % coins to user % in company %', milestone_days, milestone_coins, p_user_id, p_company_id;
END;
$function$;