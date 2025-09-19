-- Add WITH CHECK clause to the UPDATE policy for payment_provider_configs
DROP POLICY IF EXISTS "Company admins can update payment provider configs" ON public.payment_provider_configs;

CREATE POLICY "Company admins can update payment provider configs" 
ON public.payment_provider_configs 
FOR UPDATE 
USING (company_id = get_user_company_id() AND is_company_admin())
WITH CHECK (company_id = get_user_company_id() AND is_company_admin());