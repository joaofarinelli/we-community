-- Drop the old overloaded function signature that's causing PGRST23 error
-- This removes the version with uuid[] and timestamptz parameters
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(uuid, text, text[], uuid[], timestamptz, timestamptz, uuid[], uuid[], uuid[], integer, integer);

-- Drop any other potential overloaded versions to ensure clean state
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(uuid, text, uuid[], uuid[], text, text, uuid[], uuid[], uuid[], integer, integer);

-- The correct function signature with text[] parameters should remain
-- This ensures PostgREST can unambiguously resolve the function call