-- Create missing INSERT policy for payment_provider_configs table
CREATE POLICY "Company admins can create payment provider configs" 
ON public.payment_provider_configs 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND is_company_admin() AND created_by = auth.uid());