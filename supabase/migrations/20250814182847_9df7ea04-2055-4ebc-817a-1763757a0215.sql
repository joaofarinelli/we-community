-- Fix generate_invite_token function to use gen_random_uuid instead of gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Generate a token using UUID and replace characters that might cause URL issues
  RETURN replace(replace(replace(gen_random_uuid()::text || '-' || gen_random_uuid()::text, '-', ''), '+', 'A'), '/', 'B');
END;
$function$;