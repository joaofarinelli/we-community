-- Secure the public.profiles table with proper RLS
-- 1) Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) Restrict SELECT to authenticated users within their current company context
CREATE POLICY "Users can view profiles in their company"
ON public.profiles
FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id());

-- 3) Allow users to update only their own profile within the same company
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (company_id = public.get_user_company_id() AND user_id = auth.uid())
WITH CHECK (company_id = public.get_user_company_id() AND user_id = auth.uid());

-- 4) Allow company owners/admins to update any profiles within their company
CREATE POLICY "Company owners/admins can update profiles in their company"
ON public.profiles
FOR UPDATE
TO authenticated
USING (company_id = public.get_user_company_id() AND public.is_company_owner())
WITH CHECK (company_id = public.get_user_company_id() AND public.is_company_owner());

-- 5) Allow company owners/admins to delete profiles within their company (if needed by admin tools)
CREATE POLICY "Company owners/admins can delete profiles in their company"
ON public.profiles
FOR DELETE
TO authenticated
USING (company_id = public.get_user_company_id() AND public.is_company_owner());