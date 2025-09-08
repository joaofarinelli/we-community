-- Fix search path for security functions
CREATE OR REPLACE FUNCTION public.get_bulk_action_targets(
  p_company_id UUID,
  p_audience_config JSONB
)
RETURNS TABLE(user_id UUID, first_name TEXT, last_name TEXT, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
BEGIN
  -- If specific users selected
  IF p_audience_config ? 'selected_users' THEN
    RETURN QUERY
    SELECT p.user_id, p.first_name, p.last_name, p.email
    FROM public.profiles p
    WHERE p.company_id = p_company_id
      AND p.is_active = true
      AND p.user_id = ANY(
        (SELECT jsonb_array_elements_text(p_audience_config->'selected_users'))::UUID[]
      );
    RETURN;
  END IF;

  -- Use filters from audience_config
  RETURN QUERY
  SELECT * FROM public.get_company_users_with_filters(
    p_filters => COALESCE(p_audience_config->'filters', '{}'),
    p_limit => 10000,
    p_offset => 0
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.preview_bulk_action(
  p_company_id UUID,
  p_audience_config JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
DECLARE
  target_count INTEGER;
BEGIN
  -- Check permissions
  IF NOT (get_user_company_id() = p_company_id AND is_company_owner()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Count targets
  SELECT COUNT(*) INTO target_count
  FROM public.get_bulk_action_targets(p_company_id, p_audience_config);

  RETURN jsonb_build_object(
    'target_count', target_count,
    'estimated_processing_time', target_count * 0.1 -- seconds
  );
END;
$$;