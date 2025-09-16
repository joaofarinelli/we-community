-- Drop and recreate the find_company_by_domain function to include theme_mode and login_banner_url
DROP FUNCTION IF EXISTS public.find_company_by_domain(text);

CREATE OR REPLACE FUNCTION public.find_company_by_domain(p_domain text)
 RETURNS TABLE(id uuid, name text, subdomain text, custom_domain text, custom_domain_status text, status text, logo_url text, primary_color text, text_color text, button_text_color text, coin_name text, enabled_features jsonb, theme_mode text, login_banner_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
    c.enabled_features,
    c.theme_mode,
    c.login_banner_url
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