
-- Fix get_company_users_with_filters: use posts.author_id instead of po.user_id
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
BEGIN
  -- Role do requisitante nesta empresa
  SELECT p.role INTO requester_role
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
    AND p.company_id = p_company_id
    AND p.is_active = true;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    CASE 
      WHEN p.hide_phone_from_members = true 
           AND requester_role NOT IN ('owner', 'admin') 
           AND p.user_id <> auth.uid()
      THEN NULL::text
      ELSE p.phone
    END AS phone,
    p.role,
    p.created_at AS joined_at,
    COALESCE(ARRAY_AGG(DISTINCT ut.tag_id) FILTER (WHERE ut.tag_id IS NOT NULL), ARRAY[]::text[]) AS tag_ids,
    COALESCE(ARRAY_AGG(DISTINCT t.name)   FILTER (WHERE t.name   IS NOT NULL), ARRAY[]::text[]) AS tag_names,
    COALESCE(pc.count, 0) AS posts_count,
    COALESCE(cc.count, 0) AS courses_count,
    ucl.current_level_id AS level_id,
    ul.level_name,
    ul.level_color,
    COALESCE(ARRAY_AGG(DISTINCT utb.badge_id) FILTER (WHERE utb.badge_id IS NOT NULL), ARRAY[]::text[]) AS badge_ids,
    COALESCE(ARRAY_AGG(DISTINCT tb.name)     FILTER (WHERE tb.name     IS NOT NULL), ARRAY[]::text[]) AS badge_names
  FROM public.profiles p
  LEFT JOIN public.user_tags ut 
    ON ut.user_id = p.user_id AND ut.company_id = p_company_id
  LEFT JOIN public.tags t 
    ON t.id = ut.tag_id
  -- FIX: usar author_id
  LEFT JOIN (
    SELECT po.author_id AS user_id, COUNT(*) AS count
    FROM public.posts po
    WHERE po.company_id = p_company_id
    GROUP BY po.author_id
  ) pc ON pc.user_id = p.user_id
  LEFT JOIN (
    SELECT ucp.user_id, COUNT(DISTINCT ucp.course_id) AS count
    FROM public.user_course_progress ucp
    WHERE ucp.company_id = p_company_id
    GROUP BY ucp.user_id
  ) cc ON cc.user_id = p.user_id
  LEFT JOIN public.user_current_level ucl 
    ON ucl.user_id = p.user_id AND ucl.company_id = p_company_id
  LEFT JOIN public.user_levels ul 
    ON ul.id = ucl.current_level_id
  LEFT JOIN public.user_trail_badges utb 
    ON utb.user_id = p.user_id AND utb.company_id = p_company_id
  LEFT JOIN public.trail_badges tb 
    ON tb.id = utb.badge_id
  WHERE p.company_id = p_company_id 
    AND p.is_active = true
    AND (p_search IS NULL OR 
         p.first_name ILIKE '%' || p_search || '%' OR 
         p.last_name  ILIKE '%' || p_search || '%' OR
         p.email      ILIKE '%' || p_search || '%')
    AND (p_roles IS NULL OR p.role = ANY(p_roles))
    AND (p_joined_start IS NULL OR p.created_at >= p_joined_start::timestamptz)
    AND (p_joined_end   IS NULL OR p.created_at <= p_joined_end::timestamptz)
    AND (p_level_ids IS NULL OR ucl.current_level_id = ANY(p_level_ids::uuid[]))
  GROUP BY 
    p.user_id, p.first_name, p.last_name, p.email, p.phone, p.hide_phone_from_members,
    p.role, p.created_at,
    pc.count, cc.count,
    ucl.current_level_id, ul.level_name, ul.level_color
  HAVING (p_tag_ids IS NULL OR 
          p_tag_ids <@ ARRAY_AGG(DISTINCT ut.tag_id::text) FILTER (WHERE ut.tag_id IS NOT NULL))
     AND (p_course_ids IS NULL OR true) -- filtro por cursos pode ser implementado depois
     AND (p_badge_ids IS NULL OR 
          p_badge_ids <@ ARRAY_AGG(DISTINCT utb.badge_id::text) FILTER (WHERE utb.badge_id IS NOT NULL))
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;
