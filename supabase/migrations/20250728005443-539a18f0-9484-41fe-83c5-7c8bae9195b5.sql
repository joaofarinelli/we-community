-- Create super_admins table
CREATE TABLE public.super_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins 
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;

-- Function to get all companies for super admin
CREATE OR REPLACE FUNCTION public.get_all_companies_for_super_admin()
RETURNS TABLE(
  id UUID,
  name TEXT,
  subdomain TEXT,
  custom_domain TEXT,
  status TEXT,
  plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  total_users BIGINT,
  total_spaces BIGINT,
  total_posts BIGINT
)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow super admins to call this function
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.subdomain,
    c.custom_domain,
    c.status,
    c.plan,
    c.created_at,
    COALESCE(p.user_count, 0) as total_users,
    COALESCE(s.space_count, 0) as total_spaces,
    COALESCE(po.post_count, 0) as total_posts
  FROM public.companies c
  LEFT JOIN (
    SELECT company_id, COUNT(*) as user_count
    FROM public.profiles
    WHERE is_active = true
    GROUP BY company_id
  ) p ON p.company_id = c.id
  LEFT JOIN (
    SELECT company_id, COUNT(*) as space_count
    FROM public.spaces
    GROUP BY company_id
  ) s ON s.company_id = c.id
  LEFT JOIN (
    SELECT company_id, COUNT(*) as post_count
    FROM public.posts
    GROUP BY company_id
  ) po ON po.company_id = c.id
  ORDER BY c.created_at DESC;
END;
$$;

-- Function to get global metrics for super admin
CREATE OR REPLACE FUNCTION public.get_global_metrics_for_super_admin()
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  -- Only allow super admins to call this function
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  SELECT json_build_object(
    'total_companies', (SELECT COUNT(*) FROM public.companies),
    'active_companies', (SELECT COUNT(*) FROM public.companies WHERE status = 'active'),
    'total_users', (SELECT COUNT(*) FROM public.profiles WHERE is_active = true),
    'total_spaces', (SELECT COUNT(*) FROM public.spaces),
    'total_posts', (SELECT COUNT(*) FROM public.posts),
    'companies_this_month', (
      SELECT COUNT(*) 
      FROM public.companies 
      WHERE created_at >= date_trunc('month', current_date)
    ),
    'users_this_month', (
      SELECT COUNT(*) 
      FROM public.profiles 
      WHERE created_at >= date_trunc('month', current_date) AND is_active = true
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- RLS policies for super_admins table
CREATE POLICY "Only super admins can view super admins"
ON public.super_admins
FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Only super admins can manage super admins"
ON public.super_admins
FOR ALL
USING (public.is_super_admin());

-- Allow super admins to view all companies without restrictions
CREATE POLICY "Super admins can view all companies"
ON public.companies
FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Super admins can manage all companies"
ON public.companies
FOR ALL
USING (public.is_super_admin());

-- Allow super admins to view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Super admins can manage all profiles"
ON public.profiles
FOR ALL
USING (public.is_super_admin());

-- Trigger for updated_at
CREATE TRIGGER update_super_admins_updated_at
  BEFORE UPDATE ON public.super_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();