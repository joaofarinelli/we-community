-- Update RLS policies for lesson_comments to allow all company users to view comments
-- while maintaining creation/editing restrictions

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create comments on lessons they have access to" ON public.lesson_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.lesson_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.lesson_comments;
DROP POLICY IF EXISTS "Users can view comments on lessons they have access to" ON public.lesson_comments;

-- Create new policies that allow all company users to view comments
-- but maintain access control for creating/editing

-- Users can view all comments in their company (regardless of course access)
CREATE POLICY "Users can view all lesson comments in their company" 
ON public.lesson_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_comments.lesson_id 
    AND c.company_id = get_user_company_id()
  )
);

-- Users can create comments on lessons they have access to (existing logic)
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
    AND user_has_course_access(auth.uid(), c.id)
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" 
ON public.lesson_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" 
ON public.lesson_comments 
FOR DELETE 
USING (auth.uid() = user_id);