-- Update get_user_company_id to honor x-company-id header for multi-company users
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    result_company_id uuid;
    context_company_id uuid;
    user_companies uuid[];
    profile_company_id uuid;
    header_json json;
    header_company_id uuid;
BEGIN
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
                WHERE user_id = auth.uid() 
                  AND company_id = header_company_id 
                  AND is_active = true
                LIMIT 1;

                IF result_company_id IS NOT NULL THEN
                    RAISE LOG 'get_user_company_id: Using x-company-id header % for user %', result_company_id, auth.uid();
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

    -- 3) Fallbacks for single-company users
    SELECT company_id INTO profile_company_id
    FROM public.profiles 
    WHERE user_id = auth.uid() 
      AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;

    SELECT array_agg(company_id) INTO user_companies
    FROM public.profiles 
    WHERE user_id = auth.uid() 
      AND is_active = true;

    IF array_length(user_companies, 1) > 1 THEN
        RAISE LOG 'get_user_company_id: Multi-company user % without proper context. Companies: %', auth.uid(), user_companies;
        RETURN profile_company_id;
    END IF;

    IF profile_company_id IS NOT NULL THEN
        RAISE LOG 'get_user_company_id: Single company user %, returning %', auth.uid(), profile_company_id;
        RETURN profile_company_id;
    END IF;

    RAISE LOG 'get_user_company_id: No accessible companies found for user %', auth.uid();
    RETURN NULL;
END;
$function$;