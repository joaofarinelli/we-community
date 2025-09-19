-- Add UPDATE policy for payment_provider_configs table
CREATE POLICY "Company admins can update payment provider configs" 
ON public.payment_provider_configs 
FOR UPDATE 
USING (company_id = get_user_company_id() AND is_company_admin());