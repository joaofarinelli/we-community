-- Fix the find_company_by_domain function to properly handle subdomains
CREATE OR REPLACE FUNCTION public.find_company_by_domain(p_domain text)
 RETURNS TABLE(id uuid, name text, subdomain text, custom_domain text, custom_domain_status text, status text, logo_url text, primary_color text, text_color text, button_text_color text, coin_name text, enabled_features jsonb, theme_mode text, login_banner_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  normalized_domain text;
  extracted_subdomain text;
BEGIN
  -- Normalize domain: lowercase and remove www. prefix
  normalized_domain := lower(p_domain);
  normalized_domain := regexp_replace(normalized_domain, '^www\.', '', 'i');
  
  -- Extract subdomain if domain ends with known base domains
  extracted_subdomain := NULL;
  
  IF normalized_domain ~ '\.weplataforma\.com\.br$' THEN
    extracted_subdomain := regexp_replace(normalized_domain, '\.weplataforma\.com\.br$', '');
  ELSIF normalized_domain ~ '\.yourplatform\.com$' THEN
    extracted_subdomain := regexp_replace(normalized_domain, '\.yourplatform\.com$', '');
  END IF;
  
  -- Log for debugging
  RAISE LOG 'find_company_by_domain: original=%, normalized=%, extracted_subdomain=%', p_domain, normalized_domain, extracted_subdomain;
  
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
    -- Match by custom domain (exact match)
    c.custom_domain = normalized_domain
    OR c.custom_domain = ('www.' || normalized_domain)
    -- Match by extracted subdomain if we found one
    OR (extracted_subdomain IS NOT NULL AND c.subdomain = extracted_subdomain)
    -- Direct subdomain match (for cases like direct subdomain access)
    OR c.subdomain = normalized_domain
  )
  ORDER BY 
    -- Prioritize custom domain matches first
    CASE WHEN c.custom_domain = normalized_domain OR c.custom_domain = ('www.' || normalized_domain) THEN 1 ELSE 2 END,
    c.created_at DESC
  LIMIT 1;
END;
$function$