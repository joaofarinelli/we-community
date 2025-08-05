-- Fix get_user_company_id function to handle multi-company users properly
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    result_company_id uuid;
    context_company_id uuid;
    user_companies uuid[];
BEGIN
    -- Always try to get company ID from session context first
    BEGIN
        context_company_id := current_setting('app.current_company_id', true)::uuid;
        
        -- If context is set, verify user has access and return it
        IF context_company_id IS NOT NULL THEN
            SELECT company_id INTO result_company_id
            FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND company_id = context_company_id 
            AND is_active = true;
            
            IF result_company_id IS NOT NULL THEN
                RAISE LOG 'get_user_company_id: Using context company %', context_company_id;
                RETURN result_company_id;
            ELSE
                RAISE LOG 'get_user_company_id: Context company % not accessible to user %', context_company_id, auth.uid();
            END IF;
        ELSE
            RAISE LOG 'get_user_company_id: No context company set for user %', auth.uid();
        END IF;
    EXCEPTION
        WHEN others THEN
            RAISE LOG 'get_user_company_id: Error getting context: %', SQLERRM;
    END;
    
    -- Get all companies user has access to
    SELECT array_agg(company_id) INTO user_companies
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true;
    
    RAISE LOG 'get_user_company_id: User % has access to companies: %', auth.uid(), user_companies;
    
    -- For multi-company users without context, return NULL to force proper context setting
    IF array_length(user_companies, 1) > 1 THEN
        RAISE LOG 'get_user_company_id: Multi-company user without proper context, returning NULL';
        RETURN NULL;
    END IF;
    
    -- Single company user - return that company
    IF array_length(user_companies, 1) = 1 THEN
        RAISE LOG 'get_user_company_id: Single company user, returning %', user_companies[1];
        RETURN user_companies[1];
    END IF;
    
    -- No companies found
    RAISE LOG 'get_user_company_id: No accessible companies found for user %', auth.uid();
    RETURN NULL;
END;
$function$;

-- Update user_streaks RLS policies to handle NULL company context better
DROP POLICY IF EXISTS "Users can view their own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can update their own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "System can create streak records" ON public.user_streaks;
DROP POLICY IF EXISTS "System can update streak records" ON public.user_streaks;

-- Create improved policies that require explicit company context
CREATE POLICY "Users can view their own streaks with context" 
ON public.user_streaks 
FOR SELECT 
USING (
  company_id IS NOT NULL 
  AND company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = user_streaks.user_id 
    AND p.user_id = auth.uid()
    AND p.company_id = user_streaks.company_id
  )
);

CREATE POLICY "System can create streak records with context" 
ON public.user_streaks 
FOR INSERT 
WITH CHECK (
  company_id IS NOT NULL 
  AND company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = user_streaks.user_id 
    AND p.user_id = auth.uid()
    AND p.company_id = user_streaks.company_id
  )
);

CREATE POLICY "System can update streak records with context" 
ON public.user_streaks 
FOR UPDATE 
USING (
  company_id IS NOT NULL 
  AND company_id = get_user_company_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = user_streaks.user_id 
    AND p.user_id = auth.uid()
    AND p.company_id = user_streaks.company_id
  )
);

-- Update the update_user_streak function to better handle multi-company scenarios
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