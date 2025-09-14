-- Add linear lesson progression field to course_modules
ALTER TABLE public.course_modules 
ADD COLUMN linear_lesson_progression boolean NOT NULL DEFAULT false;

-- Create function to check if a lesson is completed
CREATE OR REPLACE FUNCTION public.check_lesson_completion(p_user_id uuid, p_lesson_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if the user has completed this specific lesson
  RETURN EXISTS (
    SELECT 1 FROM user_course_progress
    WHERE user_id = p_user_id 
    AND lesson_id = p_lesson_id 
    AND completed_at IS NOT NULL
  );
END;
$$;