-- Update the creation policy for lesson_comments to be simpler
-- Remove dependency on user_has_course_access function

-- Drop and recreate the creation policy with simplified logic
DROP POLICY IF EXISTS "Users can create comments on lessons they have access to" ON public.lesson_comments;

-- Users can create comments on lessons in courses that are active in their company
CREATE POLICY "Users can create comments on lessons they have access to" 
ON public.lesson_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1
    FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_comments.lesson_id 
    AND c.company_id = get_user_company_id() 
    AND c.is_active = true
  )
);