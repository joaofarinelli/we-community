-- Fix get_company_users_with_filters function - correct column references
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
  phone text,
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
AS $function$
DECLARE
  requester_role text;
  hide_phone_setting boolean := false;
BEGIN
  -- Get requester's role
  SELECT profiles.role INTO requester_role
  FROM public.profiles
  WHERE profiles.user_id = auth.uid() 
    AND profiles.company_id = p_company_id 
    AND profiles.is_active = true;

  -- Get company's phone privacy setting (default to false if not set)
  SELECT COALESCE(companies.hide_phone_from_members, false) INTO hide_phone_setting
  FROM public.companies
  WHERE companies.id = p_company_id;

  RETURN QUERY
  SELECT 
    profiles.user_id,
    profiles.first_name,
    profiles.last_name,
    profiles.email,
    CASE 
      WHEN hide_phone_setting = true 
           AND requester_role NOT IN ('owner', 'admin') 
           AND profiles.user_id != auth.uid()
      THEN NULL::text
      ELSE profiles.phone
    END as phone,
    profiles.role,
    profiles.created_at as joined_at,
    COALESCE(ARRAY_AGG(DISTINCT user_tags.tag_id) FILTER (WHERE user_tags.tag_id IS NOT NULL), ARRAY[]::text[]) as tag_ids,
    COALESCE(ARRAY_AGG(DISTINCT tags.name) FILTER (WHERE tags.name IS NOT NULL), ARRAY[]::text[]) as tag_names,
    COALESCE(posts_count.count, 0) as posts_count,
    COALESCE(courses_count.count, 0) as courses_count,
    user_current_level.current_level_id as level_id,
    user_levels.level_name,
    user_levels.level_color,
    COALESCE(ARRAY_AGG(DISTINCT user_trail_badges.badge_id) FILTER (WHERE user_trail_badges.badge_id IS NOT NULL), ARRAY[]::text[]) as badge_ids,
    COALESCE(ARRAY_AGG(DISTINCT trail_badges.name) FILTER (WHERE trail_badges.name IS NOT NULL), ARRAY[]::text[]) as badge_names
  FROM public.profiles
  LEFT JOIN public.user_tags ON user_tags.user_id = profiles.user_id AND user_tags.company_id = p_company_id
  LEFT JOIN public.tags ON tags.id = user_tags.tag_id
  LEFT JOIN (
    SELECT posts.user_id, COUNT(*) as count
    FROM public.posts
    WHERE posts.company_id = p_company_id
    GROUP BY posts.user_id
  ) posts_count ON posts_count.user_id = profiles.user_id
  LEFT JOIN (
    SELECT user_course_progress.user_id, COUNT(DISTINCT user_course_progress.course_id) as count
    FROM public.user_course_progress
    WHERE user_course_progress.company_id = p_company_id
    GROUP BY user_course_progress.user_id
  ) courses_count ON courses_count.user_id = profiles.user_id
  LEFT JOIN public.user_current_level ON user_current_level.user_id = profiles.user_id AND user_current_level.company_id = p_company_id
  LEFT JOIN public.user_levels ON user_levels.id = user_current_level.current_level_id
  LEFT JOIN public.user_trail_badges ON user_trail_badges.user_id = profiles.user_id AND user_trail_badges.company_id = p_company_id
  LEFT JOIN public.trail_badges ON trail_badges.id = user_trail_badges.badge_id
  WHERE profiles.company_id = p_company_id 
    AND profiles.is_active = true
    -- Search filter
    AND (p_search IS NULL OR 
         profiles.first_name ILIKE '%' || p_search || '%' OR 
         profiles.last_name ILIKE '%' || p_search || '%' OR
         profiles.email ILIKE '%' || p_search || '%')
    -- Role filter
    AND (p_roles IS NULL OR profiles.role = ANY(p_roles))
    -- Date filters
    AND (p_joined_start IS NULL OR profiles.created_at >= p_joined_start::timestamp with time zone)
    AND (p_joined_end IS NULL OR profiles.created_at <= p_joined_end::timestamp with time zone)
    -- Level filter
    AND (p_level_ids IS NULL OR user_current_level.current_level_id = ANY(p_level_ids::uuid[]))
  GROUP BY 
    profiles.user_id, 
    profiles.first_name, 
    profiles.last_name, 
    profiles.email, 
    profiles.phone,
    profiles.role, 
    profiles.created_at,
    posts_count.count,
    courses_count.count,
    user_current_level.current_level_id,
    user_levels.level_name,
    user_levels.level_color
  -- Tag filter (applied after GROUP BY)
  HAVING (p_tag_ids IS NULL OR 
          p_tag_ids <@ ARRAY_AGG(DISTINCT user_tags.tag_id::text) FILTER (WHERE user_tags.tag_id IS NOT NULL))
     -- Course filter (would need separate logic)
     AND (p_course_ids IS NULL OR true) -- Simplified for now
     -- Badge filter (applied after GROUP BY)
     AND (p_badge_ids IS NULL OR 
          p_badge_ids <@ ARRAY_AGG(DISTINCT user_trail_badges.badge_id::text) FILTER (WHERE user_trail_badges.badge_id IS NOT NULL))
  ORDER BY profiles.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;