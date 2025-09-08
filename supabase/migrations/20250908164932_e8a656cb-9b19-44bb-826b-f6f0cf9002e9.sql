-- Create or replace RPC functions for bulk action audience and user filtering

-- Clean up potential conflicting signatures
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(jsonb, integer, integer);
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(
  uuid, text, text[], uuid[], timestamptz, timestamptz, uuid[], uuid[], uuid[], integer, integer
);
DROP FUNCTION IF EXISTS public.get_bulk_action_targets(uuid, jsonb);
DROP FUNCTION IF EXISTS public.preview_bulk_action(uuid, jsonb);

-- Canonical function to fetch company users with filters
CREATE OR REPLACE FUNCTION public.get_company_users_with_filters(
  p_company_id uuid,
  p_search text DEFAULT NULL,
  p_roles text[] DEFAULT NULL,
  p_tag_ids uuid[] DEFAULT NULL,
  p_joined_start timestamptz DEFAULT NULL,
  p_joined_end timestamptz DEFAULT NULL,
  p_course_ids uuid[] DEFAULT NULL,
  p_level_ids uuid[] DEFAULT NULL,
  p_badge_ids uuid[] DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  role text,
  joined_at timestamptz,
  tag_ids uuid[],
  tag_names text[],
  posts_count integer,
  courses_count integer,
  level_id uuid,
  level_name text,
  level_color text,
  badge_ids uuid[],
  badge_names text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permission: only owners/admins of the company can query
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = p_company_id
      AND p.role IN ('owner','admin')
      AND p.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT p.*
    FROM public.profiles p
    WHERE p.company_id = p_company_id
      AND p.is_active = true
      AND (
        p_search IS NULL OR (
          p.first_name ILIKE '%' || p_search || '%'
          OR p.last_name ILIKE '%' || p_search || '%'
          OR p.email ILIKE '%' || p_search || '%'
        )
      )
      AND (p_roles IS NULL OR p.role = ANY(p_roles))
      AND (p_joined_start IS NULL OR p.created_at >= p_joined_start)
      AND (p_joined_end IS NULL OR p.created_at <= p_joined_end)
      AND (
        p_tag_ids IS NULL OR EXISTS (
          SELECT 1 FROM public.user_tags ut
          WHERE ut.company_id = p_company_id
            AND ut.user_id = p.user_id
            AND ut.tag_id = ANY(p_tag_ids)
        )
      )
      AND (
        p_level_ids IS NULL OR EXISTS (
          SELECT 1 FROM public.user_current_level ucl
          WHERE ucl.company_id = p_company_id
            AND ucl.user_id = p.user_id
            AND ucl.current_level_id = ANY(p_level_ids)
        )
      )
      AND (
        p_badge_ids IS NULL OR EXISTS (
          SELECT 1 FROM public.user_trail_badges utb
          WHERE utb.company_id = p_company_id
            AND utb.user_id = p.user_id
            AND utb.badge_id = ANY(p_badge_ids)
        )
      )
      AND (
        p_course_ids IS NULL OR EXISTS (
          SELECT 1 FROM public.user_course_access uca
          WHERE uca.company_id = p_company_id
            AND uca.user_id = p.user_id
            AND uca.course_id = ANY(p_course_ids)
        )
      )
    ORDER BY p.created_at DESC
    OFFSET COALESCE(p_offset, 0)
    LIMIT COALESCE(p_limit, 20)
  ),
  level_info AS (
    SELECT ucl.user_id, ucl.current_level_id as level_id, ul.level_name, ul.level_color
    FROM public.user_current_level ucl
    JOIN public.user_levels ul ON ul.id = ucl.current_level_id
    WHERE ucl.company_id = p_company_id
  ),
  tags_agg AS (
    SELECT ut.user_id,
           array_agg(DISTINCT ut.tag_id) AS tag_ids,
           array_agg(DISTINCT t.name)    AS tag_names
    FROM public.user_tags ut
    JOIN public.tags t ON t.id = ut.tag_id
    WHERE ut.company_id = p_company_id
    GROUP BY ut.user_id
  ),
  badges_agg AS (
    SELECT utb.user_id,
           array_agg(DISTINCT utb.badge_id) AS badge_ids,
           array_agg(DISTINCT tb.name)      AS badge_names
    FROM public.user_trail_badges utb
    JOIN public.trail_badges tb ON tb.id = utb.badge_id
    WHERE utb.company_id = p_company_id
    GROUP BY utb.user_id
  ),
  posts_cnt AS (
    SELECT po.user_id, COUNT(*)::int AS posts_count
    FROM public.posts po
    WHERE po.company_id = p_company_id
    GROUP BY po.user_id
  ),
  courses_cnt AS (
    SELECT uca.user_id, COUNT(DISTINCT uca.course_id)::int AS courses_count
    FROM public.user_course_access uca
    WHERE uca.company_id = p_company_id
    GROUP BY uca.user_id
  )
  SELECT 
    b.user_id,
    b.first_name,
    b.last_name,
    b.email,
    b.phone,
    b.role,
    b.created_at AS joined_at,
    COALESCE(t.tag_ids, ARRAY[]::uuid[]) AS tag_ids,
    COALESCE(t.tag_names, ARRAY[]::text[]) AS tag_names,
    COALESCE(pc.posts_count, 0) AS posts_count,
    COALESCE(cc.courses_count, 0) AS courses_count,
    li.level_id,
    li.level_name,
    li.level_color,
    COALESCE(bg.badge_ids, ARRAY[]::uuid[]) AS badge_ids,
    COALESCE(bg.badge_names, ARRAY[]::text[]) AS badge_names
  FROM base b
  LEFT JOIN level_info li ON li.user_id = b.user_id
  LEFT JOIN tags_agg t ON t.user_id = b.user_id
  LEFT JOIN badges_agg bg ON bg.user_id = b.user_id
  LEFT JOIN posts_cnt pc ON pc.user_id = b.user_id
  LEFT JOIN courses_cnt cc ON cc.user_id = b.user_id
  ORDER BY b.created_at DESC;
