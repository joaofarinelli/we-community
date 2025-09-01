-- Fix and create the get_company_users_with_filters RPC function (corrected)
CREATE OR REPLACE FUNCTION get_company_users_with_filters(
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
SET search_path = public
AS $$
BEGIN
  -- Ensure user has access to this company
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.company_id = p_company_id 
    AND profiles.is_active = true
    AND profiles.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.role,
    p.created_at as joined_at,
    COALESCE(user_tags.tag_ids, '{}') as tag_ids,
    COALESCE(user_tags.tag_names, '{}') as tag_names,
    0::bigint as posts_count, -- Set to 0 since posts table structure is unknown
    COALESCE(user_courses.courses_count, 0) as courses_count,
    ucl.current_level_id as level_id,
    ul.level_name,
    ul.level_color,
    COALESCE(user_badges.badge_ids, '{}') as badge_ids,
    COALESCE(user_badges.badge_names, '{}') as badge_names
  FROM public.profiles p
  
  -- User level information
  LEFT JOIN public.user_current_level ucl ON ucl.user_id = p.user_id AND ucl.company_id = p.company_id
  LEFT JOIN public.user_levels ul ON ul.id = ucl.current_level_id
  
  -- Aggregate user tags (if tables exist)
  LEFT JOIN (
    SELECT 
      ut.user_id,
      array_agg(ut.tag_id::text) as tag_ids,
      array_agg(t.name) as tag_names
    FROM public.user_tags ut
    JOIN public.tags t ON t.id = ut.tag_id
    WHERE ut.company_id = p_company_id
    GROUP BY ut.user_id
  ) user_tags ON user_tags.user_id = p.user_id
  
  -- Count user completed courses
  LEFT JOIN (
    SELECT 
      ucp.user_id,
      COUNT(DISTINCT ucp.course_id) as courses_count
    FROM public.user_course_progress ucp
    JOIN public.courses c ON c.id = ucp.course_id
    WHERE c.company_id = p_company_id
    GROUP BY ucp.user_id
  ) user_courses ON user_courses.user_id = p.user_id
  
  -- Aggregate user badges (if tables exist)
  LEFT JOIN (
    SELECT 
      utb.user_id,
      array_agg(utb.badge_id::text) as badge_ids,
      array_agg(tb.name) as badge_names
    FROM public.user_trail_badges utb
    JOIN public.trail_badges tb ON tb.id = utb.badge_id
    WHERE utb.company_id = p_company_id
    GROUP BY utb.user_id
  ) user_badges ON user_badges.user_id = p.user_id
  
  WHERE p.company_id = p_company_id
    AND p.is_active = true
    -- Search filter
    AND (p_search IS NULL OR (
      p.first_name ILIKE '%' || p_search || '%' OR
      p.last_name ILIKE '%' || p_search || '%' OR
      p.email ILIKE '%' || p_search || '%'
    ))
    -- Role filter
    AND (p_roles IS NULL OR p.role = ANY(p_roles))
    -- Date range filter
    AND (p_joined_start IS NULL OR p.created_at >= p_joined_start::timestamp with time zone)
    AND (p_joined_end IS NULL OR p.created_at <= p_joined_end::timestamp with time zone)
    -- Tag filter (only if user_tags table exists)
    AND (p_tag_ids IS NULL OR EXISTS (
      SELECT 1 FROM public.user_tags ut 
      WHERE ut.user_id = p.user_id 
      AND ut.company_id = p_company_id
      AND ut.tag_id::text = ANY(p_tag_ids)
    ))
    -- Level filter
    AND (p_level_ids IS NULL OR ucl.current_level_id::text = ANY(p_level_ids))
    -- Badge filter (only if user_trail_badges table exists)
    AND (p_badge_ids IS NULL OR EXISTS (
      SELECT 1 FROM public.user_trail_badges utb 
      WHERE utb.user_id = p.user_id 
      AND utb.company_id = p_company_id
      AND utb.badge_id::text = ANY(p_badge_ids)
    ))
    -- Course filter
    AND (p_course_ids IS NULL OR EXISTS (
      SELECT 1 FROM public.user_course_progress ucp2
      JOIN public.courses c2 ON c2.id = ucp2.course_id
      WHERE ucp2.user_id = p.user_id 
      AND c2.company_id = p_company_id
      AND ucp2.course_id::text = ANY(p_course_ids)
    ))
  
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Create basic indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_active ON public.profiles(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_current_level_user_company ON public.user_current_level(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_course ON public.user_course_progress(user_id, course_id);