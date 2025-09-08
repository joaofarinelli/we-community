-- Create secure course creation RPC function
CREATE OR REPLACE FUNCTION public.create_course_secure(
  p_title text,
  p_description text DEFAULT NULL,
  p_thumbnail_url text DEFAULT NULL,
  p_order_index integer DEFAULT 0,
  p_certificate_enabled boolean DEFAULT false,
  p_mentor_name text DEFAULT NULL,
  p_mentor_role text DEFAULT NULL,
  p_mentor_signature_url text DEFAULT NULL,
  p_certificate_background_url text DEFAULT NULL,
  p_certificate_footer_text text DEFAULT NULL,
  p_access_criteria jsonb DEFAULT '{}',
  p_company_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    title, description, thumbnail_url, order_index, certificate_enabled,
    mentor_name, mentor_role, mentor_signature_url, certificate_background_url,
    certificate_footer_text, access_criteria, company_id, created_by, is_active
  ) VALUES (
    p_title, p_description, p_thumbnail_url, p_order_index, p_certificate_enabled,
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
      
      -- Grant access using existing RPC if criteria exist
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