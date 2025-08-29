-- First, let's check if the get_company_users_with_filters function exists and see what it currently supports
-- We need to update it to include level and badge filtering

CREATE OR REPLACE FUNCTION public.get_company_users_with_filters(
  p_company_id uuid,
  p_search text DEFAULT NULL,
  p_roles text[] DEFAULT NULL,
  p_tag_ids text[] DEFAULT NULL,
  p_joined_start text DEFAULT NULL,
  p_joined_end text DEFAULT NULL,
  p_course_ids text[] DEFAULT NULL,
  p_level_ids text[] DEFAULT NULL,
  p_badge_ids text[] DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  role text,
  joined_at timestamp with time zone,
  tag_ids text[],
  tag_names text[],
  posts_count bigint,
  courses_count bigint,
  level_id uuid,
  level_name text,
  level_color text,
  badge_ids text[],
  badge_names text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH user_tags AS (
    SELECT 
      ut.user_id,
      ARRAY_AGG(ut.tag_id::text) as tag_ids,
      ARRAY_AGG(t.name) as tag_names
    FROM user_tags ut
    JOIN tags t ON t.id = ut.tag_id
    WHERE ut.company_id = p_company_id
    GROUP BY ut.user_id
  ),
  user_posts AS (
    SELECT 
      p.user_id,
      COUNT(*) as posts_count
    FROM posts p
    WHERE p.company_id = p_company_id
    GROUP BY p.user_id
  ),
  user_courses AS (
    SELECT 
      uca.user_id,
      COUNT(DISTINCT uca.course_id) as courses_count
    FROM user_course_access uca
    WHERE uca.company_id = p_company_id
    GROUP BY uca.user_id
  ),
  user_badges AS (
    SELECT 
      utb.user_id,
      ARRAY_AGG(utb.badge_id::text) as badge_ids,
      ARRAY_AGG(tb.name) as badge_names
    FROM user_trail_badges utb
    JOIN trail_badges tb ON tb.id = utb.badge_id
    WHERE utb.company_id = p_company_id
    GROUP BY utb.user_id
  )
  SELECT 
    pr.user_id,
    pr.first_name,
    pr.last_name,
    pr.email,
    pr.role,
    pr.created_at as joined_at,
    COALESCE(ut.tag_ids, ARRAY[]::text[]) as tag_ids,
    COALESCE(ut.tag_names, ARRAY[]::text[]) as tag_names,
    COALESCE(up.posts_count, 0) as posts_count,
    COALESCE(uc.courses_count, 0) as courses_count,
    ucl.current_level_id as level_id,
    ul.level_name,
    ul.level_color,
    COALESCE(ub.badge_ids, ARRAY[]::text[]) as badge_ids,
    COALESCE(ub.badge_names, ARRAY[]::text[]) as badge_names
  FROM profiles pr
  LEFT JOIN user_tags ut ON ut.user_id = pr.user_id
  LEFT JOIN user_posts up ON up.user_id = pr.user_id
  LEFT JOIN user_courses uc ON uc.user_id = pr.user_id
  LEFT JOIN user_current_level ucl ON ucl.user_id = pr.user_id AND ucl.company_id = pr.company_id
  LEFT JOIN user_levels ul ON ul.id = ucl.current_level_id
  LEFT JOIN user_badges ub ON ub.user_id = pr.user_id
  WHERE pr.company_id = p_company_id
    AND pr.is_active = true
    AND (p_search IS NULL OR (
      pr.first_name ILIKE '%' || p_search || '%' OR
      pr.last_name ILIKE '%' || p_search || '%' OR
      pr.email ILIKE '%' || p_search || '%'
    ))
    AND (p_roles IS NULL OR pr.role = ANY(p_roles))
    AND (p_tag_ids IS NULL OR EXISTS (
      SELECT 1 FROM user_tags ut2 
      WHERE ut2.user_id = pr.user_id AND ut2.tag_id::text = ANY(p_tag_ids)
    ))
    AND (p_level_ids IS NULL OR ucl.current_level_id::text = ANY(p_level_ids))
    AND (p_badge_ids IS NULL OR EXISTS (
      SELECT 1 FROM user_trail_badges utb2 
      WHERE utb2.user_id = pr.user_id AND utb2.badge_id::text = ANY(p_badge_ids)
    ))
    AND (p_joined_start IS NULL OR pr.created_at >= p_joined_start::date)
    AND (p_joined_end IS NULL OR pr.created_at <= p_joined_end::date)
    AND (p_course_ids IS NULL OR EXISTS (
      SELECT 1 FROM user_course_access uca2
      WHERE uca2.user_id = pr.user_id AND uca2.course_id::text = ANY(p_course_ids)
    ))
  ORDER BY pr.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;