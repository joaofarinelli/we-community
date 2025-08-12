-- Soften validation in remove_user_coins and harden handle_post_deletion to avoid failures when company_id is unexpectedly null

-- 1) Update remove_user_coins: early-return on null inputs instead of raising exceptions
CREATE OR REPLACE FUNCTION public.remove_user_coins(
  p_user_id uuid,
  p_company_id uuid,
  p_action_type text,
  p_reference_id uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  coins_to_remove integer;
  user_total_coins integer;
  new_level_id uuid;
BEGIN
  -- If essential params are missing, do not block the original operation
  IF p_user_id IS NULL OR p_company_id IS NULL OR p_action_type IS NULL OR p_action_type = '' THEN
    RAISE NOTICE 'remove_user_coins skipped: user_id=%, company_id=%, action_type=%', p_user_id, p_company_id, p_action_type;
    RETURN;
  END IF;

  -- Determine coins for the action
  coins_to_remove := public.calculate_coins_for_action(p_action_type);

  -- Only proceed if there are coins to remove
  IF coins_to_remove > 0 THEN
    -- Record reversal transaction (negative values)
    INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
    VALUES (p_user_id, p_company_id, 'undo_' || p_action_type, -coins_to_remove, -coins_to_remove, p_reference_id);

    -- Update totals (don't allow below 0) and monthly coins as per latest logic
    UPDATE public.user_points 
    SET 
      total_coins = GREATEST(0, total_coins - coins_to_remove),
      monthly_coins = GREATEST(0, monthly_coins - coins_to_remove),
      updated_at = now()
    WHERE user_id = p_user_id AND company_id = p_company_id
    RETURNING total_coins INTO user_total_coins;

    -- If user doesn't have a points row yet, initialize with zeros
    IF user_total_coins IS NULL THEN
      INSERT INTO public.user_points (user_id, company_id, total_coins, monthly_coins, last_monthly_reset)
      VALUES (p_user_id, p_company_id, 0, 0, date_trunc('month', now()));
      user_total_coins := 0;
    END IF;

    -- Recalculate level
    new_level_id := public.calculate_user_level(p_user_id, p_company_id, user_total_coins);

    -- Update current level row
    INSERT INTO public.user_current_level (user_id, company_id, current_level_id, current_coins)
    VALUES (p_user_id, p_company_id, new_level_id, user_total_coins)
    ON CONFLICT (user_id, company_id)
    DO UPDATE SET 
      current_level_id = EXCLUDED.current_level_id,
      current_coins = EXCLUDED.current_coins,
      updated_at = now();
  END IF;
END;
$$;

-- 2) Update handle_post_deletion to guard against nulls before calling remove_user_coins
CREATE OR REPLACE FUNCTION public.handle_post_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RAISE NOTICE 'Deleting post: id=%, author_id=%, company_id=%', OLD.id, OLD.author_id, OLD.company_id;

  IF OLD.author_id IS NOT NULL AND OLD.company_id IS NOT NULL THEN
    PERFORM public.remove_user_coins(OLD.author_id, OLD.company_id, 'create_post', OLD.id);
  ELSE
    RAISE NOTICE 'Skipping coin removal: author_id=%, company_id=%', OLD.author_id, OLD.company_id;
  END IF;

  RETURN OLD;
END;
$$;