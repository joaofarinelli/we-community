-- Update RLS policies to allow both owners and admins to manage lesson quizzes

-- Drop existing restrictive policies for lesson_quizzes
DROP POLICY IF EXISTS "Company owners can manage lesson quizzes" ON public.lesson_quizzes;

-- Create new policies for lesson_quizzes that allow both owners and admins
CREATE POLICY "Company owners and admins can manage lesson quizzes" 
ON public.lesson_quizzes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_quizzes.lesson_id 
    AND c.company_id = get_user_company_id()
    AND (
      is_company_owner() 
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() 
        AND p.company_id = c.company_id 
        AND p.role IN ('owner', 'admin') 
        AND p.is_active = true
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_quizzes.lesson_id 
    AND c.company_id = get_user_company_id()
    AND (
      is_company_owner() 
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() 
        AND p.company_id = c.company_id 
        AND p.role IN ('owner', 'admin') 
        AND p.is_active = true
      )
    )
  )
  AND auth.uid() = created_by
);

-- Drop existing restrictive policies for lesson_quiz_questions
DROP POLICY IF EXISTS "Company owners can manage quiz questions" ON public.lesson_quiz_questions;

-- Create new policies for lesson_quiz_questions
CREATE POLICY "Company owners and admins can manage quiz questions" 
ON public.lesson_quiz_questions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_quizzes lq
    JOIN public.course_lessons cl ON cl.id = lq.lesson_id
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE lq.id = lesson_quiz_questions.quiz_id 
    AND c.company_id = get_user_company_id()
    AND (
      is_company_owner() 
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() 
        AND p.company_id = c.company_id 
        AND p.role IN ('owner', 'admin') 
        AND p.is_active = true
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lesson_quizzes lq
    JOIN public.course_lessons cl ON cl.id = lq.lesson_id
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE lq.id = lesson_quiz_questions.quiz_id 
    AND c.company_id = get_user_company_id()
    AND (
      is_company_owner() 
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() 
        AND p.company_id = c.company_id 
        AND p.role IN ('owner', 'admin') 
        AND p.is_active = true
      )
    )
  )
);

-- Drop existing restrictive policies for lesson_quiz_options
DROP POLICY IF EXISTS "Company owners can manage quiz options" ON public.lesson_quiz_options;

-- Create new policies for lesson_quiz_options
CREATE POLICY "Company owners and admins can manage quiz options" 
ON public.lesson_quiz_options 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_quiz_questions lqq
    JOIN public.lesson_quizzes lq ON lq.id = lqq.quiz_id
    JOIN public.course_lessons cl ON cl.id = lq.lesson_id
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE lqq.id = lesson_quiz_options.question_id 
    AND c.company_id = get_user_company_id()
    AND (
      is_company_owner() 
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() 
        AND p.company_id = c.company_id 
        AND p.role IN ('owner', 'admin') 
        AND p.is_active = true
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lesson_quiz_questions lqq
    JOIN public.lesson_quizzes lq ON lq.id = lqq.quiz_id
    JOIN public.course_lessons cl ON cl.id = lq.lesson_id
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE lqq.id = lesson_quiz_options.question_id 
    AND c.company_id = get_user_company_id()
    AND (
      is_company_owner() 
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() 
        AND p.company_id = c.company_id 
        AND p.role IN ('owner', 'admin') 
        AND p.is_active = true
      )
    )
  )
);

-- Also update lesson_quiz_attempts to allow admins to view attempts for review
CREATE POLICY "Company owners and admins can view quiz attempts" 
ON public.lesson_quiz_attempts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_quizzes lq
    JOIN public.course_lessons cl ON cl.id = lq.lesson_id
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE lq.id = lesson_quiz_attempts.quiz_id 
    AND c.company_id = get_user_company_id()
    AND (
      is_company_owner() 
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() 
        AND p.company_id = c.company_id 
        AND p.role IN ('owner', 'admin') 
        AND p.is_active = true
      )
    )
  )
);

-- Also update lesson_quiz_answers to allow admins to view answers for review
CREATE POLICY "Company owners and admins can view quiz answers" 
ON public.lesson_quiz_answers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_quiz_attempts lqa
    JOIN public.lesson_quizzes lq ON lq.id = lqa.quiz_id
    JOIN public.course_lessons cl ON cl.id = lq.lesson_id
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE lqa.id = lesson_quiz_answers.attempt_id 
    AND c.company_id = get_user_company_id()
    AND (
      is_company_owner() 
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() 
        AND p.company_id = c.company_id 
        AND p.role IN ('owner', 'admin') 
        AND p.is_active = true
      )
    )
  )
);