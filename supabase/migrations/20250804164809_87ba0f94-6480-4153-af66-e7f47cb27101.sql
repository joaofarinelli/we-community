-- Improve the get_user_company_id function to better handle multi-company context
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result_company_id uuid;
    context_company_id uuid;
    user_companies uuid[];
BEGIN
    -- Try to get company ID from session context first
    BEGIN
        context_company_id := current_setting('app.current_company_id', true)::uuid;
        
        -- Verify user has access to this company
        IF context_company_id IS NOT NULL THEN
            SELECT company_id INTO result_company_id
            FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND company_id = context_company_id 
            AND is_active = true;
            
            IF result_company_id IS NOT NULL THEN
                RETURN result_company_id;
            END IF;
        END IF;
    EXCEPTION
        WHEN others THEN
            -- Ignore context setting errors and continue to fallback
            NULL;
    END;
    
    -- Get all companies user has access to
    SELECT array_agg(company_id) INTO user_companies
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true;
    
    -- If user has access to multiple companies but no context is set,
    -- we need to return NULL to force the application to set context properly
    IF array_length(user_companies, 1) > 1 AND context_company_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Fallback: return the first company if user only has one
    IF array_length(user_companies, 1) = 1 THEN
        RETURN user_companies[1];
    END IF;
    
    -- If no companies found, return NULL
    RETURN NULL;
END;
$$;