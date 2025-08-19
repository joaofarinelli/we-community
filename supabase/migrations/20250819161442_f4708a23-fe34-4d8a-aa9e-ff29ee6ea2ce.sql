-- Add access_criteria column to courses table
ALTER TABLE public.courses 
ADD COLUMN access_criteria jsonb DEFAULT '{}'::jsonb;

-- Create function to grant course access based on criteria
CREATE OR REPLACE FUNCTION public.grant_course_access(
  p_company_id uuid,
  p_course_id uuid,
  p_tag_ids uuid[] DEFAULT NULL,
  p_level_ids uuid[] DEFAULT NULL,
  p_badge_ids uuid[] DEFAULT NULL,
  p_logic text DEFAULT 'any'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_users integer := 0;
  user_record RECORD;
BEGIN
  -- Verify permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND company_id = p_company_id 
    AND role IN ('owner', 'admin') 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Owner or admin required';
  END IF;

  -- If no criteria specified, return 0
  IF (p_tag_ids IS NULL OR array_length(p_tag_ids, 1) = 0) 
     AND (p_level_ids IS NULL OR array_length(p_level_ids, 1) = 0)
     AND (p_badge_ids IS NULL OR array_length(p_badge_ids, 1) = 0) THEN
    RETURN 0;
  END IF;

  -- Select eligible users based on criteria and logic
  FOR user_record IN
    SELECT DISTINCT p.user_id
    FROM public.profiles p
    WHERE p.company_id = p_company_id 
    AND p.is_active = true
    AND (
      CASE 
        WHEN p_logic = 'all' THEN
          -- All criteria must match
          (p_tag_ids IS NULL OR array_length(p_tag_ids, 1) = 0 OR EXISTS (
            SELECT 1 FROM public.user_tags ut 
            WHERE ut.user_id = p.user_id 
            AND ut.company_id = p_company_id 
            AND ut.tag_id = ANY(p_tag_ids)
          ))
          AND
          (p_level_ids IS NULL OR array_length(p_level_ids, 1) = 0 OR EXISTS (
            SELECT 1 FROM public.user_current_level ucl 
            WHERE ucl.user_id = p.user_id 
            AND ucl.company_id = p_company_id 
            AND ucl.current_level_id = ANY(p_level_ids)
          ))
          AND
          (p_badge_ids IS NULL OR array_length(p_badge_ids, 1) = 0 OR EXISTS (
            SELECT 1 FROM public.user_trail_badges utb 
            WHERE utb.user_id = p.user_id 
            AND utb.company_id = p_company_id 
            AND utb.badge_id = ANY(p_badge_ids)
          ))
        ELSE
          -- Any criteria matches (default)
          (p_tag_ids IS NOT NULL AND array_length(p_tag_ids, 1) > 0 AND EXISTS (
            SELECT 1 FROM public.user_tags ut 
            WHERE ut.user_id = p.user_id 
            AND ut.company_id = p_company_id 
            AND ut.tag_id = ANY(p_tag_ids)
          ))
          OR
          (p_level_ids IS NOT NULL AND array_length(p_level_ids, 1) > 0 AND EXISTS (
            SELECT 1 FROM public.user_current_level ucl 
            WHERE ucl.user_id = p.user_id 
            AND ucl.company_id = p_company_id 
            AND ucl.current_level_id = ANY(p_level_ids)
          ))
          OR
          (p_badge_ids IS NOT NULL AND array_length(p_badge_ids, 1) > 0 AND EXISTS (
            SELECT 1 FROM public.user_trail_badges utb 
            WHERE utb.user_id = p.user_id 
            AND utb.company_id = p_company_id 
            AND utb.badge_id = ANY(p_badge_ids)
          ))
      END
    )
  LOOP
    -- Grant access (ignore if already exists)
    INSERT INTO public.user_course_access (user_id, course_id, company_id, granted_by)
    VALUES (user_record.user_id, p_course_id, p_company_id, auth.uid())
    ON CONFLICT (user_id, course_id) DO NOTHING;
    
    affected_users := affected_users + 1;
  END LOOP;

  RETURN affected_users;
END;
$$;