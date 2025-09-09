-- Create RPC function for public certificate verification
CREATE OR REPLACE FUNCTION public.verify_certificate(p_certificate_code text)
RETURNS TABLE(
  course_title text,
  user_name text,
  duration_minutes integer,
  issued_at timestamp with time zone,
  company_name text,
  mentor_name text,
  mentor_role text,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ucc.course_title,
    COALESCE(p.first_name || ' ' || p.last_name, 'Usuário') as user_name,
    ucc.duration_minutes,
    ucc.issued_at,
    c.name as company_name,
    ucc.mentor_name,
    ucc.mentor_role,
    true as is_valid
  FROM public.user_course_certificates ucc
  JOIN public.companies c ON c.id = ucc.company_id
  LEFT JOIN public.profiles p ON p.user_id = ucc.user_id AND p.company_id = ucc.company_id
  WHERE ucc.certificate_code = p_certificate_code
  AND c.status = 'active'
  LIMIT 1;
END;
$$;