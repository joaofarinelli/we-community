-- Create the grant_course_access function that is called by create_course_secure
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
SET search_path TO 'public'
AS $$
DECLARE
  v_user_count integer := 0;
  v_user_id uuid;
BEGIN
  -- Logic for granting access based on criteria
  -- This is a simplified version - you may need to adjust based on your actual business logic
  
  FOR v_user_id IN
    SELECT DISTINCT p.user_id
    FROM public.profiles p
    WHERE p.company_id = p_company_id
      AND p.is_active = true
      AND (
        -- If logic is 'any', user needs to match at least one criteria
        (p_logic = 'any' AND (
          (p_tag_ids IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_tags ut 
            WHERE ut.user_id = p.user_id 
              AND ut.tag_id = ANY(p_tag_ids::uuid[])
          )) OR
          (p_level_ids IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_current_level ucl
            WHERE ucl.user_id = p.user_id 
              AND ucl.current_level_id = ANY(p_level_ids::uuid[])
          )) OR
          (p_badge_ids IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_trail_badges utb
            WHERE utb.user_id = p.user_id 
              AND utb.badge_id = ANY(p_badge_ids::uuid[])
          ))
        )) OR
        -- If logic is 'all', user needs to match all provided criteria
        (p_logic = 'all' AND 
          (p_tag_ids IS NULL OR EXISTS (
            SELECT 1 FROM public.user_tags ut 
            WHERE ut.user_id = p.user_id 
              AND ut.tag_id = ANY(p_tag_ids::uuid[])
          )) AND
          (p_level_ids IS NULL OR EXISTS (
            SELECT 1 FROM public.user_current_level ucl
            WHERE ucl.user_id = p.user_id 
              AND ucl.current_level_id = ANY(p_level_ids::uuid[])
          )) AND
          (p_badge_ids IS NULL OR EXISTS (
            SELECT 1 FROM public.user_trail_badges utb
            WHERE utb.user_id = p.user_id 
              AND utb.badge_id = ANY(p_badge_ids::uuid[])
          ))
        )
      )
  LOOP
    -- Grant access to the user
    INSERT INTO public.user_course_access (user_id, course_id, company_id)
    VALUES (v_user_id, p_course_id, p_company_id)
    ON CONFLICT (user_id, course_id) DO NOTHING;
    
    v_user_count := v_user_count + 1;
  END LOOP;
  
  RETURN v_user_count;
END;
$$;