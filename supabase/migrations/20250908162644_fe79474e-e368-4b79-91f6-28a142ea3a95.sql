-- Drop the conflicting get_company_users_with_filters function signatures
-- Keep only the correct canonical version

-- Drop the function with incorrect return structure (the one causing PGRST203)
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(
  p_search text,
  p_roles text[],
  p_tags text[],
  p_join_date_from timestamp with time zone,
  p_join_date_to timestamp with time zone,
  p_courses uuid[],
  p_levels uuid[],
  p_badges uuid[],
  p_limit integer,
  p_offset integer
);

-- Drop any other conflicting signatures
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(
  text,
  text[],
  text[],
  timestamp with time zone,
  timestamp with time zone,
  uuid[],
  uuid[],
  uuid[]
);

-- Ensure we have only the correct canonical function
-- This function should match the FilteredUser interface exactly
CREATE OR REPLACE FUNCTION public.get_company_users_with_filters(
  p_search text DEFAULT ''::text,
  p_roles text[] DEFAULT '{}'::text[],
  p_tags text[] DEFAULT '{}'::text[],
  p_join_date_from timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_join_date_to timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_courses uuid[] DEFAULT '{}'::uuid[],
  p_levels uuid[] DEFAULT '{}'::uuid[],
  p_badges uuid[] DEFAULT '{}'::uuid[],
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  role text,
  join_date timestamp with time zone,
  tag_ids uuid[],
  post_count bigint,
  course_count bigint,
  level_id uuid,
  level_name text,
  badge_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH user_tags AS (
    SELECT 
      ut.user_id,
      ARRAY_AGG(ut.tag_id) AS tag_ids
    FROM user_tags ut
    WHERE ut.company_id = get_user_company_id()
    GROUP BY ut.user_id
  ),
  user_posts AS (
    SELECT 
      p.created_by AS user_id,
      COUNT(*) AS post_count
    FROM posts p
    WHERE p.company_id = get_user_company_id()
    GROUP BY p.created_by
  ),
  user_courses AS (
    SELECT 
      uca.user_id,
      COUNT(*) AS course_count
    FROM user_course_access uca
    WHERE uca.company_id = get_user_company_id()
    GROUP BY uca.user_id
  ),
  user_levels AS (
    SELECT 
      ucl.user_id,
      ucl.current_level_id AS level_id,
      ul.level_name
    FROM user_current_level ucl
    JOIN user_levels ul ON ul.id = ucl.current_level_id
    WHERE ucl.company_id = get_user_company_id()
  ),
  user_badges AS (
    SELECT 
      utb.user_id,
      ARRAY_AGG(utb.badge_id) AS badge_ids
    FROM user_trail_badges utb
    WHERE utb.company_id = get_user_company_id()
    GROUP BY utb.user_id
  )
  SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.role,
    p.created_at AS join_date,
    COALESCE(ut.tag_ids, '{}'::uuid[]) AS tag_ids,
    COALESCE(up.post_count, 0) AS post_count,
    COALESCE(uc.course_count, 0) AS course_count,
    ul.level_id,
    ul.level_name,
    COALESCE(ub.badge_ids, '{}'::uuid[]) AS badge_ids
  FROM profiles p
  LEFT JOIN user_tags ut ON ut.user_id = p.user_id
  LEFT JOIN user_posts up ON up.user_id = p.user_id
  LEFT JOIN user_courses uc ON uc.user_id = p.user_id
  LEFT JOIN user_levels ul ON ul.user_id = p.user_id
  LEFT JOIN user_badges ub ON ub.user_id = p.user_id
  WHERE p.company_id = get_user_company_id()
    AND p.is_active = true
    AND (p_search = '' OR 
         p.first_name ILIKE '%' || p_search || '%' OR 
         p.last_name ILIKE '%' || p_search || '%' OR 
         p.email ILIKE '%' || p_search || '%')
    AND (COALESCE(array_length(p_roles, 1), 0) = 0 OR p.role = ANY(p_roles))
    AND (COALESCE(array_length(p_tags, 1), 0) = 0 OR 
         EXISTS (SELECT 1 FROM user_tags ut2 
                 JOIN user_tags_list utl ON ut2.tag_id = utl.id 
                 WHERE ut2.user_id = p.user_id AND utl.name = ANY(p_tags)))
    AND (p_join_date_from IS NULL OR p.created_at >= p_join_date_from)
    AND (p_join_date_to IS NULL OR p.created_at <= p_join_date_to)
    AND (COALESCE(array_length(p_courses, 1), 0) = 0 OR 
         EXISTS (SELECT 1 FROM user_course_access uca2 
                 WHERE uca2.user_id = p.user_id AND uca2.course_id = ANY(p_courses)))
    AND (COALESCE(array_length(p_levels, 1), 0) = 0 OR ul.level_id = ANY(p_levels))
    AND (COALESCE(array_length(p_badges, 1), 0) = 0 OR 
         EXISTS (SELECT 1 FROM user_trail_badges utb2 
                 WHERE utb2.user_id = p.user_id AND utb2.badge_id = ANY(p_badges)))
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;