-- Remove duplicate versions of get_company_users_with_filters function
-- Keep only the canonical version with proper parameter naming

-- Drop the version with different parameter types/names
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(uuid, text, text[], text[], text[], text);

-- Drop any other conflicting versions
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(text, text, text[], text[], text[], text);

-- Drop version with different parameter signature
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(uuid, text, text[], text[], text[]);