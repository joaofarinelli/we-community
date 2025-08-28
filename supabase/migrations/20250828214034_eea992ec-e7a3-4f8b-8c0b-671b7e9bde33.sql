-- Create RPC function to safely get company details for users with profiles
CREATE OR REPLACE FUNCTION public.get_company_details_for_user(p_company_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  subdomain text,
  custom_domain text,
  custom_domain_status text,
  custom_domain_verified_at timestamp with time zone,
  logo_url text,
  status text,
  theme_config jsonb,
  enabled_features jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify user has an active profile in this company
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND company_id = p_company_id 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User does not have access to company %', p_company_id;
  END IF;
  
  -- Return company details
  RETURN QUERY
  SELECT c.id, c.name, c.subdomain, c.custom_domain, c.custom_domain_status,
         c.custom_domain_verified_at, c.logo_url, c.status, c.theme_config, c.enabled_features
  FROM public.companies c
  WHERE c.id = p_company_id;
END;
$function$;