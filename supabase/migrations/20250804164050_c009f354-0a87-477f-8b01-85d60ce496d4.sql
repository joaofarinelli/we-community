-- Drop and recreate the get_user_company_id function to handle company context properly
DROP FUNCTION IF EXISTS public.get_user_company_id();

-- Create an improved version that can accept a company_id parameter for context
CREATE OR REPLACE FUNCTION public.get_user_company_id_for_context(p_company_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result_company_id uuid;
BEGIN
    -- If company_id is provided, verify user has profile in that company
    IF p_company_id IS NOT NULL THEN
        SELECT company_id INTO result_company_id
        FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND company_id = p_company_id 
        AND is_active = true;
        
        IF result_company_id IS NOT NULL THEN
            RETURN result_company_id;
        END IF;
    END IF;
    
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

-- Keep the original function for backward compatibility but improve it
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    -- Get the company ID from current context or first available company
    SELECT COALESCE(
        -- Try to get from session context first (if set by app)
        current_setting('app.current_company_id', true)::uuid,
        -- Fallback to first company user has access to
        (SELECT company_id FROM public.profiles WHERE user_id = auth.uid() AND is_active = true ORDER BY created_at ASC LIMIT 1)
    );
$$;