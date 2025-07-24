-- Create lesson_likes table
CREATE TABLE public.lesson_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, user_id)
);

-- Enable RLS
ALTER TABLE public.lesson_likes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view likes on lessons they have access to"
ON public.lesson_likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM course_lessons cl
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_likes.lesson_id 
    AND c.company_id = get_user_company_id()
    AND c.is_active = true
  )
);

CREATE POLICY "Users can like lessons they have access to"
ON public.lesson_likes FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM course_lessons cl
    JOIN course_modules cm ON cm.id = cl.module_id
    JOIN courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_likes.lesson_id 
    AND c.company_id = get_user_company_id()
    AND c.is_active = true
  )
);

CREATE POLICY "Users can remove their own likes"
ON public.lesson_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_lesson_likes_lesson_id ON public.lesson_likes(lesson_id);
CREATE INDEX idx_lesson_likes_user_id ON public.lesson_likes(user_id);