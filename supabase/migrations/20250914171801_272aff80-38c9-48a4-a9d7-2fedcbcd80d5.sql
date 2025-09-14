-- Fix the get_user_company_id function to handle session context properly
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  company_id uuid;
BEGIN
  -- First try to get from session context (set by useSupabaseContext)
  BEGIN
    SELECT current_setting('app.current_company_id', true)::uuid INTO company_id;
  EXCEPTION WHEN OTHERS THEN
    company_id := NULL;
  END;
  
  -- If not found in context or invalid, get from user profile
  IF company_id IS NULL THEN
    SELECT p.company_id INTO company_id
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN company_id;
END;
$function$