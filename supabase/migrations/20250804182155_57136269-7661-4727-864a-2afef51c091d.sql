-- Improve set_current_company_context function with better error handling
CREATE OR REPLACE FUNCTION public.set_current_company_context(p_company_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RAISE LOG 'set_current_company_context: Called with company_id %', p_company_id;
    
    -- Verify the user has access to this company
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND company_id = p_company_id 
        AND is_active = true
    ) THEN
        RAISE LOG 'set_current_company_context: User % does not have access to company %', auth.uid(), p_company_id;
        RAISE EXCEPTION 'User does not have access to company %', p_company_id;
    END IF;
    
    -- Set the company context for the session
    PERFORM set_config('app.current_company_id', p_company_id::text, true);
    
    RAISE LOG 'set_current_company_context: Successfully set context for company % for user %', p_company_id, auth.uid();
    
    -- Verify the context was set correctly
    DECLARE
        check_context_id uuid;
    BEGIN
        check_context_id := current_setting('app.current_company_id', true)::uuid;
        IF check_context_id != p_company_id THEN
            RAISE LOG 'set_current_company_context: Context verification failed. Expected %, got %', p_company_id, check_context_id;
            RAISE EXCEPTION 'Failed to set company context properly';
        END IF;
        RAISE LOG 'set_current_company_context: Context verification successful';
    EXCEPTION
        WHEN others THEN
            RAISE LOG 'set_current_company_context: Context verification error: %', SQLERRM;
            RAISE EXCEPTION 'Failed to verify company context';
    END;
END;
$function$;