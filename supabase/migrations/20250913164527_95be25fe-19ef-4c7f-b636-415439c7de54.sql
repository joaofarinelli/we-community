-- Drop any existing versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(uuid, text, text[], text[], text, text, text[], text[], text[], integer, integer);
DROP FUNCTION IF EXISTS public.get_company_users_with_filters(text, text, text[], text[], text, text, text[], text[], text[], integer, integer);

-- Create the corrected function
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
AS $$
BEGIN
    -- Verify that the current user is an owner or admin in the specified company
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND company_id = p_company_id 
        AND role IN ('owner', 'admin') 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Access denied: Only company owners and admins can access this function';
    END IF;

    RETURN QUERY
    WITH user_tags AS (
        SELECT 
            ut.user_id,
            ARRAY_AGG(ut.tag_id::text) as tag_ids,
            ARRAY_AGG(t.name) as tag_names
        FROM public.user_tags ut
        JOIN public.tags t ON t.id = ut.tag_id
        WHERE ut.company_id = p_company_id
        GROUP BY ut.user_id
    ),
    user_badges AS (
        SELECT 
            ub.user_id,
            ARRAY_AGG(ub.badge_id::text) as badge_ids,
            ARRAY_AGG(b.name) as badge_names
        FROM public.user_badges ub
        JOIN public.badges b ON b.id = ub.badge_id
        WHERE ub.company_id = p_company_id
        GROUP BY ub.user_id
    ),
    user_posts AS (
        SELECT 
            po.author_id as user_id,  -- FIXED: Use author_id instead of user_id
            COUNT(*) as posts_count
        FROM public.posts po
        WHERE po.company_id = p_company_id
        GROUP BY po.author_id
    ),
    user_courses AS (
        SELECT 
            ucp.user_id,
            COUNT(DISTINCT ucp.course_id) as courses_count
        FROM public.user_course_progress ucp
        JOIN public.courses c ON c.id = ucp.course_id
        WHERE c.company_id = p_company_id
        GROUP BY ucp.user_id
    )
    SELECT 
        p.user_id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.role,
        p.created_at as joined_at,
        COALESCE(ut.tag_ids, '{}') as tag_ids,
        COALESCE(ut.tag_names, '{}') as tag_names,
        COALESCE(up.posts_count, 0) as posts_count,
        COALESCE(uc.courses_count, 0) as courses_count,
        ucl.current_level_id as level_id,
        ul.level_name,
        ul.level_color,
        COALESCE(ub.badge_ids, '{}') as badge_ids,
        COALESCE(ub.badge_names, '{}') as badge_names
    FROM public.profiles p
    LEFT JOIN user_tags ut ON ut.user_id = p.user_id
    LEFT JOIN user_badges ub ON ub.user_id = p.user_id
    LEFT JOIN user_posts up ON up.user_id = p.user_id
    LEFT JOIN user_courses uc ON uc.user_id = p.user_id
    LEFT JOIN public.user_current_level ucl ON ucl.user_id = p.user_id AND ucl.company_id = p.company_id
    LEFT JOIN public.user_levels ul ON ul.id = ucl.current_level_id
    WHERE p.company_id = p_company_id
    AND p.is_active = true
    AND (p_search IS NULL OR (
        p.first_name ILIKE '%' || p_search || '%' OR
        p.last_name ILIKE '%' || p_search || '%' OR
        p.email ILIKE '%' || p_search || '%'
    ))
    AND (p_roles IS NULL OR p.role = ANY(p_roles))
    AND (p_tag_ids IS NULL OR ut.tag_ids && p_tag_ids)
    AND (p_joined_start IS NULL OR p.created_at >= p_joined_start::timestamp with time zone)
    AND (p_joined_end IS NULL OR p.created_at <= p_joined_end::timestamp with time zone)
    AND (p_level_ids IS NULL OR ucl.current_level_id::text = ANY(p_level_ids))
    AND (p_badge_ids IS NULL OR ub.badge_ids && p_badge_ids)
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;