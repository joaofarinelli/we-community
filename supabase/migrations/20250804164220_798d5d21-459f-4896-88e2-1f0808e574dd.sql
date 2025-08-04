-- Update the existing get_user_company_id function to handle context better
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result_company_id uuid;
    context_company_id uuid;
BEGIN
    -- Try to get company ID from session context (set by application)
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
            -- Ignore context setting errors
            NULL;
    END;
    
    -- Fallback: return the first company the user has access to
    SELECT company_id INTO result_company_id
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;
    
    RETURN result_company_id;
END;
$$;