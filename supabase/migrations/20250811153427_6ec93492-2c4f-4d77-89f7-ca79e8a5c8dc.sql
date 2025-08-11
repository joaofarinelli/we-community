-- Create function to check course completion
CREATE OR REPLACE FUNCTION public.check_course_completion(p_user_id uuid, p_course_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_lessons integer;
  completed_lessons integer;
BEGIN
  -- Count total lessons in the course
  SELECT COUNT(*) INTO total_lessons
  FROM public.course_lessons cl
  JOIN public.course_modules cm ON cm.id = cl.module_id
  WHERE cm.course_id = p_course_id;
  
  -- Count completed lessons by user within the course
  SELECT COUNT(DISTINCT ucp.lesson_id) INTO completed_lessons
  FROM public.user_course_progress ucp
  WHERE ucp.user_id = p_user_id
    AND ucp.course_id = p_course_id;
  
  -- Return true if all lessons are completed
  RETURN total_lessons > 0 AND completed_lessons = total_lessons;
END;
$$;