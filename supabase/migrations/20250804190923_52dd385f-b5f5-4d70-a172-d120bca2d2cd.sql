-- First, remove the existing foreign key constraint if it exists
ALTER TABLE public.user_streaks DROP CONSTRAINT IF EXISTS user_streaks_user_id_fkey;

-- Add the new foreign key constraint referencing profiles table
ALTER TABLE public.user_streaks 
ADD CONSTRAINT user_streaks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update the comment to reflect the new relationship
COMMENT ON COLUMN public.user_streaks.user_id IS 'References profiles.id for multi-company support';

-- Update the RLS policies to work with profile IDs
DROP POLICY IF EXISTS "Users can view their own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can update their own streaks" ON public.user_streaks;

-- Create new RLS policies that work with profile IDs
CREATE POLICY "Users can view their own streaks" ON public.user_streaks
FOR SELECT USING (
  user_id IN (
    SELECT id FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.company_id = get_user_company_id()
  )
);

CREATE POLICY "System can manage streaks" ON public.user_streaks
FOR ALL USING (
  user_id IN (
    SELECT id FROM public.profiles 
    WHERE profiles.company_id = get_user_company_id()
  )
);

-- Update the update_user_streak function to work with profile IDs
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
  current_context_company uuid;
  profile_id uuid;
BEGIN
  -- Log the function call
  RAISE LOG 'update_user_streak called for user % in company %', p_user_id, p_company_id;
  
  -- Verify context is set correctly
  BEGIN
    current_context_company := current_setting('app.current_company_id', true)::uuid;
    RAISE LOG 'update_user_streak: Current context company is %', current_context_company;
    
    IF current_context_company != p_company_id THEN
      RAISE LOG 'update_user_streak: Context mismatch! Expected %, got %', p_company_id, current_context_company;
      RAISE EXCEPTION 'Company context mismatch. Expected %, current context %', p_company_id, current_context_company;
    END IF;
  EXCEPTION
    WHEN others THEN
      RAISE LOG 'update_user_streak: Error checking context: %', SQLERRM;
      RAISE EXCEPTION 'Company context not properly set';
  END;
  
  -- Get the profile ID for this user in this company
  SELECT id INTO profile_id
  FROM public.profiles
  WHERE user_id = p_user_id AND company_id = p_company_id;
  
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