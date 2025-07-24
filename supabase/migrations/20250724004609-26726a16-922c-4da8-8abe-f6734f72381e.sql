-- Add is_active column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create index for better performance on active user queries
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- Update RLS policies to check if user is active
-- This function will be used in the AuthGuard to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(is_active, true) 
  FROM public.profiles 
  WHERE user_id = auth.uid();
$$;