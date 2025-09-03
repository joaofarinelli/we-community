-- Update RLS policies to allow both owners and admins to create courses, modules, and lessons

-- Update courses table INSERT policy
DROP POLICY IF EXISTS "Company owners can create courses" ON public.courses;
CREATE POLICY "Company owners and admins can create courses" 
ON public.courses 
FOR INSERT 
TO authenticated
WITH CHECK (
  (company_id = get_user_company_id()) AND 
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.company_id = courses.company_id 
    AND p.role IN ('owner', 'admin') 
    AND p.is_active = true
  )) AND 
  (auth.uid() = created_by)
);

-- Update course_modules table INSERT policy
DROP POLICY IF EXISTS "Company owners can create modules" ON public.course_modules;
CREATE POLICY "Company owners and admins can create modules" 
ON public.course_modules 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.profiles p ON p.company_id = c.company_id
    WHERE c.id = course_modules.course_id 
    AND c.company_id = get_user_company_id() 
    AND p.user_id = auth.uid()
    AND p.role IN ('owner', 'admin') 
    AND p.is_active = true
  )
);

-- Update course_lessons table INSERT policy  
DROP POLICY IF EXISTS "Company owners can create lessons" ON public.course_lessons;
CREATE POLICY "Company owners and admins can create lessons" 
ON public.course_lessons 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.course_modules cm
    JOIN public.courses c ON c.id = cm.course_id
    JOIN public.profiles p ON p.company_id = c.company_id
    WHERE cm.id = course_lessons.module_id 
    AND c.company_id = get_user_company_id() 
    AND p.user_id = auth.uid()
    AND p.role IN ('owner', 'admin') 
    AND p.is_active = true
  )
);