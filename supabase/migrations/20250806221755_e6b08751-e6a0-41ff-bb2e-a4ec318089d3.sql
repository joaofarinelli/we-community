-- Fix user_has_course_access to work for multi-company users by checking profile in the course's company
CREATE OR REPLACE FUNCTION public.user_has_course_access(p_user_id uuid, p_course_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  course_company_id uuid;
  has_profile boolean;
BEGIN
  -- Get course's company
  SELECT company_id INTO course_company_id
  FROM public.courses 
  WHERE id = p_course_id;
  
  IF course_company_id IS NULL THEN
    RETURN false;
  END IF;

  -- Ensure user has an active profile in the course's company
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id 
      AND company_id = course_company_id 
      AND is_active = true
  ) INTO has_profile;

  IF NOT has_profile THEN
    RETURN false;
  END IF;

  -- Company owners/admins in that company have access to all courses
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id 
      AND company_id = course_company_id 
      AND role IN ('owner','admin')
      AND is_active = true
  ) THEN
    RETURN true;
  END IF;

  -- Regular members need explicit course access
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_course_access 
    WHERE user_id = p_user_id 
      AND course_id = p_course_id 
      AND company_id = course_company_id
  );
END;
$function$;