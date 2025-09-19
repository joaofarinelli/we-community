-- Create RLS policies for payment_provider_configs table
CREATE POLICY "Company admins can view payment provider configs" 
ON public.payment_provider_configs 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_admin());

CREATE POLICY "Company admins can create payment provider configs" 
ON public.payment_provider_configs 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id() AND is_company_admin() AND created_by = auth.uid());

CREATE POLICY "Company admins can update payment provider configs" 
ON public.payment_provider_configs 
FOR UPDATE 
USING (company_id = get_user_company_id() AND is_company_admin());

-- Create RLS policies for payments table  
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Company owners can view all payments" 
ON public.payments 
FOR SELECT 
USING (company_id = get_user_company_id() AND is_company_owner());

CREATE POLICY "System can create payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "System can update payments" 
ON public.payments 
FOR UPDATE 
USING (company_id = get_user_company_id());