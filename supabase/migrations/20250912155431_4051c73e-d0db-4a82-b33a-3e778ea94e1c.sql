-- Clean up overloaded duplicates of get_company_users_with_filters, keep the canonical UUID/timestamptz version

-- Drop legacy variant (no level/badge filters, date types)
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(
  uuid, text, text[], uuid[], date, date, uuid[], integer, integer
);

-- Drop incorrect TEXT-based variant
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(
  uuid, text, text[], text[], text, text, text[], text[], text[], integer, integer
);

-- Drop context-based variant without company_id (uses get_user_company_id)
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(
  text, text[], text[], timestamp with time zone, timestamp with time zone, uuid[], uuid[], uuid[], integer, integer
);

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';