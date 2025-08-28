-- Melhorar a função get_user_company_id para lidar melhor com usuários multi-empresa
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result_company_id uuid;
    context_company_id uuid;
    user_companies uuid[];
    profile_company_id uuid;
    header_json json;
    header_company_id uuid;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE LOG 'get_user_company_id: No authenticated user';
        RETURN NULL;
    END IF;

    -- 1) Try to read company from request header `x-company-id`
    BEGIN
        header_json := current_setting('request.headers', true)::json;
        IF header_json ? 'x-company-id' THEN
            BEGIN
                header_company_id := (header_json ->> 'x-company-id')::uuid;
            EXCEPTION WHEN others THEN
                header_company_id := NULL;
            END;

            IF header_company_id IS NOT NULL THEN
                SELECT company_id INTO result_company_id
                FROM public.profiles 
                WHERE user_id = current_user_id 
                  AND company_id = header_company_id 
                  AND is_active = true
                LIMIT 1;

                IF result_company_id IS NOT NULL THEN
                    RAISE LOG 'get_user_company_id: Using x-company-id header % for user %', result_company_id, current_user_id;
                    RETURN result_company_id;
                END IF;
            END IF;
        END IF;
    EXCEPTION WHEN others THEN
        RAISE LOG 'get_user_company_id: Error reading request.headers: %', SQLERRM;
    END;

    -- 2) Fallback to app.current_company_id (set via set_current_company_context)
    BEGIN
        context_company_id := current_setting('app.current_company_id', true)::uuid;
        IF context_company_id IS NOT NULL THEN
            SELECT company_id INTO result_company_id
            FROM public.profiles 
            WHERE user_id = current_user_id 
              AND company_id = context_company_id 
              AND is_active = true;

            IF result_company_id IS NOT NULL THEN
                RAISE LOG 'get_user_company_id: Using context company % for user %', context_company_id, current_user_id;
                RETURN result_company_id;
            ELSE
                RAISE LOG 'get_user_company_id: Context company % not accessible to user %', context_company_id, current_user_id;
            END IF;
        ELSE
            RAISE LOG 'get_user_company_id: No context company set for user %', current_user_id;
        END IF;
    EXCEPTION
        WHEN others THEN
            RAISE LOG 'get_user_company_id: Error getting context: %', SQLERRM;
    END;

    -- 3) Get user companies to determine best fallback
    SELECT array_agg(company_id) INTO user_companies
    FROM public.profiles 
    WHERE user_id = current_user_id 
      AND is_active = true;

    RAISE LOG 'get_user_company_id: User % has companies: %', current_user_id, user_companies;

    -- If user has multiple companies but no context, this is a problem
    IF array_length(user_companies, 1) > 1 THEN
        RAISE LOG 'get_user_company_id: CRITICAL - Multi-company user % without proper context. Companies: %', current_user_id, user_companies;
        -- For multi-company users without context, return the most recently created profile
        SELECT company_id INTO profile_company_id
        FROM public.profiles 
        WHERE user_id = current_user_id 
          AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1;
        
        IF profile_company_id IS NOT NULL THEN
            RAISE LOG 'get_user_company_id: Multi-company fallback for user %, using most recent company %', current_user_id, profile_company_id;
        END IF;
    ELSE
        -- Single company user - use their only company
        SELECT company_id INTO profile_company_id
        FROM public.profiles 
        WHERE user_id = current_user_id 
          AND is_active = true
        LIMIT 1;
        
        IF profile_company_id IS NOT NULL THEN
            RAISE LOG 'get_user_company_id: Single company user %, returning %', current_user_id, profile_company_id;
        END IF;
    END IF;

    IF profile_company_id IS NULL THEN
        RAISE LOG 'get_user_company_id: No accessible companies found for user %', current_user_id;
    END IF;

    RETURN profile_company_id;
END;
$$;

-- Melhorar a função de debug para incluir mais informações sobre usuários multi-empresa
CREATE OR REPLACE FUNCTION public.debug_space_creation_context()
RETURNS TABLE (
    auth_user_id uuid,
    company_context uuid,
    is_owner boolean,
    profile_exists boolean,
    user_companies_count bigint,
    user_companies uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid := auth.uid();
    current_company uuid := get_user_company_id();
BEGIN
    RETURN QUERY
    SELECT 
        current_user_id as auth_user_id,
        current_company as company_context,
        is_company_owner() as is_owner,
        EXISTS(
            SELECT 1 FROM profiles 
            WHERE user_id = current_user_id 
            AND company_id = current_company
            AND is_active = true
        ) as profile_exists,
        (
            SELECT COUNT(*) FROM profiles 
            WHERE user_id = current_user_id 
            AND is_active = true
        ) as user_companies_count,
        (
            SELECT array_agg(company_id) FROM profiles 
            WHERE user_id = current_user_id 
            AND is_active = true
        ) as user_companies;
END;
$$;