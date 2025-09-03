-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Company owners can update their company" ON public.companies;

-- Create new policy that allows both owners and admins to update companies
CREATE POLICY "Company owners and admins can update their company"
ON public.companies
FOR UPDATE
USING (
  id = get_user_company_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = companies.id
      AND p.role IN ('owner', 'admin')
      AND p.is_active = true
  )
)
WITH CHECK (
  id = get_user_company_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = companies.id
      AND p.role IN ('owner', 'admin')
      AND p.is_active = true
  )
);