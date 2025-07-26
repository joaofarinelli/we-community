-- Function to check if a module is completed by a user
CREATE OR REPLACE FUNCTION public.check_module_completion(p_user_id uuid, p_module_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_lessons integer;
  completed_lessons integer;
BEGIN
  -- Count total lessons in the module
  SELECT COUNT(*) INTO total_lessons
  FROM course_lessons
  WHERE module_id = p_module_id;
  
  -- Count completed lessons by user
  SELECT COUNT(DISTINCT lesson_id) INTO completed_lessons
  FROM user_course_progress
  WHERE user_id = p_user_id
    AND module_id = p_module_id;
  
  -- Return true if all lessons are completed
  RETURN total_lessons > 0 AND completed_lessons = total_lessons;
END;
$function$;