-- Create user_streaks table
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own streak" 
ON public.user_streaks 
FOR SELECT 
USING (user_id = auth.uid() AND company_id = get_user_company_id());

CREATE POLICY "Users can update their own streak" 
ON public.user_streaks 
FOR UPDATE 
USING (user_id = auth.uid() AND company_id = get_user_company_id());

CREATE POLICY "System can create streaks" 
ON public.user_streaks 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Company owners can view all streaks" 
ON public.user_streaks 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());

-- Create function to update user streak
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID, p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_date_local DATE;
  last_activity DATE;
  current_streak_val INTEGER;
  longest_streak_val INTEGER;
  streak_start DATE;
BEGIN
  current_date_local := CURRENT_DATE;
  
  -- Get or create user streak record
  INSERT INTO public.user_streaks (user_id, company_id, current_streak, longest_streak, last_activity_date, streak_start_date, is_active)
  VALUES (p_user_id, p_company_id, 0, 0, NULL, NULL, false)
  ON CONFLICT (user_id, company_id) DO NOTHING;
  
  -- Get current streak data
  SELECT last_activity_date, current_streak, longest_streak, streak_start_date
  INTO last_activity, current_streak_val, longest_streak_val, streak_start
  FROM public.user_streaks
  WHERE user_id = p_user_id AND company_id = p_company_id;
  
  -- Check if user already checked in today
  IF last_activity = current_date_local THEN
    RETURN; -- Already checked in today
  END IF;
  
  -- Check streak logic
  IF last_activity IS NULL THEN
    -- First time check-in
    current_streak_val := 1;
    streak_start := current_date_local;
  ELSIF last_activity = current_date_local - INTERVAL '1 day' THEN
    -- Consecutive day
    current_streak_val := current_streak_val + 1;
  ELSIF last_activity < current_date_local - INTERVAL '1 day' THEN
    -- Streak broken
    current_streak_val := 1;
    streak_start := current_date_local;
  END IF;
  
  -- Update longest streak if needed
  IF current_streak_val > longest_streak_val THEN
    longest_streak_val := current_streak_val;
  END IF;
  
  -- Update the record
  UPDATE public.user_streaks
  SET 
    current_streak = current_streak_val,
    longest_streak = longest_streak_val,
    last_activity_date = current_date_local,
    streak_start_date = streak_start,
    is_active = true,
    updated_at = now()
  WHERE user_id = p_user_id AND company_id = p_company_id;
  
  -- Award streak rewards
  PERFORM public.process_streak_rewards(p_user_id, p_company_id, current_streak_val);
END;
$$;

-- Create function to process streak rewards
CREATE OR REPLACE FUNCTION public.process_streak_rewards(p_user_id UUID, p_company_id UUID, p_streak_days INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  reward_coins INTEGER;
BEGIN
  -- Calculate rewards based on streak milestones
  IF p_streak_days = 7 THEN
    reward_coins := 50;
  ELSIF p_streak_days = 14 THEN
    reward_coins := 100;
  ELSIF p_streak_days = 30 THEN
    reward_coins := 300;
  ELSIF p_streak_days = 60 THEN
    reward_coins := 600;
  ELSIF p_streak_days = 100 THEN
    reward_coins := 1000;
  ELSIF p_streak_days % 10 = 0 AND p_streak_days >= 10 THEN
    reward_coins := p_streak_days * 2; -- 2 coins per day for every 10-day milestone
  ELSE
    reward_coins := 0;
  END IF;
  
  -- Award coins if there's a reward
  IF reward_coins > 0 THEN
    PERFORM public.add_user_coins(p_user_id, p_company_id, 'streak_milestone', NULL);
    
    -- Insert custom transaction with correct amount
    INSERT INTO public.point_transactions (user_id, company_id, action_type, points, coins, reference_id)
    VALUES (p_user_id, p_company_id, 'streak_milestone', reward_coins, reward_coins, NULL);
    
    -- Update user's total coins
    INSERT INTO public.user_points (user_id, company_id, total_coins)
    VALUES (p_user_id, p_company_id, reward_coins)
    ON CONFLICT (user_id, company_id)
    DO UPDATE SET 
      total_coins = user_points.total_coins + reward_coins,
      updated_at = now();
      
    -- Create notification
    INSERT INTO public.notifications (user_id, company_id, type, title, content)
    VALUES (
      p_user_id,
      p_company_id,
      'streak_milestone',
      'Ofensiva de ' || p_streak_days || ' dias!',
      'Parabéns! Você recebeu ' || reward_coins || ' moedas pela sua ofensiva de ' || p_streak_days || ' dias consecutivos.'
    );
  END IF;
END;
$$;

-- Create function to reset broken streaks (runs daily)
CREATE OR REPLACE FUNCTION public.reset_broken_streaks()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_streaks
  SET 
    current_streak = 0,
    is_active = false,
    updated_at = now()
  WHERE last_activity_date < CURRENT_DATE - INTERVAL '1 day'
    AND is_active = true;
END;
$$;

-- Create trigger for automatic streak updates on login
CREATE OR REPLACE FUNCTION public.handle_user_login_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update streak when user profile is accessed (indicates login)
  IF TG_OP = 'UPDATE' AND OLD.updated_at != NEW.updated_at THEN
    PERFORM public.update_user_streak(NEW.user_id, NEW.company_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add updated_at trigger to user_streaks
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();