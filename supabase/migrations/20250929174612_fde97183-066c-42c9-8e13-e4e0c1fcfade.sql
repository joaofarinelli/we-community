-- Fix RLS policies for user_custom_profile_data to allow users to manage their own data

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can insert their own custom profile data" ON public.user_custom_profile_data;
DROP POLICY IF EXISTS "Users can update their own custom profile data" ON public.user_custom_profile_data;

-- Allow users to insert their own custom profile data
CREATE POLICY "Users can insert their own custom profile data"
ON public.user_custom_profile_data
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND company_id = get_user_company_id()
);

-- Allow users to update their own custom profile data
CREATE POLICY "Users can update their own custom profile data"
ON public.user_custom_profile_data
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  AND company_id = get_user_company_id()
)
WITH CHECK (
  user_id = auth.uid() 
  AND company_id = get_user_company_id()
);