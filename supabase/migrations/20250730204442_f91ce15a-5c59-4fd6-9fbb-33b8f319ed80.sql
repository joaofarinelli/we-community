-- Function to calculate trail progress
CREATE OR REPLACE FUNCTION public.calculate_trail_progress(p_trail_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_stages INTEGER;
  completed_stages INTEGER;
  progress_percentage INTEGER;
BEGIN
  -- Count total stages
  SELECT COUNT(*) INTO total_stages
  FROM public.trail_stages
  WHERE trail_id = p_trail_id;
  
  -- Count completed stages
  SELECT COUNT(*) INTO completed_stages
  FROM public.trail_progress
  WHERE trail_id = p_trail_id AND is_completed = true;
  
  -- Calculate percentage
  IF total_stages > 0 THEN
    progress_percentage := ROUND((completed_stages::DECIMAL / total_stages::DECIMAL) * 100);
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- Update trail progress
  UPDATE public.trails 
  SET progress_percentage = progress_percentage,
      updated_at = now()
  WHERE id = p_trail_id;
  
  RETURN progress_percentage;
END;
$$;

-- Function to award trail badge and coins
CREATE OR REPLACE FUNCTION public.award_trail_badge(
  p_user_id UUID,
  p_company_id UUID,
  p_trail_id UUID,
  p_badge_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  badge_record RECORD;
BEGIN
  -- Get badge details
  SELECT * INTO badge_record
  FROM public.trail_badges
  WHERE company_id = p_company_id 
  AND badge_type = p_badge_type 
  AND is_active = true
  LIMIT 1;
  
  IF badge_record.id IS NOT NULL THEN
    -- Award badge (ignore if already earned)
    INSERT INTO public.user_trail_badges (user_id, company_id, trail_id, badge_id)
    VALUES (p_user_id, p_company_id, p_trail_id, badge_record.id)
    ON CONFLICT (user_id, trail_id, badge_id) DO NOTHING;
    
    -- Award coins if configured
    IF badge_record.coins_reward > 0 THEN
      -- Insert custom transaction with badge reward amount
      INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
      VALUES (p_user_id, p_company_id, 'trail_badge', badge_record.coins_reward, badge_record.coins_reward, badge_record.id);
      
      -- Update user's total coins
      INSERT INTO public.user_points (user_id, company_id, total_coins)
      VALUES (p_user_id, p_company_id, badge_record.coins_reward)
      ON CONFLICT (user_id, company_id)
      DO UPDATE SET 
        total_coins = user_points.total_coins + badge_record.coins_reward,
        updated_at = now();
    END IF;
    
    -- Create notification
    INSERT INTO public.notifications (user_id, company_id, type, title, content, reference_id)
    VALUES (
      p_user_id,
      p_company_id,
      'trail_badge',
      'Novo Selo Conquistado!',
      'Parabéns! Você conquistou o selo "' || badge_record.name || '" em sua jornada.',
      badge_record.id
    );
  END IF;
END;
$$;