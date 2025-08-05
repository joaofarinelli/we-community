-- Fix update_user_streak to be less dependent on session context
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid, p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_date_local DATE;
  last_activity DATE;
  current_streak_val INTEGER;
  longest_streak_val INTEGER;
  streak_start DATE;
  profile_id uuid;
  user_has_access boolean := false;
BEGIN
  -- Log the function call
  RAISE LOG 'update_user_streak called for user % in company %', p_user_id, p_company_id;
  
  -- Verify user has access to this company (more direct approach)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id 
    AND company_id = p_company_id 
    AND is_active = true
  ) INTO user_has_access;
  
  IF NOT user_has_access THEN
    RAISE LOG 'update_user_streak: User % does not have access to company %', p_user_id, p_company_id;
    RAISE EXCEPTION 'User does not have access to this company';
  END IF;
  
  -- Verify that the authenticated user is the same as the one updating the streak
  IF auth.uid() != p_user_id THEN
    RAISE LOG 'update_user_streak: Auth user % trying to update streak for different user %', auth.uid(), p_user_id;
    RAISE EXCEPTION 'Cannot update streak for different user';
  END IF;
  
  -- Get the profile ID for this user in this company
  SELECT id INTO profile_id
  FROM public.profiles
  WHERE user_id = p_user_id AND company_id = p_company_id AND is_active = true;
  
  IF profile_id IS NULL THEN
    RAISE LOG 'update_user_streak: No profile found for user % in company %', p_user_id, p_company_id;
    RAISE EXCEPTION 'No profile found for user in this company';
  END IF;
  
  current_date_local := CURRENT_DATE;
  
  -- Get or create user streak record using profile_id
  INSERT INTO public.user_streaks (user_id, company_id, current_streak, longest_streak, last_activity_date, streak_start_date, is_active)
  VALUES (profile_id, p_company_id, 0, 0, NULL, NULL, false)
  ON CONFLICT (user_id, company_id) DO NOTHING;
  
  -- Get current streak data
  SELECT last_activity_date, current_streak, longest_streak, streak_start_date
  INTO last_activity, current_streak_val, longest_streak_val, streak_start
  FROM public.user_streaks
  WHERE user_id = profile_id AND company_id = p_company_id;
  
  RAISE LOG 'update_user_streak: Current data - last_activity: %, streak: %, longest: %', last_activity, current_streak_val, longest_streak_val;
  
  -- Check if user already checked in today
  IF last_activity = current_date_local THEN
    RAISE LOG 'update_user_streak: Already checked in today';
    RETURN; -- Already checked in today
  END IF;
  
  -- Check streak logic
  IF last_activity IS NULL THEN
    -- First time check-in
    current_streak_val := 1;
    streak_start := current_date_local;
    RAISE LOG 'update_user_streak: First check-in, starting streak';
  ELSIF last_activity = current_date_local - INTERVAL '1 day' THEN
    -- Consecutive day
    current_streak_val := current_streak_val + 1;
    RAISE LOG 'update_user_streak: Consecutive day, streak now %', current_streak_val;
  ELSIF last_activity < current_date_local - INTERVAL '1 day' THEN
    -- Streak broken
    current_streak_val := 1;
    streak_start := current_date_local;
    RAISE LOG 'update_user_streak: Streak broken, restarting';
  END IF;
  
  -- Update longest streak if needed
  IF current_streak_val > longest_streak_val THEN
    longest_streak_val := current_streak_val;
    RAISE LOG 'update_user_streak: New longest streak: %', longest_streak_val;
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
  WHERE user_id = profile_id AND company_id = p_company_id;
  
  RAISE LOG 'update_user_streak: Updated streak record successfully';
  
  -- Award streak rewards (using the auth user_id for rewards)
  PERFORM public.process_streak_rewards(p_user_id, p_company_id, current_streak_val);
  
  RAISE LOG 'update_user_streak: Completed successfully';
END;
$function$;

-- Also update the RLS policies to be more permissive for authenticated operations
DROP POLICY IF EXISTS "Users can view their own streaks with context" ON public.user_streaks;
DROP POLICY IF EXISTS "System can create streak records with context" ON public.user_streaks;
DROP POLICY IF EXISTS "System can update streak records with context" ON public.user_streaks;

-- Create simpler, more reliable policies
CREATE POLICY "Users can view their own streaks" 
ON public.user_streaks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = user_streaks.user_id 
    AND p.user_id = auth.uid()
    AND p.company_id = user_streaks.company_id
    AND p.is_active = true
  )
);

CREATE POLICY "System can create streak records" 
ON public.user_streaks 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = user_streaks.user_id 
    AND p.user_id = auth.uid()
    AND p.company_id = user_streaks.company_id
    AND p.is_active = true
  )
);

CREATE POLICY "System can update streak records" 
ON public.user_streaks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = user_streaks.user_id 
    AND p.user_id = auth.uid()
    AND p.company_id = user_streaks.company_id
    AND p.is_active = true
  )
);