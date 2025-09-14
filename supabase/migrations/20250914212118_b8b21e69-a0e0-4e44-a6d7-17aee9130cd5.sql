-- Add policy for admins and owners to view all courses in their company
CREATE POLICY "Admins can view all courses in their company" 
ON public.courses 
FOR SELECT 
USING ((company_id = get_user_company_id()) AND (is_company_admin() OR is_company_owner()));