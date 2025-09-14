-- Fix the set_current_company_context function to handle UUID properly
CREATE OR REPLACE FUNCTION public.set_current_company_context(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Set the current company ID in the session
  IF p_company_id IS NOT NULL THEN
    PERFORM set_config('app.current_company_id', p_company_id::text, false);
  ELSE
    PERFORM set_config('app.current_company_id', '', false);
  END IF;
END;
$function$