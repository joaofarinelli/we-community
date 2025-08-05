-- Fix get_user_company_id function for multi-company users
CREATE OR REPLACE FUNCTION public.get_user_company_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result_company_id uuid;
    context_company_id uuid;
    user_companies uuid[];
    profile_company_id uuid;
BEGIN
    -- First, try to get company ID from session context
    BEGIN
        context_company_id := current_setting('app.current_company_id', true)::uuid;
        
        -- If context is set, verify user has access and return it
        IF context_company_id IS NOT NULL THEN
            SELECT company_id INTO result_company_id
            FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND company_id = context_company_id 
            AND is_active = true;
            
            IF result_company_id IS NOT NULL THEN
                RAISE LOG 'get_user_company_id: Using context company % for user %', context_company_id, auth.uid();
                RETURN result_company_id;
            ELSE
                RAISE LOG 'get_user_company_id: Context company % not accessible to user %', context_company_id, auth.uid();
            END IF;
        END IF;
    EXCEPTION
        WHEN others THEN
            RAISE LOG 'get_user_company_id: Error getting context: %', SQLERRM;
    END;
    
    -- Get the first active profile for the user (fallback for single company users)
    SELECT company_id INTO profile_company_id
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- For multi-company users, we need context to be set properly
    -- Check if user has multiple companies
    SELECT array_agg(company_id) INTO user_companies
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true;
    
    IF array_length(user_companies, 1) > 1 THEN
        RAISE LOG 'get_user_company_id: Multi-company user % without proper context. Companies: %', auth.uid(), user_companies;
        -- For multi-company users, return the first company but log the issue
        RETURN profile_company_id;
    END IF;
    
    -- Single company user - return that company
    IF profile_company_id IS NOT NULL THEN
        RAISE LOG 'get_user_company_id: Single company user %, returning %', auth.uid(), profile_company_id;
        RETURN profile_company_id;
    END IF;
    
    -- No companies found
    RAISE LOG 'get_user_company_id: No accessible companies found for user %', auth.uid();
    RETURN NULL;
END;
$function$;