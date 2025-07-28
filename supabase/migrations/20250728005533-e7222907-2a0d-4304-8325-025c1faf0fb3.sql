-- Fix security issue: Set search_path for functions that don't have it set

-- Update is_super_admin function to have proper search_path
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