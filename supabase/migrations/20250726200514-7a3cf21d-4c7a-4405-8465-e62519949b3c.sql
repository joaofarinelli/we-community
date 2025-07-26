-- Drop and recreate the get_user_companies function to include company logo_url
DROP FUNCTION IF EXISTS public.get_user_companies(uuid);

CREATE OR REPLACE FUNCTION public.get_user_companies(p_user_id uuid)
RETURNS TABLE(
    company_id uuid, 
    company_name text, 
    company_subdomain text, 
    company_custom_domain text, 
    company_logo_url text,
    user_role text, 
    profile_created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.subdomain, c.custom_domain, c.logo_url, p.role, p.created_at
    FROM public.profiles p
    JOIN public.companies c ON c.id = p.company_id
    WHERE p.user_id = p_user_id AND p.is_active = true
    ORDER BY p.created_at DESC;
END;
$function$;