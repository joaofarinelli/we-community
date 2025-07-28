-- First, let's check if we need to create the super_admins table
-- Create super_admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.super_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage super admins
CREATE POLICY "Super admins can manage super admins" 
ON public.super_admins 
FOR ALL 
USING (public.is_super_admin());

-- Add updated_at trigger
CREATE TRIGGER update_super_admins_updated_at
  BEFORE UPDATE ON public.super_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get all super admins
CREATE OR REPLACE FUNCTION public.get_all_super_admins()
RETURNS TABLE(id uuid, user_id uuid, email text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow super admins to call this function
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  RETURN QUERY
  SELECT sa.id, sa.user_id, sa.email, sa.is_active, sa.created_at, sa.updated_at
  FROM public.super_admins sa
  ORDER BY sa.created_at DESC;
END;
$$;

-- Create function to add super admin
CREATE OR REPLACE FUNCTION public.add_super_admin(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
  result jsonb;
BEGIN
  -- Only allow super admins to call this function
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  -- Get user ID from auth.users using email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = p_email;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found with this email');
  END IF;

  -- Check if already a super admin
  IF EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = target_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already a super admin');
  END IF;

  -- Add as super admin
  INSERT INTO public.super_admins (user_id, email, created_by)
  VALUES (target_user_id, p_email, auth.uid());

  RETURN jsonb_build_object('success', true, 'message', 'Super admin added successfully');
END;
$$;

-- Create function to remove super admin
CREATE OR REPLACE FUNCTION public.remove_super_admin(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow super admins to call this function
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  -- Prevent removing yourself
  IF p_user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot remove yourself as super admin');
  END IF;

  -- Check if user is a super admin
  IF NOT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = p_user_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is not an active super admin');
  END IF;

  -- Remove super admin (set inactive)
  UPDATE public.super_admins 
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Super admin removed successfully');
END;
$$;