
-- 1) Garantir can_user_see_space sem ambiguidade de user_id/space_id
CREATE OR REPLACE FUNCTION public.can_user_see_space(space_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  space_visibility text;
  space_company_id uuid;
  user_company_id uuid;
  is_company_owner boolean;
  has_access_group_permission boolean := false;
BEGIN
  -- Get space visibility and company
  SELECT s.visibility, s.company_id
  INTO space_visibility, space_company_id
  FROM public.spaces s
  WHERE s.id = can_user_see_space.space_id;

  -- Try current session company context first
  user_company_id := public.get_user_company_id();

  -- If not available, fall back to the profile in the same company as the space
  IF user_company_id IS NULL THEN
    SELECT p.company_id
    INTO user_company_id
    FROM public.profiles p
    WHERE p.user_id = can_user_see_space.user_id
      AND p.company_id = space_company_id
      AND p.is_active = true
    LIMIT 1;
  END IF;

  -- Different companies cannot see each other's spaces
  IF space_company_id IS DISTINCT FROM user_company_id THEN
    RETURN false;
  END IF;

  -- Company owners/admins can see all spaces
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = can_user_see_space.user_id
      AND p.company_id = user_company_id
      AND p.role IN ('owner','admin')
      AND p.is_active = true
  ) INTO is_company_owner;

  IF is_company_owner THEN
    RETURN true;
  END IF;

  -- Public spaces are visible to everyone in the company
  IF space_visibility = 'public' THEN
    RETURN true;
  END IF;

  -- For private and secret spaces, check membership OR access groups
  IF space_visibility IN ('private', 'secret') THEN
    -- Direct membership
    IF public.is_space_member(can_user_see_space.space_id, can_user_see_space.user_id) THEN
      RETURN true;
    END IF;

    -- Access groups
    SELECT EXISTS (
      SELECT 1
      FROM public.access_group_members agm
      JOIN public.access_group_spaces ags
        ON agm.access_group_id = ags.access_group_id
      WHERE agm.user_id = can_user_see_space.user_id
        AND ags.space_id = can_user_see_space.space_id
        AND agm.company_id = user_company_id
        AND ags.company_id = user_company_id
    ) INTO has_access_group_permission;

    RETURN has_access_group_permission;
  END IF;

  RETURN false;
END;
$function$;

-- 2) Recriar a lista filtrada de usuários com aliases mais explícitos
CREATE OR REPLACE FUNCTION public.get_company_users_with_filters(
  p_company_id uuid,
  p_search text DEFAULT NULL,
  p_roles text[] DEFAULT NULL,
  p_tag_ids uuid[] DEFAULT NULL,
  p_joined_start date DEFAULT NULL,
  p_joined_end date DEFAULT NULL,
  p_course_ids uuid[] DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  role text,
  joined_at timestamptz,
  tag_ids uuid[],
  tag_names text[],
  posts_count integer,
  courses_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Apenas owners/admins da empresa
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles pr_chk
    WHERE pr_chk.user_id = auth.uid()
      AND pr_chk.company_id = p_company_id
      AND pr_chk.role IN ('owner','admin')
      AND pr_chk.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      pr.user_id,
      pr.first_name,
      pr.last_name,
      pr.email,
      pr.role,
      pr.created_at AS joined_at
    FROM public.profiles pr
    WHERE pr.company_id = p_company_id
      AND pr.is_active = true
      AND (
        p_search IS NULL
        OR pr.first_name ILIKE '%' || p_search || '%'
        OR pr.last_name  ILIKE '%' || p_search || '%'
        OR pr.email      ILIKE '%' || p_search || '%'
      )
      AND (p_roles IS NULL OR array_length(p_roles,1) IS NULL OR pr.role = ANY(p_roles))
      AND (p_joined_start IS NULL OR pr.created_at >= p_joined_start::timestamptz)
      AND (p_joined_end   IS NULL OR pr.created_at < (p_joined_end + 1))
      AND (
        p_tag_ids IS NULL OR array_length(p_tag_ids,1) IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.user_tags ut
          WHERE ut.user_id = pr.user_id
            AND ut.company_id = p_company_id
            AND ut.tag_id = ANY(p_tag_ids)
        )
      )
      AND (
        p_course_ids IS NULL OR array_length(p_course_ids,1) IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.user_course_access uca
          WHERE uca.user_id = pr.user_id
            AND uca.company_id = p_company_id
            AND uca.course_id = ANY(p_course_ids)
        )
      )
    ORDER BY pr.created_at DESC
    LIMIT COALESCE(p_limit, 20)
    OFFSET COALESCE(p_offset, 0)
  ),
  tag_agg AS (
    SELECT
      b.user_id,
      COALESCE(array_agg(t.id ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL), ARRAY[]::uuid[])  AS tag_ids,
      COALESCE(array_agg(t.name ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL), ARRAY[]::text[]) AS tag_names
    FROM base b
    LEFT JOIN public.user_tags ut
      ON ut.user_id = b.user_id AND ut.company_id = p_company_id
    LEFT JOIN public.tags t
      ON t.id = ut.tag_id
    GROUP BY b.user_id
  ),
  post_cnt AS (
    SELECT
      b.user_id,
      COUNT(po.*)::int AS posts_count
    FROM base b
    LEFT JOIN public.posts po
      ON po.author_id = b.user_id
     AND po.company_id = p_company_id
    GROUP BY b.user_id
  ),
  course_cnt AS (
    SELECT
      b.user_id,
      COUNT(DISTINCT uca.course_id)::int AS courses_count
    FROM base b
    LEFT JOIN public.user_course_access uca
      ON uca.user_id = b.user_id
     AND uca.company_id = p_company_id
    GROUP BY b.user_id
  )
  SELECT
    b.user_id,
    b.first_name,
    b.last_name,
    b.email,
    b.role,
    b.joined_at,
    ta.tag_ids,
    ta.tag_names,
    COALESCE(pc.posts_count, 0)  AS posts_count,
    COALESCE(cc.courses_count, 0) AS courses_count
  FROM base b
  LEFT JOIN tag_agg   ta ON ta.user_id = b.user_id
  LEFT JOIN post_cnt  pc ON pc.user_id = b.user_id
  LEFT JOIN course_cnt cc ON cc.user_id = b.user_id;
END;
$function$;

-- 3) Índices para performance (evitam FULL SCAN ao carregar a página)
CREATE INDEX IF NOT EXISTS idx_posts_company_author
  ON public.posts (company_id, author_id);

CREATE INDEX IF NOT EXISTS idx_user_course_access_company_user
  ON public.user_course_access (company_id, user_id);

CREATE INDEX IF NOT EXISTS idx_user_tags_company_user
  ON public.user_tags (company_id, user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_company_created_at
  ON public.profiles (company_id, created_at);
