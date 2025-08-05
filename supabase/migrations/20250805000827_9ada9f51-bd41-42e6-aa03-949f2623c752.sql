-- Fix update_user_streak to automatically find the correct profile for the company
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
  RAISE LOG 'update_user_streak called for auth user % in company %', p_user_id, p_company_id;
  
  -- Verify user has access to this company and get the profile ID
  -- p_user_id should be the auth.uid(), we need to find the profile.id for this company
  SELECT p.id INTO profile_id
  FROM public.profiles p
  WHERE p.user_id = p_user_id 
  AND p.company_id = p_company_id 
  AND p.is_active = true;
  
  IF profile_id IS NULL THEN
    RAISE LOG 'update_user_streak: No profile found for auth user % in company %', p_user_id, p_company_id;
    RAISE EXCEPTION 'No profile found for user in this company';
  END IF;
  
  -- Verify that the authenticated user is the same as the one updating the streak
  IF auth.uid() != p_user_id THEN
    RAISE LOG 'update_user_streak: Auth user % trying to update streak for different user %', auth.uid(), p_user_id;
    RAISE EXCEPTION 'Cannot update streak for different user';
  END IF;
  
  RAISE LOG 'update_user_streak: Found profile % for auth user % in company %', profile_id, p_user_id, p_company_id;
  
  current_date_local := CURRENT_DATE;
  
  -- Get or create user streak record using the profile_id (unique per company)
  INSERT INTO public.user_streaks (user_id, company_id, current_streak, longest_streak, last_activity_date, streak_start_date, is_active)
  VALUES (profile_id, p_company_id, 0, 0, NULL, NULL, false)
  ON CONFLICT (user_id, company_id) DO NOTHING;
  
  -- Get current streak data using profile_id
  SELECT last_activity_date, current_streak, longest_streak, streak_start_date
  INTO last_activity, current_streak_val, longest_streak_val, streak_start
  FROM public.user_streaks
  WHERE user_id = profile_id AND company_id = p_company_id;
  
  RAISE LOG 'update_user_streak: Current data for profile % - last_activity: %, streak: %, longest: %', profile_id, last_activity, current_streak_val, longest_streak_val;
  
  -- Check if user already checked in today
  IF last_activity = current_date_local THEN
    RAISE LOG 'update_user_streak: Profile % already checked in today', profile_id;
    RETURN; -- Already checked in today
  END IF;
  
  -- Check streak logic
  IF last_activity IS NULL THEN
    -- First time check-in
    current_streak_val := 1;
    streak_start := current_date_local;
    RAISE LOG 'update_user_streak: Profile % first check-in, starting streak', profile_id;
  ELSIF last_activity = current_date_local - INTERVAL '1 day' THEN
    -- Consecutive day
    current_streak_val := current_streak_val + 1;
    RAISE LOG 'update_user_streak: Profile % consecutive day, streak now %', profile_id, current_streak_val;
  ELSIF last_activity < current_date_local - INTERVAL '1 day' THEN
    -- Streak broken
    current_streak_val := 1;
    streak_start := current_date_local;
    RAISE LOG 'update_user_streak: Profile % streak broken, restarting', profile_id;
  END IF;
  
  -- Update longest streak if needed
  IF current_streak_val > longest_streak_val THEN
    longest_streak_val := current_streak_val;
    RAISE LOG 'update_user_streak: Profile % new longest streak: %', profile_id, longest_streak_val;
  END IF;
  
  -- Update the record for this specific profile/company combination
  UPDATE public.user_streaks
  SET 
    current_streak = current_streak_val,
    longest_streak = longest_streak_val,
    last_activity_date = current_date_local,
    streak_start_date = streak_start,
    is_active = true,
    updated_at = now()
  WHERE user_id = profile_id AND company_id = p_company_id;
  
  RAISE LOG 'update_user_streak: Updated streak record successfully for profile % in company %', profile_id, p_company_id;
  
  -- Award streak rewards (using the auth user_id for rewards system)
  PERFORM public.process_streak_rewards(p_user_id, p_company_id, current_streak_val);
  
  RAISE LOG 'update_user_streak: Completed successfully for profile % in company %', profile_id, p_company_id;
END;
$function$;