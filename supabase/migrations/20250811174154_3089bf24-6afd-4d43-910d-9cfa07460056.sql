-- Make profiles RLS policies idempotent: drop existing and recreate with secure definitions
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Company owners/admins can update profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Company owners/admins can delete profiles in their company" ON public.profiles;

-- Recreate policies with strict company scoping
CREATE POLICY "Users can view profiles in their company"
ON public.profiles
FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (company_id = public.get_user_company_id() AND user_id = auth.uid())
WITH CHECK (company_id = public.get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners/admins can update profiles in their company"
ON public.profiles
FOR UPDATE
TO authenticated
USING (company_id = public.get_user_company_id() AND public.is_company_owner())
WITH CHECK (company_id = public.get_user_company_id() AND public.is_company_owner());

CREATE POLICY "Company owners/admins can delete profiles in their company"
ON public.profiles
FOR DELETE
TO authenticated
USING (company_id = public.get_user_company_id() AND public.is_company_owner());