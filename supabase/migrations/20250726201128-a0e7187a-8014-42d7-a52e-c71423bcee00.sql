-- Create a function to get company access for cross-domain scenarios
CREATE OR REPLACE FUNCTION public.get_user_accessible_companies(p_user_email text)
RETURNS TABLE(
  company_id uuid,
  company_name text,
  company_subdomain text,
  company_custom_domain text,
  company_logo_url text,
  user_role text,
  profile_created_at timestamp with time zone,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.subdomain, c.custom_domain, c.logo_url, p.role, p.created_at, p.user_id
    FROM public.profiles p
    JOIN public.companies c ON c.id = p.company_id
    WHERE p.email = p_user_email AND p.is_active = true
    ORDER BY p.created_at DESC;
END;
$$;