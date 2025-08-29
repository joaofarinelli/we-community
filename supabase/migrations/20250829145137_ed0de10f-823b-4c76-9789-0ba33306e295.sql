-- Melhorar a função get_user_company_id para ser mais robusta
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
    header_json jsonb;
    header_company_id uuid;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE LOG 'get_user_company_id: No authenticated user';
        RETURN NULL;
    END IF;

    -- 1) Prioritize request header `x-company-id` first
    BEGIN
        header_json := current_setting('request.headers', true)::jsonb;
        IF header_json ? 'x-company-id' THEN
            BEGIN
                header_company_id := (header_json ->> 'x-company-id')::uuid;
                
                -- Validate that user has access to this company
                SELECT company_id INTO result_company_id
                FROM public.profiles 
                WHERE user_id = current_user_id 
                  AND company_id = header_company_id 
                  AND is_active = true
                LIMIT 1;

                IF result_company_id IS NOT NULL THEN
                    RAISE LOG 'get_user_company_id: Using x-company-id header % for user %', result_company_id, current_user_id;
                    RETURN result_company_id;
                ELSE
                    RAISE LOG 'get_user_company_id: Header company % not accessible to user %', header_company_id, current_user_id;
                END IF;
            EXCEPTION WHEN others THEN
                RAISE LOG 'get_user_company_id: Error parsing header company_id: %', SQLERRM;
            END;
        END IF;
    EXCEPTION WHEN others THEN
        RAISE LOG 'get_user_company_id: Error reading request.headers: %', SQLERRM;
    END;

    -- 2) Try session context as secondary option
    BEGIN
        context_company_id := NULLIF(current_setting('app.current_company_id', true), '')::uuid;
        IF context_company_id IS NOT NULL THEN
            SELECT company_id INTO result_company_id
            FROM public.profiles 
            WHERE user_id = current_user_id 
              AND company_id = context_company_id 
              AND is_active = true
            LIMIT 1;

            IF result_company_id IS NOT NULL THEN
                RAISE LOG 'get_user_company_id: Using context company % for user %', context_company_id, current_user_id;
                RETURN result_company_id;
            ELSE
                RAISE LOG 'get_user_company_id: Context company % not accessible to user %', context_company_id, current_user_id;
            END IF;
        ELSE
            RAISE LOG 'get_user_company_id: No valid context company set for user %', current_user_id;
        END IF;
    EXCEPTION
        WHEN others THEN
            RAISE LOG 'get_user_company_id: Error getting context: %', SQLERRM;
    END;

    -- 3) Get user companies to determine best fallback
    SELECT array_agg(company_id ORDER BY created_at DESC) INTO user_companies
    FROM public.profiles 
    WHERE user_id = current_user_id 
      AND is_active = true;

    RAISE LOG 'get_user_company_id: User % has companies: %', current_user_id, user_companies;

    -- For multi-company users without context, this is a critical error
    IF array_length(user_companies, 1) > 1 THEN
        RAISE LOG 'get_user_company_id: CRITICAL - Multi-company user % without proper context. Companies: %', current_user_id, user_companies;
        -- Use most recent company as fallback but log this as critical
        profile_company_id := user_companies[1];
    ELSIF array_length(user_companies, 1) = 1 THEN
        -- Single company user - use their only company
        profile_company_id := user_companies[1];
    ELSE
        RAISE LOG 'get_user_company_id: No accessible companies found for user %', current_user_id;
        RETURN NULL;
    END IF;

    IF profile_company_id IS NOT NULL THEN
        RAISE LOG 'get_user_company_id: Fallback company % for user %', profile_company_id, current_user_id;
    END IF;

    RETURN profile_company_id;
END;
$function$;