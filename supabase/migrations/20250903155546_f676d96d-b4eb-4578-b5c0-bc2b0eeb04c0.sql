-- Update RLS policies to allow admins and owners to update order_index for courses
DROP POLICY IF EXISTS "Company owners can update courses" ON public.courses;
CREATE POLICY "Company owners and admins can update courses" 
ON public.courses 
FOR UPDATE 
USING (
  company_id = get_user_company_id() AND 
  (is_company_owner() OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.company_id = courses.company_id 
    AND p.role IN ('owner', 'admin') 
    AND p.is_active = true
  ))
);

-- Update RLS policies to allow admins and owners to update order_index for course_modules
DROP POLICY IF EXISTS "Company owners can update modules" ON public.course_modules;
CREATE POLICY "Company owners and admins can update modules" 
ON public.course_modules 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = course_modules.course_id 
    AND c.company_id = get_user_company_id() 
    AND (is_company_owner() OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.company_id = c.company_id 
      AND p.role IN ('owner', 'admin') 
      AND p.is_active = true
    ))
  )
);

-- Update RLS policies to allow admins and owners to update order_index for course_lessons
DROP POLICY IF EXISTS "Company owners can update lessons" ON public.course_lessons;
CREATE POLICY "Company owners and admins can update lessons" 
ON public.course_lessons 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.course_modules cm
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cm.id = course_lessons.module_id 
    AND c.company_id = get_user_company_id() 
    AND (is_company_owner() OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.company_id = c.company_id 
      AND p.role IN ('owner', 'admin') 
      AND p.is_active = true
    ))
  )
);