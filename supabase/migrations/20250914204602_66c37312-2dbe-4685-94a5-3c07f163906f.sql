-- 1) Função para conceder acesso a curso com base em critérios
CREATE OR REPLACE FUNCTION public.grant_course_access(
  p_company_id uuid,
  p_course_id uuid,
  p_tag_ids text[],
  p_level_ids text[],
  p_badge_ids text[],
  p_logic text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted int := 0;
BEGIN
  WITH base AS (
    SELECT p.user_id
    FROM public.profiles p
    WHERE p.company_id = p_company_id
      AND p.is_active = true
  ),
  targets AS (
    SELECT b.user_id
    FROM base b
    WHERE
      (
        coalesce(p_logic, 'any') = 'any' AND (
          (p_tag_ids IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_tags ut
            WHERE ut.user_id = b.user_id
              AND ut.company_id = p_company_id
              AND ut.tag_id::text = ANY(p_tag_ids)
          ))
          OR
          (p_level_ids IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_current_level ucl
            WHERE ucl.user_id = b.user_id
              AND ucl.company_id = p_company_id
              AND ucl.current_level_id::text = ANY(p_level_ids)
          ))
          OR
          (p_badge_ids IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_trail_badges ub
            WHERE ub.user_id = b.user_id
              AND ub.company_id = p_company_id
              AND ub.badge_id::text = ANY(p_badge_ids)
          ))
        )
      )
      OR
      (
        coalesce(p_logic, 'any') <> 'any'
        AND (p_tag_ids IS NULL OR EXISTS (
            SELECT 1 FROM public.user_tags ut
            WHERE ut.user_id = b.user_id
              AND ut.company_id = p_company_id
              AND ut.tag_id::text = ANY(p_tag_ids)
        ))
        AND (p_level_ids IS NULL OR EXISTS (
            SELECT 1 FROM public.user_current_level ucl
            WHERE ucl.user_id = b.user_id
              AND ucl.company_id = p_company_id
              AND ucl.current_level_id::text = ANY(p_level_ids)
        ))
        AND (p_badge_ids IS NULL OR EXISTS (
            SELECT 1 FROM public.user_trail_badges ub
            WHERE ub.user_id = b.user_id
              AND ub.company_id = p_company_id
              AND ub.badge_id::text = ANY(p_badge_ids)
        ))
      )
  ),
  inserted AS (
    INSERT INTO public.user_course_access (user_id, company_id, course_id)
    SELECT t.user_id, p_company_id, p_course_id
    FROM targets t
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_course_access uca
      WHERE uca.user_id = t.user_id
        AND uca.company_id = p_company_id
        AND uca.course_id = p_course_id
    )
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM inserted;

  RETURN v_inserted;
END;
$$;

-- garantir que a função rode com um owner que possua BYPASSRLS
ALTER FUNCTION public.grant_course_access(uuid, uuid, text[], text[], text[], text) OWNER TO postgres;

-- 2) Tornar a função create_course_secure SECURITY DEFINER para evitar erros de RLS legítimos após validações internas
CREATE OR REPLACE FUNCTION public.create_course_secure(
  p_company_id uuid,
  p_title text,
  p_description text,
  p_thumbnail_url integer,
  p_order_index integer,
  p_certificate_enabled boolean,
  p_linear_module_progression boolean,
  p_mentor_name text,
  p_mentor_role text,
  p_mentor_signature_url text,
  p_certificate_background_url text,
  p_certificate_footer_text text,
  p_access_criteria jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_course_id uuid;
  v_affected_users integer := 0;
  v_course_data jsonb;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Verify user has an active profile in the specified company
  SELECT role INTO v_user_role
  FROM public.profiles 
  WHERE user_id = v_user_id 
    AND company_id = p_company_id 
    AND is_active = true;
  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'User does not have an active profile in this company';
  END IF;

  -- Verify user has owner or admin role
  IF v_user_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'User must be owner or admin to create courses';
  END IF;

  -- Set company context for the session
  PERFORM set_config('app.current_company_id', p_company_id::text, true);
  
  -- Create the course
  INSERT INTO public.courses (
    title, description, thumbnail_url, order_index, certificate_enabled, linear_module_progression,
    mentor_name, mentor_role, mentor_signature_url, certificate_background_url,
    certificate_footer_text, access_criteria, company_id, created_by, is_active
  ) VALUES (
    p_title, p_description, p_thumbnail_url, p_order_index, p_certificate_enabled, p_linear_module_progression,
    p_mentor_name, p_mentor_role, p_mentor_signature_url, p_certificate_background_url,
    p_certificate_footer_text, p_access_criteria, p_company_id, v_user_id, true
  ) RETURNING id INTO v_course_id;
  
  -- Grant access to users based on criteria if specified
  IF p_access_criteria IS NOT NULL AND p_access_criteria != '{}' THEN
    DECLARE
      v_tag_ids text[];
      v_level_ids text[];
      v_badge_ids text[];
      v_logic text;
    BEGIN
      -- Extract access criteria
      v_tag_ids := CASE 
        WHEN p_access_criteria ? 'tag_ids' 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_access_criteria->'tag_ids'))::text[]
        ELSE NULL 
      END;
      
      v_level_ids := CASE 
        WHEN p_access_criteria ? 'level_ids' 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_access_criteria->'level_ids'))::text[]
        ELSE NULL 
      END;
      
      v_badge_ids := CASE 
        WHEN p_access_criteria ? 'badge_ids' 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_access_criteria->'badge_ids'))::text[]
        ELSE NULL 
      END;
      
      v_logic := COALESCE(p_access_criteria->>'logic', 'any');
      
      -- Grant access using RPC if criteria exist
      IF (v_tag_ids IS NOT NULL AND array_length(v_tag_ids, 1) > 0) OR
         (v_level_ids IS NOT NULL AND array_length(v_level_ids, 1) > 0) OR
         (v_badge_ids IS NOT NULL AND array_length(v_badge_ids, 1) > 0) THEN
        
        SELECT public.grant_course_access(
          p_company_id,
          v_course_id,
          v_tag_ids,
          v_level_ids,
          v_badge_ids,
          v_logic
        ) INTO v_affected_users;
      END IF;
    END;
  END IF;
  
  -- Get course data to return
  SELECT to_jsonb(c.*) INTO v_course_data
  FROM public.courses c
  WHERE c.id = v_course_id;
  
  -- Return result
  RETURN jsonb_build_object(
    'course', v_course_data,
    'affected_users', v_affected_users
  );
END;
$$;

ALTER FUNCTION public.create_course_secure(
  uuid, text, text, integer, integer, boolean, boolean, text, text, text, text, text, jsonb
) OWNER TO postgres;