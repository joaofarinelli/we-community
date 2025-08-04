-- Create a function to set the current company context
CREATE OR REPLACE FUNCTION public.set_current_company_context(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Verify the user has access to this company
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND company_id = p_company_id 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'User does not have access to company %', p_company_id;
    END IF;
    
    -- Set the company context for the session
    PERFORM set_config('app.current_company_id', p_company_id::text, true);
END;
$$;