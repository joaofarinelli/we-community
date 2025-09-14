-- Add prerequisite course support to courses table
ALTER TABLE public.courses 
ADD COLUMN prerequisite_course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;

-- Add index for better performance on prerequisite lookups
CREATE INDEX idx_courses_prerequisite ON public.courses(prerequisite_course_id);

-- Create function to check if user has access to a course considering prerequisites
CREATE OR REPLACE FUNCTION public.user_has_course_access(p_user_id uuid, p_course_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_company_id uuid;
  course_record RECORD;
  has_access boolean := false;
BEGIN
  -- Get user's company
  user_company_id := public.get_user_company_id();
  
  -- Get course details
  SELECT c.*, c.prerequisite_course_id INTO course_record
  FROM public.courses c 
  WHERE c.id = p_course_id 
    AND c.company_id = user_company_id
    AND c.is_active = true;
  
  IF course_record.id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has access through access groups or other criteria
  SELECT EXISTS (
    SELECT 1 FROM public.access_group_members agm
    JOIN public.access_group_courses agc ON agc.access_group_id = agm.access_group_id
    WHERE agc.course_id = p_course_id
    AND agm.user_id = p_user_id
    AND agm.company_id = user_company_id
  ) INTO has_access;
  
  -- If no access through groups, return false
  IF NOT has_access THEN
    RETURN false;
  END IF;
  
  -- If course has no prerequisite, user has access
  IF course_record.prerequisite_course_id IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if prerequisite course is completed
  RETURN public.check_course_completion(p_user_id, course_record.prerequisite_course_id);
END;
$function$;