END;
$$;

-- Function that resolves audience targets (manual vs filters)
CREATE OR REPLACE FUNCTION public.get_bulk_action_targets(
  p_company_id uuid,
  p_audience_config jsonb
)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_users uuid[];
BEGIN
  -- Permission: only owners/admins of the company can query
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = p_company_id
      AND p.role IN ('owner','admin')
      AND p.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Manual selection
  IF p_audience_config ? 'selected_users' THEN
    SELECT array_agg((elem->>0)::uuid)
    INTO selected_users
    FROM (
      SELECT jsonb_array_elements_text(p_audience_config->'selected_users')
    ) s(elem);

    RETURN QUERY
    SELECT pr.user_id, pr.first_name, pr.last_name, pr.email
    FROM public.profiles pr
    WHERE pr.company_id = p_company_id
      AND pr.is_active = true
      AND (selected_users IS NOT NULL AND pr.user_id = ANY(selected_users));

    RETURN;
  END IF;

  -- Filter-based selection
  IF p_audience_config ? 'filters' THEN
    RETURN QUERY
    SELECT guf.user_id, guf.first_name, guf.last_name, guf.email
    FROM public.get_company_users_with_filters(
      p_company_id,
      COALESCE((p_audience_config->'filters'->>'search'), NULL),
      CASE WHEN (p_audience_config->'filters'->'roles') IS NULL THEN NULL
           ELSE ARRAY(SELECT jsonb_array_elements_text(p_audience_config->'filters'->'roles'))::text[] END,
      CASE WHEN (p_audience_config->'filters'->'tagIds') IS NULL THEN NULL
           ELSE ARRAY(SELECT (jsonb_array_elements_text(p_audience_config->'filters'->'tagIds'))::uuid)::uuid[] END,
      CASE WHEN (p_audience_config->'filters'->>'joinedStart') IS NULL THEN NULL
           ELSE (p_audience_config->'filters'->>'joinedStart')::timestamptz END,
      CASE WHEN (p_audience_config->'filters'->>'joinedEnd') IS NULL THEN NULL
           ELSE (p_audience_config->'filters'->>'joinedEnd')::timestamptz END,
      CASE WHEN (p_audience_config->'filters'->'courseIds') IS NULL THEN NULL
           ELSE ARRAY(SELECT (jsonb_array_elements_text(p_audience_config->'filters'->'courseIds'))::uuid)::uuid[] END,
      CASE WHEN (p_audience_config->'filters'->'levelIds') IS NULL THEN NULL
           ELSE ARRAY(SELECT (jsonb_array_elements_text(p_audience_config->'filters'->'levelIds'))::uuid)::uuid[] END,
      CASE WHEN (p_audience_config->'filters'->'badgeIds') IS NULL THEN NULL
           ELSE ARRAY(SELECT (jsonb_array_elements_text(p_audience_config->'filters'->'badgeIds'))::uuid)::uuid[] END,
      10000,  -- large limit for target enumeration
      0
    ) AS guf;

    RETURN;
  END IF;

  -- Default: empty set
  RETURN;
END;
$$;

-- Preview function: returns estimated processing info
CREATE OR REPLACE FUNCTION public.preview_bulk_action(
  p_company_id uuid,
  p_audience_config jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_targets integer := 0;
  estimated_processing_time numeric := 0;
BEGIN
  -- Permission: only owners/admins of the company can preview
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.company_id = p_company_id
      AND p.role IN ('owner','admin')
      AND p.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO total_targets
  FROM public.get_bulk_action_targets(p_company_id, p_audience_config);

  -- Simple estimation: 0.05s per target (adjust as needed)
  estimated_processing_time := GREATEST(1, total_targets * 0.05);

  RETURN jsonb_build_object(
    'total_targets', total_targets,
    'estimated_processing_time', estimated_processing_time
  );
END;
$$;