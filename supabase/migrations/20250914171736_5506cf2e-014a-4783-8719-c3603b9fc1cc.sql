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

-- Create a function for domain-based company lookup that doesn't require authentication
CREATE OR REPLACE FUNCTION public.find_company_by_domain(p_domain text)
RETURNS TABLE(
  id uuid,
  name text,
  subdomain text,
  custom_domain text,
  custom_domain_status text,
  status text,
  logo_url text,
  primary_color text,
  text_color text,
  button_text_color text,
  coin_name text,
  enabled_features jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Remove www. prefix if present
  p_domain := regexp_replace(p_domain, '^www\.', '', 'i');
  
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.subdomain,
    c.custom_domain,
    c.custom_domain_status,
    c.status,
    c.logo_url,
    c.primary_color,
    c.text_color,
    c.button_text_color,
    c.coin_name,
    c.enabled_features
  FROM public.companies c
  WHERE c.status = 'active'
  AND (
    c.custom_domain = p_domain
    OR c.subdomain = p_domain
    OR c.custom_domain = 'www.' || p_domain
  )
  LIMIT 1;
END;
$function$