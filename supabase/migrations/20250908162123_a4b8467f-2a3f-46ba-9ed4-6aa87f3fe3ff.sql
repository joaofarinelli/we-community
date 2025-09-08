-- Drop existing conflicting functions and create the correct one
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(uuid, text, text[], uuid[], timestamp with time zone, timestamp with time zone, uuid[], uuid[], uuid[], integer, integer);
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(uuid, jsonb);

-- Create the canonical get_company_users_with_filters function that matches the FilteredUser interface
CREATE OR REPLACE FUNCTION public.get_company_users_with_filters(
  p_company_id uuid,
  p_search text DEFAULT NULL,
  p_roles text[] DEFAULT NULL,
  p_tag_ids uuid[] DEFAULT NULL,
  p_joined_start timestamp with time zone DEFAULT NULL,
  p_joined_end timestamp with time zone DEFAULT NULL,
  p_course_ids uuid[] DEFAULT NULL,
  p_level_ids uuid[] DEFAULT NULL,
  p_badge_ids uuid[] DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  role text,
  joined_at timestamp with time zone,
  tag_ids uuid[],
  tag_names text[],
  posts_count bigint,
  courses_count bigint,
  level_id uuid,
  level_name text,
  level_color text,
  badge_ids uuid[],
  badge_names text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    pr.user_id,
    pr.first_name,
    pr.last_name,
    pr.email,
    pr.phone,
    pr.role,
    pr.created_at as joined_at,
    COALESCE(
      (SELECT array_agg(ut.tag_id)
       FROM user_tags ut
       WHERE ut.user_id = pr.user_id AND ut.company_id = p_company_id),
      ARRAY[]::uuid[]
    ) as tag_ids,
    COALESCE(
      (SELECT array_agg(t.name)
       FROM user_tags ut
       JOIN tags t ON t.id = ut.tag_id
       WHERE ut.user_id = pr.user_id AND ut.company_id = p_company_id),
      ARRAY[]::text[]
    ) as tag_names,
    COALESCE(
      (SELECT COUNT(*)::bigint
       FROM posts p
       WHERE p.author_id = pr.user_id AND p.company_id = p_company_id),
      0
    ) as posts_count,
    COALESCE(
      (SELECT COUNT(DISTINCT uca.course_id)::bigint
       FROM user_course_access uca
       WHERE uca.user_id = pr.user_id AND uca.company_id = p_company_id),
      0
    ) as courses_count,
    ucl.current_level_id as level_id,
    ul.level_name,
    ul.level_color,
    COALESCE(
      (SELECT array_agg(utb.badge_id)
       FROM user_trail_badges utb
       WHERE utb.user_id = pr.user_id AND utb.company_id = p_company_id),
      ARRAY[]::uuid[]
    ) as badge_ids,
    COALESCE(
      (SELECT array_agg(tb.name)
       FROM user_trail_badges utb
       JOIN trail_badges tb ON tb.id = utb.badge_id
       WHERE utb.user_id = pr.user_id AND utb.company_id = p_company_id),
      ARRAY[]::text[]
    ) as badge_names
  FROM profiles pr
  LEFT JOIN user_current_level ucl ON ucl.user_id = pr.user_id AND ucl.company_id = pr.company_id
  LEFT JOIN user_levels ul ON ul.id = ucl.current_level_id
  WHERE pr.company_id = p_company_id
    AND pr.is_active = true
    AND (p_search IS NULL OR 
         pr.first_name ILIKE '%' || p_search || '%' OR 
         pr.last_name ILIKE '%' || p_search || '%' OR 
         pr.email ILIKE '%' || p_search || '%')
    AND (p_roles IS NULL OR pr.role = ANY(p_roles))
    AND (p_joined_start IS NULL OR pr.created_at >= p_joined_start)
    AND (p_joined_end IS NULL OR pr.created_at <= p_joined_end)
    AND (p_tag_ids IS NULL OR EXISTS (
      SELECT 1 FROM user_tags ut 
      WHERE ut.user_id = pr.user_id 
      AND ut.company_id = p_company_id 
      AND ut.tag_id = ANY(p_tag_ids)
    ))
    AND (p_course_ids IS NULL OR EXISTS (
      SELECT 1 FROM user_course_access uca 
      WHERE uca.user_id = pr.user_id 
      AND uca.company_id = p_company_id 
      AND uca.course_id = ANY(p_course_ids)
    ))
    AND (p_level_ids IS NULL OR ucl.current_level_id = ANY(p_level_ids))
    AND (p_badge_ids IS NULL OR EXISTS (
      SELECT 1 FROM user_trail_badges utb 
      WHERE utb.user_id = pr.user_id 
      AND utb.company_id = p_company_id 
      AND utb.badge_id = ANY(p_badge_ids)
    ))
  ORDER BY pr.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;