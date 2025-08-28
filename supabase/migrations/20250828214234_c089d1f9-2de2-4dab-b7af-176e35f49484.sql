-- Update RPC function to return all company fields used in the codebase
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
  enabled_features jsonb,
  favicon_url text,
  primary_color text,
  button_text_color text,
  text_color text,
  theme_mode text,
  feed_banner_url text,
  login_banner_url text,
  course_banner_url text,
  courses_banner_url text,
  spaces_banner_url text,
  challenges_banner_url text,
  bank_banner_url text,
  store_banner_url text,
  marketplace_banner_url text,
  ranking_banner_url text,
  members_banner_url text,
  trails_banner_url text,
  coin_name text,
  plan text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
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
  
  -- Return complete company details
  RETURN QUERY
  SELECT c.id, c.name, c.subdomain, c.custom_domain, c.custom_domain_status,
         c.custom_domain_verified_at, c.logo_url, c.status, c.theme_config, c.enabled_features,
         c.favicon_url, c.primary_color, c.button_text_color, c.text_color, c.theme_mode,
         c.feed_banner_url, c.login_banner_url, c.course_banner_url, c.courses_banner_url,
         c.spaces_banner_url, c.challenges_banner_url, c.bank_banner_url, c.store_banner_url,
         c.marketplace_banner_url, c.ranking_banner_url, c.members_banner_url, c.trails_banner_url,
         c.coin_name, c.plan, c.created_at, c.updated_at
  FROM public.companies c
  WHERE c.id = p_company_id;
END;
$function$;